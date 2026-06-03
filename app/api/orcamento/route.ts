import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { agentQuery } from '@/lib/agent'

interface DadosOrcamento {
  kpis: {
    arrecadado: { valor: number; meta_pct: number }
    empenhado:  { valor: number; receita_pct: number }
    liquidado:  { valor: number; empenhado_pct: number }
    pago:       { valor: number; liquidado_pct: number }
  }
  mensal:     Array<{ mes: string; arrecadado: number }>
  funcoes:    Array<{ nome: string; pago: number }>
  categorias: Array<{ nome: string; valor: number; pct: number }>
}

const MES_ABREV = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }
const pct = (a: number, b: number) => (b > 0 ? +(((a / b) * 100)).toFixed(1) : 0)

function vazio(): DadosOrcamento {
  return {
    kpis: {
      arrecadado: { valor: 0, meta_pct: 0 }, empenhado: { valor: 0, receita_pct: 0 },
      liquidado: { valor: 0, empenhado_pct: 0 }, pago: { valor: 0, liquidado_pct: 0 },
    },
    mensal: MES_ABREV.slice(1).map(m => ({ mes: m, arrecadado: 0 })),
    funcoes: [], categorias: [],
  }
}

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ano = parseInt(searchParams.get('ano') ?? '2025')

  try {
    // Receita do ano (atual e anterior) + série mensal
    const rec = await agentQuery(`
      SELECT d.NO_ANO ano, d.NO_MES mes, SUM(ISNULL(f.VL_ARRECADACAO_RECEITA,0)) v
      FROM SEPLAN.FATO_EXECUCAO_RECEITA f
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO IN (${ano}, ${ano - 1})
      GROUP BY d.NO_ANO, d.NO_MES`, 60)
    const mensalArr = Array(12).fill(0)
    let arrecadado = 0, arrecadadoPrev = 0
    for (const r of rec.rows) {
      const a = n(r[0]); const m = n(r[1]); const v = n(r[2])
      if (a === ano) { arrecadado += v; if (m >= 1 && m <= 12) mensalArr[m - 1] = v }
      else if (a === ano - 1) arrecadadoPrev += v
    }

    // Despesa do ano (estágios)
    const desp = await agentQuery(`
      SELECT
        SUM(ISNULL(f.VL_SALDO_MES_EMPENHADO,0)) empenhado,
        SUM(ISNULL(f.VL_SALDO_MES_LIQUIDADO,0)) liquidado,
        SUM(ISNULL(f.VL_SALDO_MES_PAGO,0)) pago
      FROM SEPLAN.FATO_INTERVENCAO_DOTACAO f
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano} AND f.IC_CONVERSAO IN (CHAR(67),CHAR(72))`, 5)
    const dr = desp.rows[0] ?? []
    const empenhado = n(dr[0]), liquidado = n(dr[1]), pago = n(dr[2])

    // Despesa paga por órgão
    const fun = await agentQuery(`
      SELECT TOP 6 i.DS_ORGAO nome, SUM(ISNULL(f.VL_SALDO_MES_PAGO,0)) pago
      FROM SEPLAN.FATO_INTERVENCAO_DOTACAO f
      JOIN SEPLAN.DIM_INSTITUCIONAL i ON f.SK_INSTITUCIONAL = i.SK_INSTITUCIONAL
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano} AND f.IC_CONVERSAO IN (CHAR(67),CHAR(72))
      GROUP BY i.DS_ORGAO ORDER BY pago DESC`, 20)

    // Receita por categoria econômica
    const cat = await agentQuery(`
      SELECT nr.DS_CATEGORIA_ECONOMICA_RECEITA nome, SUM(ISNULL(f.VL_ARRECADACAO_RECEITA,0)) v
      FROM SEPLAN.FATO_EXECUCAO_RECEITA f
      JOIN SEPLAN.DIM_NATUREZA_RECEITA nr ON f.SK_NATUREZA_RECEITA = nr.SK_NATUREZA_RECEITA
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano}
      GROUP BY nr.DS_CATEGORIA_ECONOMICA_RECEITA ORDER BY v DESC`, 20)
    const totCat = cat.rows.reduce((s, r) => s + n(r[1]), 0) || 1

    const dados: DadosOrcamento = {
      kpis: {
        arrecadado: { valor: arrecadado, meta_pct: pct(arrecadado, arrecadadoPrev) },
        empenhado:  { valor: empenhado, receita_pct: pct(empenhado, arrecadado) },
        liquidado:  { valor: liquidado, empenhado_pct: pct(liquidado, empenhado) },
        pago:       { valor: pago, liquidado_pct: pct(pago, liquidado) },
      },
      mensal: mensalArr.map((v, i) => ({ mes: MES_ABREV[i + 1], arrecadado: v })),
      funcoes: fun.rows.map(r => ({ nome: String(r[0] ?? '').trim(), pago: n(r[1]) })),
      categorias: cat.rows.map(r => ({ nome: String(r[0] ?? '').trim() || 'Não informado', valor: n(r[1]), pct: Math.round((n(r[1]) / totCat) * 100) })),
    }
    return NextResponse.json(dados)
  } catch (e) {
    console.error('[api/orcamento]', e)
    return NextResponse.json(vazio())
  }
}
