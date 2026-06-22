import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { agentQuery } from '@/lib/agent'

export interface DadosReceita {
  kpis: {
    previsao:    { valor: number }
    anoAtual:    { valor: number; vs_ano_anterior_pct: number }
    anoAnterior: { valor: number }
    mes:         { valor: number; vs_ano_anterior_pct: number }
    mesAnterior: { valor: number }
  }
  mensal:     Array<{ mes: string; meta: number; realizado: number }>
  categorias: Array<{ nome: string; valor: number; pct: number }>
  historico: {
    meses: string[]
    anos:  Record<string, number[]>
  }
  origens: Array<{ categoria: string; nome: string; valor: number }>
}

const MES_ABREV = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MES_NOME = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }

function vazio(): DadosReceita {
  return {
    kpis: {
      previsao: { valor: 0 },
      anoAtual: { valor: 0, vs_ano_anterior_pct: 0 }, anoAnterior: { valor: 0 },
      mes: { valor: 0, vs_ano_anterior_pct: 0 }, mesAnterior: { valor: 0 },
    },
    mensal: MES_ABREV.slice(1).map(m => ({ mes: m, meta: 0, realizado: 0 })),
    categorias: [], historico: { meses: MES_NOME.slice(1), anos: {} }, origens: [],
  }
}

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ano = parseInt(searchParams.get('ano') ?? '2025')

  try {
    // Histórico mensal dos últimos 4 anos (também usado para mensal/KPIs)
    const hist = await agentQuery(`
      SELECT d.NO_ANO ano, d.NO_MES mes, SUM(ISNULL(f.VL_ARRECADACAO_RECEITA,0)) v
      FROM SEPLAN.FATO_EXECUCAO_RECEITA f
      JOIN SEPLAN.DIM_NATUREZA_RECEITA nr ON f.SK_NATUREZA_RECEITA = nr.SK_NATUREZA_RECEITA
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO BETWEEN ${ano - 3} AND ${ano} AND nr.CD_TIPO_RECEITA = 1
      GROUP BY d.NO_ANO, d.NO_MES`, 100)

    const matriz: Record<number, number[]> = {}
    for (let a = ano - 3; a <= ano; a++) matriz[a] = Array(12).fill(0)
    for (const r of hist.rows) {
      const a = n(r[0]); const m = n(r[1])
      if (matriz[a] && m >= 1 && m <= 12) matriz[a][m - 1] = n(r[2])
    }

    const arrCur = matriz[ano] ?? Array(12).fill(0)
    const arrPrev = matriz[ano - 1] ?? Array(12).fill(0)
    const acumulado = arrCur.reduce((s, v) => s + v, 0)
    const acumuladoPrev = arrPrev.reduce((s, v) => s + v, 0)
    let ultimoMes = 0
    for (let i = 11; i >= 0; i--) { if (arrCur[i] > 0) { ultimoMes = i + 1; break } }
    const arrecadacaoMes = ultimoMes > 0 ? arrCur[ultimoMes - 1] : 0
    const mesAnterior = ultimoMes > 1 ? arrCur[ultimoMes - 2] : 0
    const mesAnoAnterior = ultimoMes > 0 ? arrPrev[ultimoMes - 1] : 0
    const varPct = (a: number, b: number) => (b > 0 ? +(((a - b) / b) * 100).toFixed(1) : 0)

    // Categorias econômicas
    const cat = await agentQuery(`
      SELECT nr.DS_CATEGORIA_ECONOMICA_RECEITA nome, SUM(ISNULL(f.VL_ARRECADACAO_RECEITA,0)) v
      FROM SEPLAN.FATO_EXECUCAO_RECEITA f
      JOIN SEPLAN.DIM_NATUREZA_RECEITA nr ON f.SK_NATUREZA_RECEITA = nr.SK_NATUREZA_RECEITA
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano} AND nr.CD_TIPO_RECEITA = 1
      GROUP BY nr.DS_CATEGORIA_ECONOMICA_RECEITA ORDER BY v DESC`, 20)
    const totCat = cat.rows.reduce((s, r) => s + n(r[1]), 0) || 1

    // Origens da receita
    const orig = await agentQuery(`
      SELECT nr.DS_CATEGORIA_ECONOMICA_RECEITA categoria, nr.DS_ORIGEM_RECEITA nome, SUM(ISNULL(f.VL_ARRECADACAO_RECEITA,0)) v
      FROM SEPLAN.FATO_EXECUCAO_RECEITA f
      JOIN SEPLAN.DIM_NATUREZA_RECEITA nr ON f.SK_NATUREZA_RECEITA = nr.SK_NATUREZA_RECEITA
      JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
      WHERE d.NO_ANO = ${ano} AND nr.CD_TIPO_RECEITA = 1 AND nr.DS_ORIGEM_RECEITA IS NOT NULL
      GROUP BY nr.DS_CATEGORIA_ECONOMICA_RECEITA, nr.DS_ORIGEM_RECEITA ORDER BY v DESC`, 80)

    // Previsão da receita (LOA) do ano
    let previsao = 0
    try {
      const prev = await agentQuery(`
        SELECT SUM(ISNULL(f.VL_PREVISAO_RECEITA_LOA,0)) v
        FROM SEPLAN.FATO_ELABORACAO_PREVISAO_RECEITA f
        JOIN SEPLAN.DIM_NATUREZA_RECEITA nr ON f.SK_NATUREZA_RECEITA = nr.SK_NATUREZA_RECEITA
        JOIN SEPLAN.DIM_DATA_CALENDARIO d ON f.SK_DATA_CALENDARIO = d.SK_DATA_CALENDARIO
        WHERE d.NO_ANO = ${ano} AND nr.CD_TIPO_RECEITA = 1`, 1)
      previsao = n(prev.rows[0]?.[0])
    } catch { previsao = 0 }

    const anosHist: Record<string, number[]> = {}
    for (let a = ano - 3; a <= ano; a++) anosHist[String(a)] = matriz[a]

    const dados: DadosReceita = {
      kpis: {
        previsao:    { valor: previsao },
        anoAtual:    { valor: acumulado, vs_ano_anterior_pct: varPct(acumulado, acumuladoPrev) },
        anoAnterior: { valor: acumuladoPrev },
        mes:         { valor: arrecadacaoMes, vs_ano_anterior_pct: varPct(arrecadacaoMes, mesAnoAnterior) },
        mesAnterior: { valor: mesAnterior },
      },
      mensal: arrCur.map((v, i) => ({ mes: MES_ABREV[i + 1], meta: 0, realizado: v })),
      categorias: cat.rows.map(r => ({ nome: String(r[0] ?? '').trim() || 'Não informado', valor: n(r[1]), pct: Math.round((n(r[1]) / totCat) * 100) })),
      historico: { meses: MES_NOME.slice(1), anos: anosHist },
      origens: orig.rows.map(r => ({ categoria: String(r[0] ?? '').trim() || 'Não informado', nome: String(r[1] ?? '').trim(), valor: n(r[2]) })),
    }
    return NextResponse.json(dados)
  } catch (e) {
    console.error('[api/receita]', e)
    return NextResponse.json(vazio())
  }
}
