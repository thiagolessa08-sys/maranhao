'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import type { DadosIPTU } from '@/app/api/iptu/route'

const DONUT_COLORS = ['#0f2d5a', '#2563eb', '#60a5fa', '#93c5fd']
const ANOS = [2023, 2024, 2025, 2026]

function fmtM(v: number): string {
  if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(1)} B`
  if (v >= 1_000_000)     return `R$ ${(v / 1_000_000).toFixed(1)} M`
  if (v >= 1_000)         return `R$ ${(v / 1_000).toFixed(0)} K`
  return `R$ ${v.toLocaleString('pt-BR')}`
}

function fmtMShort(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$${(v / 1_000).toFixed(0)}K`
  return `R$${v}`
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

.kipt-root, .kipt-root * { box-sizing: border-box; }
.kipt-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}
.kipt-root[data-theme="light"] {
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
.kipt-root[data-theme="dark"] {
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
.kipt-sidebar {
  background: oklch(0.20 0.10 264);
  border-right: 1px solid oklch(0.26 0.12 264);
  padding: 24px 18px 20px;
  display: flex; flex-direction: column; gap: 22px;
  position: sticky; top: 0; height: 100vh; overflow: hidden;
}
.kipt-brand { display: flex; align-items: center; gap: 10px; padding: 0 4px 2px; }
.kipt-brand-icon {
  width: 38px; height: 38px; background: var(--green); border-radius: 12px;
  display: grid; place-items: center; flex-shrink: 0; color: #fff;
}
.kipt-brand-text .t1 { font-size: 13.5px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.kipt-nav-label {
  font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.45);
  font-weight: 700; padding: 0 10px; text-transform: uppercase; margin-bottom: 6px;
}
.kipt-nav { display: flex; flex-direction: column; gap: 2px; }
.kipt-nav a {
  display: flex; align-items: center; gap: 10px; padding: 10px;
  border-radius: 10px; color: rgba(255,255,255,0.70); text-decoration: none;
  font-size: 13.5px; font-weight: 500; transition: background .12s;
}
.kipt-nav a:hover { background: rgba(255,255,255,0.10); color: #fff; }
.kipt-nav a.active { background: rgba(255,255,255,0.18); color: #fff; }
.kipt-nav a svg { width: 16px; height: 16px; flex-shrink: 0; }

/* ── MAIN ── */
.kipt-main {
  padding: 28px 32px 48px;
  display: flex; flex-direction: column; gap: 20px;
  min-width: 0; overflow-y: auto;
}

/* Topbar */
.kipt-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.kipt-title {
  font-family: 'Instrument Serif', serif;
  font-size: 36px; font-weight: 400; letter-spacing: -0.02em;
  margin: 0; line-height: 1; color: var(--ink);
}
.kipt-title em { font-style: italic; color: var(--green); }
.kipt-sub { font-size: 13px; color: var(--ink-3); margin: 6px 0 0; }
.kipt-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 4px; }

.kipt-hdr-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; font-family: inherit; border: 0;
  transition: all .12s;
}
.kipt-hdr-btn.primary { background: var(--green); color: #fff; }
.kipt-hdr-btn.primary:hover { background: var(--green-deep); }
.kipt-hdr-btn.secondary { background: var(--surface); border: 1px solid var(--line); color: var(--ink-2); }
.kipt-hdr-btn.secondary:hover { background: var(--surface-2); }

.kipt-theme-toggle {
  display: inline-flex; background: var(--surface);
  border: 1px solid var(--line); border-radius: 999px; padding: 3px; gap: 2px;
}
.kipt-theme-toggle button {
  padding: 5px 12px; border-radius: 999px; border: 0;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; color: var(--ink-3); background: transparent; transition: all .15s;
}
.kipt-theme-toggle button.active { background: var(--green); color: #fff; }

/* KPI Grid — 5 cols */
.kipt-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.kipt-kpi {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-sm); padding: 18px 20px;
  box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
}
.kipt-kpi.accent { background: #0f2d5a; border-color: #0f2d5a; }
.kipt-kpi.accent .kipt-kpi-label { color: rgba(255,255,255,.65); }
.kipt-kpi.accent .kipt-kpi-val   { color: #fff; }
.kipt-kpi.accent .kipt-kpi-sub   { color: rgba(255,255,255,.70); }
.kipt-kpi.accent .kipt-kpi-arrow { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.7); }
.kipt-kpi.warm  { background: oklch(0.96 0.04 75); border-color: oklch(0.88 0.06 75); }
.kipt-kpi-label { font-size: 11px; font-weight: 600; color: var(--ink-3); margin-bottom: 8px; letter-spacing: .02em; }
.kipt-kpi-val   { font-size: 22px; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; line-height: 1; }
.kipt-kpi-sub   { font-size: 10.5px; margin-top: 6px; display: flex; align-items: center; gap: 4px; font-weight: 600; }
.kipt-kpi-sub.up   { color: oklch(0.42 0.16 145); }
.kipt-kpi-sub.down { color: oklch(0.48 0.18 25);  }
.kipt-kpi-sub.neutral { color: var(--ink-3); }
.kipt-kpi-arrow {
  position: absolute; top: 14px; right: 14px;
  width: 24px; height: 24px; border-radius: 7px;
  border: 1px solid var(--line);
  display: grid; place-items: center; color: var(--ink-3);
}

/* Skeleton */
.kipt-sk { border-radius: 8px; background: var(--surface-2); animation: kipt-pulse 1.4s ease-in-out infinite; }
@keyframes kipt-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
.kipt-sk-full { border-radius: 12px; background: var(--surface-2); animation: kipt-pulse 1.4s ease-in-out infinite; }

/* Cards */
.kipt-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 22px 24px; box-shadow: var(--shadow-sm);
}
.kipt-card-hdr {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.kipt-card-title { font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; }
.kipt-detail-btn {
  font-size: 12px; font-weight: 600; color: var(--ink-3);
  background: var(--surface-2); border: 1px solid var(--line);
  border-radius: 8px; padding: 5px 12px; cursor: pointer;
  font-family: inherit; transition: background .12s;
}
.kipt-detail-btn:hover { background: var(--green-soft); color: var(--ink); }

/* Year pills */
.kipt-year-pills { display: flex; gap: 4px; }
.kipt-year-pill {
  font-size: 12px; font-weight: 600; padding: 4px 10px;
  border-radius: 999px; border: 1px solid var(--line);
  background: transparent; color: var(--ink-3);
  cursor: pointer; font-family: inherit; transition: all .12s;
}
.kipt-year-pill.active { background: var(--green); color: #fff; border-color: var(--green); }
.kipt-year-pill:hover:not(.active) { background: var(--green-soft); color: var(--ink); }

/* Chart legend */
.kipt-chart-legend { display: flex; gap: 20px; justify-content: center; margin-top: 12px; }
.kipt-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink-2); }
.kipt-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

/* Row layouts */
.kipt-row2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
.kipt-row3 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }

/* Progress bars (bairros) */
.kipt-bar-list { display: flex; flex-direction: column; gap: 14px; }
.kipt-bar-row  { display: flex; flex-direction: column; gap: 5px; }
.kipt-bar-top  { display: flex; align-items: center; justify-content: space-between; }
.kipt-bar-name { font-size: 11px; font-weight: 700; color: var(--ink-2); letter-spacing: .04em; text-transform: uppercase; }
.kipt-bar-val  { font-size: 11.5px; font-weight: 700; color: var(--ink); }
.kipt-bar-track {
  width: 100%; height: 7px; border-radius: 999px;
  background: var(--bar-track); overflow: hidden;
}
.kipt-bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #0f2d5a 0%, #2563eb 100%);
  transition: width .5s cubic-bezier(.4,0,.2,1);
}

/* Donut */
.kipt-donut-wrap  { display: flex; align-items: center; gap: 24px; }
.kipt-donut-chart { position: relative; flex-shrink: 0; width: 220px; height: 220px; }
.kipt-donut-inner {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); text-align: center; pointer-events: none;
}
.kipt-donut-val { font-size: 16px; font-weight: 800; color: var(--ink); line-height: 1.3; }
.kipt-donut-lbl { font-size: 11px; color: var(--ink-3); font-weight: 500; }
.kipt-donut-legend { display: flex; flex-direction: column; gap: 14px; flex: 1; }
.kipt-donut-leg-row { display: flex; align-items: center; gap: 8px; }
.kipt-donut-leg-dot { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
.kipt-donut-leg-name { font-size: 11px; font-weight: 600; color: var(--ink-2); flex: 1; }
.kipt-donut-leg-pct  { font-size: 13px; font-weight: 800; color: var(--ink); }

/* Recharts overrides */
.kipt-root .recharts-cartesian-axis-tick text { fill: var(--ink-3); font-size: 11px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.kipt-root .recharts-cartesian-grid line { stroke: var(--line); }
.kipt-root .recharts-tooltip-wrapper { outline: none; }
`

const ArrowIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Custom tooltip for BarChart
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,.10)', fontSize: '12px', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', marginTop: '2px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color, flexShrink: 0 }} />
          {p.dataKey === 'lancado' ? 'Lançado' : 'Arrecadado'}: <strong style={{ color: '#0f172a' }}>{fmtMShort(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export default function IPTUPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [ano, setAno] = useState(2026)
  const [dados, setDados] = useState<DadosIPTU | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('k-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    setDados(null)
    fetch(`/api/iptu?ano=${ano}`)
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => { if (data) setDados(data as DadosIPTU) })
      .catch(() => {})
  }, [ano, router])

  function toggleTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('k-theme', t)
  }

  const maxBairro = dados ? Math.max(...dados.bairros.map(b => b.valor)) : 1
  const totalDivida = dados ? dados.aging.reduce((s, a) => s + a.valor, 0) : 0

  return (
    <div className="kipt-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── SIDEBAR ── */}
      <aside className="kipt-sidebar">
        <div className="kipt-brand">
          <img src="/logo-maranhao.png" alt="Governo do Maranhão" style={{ width: '100%', height: 'auto', background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'block' }} />
        </div>

        <div>
          <div className="kipt-nav-label">Menu</div>
          <nav className="kipt-nav">
            <Link href="/orcamento">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15V9M12 15V5M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Orçamento
            </Link>
            <Link href="/receita">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Receita
            </Link>
            <Link href="/despesa">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 3v18M16 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Despesa
            </Link>
            <a className="active" href="/iptu">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              IPTU
            </a>
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

        <div style={{ marginTop: 'auto', background: 'var(--green-ink)', borderRadius: '16px', padding: '16px', color: '#fff' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, opacity: .7, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Dashboard</div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, lineHeight: 1.4, marginBottom: '6px' }}>IPTU Municipal</div>
          <div style={{ fontSize: '11.5px', opacity: .7, lineHeight: 1.5 }}>Lançamento e arrecadação · dados mock</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="kipt-main">

        {/* Header */}
        <div className="kipt-topbar">
          <div>
            <h1 className="kipt-title">IPTU do <em>Município</em></h1>
            <p className="kipt-sub">Análise executiva de lançamento e arrecadação · Atualização: 19/05/26 · Anual</p>
          </div>
          <div className="kipt-topbar-right">
            <div className="kipt-theme-toggle">
              <button className={theme === 'light' ? 'active' : ''} onClick={() => toggleTheme('light')}>☀ Claro</button>
              <button className={theme === 'dark'  ? 'active' : ''} onClick={() => toggleTheme('dark')}>☾ Escuro</button>
            </div>
            <button className="kipt-hdr-btn primary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Exportar
            </button>
            <button className="kipt-hdr-btn secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 4a2 2 0 012-2h2a2 2 0 012 2M9 4h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Carnê IPTU
            </button>
            <button className="kipt-hdr-btn secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.8"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.8"/></svg>
              Detalhe Cadastro
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="kipt-kpi-grid">

          {/* IPTU Lançado */}
          <div className="kipt-kpi accent">
            <div className="kipt-kpi-label">IPTU Lançado</div>
            {dados ? (
              <>
                <div className="kipt-kpi-val">{fmtM(dados.kpis.lancado.valor)}</div>
                <div className={`kipt-kpi-sub ${dados.kpis.lancado.vs_ano_anterior_pct >= 0 ? 'up' : 'down'}`}>
                  {dados.kpis.lancado.vs_ano_anterior_pct >= 0 ? '▲' : '▼'}{Math.abs(dados.kpis.lancado.vs_ano_anterior_pct).toFixed(1)}% vs ano anterior
                </div>
              </>
            ) : (
              <><div className="kipt-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="kipt-sk" style={{ width: '60%', height: '13px' }} /></>
            )}
            <div className="kipt-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* IPTU Arrecadado */}
          <div className="kipt-kpi">
            <div className="kipt-kpi-label">IPTU Arrecadado</div>
            {dados ? (
              <>
                <div className="kipt-kpi-val">{fmtM(dados.kpis.arrecadado.valor)}</div>
                <div className={`kipt-kpi-sub ${dados.kpis.arrecadado.vs_ano_anterior_pct >= 0 ? 'up' : 'down'}`}>
                  {dados.kpis.arrecadado.vs_ano_anterior_pct >= 0 ? '▲' : '▼'}{Math.abs(dados.kpis.arrecadado.vs_ano_anterior_pct).toFixed(1)}% vs ano anterior
                </div>
              </>
            ) : (
              <><div className="kipt-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="kipt-sk" style={{ width: '60%', height: '13px' }} /></>
            )}
            <div className="kipt-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* % Efetividade */}
          <div className="kipt-kpi">
            <div className="kipt-kpi-label">% Efetividade</div>
            {dados ? (
              <>
                <div className="kipt-kpi-val">{dados.kpis.efetividade.pct.toFixed(1)}%</div>
                <div className="kipt-kpi-sub neutral">arrecadado / lançado</div>
              </>
            ) : (
              <><div className="kipt-sk" style={{ width: '60%', height: '28px', marginBottom: '8px' }} /><div className="kipt-sk" style={{ width: '70%', height: '13px' }} /></>
            )}
            <div className="kipt-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* Inadimplência */}
          <div className="kipt-kpi warm">
            <div className="kipt-kpi-label">Inadimplência</div>
            {dados ? (
              <>
                <div className="kipt-kpi-val">{fmtM(dados.kpis.inadimplencia.valor)}</div>
                <div className={`kipt-kpi-sub ${dados.kpis.inadimplencia.vs_ano_anterior_pct >= 0 ? 'down' : 'up'}`}>
                  {dados.kpis.inadimplencia.vs_ano_anterior_pct >= 0 ? '▲' : '▼'}{Math.abs(dados.kpis.inadimplencia.vs_ano_anterior_pct).toFixed(1)}% vs ano anterior
                </div>
              </>
            ) : (
              <><div className="kipt-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="kipt-sk" style={{ width: '60%', height: '13px' }} /></>
            )}
            <div className="kipt-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* Imóveis Cadastrados */}
          <div className="kipt-kpi">
            <div className="kipt-kpi-label">Imóveis Cadastrados</div>
            {dados ? (
              <>
                <div className="kipt-kpi-val">{dados.kpis.imoveis.qtde.toLocaleString('pt-BR')}</div>
                <div className="kipt-kpi-sub neutral">imóveis no cadastro</div>
              </>
            ) : (
              <><div className="kipt-sk" style={{ width: '70%', height: '28px', marginBottom: '8px' }} /><div className="kipt-sk" style={{ width: '60%', height: '13px' }} /></>
            )}
            <div className="kipt-kpi-arrow"><ArrowIcon /></div>
          </div>

        </div>

        {/* ── Row 2: BarChart Mensal + Donut Tipos ── */}
        <div className="kipt-row2">

          {/* Lançado vs Arrecadado — mensal */}
          <div className="kipt-card">
            <div className="kipt-card-hdr">
              <h2 className="kipt-card-title">Lançado vs Arrecadado — Mensal</h2>
              <div className="kipt-year-pills">
                {ANOS.map(a => (
                  <button key={a} className={`kipt-year-pill${ano === a ? ' active' : ''}`} onClick={() => setAno(a)}>{a}</button>
                ))}
              </div>
            </div>
            {dados ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dados.mensal} barGap={3} barCategoryGap="30%">
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => `R$${(v / 1_000_000).toFixed(0)}M`}
                      width={56}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="lancado"    fill="#d1d5db" radius={[4,4,0,0]} />
                    <Bar dataKey="arrecadado" fill="#2563eb" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="kipt-chart-legend">
                  <div className="kipt-legend-item">
                    <div className="kipt-legend-dot" style={{ background: '#d1d5db' }} />
                    Lançado
                  </div>
                  <div className="kipt-legend-item">
                    <div className="kipt-legend-dot" style={{ background: '#2563eb' }} />
                    Arrecadado
                  </div>
                </div>
              </>
            ) : (
              <div className="kipt-sk-full" style={{ height: '270px' }} />
            )}
          </div>

          {/* Por Tipo de Imóvel */}
          <div className="kipt-card">
            <div className="kipt-card-hdr">
              <h2 className="kipt-card-title">Por Tipo de Imóvel</h2>
              <button className="kipt-detail-btn" type="button">Detalhes</button>
            </div>
            {dados ? (
              <div className="kipt-donut-wrap">
                <div className="kipt-donut-chart">
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <Pie
                        data={dados.tipos}
                        cx="50%" cy="50%"
                        innerRadius={66} outerRadius={100}
                        dataKey="valor" strokeWidth={0}
                      >
                        {dados.tipos.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i] ?? '#93c5fd'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="kipt-donut-inner">
                    <div className="kipt-donut-val">{fmtM(dados.kpis.arrecadado.valor)}</div>
                    <div className="kipt-donut-lbl">arrecadado</div>
                  </div>
                </div>
                <div className="kipt-donut-legend">
                  {dados.tipos.map((t, i) => (
                    <div key={i} className="kipt-donut-leg-row">
                      <div className="kipt-donut-leg-dot" style={{ background: DONUT_COLORS[i] ?? '#93c5fd' }} />
                      <span className="kipt-donut-leg-name">{t.nome}</span>
                      <span className="kipt-donut-leg-pct">{t.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="kipt-sk-full" style={{ height: '200px' }} />
            )}
          </div>

        </div>

        {/* ── Row 3: Top 10 Bairros + Aging Dívida ── */}
        <div className="kipt-row3">

          {/* Top 10 Bairros em Arrecadação */}
          <div className="kipt-card">
            <div className="kipt-card-hdr">
              <h2 className="kipt-card-title">Top 10 Bairros em Arrecadação</h2>
              <button className="kipt-detail-btn" type="button">Detalhe</button>
            </div>
            {dados ? (
              <div className="kipt-bar-list">
                {dados.bairros.map((b, i) => (
                  <div key={i} className="kipt-bar-row">
                    <div className="kipt-bar-top">
                      <span className="kipt-bar-name">{b.nome}</span>
                      <span className="kipt-bar-val">{fmtMShort(b.valor)}</span>
                    </div>
                    <div className="kipt-bar-track">
                      <div className="kipt-bar-fill" style={{ width: `${(b.valor / maxBairro) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kipt-sk-full" style={{ height: '300px' }} />
            )}
          </div>

          {/* Aging da Dívida */}
          <div className="kipt-card">
            <div className="kipt-card-hdr">
              <h2 className="kipt-card-title">Aging da Dívida</h2>
              <button className="kipt-detail-btn" type="button">Detalhes</button>
            </div>
            {dados ? (
              <div className="kipt-donut-wrap">
                <div className="kipt-donut-chart">
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <Pie
                        data={dados.aging}
                        cx="50%" cy="50%"
                        innerRadius={66} outerRadius={100}
                        dataKey="valor" strokeWidth={0}
                      >
                        {dados.aging.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i] ?? '#93c5fd'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="kipt-donut-inner">
                    <div className="kipt-donut-val">{fmtM(totalDivida)}</div>
                    <div className="kipt-donut-lbl">dívida total</div>
                  </div>
                </div>
                <div className="kipt-donut-legend">
                  {dados.aging.map((a, i) => (
                    <div key={i} className="kipt-donut-leg-row">
                      <div className="kipt-donut-leg-dot" style={{ background: DONUT_COLORS[i] ?? '#93c5fd' }} />
                      <span className="kipt-donut-leg-name">{a.faixa}</span>
                      <span className="kipt-donut-leg-pct">{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="kipt-sk-full" style={{ height: '200px' }} />
            )}
          </div>

        </div>

      </main>
    </div>
  )
}
