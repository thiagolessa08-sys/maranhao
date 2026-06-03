import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { agentQuery } from '@/lib/agent'

export interface DadosDespesa {
  kpis: {
    dotacaoInicial:    { valor: number; vs_ano_anterior_pct: number }
    dotacaoAtualizada: { valor: number; vs_ano_anterior_pct: number }
    valorEmpenho:      { valor: number }
    valorLiquidado:    { valor: number }
    valorPago:         { valor: number }
  }
  secretarias: Array<{ nome: string; valor: number }>
  categorias:  Array<{ nome: string; valor: number; pct: number }>
  elementos:   Array<{ nome: string; dotacao: number; empenhado: number; pct_exec: number; link?: boolean }>
  modalidades: Array<{ nome: string; valor: number }>
}

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }

function vazio(): DadosDespesa {
  return {
    kpis: {
      dotacaoInicial: { valor: 0, vs_ano_anterior_pct: 0 },
      dotacaoAtualizada: { valor: 0, vs_ano_anterior_pct: 0 },
      valorEmpenho: { valor: 0 }, valorLiquidado: { valor: 0 }, valorPago: { valor: 0 },
    },
    secretarias: [], categorias: [], elementos: [], modalidades: [],
  }
}

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ano = parseInt(searchParams.get('ano') ?? '2025')

  try {
    // KPIs do ano e do ano anterior (para variação)
    const totais = await agentQuery(`
      SELECT d.NO_ANO ano,
        SUM(ISNULL(f.VL_LEI_MAIS_CREDITO,0)) dot_atualizada,
        SUM(ISNULL(f.VL_SALDO_MES_SUPLEMENTACAO,0)) suplem,
        SUM(ISNULL(f.VL_SALDO_MES_REDUCAO,0)) reducao,
        SUM(ISNULL(f.VL_SALDO_MES_EMPENHADO,0)) empenhado,
        SUM(ISNULL(f.VL_SALDO_MES_LIQUIDADO,0)) liquidado,
        SUM(ISNULL(f.VL_SALDO_MES_PAGO,0)) pago
      FROM SEPLAN.FATO_INTERVENCAO_DOTACAO f
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO IN (${ano}, ${ano - 1})
      GROUP BY d.NO_ANO`, 10)

    const byAno: Record<number, Record<string, number>> = {}
    for (const r of totais.rows) {
      byAno[n(r[0])] = {
        dotAtual: n(r[1]), suplem: n(r[2]), reducao: n(r[3]),
        empenhado: n(r[4]), liquidado: n(r[5]), pago: n(r[6]),
      }
    }
    const cur = byAno[ano] ?? {}
    const prev = byAno[ano - 1] ?? {}
    const dotInicialCur = (cur.dotAtual ?? 0) - (cur.suplem ?? 0) + (cur.reducao ?? 0)
    const dotInicialPrev = (prev.dotAtual ?? 0) - (prev.suplem ?? 0) + (prev.reducao ?? 0)
    const varPct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0)

    // Despesa paga por órgão (secretarias)
    const orgaos = await agentQuery(`
      SELECT TOP 10 i.DS_ORGAO nome, SUM(ISNULL(f.VL_SALDO_MES_PAGO,0)) v
      FROM SEPLAN.FATO_INTERVENCAO_DOTACAO f
      JOIN SEPLAN.DIM_INSTITUCIONAL i ON f.SK_INSTITUCIONAL = i.SK_INSTITUCIONAL
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano}
      GROUP BY i.DS_ORGAO ORDER BY v DESC`, 20)

    // Elementos de despesa: dotação x empenhado
    const elem = await agentQuery(`
      SELECT TOP 8 nd.DS_NATUREZA_DESPESA nome,
        SUM(ISNULL(f.VL_LEI_MAIS_CREDITO,0)) dotacao,
        SUM(ISNULL(f.VL_SALDO_MES_EMPENHADO,0)) empenhado
      FROM SEPLAN.FATO_INTERVENCAO_DOTACAO f
      JOIN SEPLAN.DIM_NATUREZA_DESPESA nd ON f.SK_NATUREZA_DESPESA = nd.SK_NATUREZA_DESPESA
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano}
      GROUP BY nd.DS_NATUREZA_DESPESA ORDER BY empenhado DESC`, 20)

    // Despesa paga por grupo de fonte (categorias) e por fonte (modalidades)
    const grupos = await agentQuery(`
      SELECT fr.DS_GRUPO_FONTE nome, SUM(ISNULL(f.VL_SALDO_MES_PAGO,0)) v
      FROM SEPLAN.FATO_INTERVENCAO_DOTACAO f
      JOIN SEPLAN.DIM_FONTE_RECURSO fr ON f.SK_FONTE_RECURSO = fr.SK_FONTE_RECURSO
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano}
      GROUP BY fr.DS_GRUPO_FONTE ORDER BY v DESC`, 20)

    const fontes = await agentQuery(`
      SELECT TOP 6 fr.DS_FONTE_RECURSO nome, SUM(ISNULL(f.VL_SALDO_MES_PAGO,0)) v
      FROM SEPLAN.FATO_INTERVENCAO_DOTACAO f
      JOIN SEPLAN.DIM_FONTE_RECURSO fr ON f.SK_FONTE_RECURSO = fr.SK_FONTE_RECURSO
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano}
      GROUP BY fr.DS_FONTE_RECURSO ORDER BY v DESC`, 20)

    const totGrupos = grupos.rows.reduce((s, r) => s + n(r[1]), 0) || 1

    const dados: DadosDespesa = {
      kpis: {
        dotacaoInicial:    { valor: dotInicialCur, vs_ano_anterior_pct: +varPct(dotInicialCur, dotInicialPrev).toFixed(1) },
        dotacaoAtualizada: { valor: cur.dotAtual ?? 0, vs_ano_anterior_pct: +varPct(cur.dotAtual ?? 0, prev.dotAtual ?? 0).toFixed(1) },
        valorEmpenho:      { valor: cur.empenhado ?? 0 },
        valorLiquidado:    { valor: cur.liquidado ?? 0 },
        valorPago:         { valor: cur.pago ?? 0 },
      },
      secretarias: orgaos.rows.map(r => ({ nome: String(r[0] ?? '').trim(), valor: n(r[1]) })),
      categorias: grupos.rows.map(r => ({ nome: String(r[0] ?? '').trim() || 'Não informado', valor: n(r[1]), pct: Math.round((n(r[1]) / totGrupos) * 100) })),
      elementos: elem.rows.map(r => {
        const dot = n(r[1]), emp = n(r[2])
        return { nome: String(r[0] ?? '').trim(), dotacao: dot, empenhado: emp, pct_exec: dot > 0 ? +((emp / dot) * 100).toFixed(1) : 0 }
      }),
      modalidades: fontes.rows.map(r => ({ nome: String(r[0] ?? '').trim(), valor: n(r[1]) })),
    }
    return NextResponse.json(dados)
  } catch (e) {
    console.error('[api/despesa]', e)
    return NextResponse.json(vazio())
  }
}
