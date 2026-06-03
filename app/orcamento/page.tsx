'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

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

const DONUT_COLORS = ['#1a3a6b', '#2563eb']
const ANOS = [2023, 2024, 2025, 2026]

function fmtM(v: number): string {
  if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(1)} B`
  if (v >= 1_000_000)     return `R$ ${(v / 1_000_000).toFixed(1)} M`
  if (v >= 1_000)         return `R$ ${(v / 1_000).toFixed(0)} K`
  return `R$ ${v.toLocaleString('pt-BR')}`
}

function fmtAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

.kor-root, .kor-root * { box-sizing: border-box; }
.kor-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}
.kor-root[data-theme="light"] {
  --bg: oklch(0.97 0.008 95);
  --surface: #ffffff;
  --surface-2: oklch(0.96 0.01 240);
  --ink: oklch(0.18 0.02 240);
  --ink-2: oklch(0.42 0.02 240);
  --ink-3: oklch(0.62 0.015 240);
  --line: oklch(0.92 0.012 240);
  --line-2: oklch(0.88 0.015 240);
  --bar-track: oklch(0.91 0.01 220);
  --green: oklch(0.52 0.20 264);
  --green-deep: oklch(0.32 0.14 264);
  --green-ink: oklch(0.20 0.10 264);
  --green-soft: oklch(0.94 0.04 240);
  --radius: 22px;
  --radius-sm: 14px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.07);
}
.kor-root[data-theme="dark"] {
  --bg: oklch(0.16 0.012 150);
  --surface: oklch(0.21 0.014 240);
  --surface-2: oklch(0.26 0.014 240);
  --ink: oklch(0.96 0.008 95);
  --ink-2: oklch(0.78 0.01 240);
  --ink-3: oklch(0.58 0.012 240);
  --line: oklch(0.28 0.014 240);
  --line-2: oklch(0.32 0.014 240);
  --bar-track: oklch(0.30 0.01 220);
  --green: oklch(0.64 0.18 264);
  --green-deep: oklch(0.26 0.10 264);
  --green-ink: oklch(0.20 0.10 264);
  --green-soft: oklch(0.28 0.06 240);
  --radius: 22px;
  --radius-sm: 14px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.3);
}

/* ── SIDEBAR ── */
.kor-sidebar {
  background: oklch(0.20 0.10 264);
  border-right: 1px solid oklch(0.26 0.12 264);
  padding: 24px 18px 20px;
  display: flex; flex-direction: column; gap: 22px;
  position: sticky; top: 0; height: 100vh; overflow: hidden;
}
.kor-brand { display: flex; align-items: center; gap: 10px; padding: 0 4px 2px; }
.kor-brand-icon {
  width: 38px; height: 38px; background: var(--green); border-radius: 12px;
  display: grid; place-items: center; flex-shrink: 0; color: #fff;
}
.kor-brand-text .t1 { font-size: 13.5px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.kor-brand-text .t2 { font-size: 10.5px; color: rgba(255,255,255,0.55); font-weight: 500; }
.kor-nav-label {
  font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.45);
  font-weight: 700; padding: 0 10px; text-transform: uppercase; margin-bottom: 6px;
}
.kor-nav { display: flex; flex-direction: column; gap: 2px; }
.kor-nav a {
  display: flex; align-items: center; gap: 10px; padding: 10px;
  border-radius: 10px; color: rgba(255,255,255,0.70); text-decoration: none;
  font-size: 13.5px; font-weight: 500; transition: background .12s;
}
.kor-nav a:hover { background: rgba(255,255,255,0.10); color: #fff; }
.kor-nav a.active { background: rgba(255,255,255,0.18); color: #fff; }
.kor-nav a svg { width: 16px; height: 16px; flex-shrink: 0; }

/* ── MAIN ── */
.kor-main {
  padding: 28px 32px 48px;
  display: flex; flex-direction: column; gap: 20px;
  min-width: 0; overflow-y: auto;
}

/* Topbar */
.kor-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.kor-title {
  font-family: 'Instrument Serif', serif;
  font-size: 36px; font-weight: 400; letter-spacing: -0.02em;
  margin: 0; line-height: 1; color: var(--ink);
}
.kor-title em { font-style: italic; color: var(--green); }
.kor-sub { font-size: 13px; color: var(--ink-3); margin: 6px 0 0; }
.kor-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 4px; }

.kor-hdr-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; font-family: inherit; border: 0;
  transition: all .12s;
}
.kor-hdr-btn.primary { background: var(--green); color: #fff; }
.kor-hdr-btn.primary:hover { background: var(--green-deep); }
.kor-hdr-btn.secondary { background: var(--surface); border: 1px solid var(--line); color: var(--ink-2); }
.kor-hdr-btn.secondary:hover { background: var(--surface-2); }

.kor-theme-toggle {
  display: inline-flex; background: var(--surface);
  border: 1px solid var(--line); border-radius: 999px; padding: 3px; gap: 2px;
}
.kor-theme-toggle button {
  padding: 5px 12px; border-radius: 999px; border: 0;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; color: var(--ink-3); background: transparent; transition: all .15s;
}
.kor-theme-toggle button.active { background: var(--green); color: #fff; }

/* KPI Grid */
.kor-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kor-kpi {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-sm); padding: 20px 22px;
  box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
}
.kor-kpi.accent { background: #0f2d5a; border-color: #0f2d5a; }
.kor-kpi.accent .kor-kpi-label { color: rgba(255,255,255,.65); }
.kor-kpi.accent .kor-kpi-val   { color: #fff; }
.kor-kpi.accent .kor-kpi-sub   { color: rgba(255,255,255,.55); }
.kor-kpi.accent .kor-kpi-arrow { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.7); }
.kor-kpi-label { font-size: 12px; font-weight: 600; color: var(--ink-3); margin-bottom: 10px; letter-spacing: .02em; }
.kor-kpi-val   { font-size: 26px; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; line-height: 1; }
.kor-kpi-sub   { font-size: 11.5px; color: var(--ink-3); margin-top: 6px; }
.kor-kpi-arrow {
  position: absolute; top: 16px; right: 16px;
  width: 26px; height: 26px; border-radius: 8px;
  border: 1px solid var(--line);
  display: grid; place-items: center; color: var(--ink-3);
}

/* Skeleton */
.kor-sk { border-radius: 8px; background: var(--surface-2); animation: kor-pulse 1.4s ease-in-out infinite; }
@keyframes kor-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
.kor-sk-full { border-radius: 12px; background: var(--surface-2); animation: kor-pulse 1.4s ease-in-out infinite; }

/* Cards */
.kor-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 22px 24px; box-shadow: var(--shadow-sm);
}
.kor-card-hdr {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
}
.kor-card-title { font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; }
.kor-detail-btn {
  font-size: 12px; font-weight: 600; color: var(--ink-3);
  background: var(--surface-2); border: 1px solid var(--line);
  border-radius: 8px; padding: 5px 12px; cursor: pointer;
  font-family: inherit; transition: background .12s;
}
.kor-detail-btn:hover { background: var(--green-soft); color: var(--ink); }

/* Year pills */
.kor-year-pills { display: flex; gap: 4px; }
.kor-year-pill {
  font-size: 12px; font-weight: 600; padding: 4px 10px;
  border-radius: 999px; border: 1px solid var(--line);
  background: transparent; color: var(--ink-3);
  cursor: pointer; font-family: inherit; transition: all .12s;
}
.kor-year-pill.active { background: var(--green); color: #fff; border-color: var(--green); }
.kor-year-pill:hover:not(.active) { background: var(--green-soft); color: var(--ink); }

/* Row layouts */
.kor-row2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
.kor-row3 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }

/* Gauge */
.kor-gauge-wrap { position: relative; }
.kor-gauge-overlay {
  position: absolute; bottom: 24px; left: 50%;
  transform: translateX(-50%); text-align: center; pointer-events: none;
}
.kor-gauge-pct  { font-size: 30px; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; line-height: 1; }
.kor-gauge-lbl  { font-size: 11px; color: var(--ink-3); font-weight: 500; margin-top: 3px; }
.kor-gauge-legend {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  margin-top: 8px; flex-wrap: wrap;
}
.kor-gauge-leg  { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--ink-3); }
.kor-gauge-dot  { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }

/* Donut */
.kor-donut-wrap  { display: flex; align-items: center; gap: 20px; }
.kor-donut-chart { position: relative; flex-shrink: 0; width: 180px; height: 180px; }
.kor-donut-inner {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); text-align: center; pointer-events: none;
}
.kor-donut-val { font-size: 13px; font-weight: 800; color: var(--ink); letter-spacing: -0.01em; line-height: 1.3; }
.kor-donut-lbl { font-size: 10px; color: var(--ink-3); font-weight: 500; }
.kor-donut-legend { display: flex; flex-direction: column; gap: 14px; flex: 1; }
.kor-donut-leg-row { display: flex; align-items: center; gap: 8px; }
.kor-donut-leg-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.kor-donut-leg-name { font-size: 11.5px; font-weight: 600; color: var(--ink-2); flex: 1; line-height: 1.3; }
.kor-donut-leg-pct  { font-size: 14px; font-weight: 800; color: var(--ink); }
`

export default function OrcamentoPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [ano, setAno] = useState(2025)
  const [dados, setDados] = useState<DadosOrcamento | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('k-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    setDados(null)
    fetch(`/api/orcamento?ano=${ano}`)
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => { if (data) setDados(data as DadosOrcamento) })
      .catch(() => {})
  }, [ano, router])

  function toggleTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('k-theme', t)
  }

  const tooltipStyle = {
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,.1)',
    padding: '8px 12px', fontSize: '12.5px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }
  const axisProps = {
    tick: { fontSize: 11, fill: 'var(--ink-3)', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    axisLine: false as const,
    tickLine: false as const,
  }

  const gaugePct = dados?.kpis.empenhado.receita_pct ?? 0
  const gaugeData = [
    { value: gaugePct,       name: 'Empenhado' },
    { value: 100 - gaugePct, name: ''          },
  ]

  const funcColors = ['#1a3a6b', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

  return (
    <div className="kor-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── SIDEBAR ── */}
      <aside className="kor-sidebar">
        <div className="kor-brand">
          <img src="/logo-maranhao.png" alt="Governo do Maranhão" style={{ width: '100%', height: 'auto', background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'block' }} />
        </div>

        <div>
          <div className="kor-nav-label">Menu</div>
          <nav className="kor-nav">
            <a className="active" href="/orcamento">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15V9M12 15V5M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Orçamento
            </a>
            <Link href="/receita">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Receita
            </Link>
            <Link href="/despesa">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 3v18M16 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Despesa
            </Link>
            <Link href="/chat">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Chat IA
            </Link>
            <Link href="/catalogo">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Catálogo
            </Link>
            <Link href="/dashboard">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 13l9-9 9 9M5 11v9h14v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Consulta
            </Link>
          </nav>
        </div>

        <div style={{ marginTop: 'auto', background: 'var(--green-ink)', borderRadius: '16px', padding: '16px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, opacity: .7, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Dashboard</div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, lineHeight: 1.4, marginBottom: '6px' }}>Orçamento Governo</div>
          <div style={{ fontSize: '11.5px', opacity: .7, lineHeight: 1.5 }}>Execução orçamentária do Governo do Maranhão · DWPROD16</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="kor-main">

        {/* Header */}
        <div className="kor-topbar">
          <div>
            <h1 className="kor-title">Orçamento <em>Governo</em></h1>
            <p className="kor-sub">Execução orçamentária · Receitas e Despesas · {ano}</p>
          </div>
          <div className="kor-topbar-right">
            <div className="kor-theme-toggle">
              <button className={theme === 'light' ? 'active' : ''} onClick={() => toggleTheme('light')}>☀ Claro</button>
              <button className={theme === 'dark'  ? 'active' : ''} onClick={() => toggleTheme('dark')}>☾ Escuro</button>
            </div>
            <button className="kor-hdr-btn primary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Exportar
            </button>
            <button className="kor-hdr-btn secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 21h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Relatório
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="kor-kpi-grid">

          <div className="kor-kpi accent">
            <div className="kor-kpi-label">Total Arrecadado</div>
            {dados ? (
              <>
                <div className="kor-kpi-val">{fmtM(dados.kpis.arrecadado.valor)}</div>
                <div className="kor-kpi-sub">{dados.kpis.arrecadado.meta_pct}% da meta</div>
              </>
            ) : (
              <><div className="kor-sk" style={{ width: '80%', height: '32px', marginBottom: '8px' }} /><div className="kor-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="kor-kpi-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div className="kor-kpi">
            <div className="kor-kpi-label">Total Empenhado</div>
            {dados ? (
              <>
                <div className="kor-kpi-val">{fmtM(dados.kpis.empenhado.valor)}</div>
                <div className="kor-kpi-sub">{dados.kpis.empenhado.receita_pct}% da receita</div>
              </>
            ) : (
              <><div className="kor-sk" style={{ width: '80%', height: '32px', marginBottom: '8px' }} /><div className="kor-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="kor-kpi-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div className="kor-kpi">
            <div className="kor-kpi-label">Total Liquidado</div>
            {dados ? (
              <>
                <div className="kor-kpi-val">{fmtM(dados.kpis.liquidado.valor)}</div>
                <div className="kor-kpi-sub">{dados.kpis.liquidado.empenhado_pct}% do empenhado</div>
              </>
            ) : (
              <><div className="kor-sk" style={{ width: '80%', height: '32px', marginBottom: '8px' }} /><div className="kor-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="kor-kpi-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div className="kor-kpi">
            <div className="kor-kpi-label">Total Pago</div>
            {dados ? (
              <>
                <div className="kor-kpi-val">{fmtM(dados.kpis.pago.valor)}</div>
                <div className="kor-kpi-sub">{dados.kpis.pago.liquidado_pct}% do liquidado</div>
              </>
            ) : (
              <><div className="kor-sk" style={{ width: '80%', height: '32px', marginBottom: '8px' }} /><div className="kor-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="kor-kpi-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* ── Row 2: Mensal + Gauge ── */}
        <div className="kor-row2">

          {/* Arrecadação Mensal */}
          <div className="kor-card">
            <div className="kor-card-hdr">
              <h2 className="kor-card-title">Arrecadação Mensal</h2>
              <div className="kor-year-pills">
                {ANOS.map(a => (
                  <button key={a} className={`kor-year-pill${ano === a ? ' active' : ''}`} onClick={() => setAno(a)}>{a}</button>
                ))}
              </div>
            </div>
            {dados ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dados.mensal} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barSize={22}>
                  <XAxis dataKey="mes" {...axisProps} dy={6} />
                  <YAxis tickFormatter={fmtAxis} {...axisProps} width={42} />
                  <Tooltip
                    formatter={(v) => [fmtM(Number(v)), 'Arrecadado']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--green-soft)' }}
                  />
                  <Bar dataKey="arrecadado" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="kor-sk-full" style={{ height: '220px' }} />
            )}
          </div>

          {/* Gauge — Execução Orçamentária */}
          <div className="kor-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="kor-card-title" style={{ marginBottom: '4px' }}>Execução Orçamentária</h2>
            {dados ? (
              <>
                <div className="kor-gauge-wrap" style={{ flex: 1 }}>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      {/* track */}
                      <Pie
                        data={[{ value: 100 }]}
                        cx="50%" cy="85%"
                        startAngle={180} endAngle={0}
                        innerRadius={68} outerRadius={90}
                        dataKey="value" strokeWidth={0}
                      >
                        <Cell fill="var(--bar-track)" />
                      </Pie>
                      {/* value */}
                      <Pie
                        data={gaugeData}
                        cx="50%" cy="85%"
                        startAngle={180} endAngle={0}
                        innerRadius={68} outerRadius={90}
                        dataKey="value" strokeWidth={0}
                      >
                        <Cell fill="#2563eb" />
                        <Cell fill="transparent" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="kor-gauge-overlay">
                    <div className="kor-gauge-pct">{gaugePct}%</div>
                    <div className="kor-gauge-lbl">empenho / receita</div>
                  </div>
                </div>
                <div className="kor-gauge-legend">
                  {[
                    { label: 'Empenhado', color: '#2563eb'          },
                    { label: 'Liquidado', color: '#f59e0b'          },
                    { label: 'Pendente',  color: 'var(--bar-track)' },
                  ].map(item => (
                    <div key={item.label} className="kor-gauge-leg">
                      <div className="kor-gauge-dot" style={{ background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="kor-sk-full" style={{ flex: 1, minHeight: '200px' }} />
            )}
          </div>
        </div>

        {/* ── Row 3: Funções + Categorias ── */}
        <div className="kor-row3">

          {/* Despesa por Função */}
          <div className="kor-card">
            <div className="kor-card-hdr">
              <h2 className="kor-card-title">Despesa por Função</h2>
              <button className="kor-detail-btn" type="button">Detalhes</button>
            </div>
            {dados ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={dados.funcoes} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barSize={18}>
                  <XAxis type="number" tickFormatter={fmtAxis} {...axisProps} />
                  <YAxis dataKey="nome" type="category" {...axisProps} width={108} />
                  <Tooltip
                    formatter={(v) => [fmtM(Number(v)), 'Pago']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--green-soft)' }}
                  />
                  <Bar dataKey="pago" radius={[0, 6, 6, 0]}>
                    {dados.funcoes.map((_, i) => (
                      <Cell key={i} fill={funcColors[i] ?? '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="kor-sk-full" style={{ height: '230px' }} />
            )}
          </div>

          {/* Receita por Categoria */}
          <div className="kor-card">
            <div className="kor-card-hdr">
              <h2 className="kor-card-title">Receita por Categoria</h2>
              <button className="kor-detail-btn" type="button">Exportar</button>
            </div>
            {dados ? (
              <div className="kor-donut-wrap">
                <div className="kor-donut-chart">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={dados.categorias}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        dataKey="valor" strokeWidth={0}
                      >
                        {dados.categorias.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i] ?? '#93c5fd'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="kor-donut-inner">
                    <div className="kor-donut-val">{fmtM(dados.kpis.arrecadado.valor)}</div>
                    <div className="kor-donut-lbl">arrecadado</div>
                  </div>
                </div>
                <div className="kor-donut-legend">
                  {dados.categorias.map((c, i) => (
                    <div key={i} className="kor-donut-leg-row">
                      <div className="kor-donut-leg-dot" style={{ background: DONUT_COLORS[i] ?? '#93c5fd' }} />
                      <span className="kor-donut-leg-name">{c.nome}</span>
                      <span className="kor-donut-leg-pct">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="kor-sk-full" style={{ height: '180px' }} />
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
