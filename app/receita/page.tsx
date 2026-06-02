'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import type { DadosReceita } from '@/app/api/receita/route'

const DONUT_COLORS = ['#0f2d5a', '#1a3a6b', '#1d4ed8', '#2563eb', '#60a5fa', '#93c5fd']
const ANOS = [2023, 2024, 2025, 2026]

function fmtM(v: number): string {
  if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(1)} B`
  if (v >= 1_000_000)     return `R$ ${(v / 1_000_000).toFixed(1)} M`
  if (v >= 1_000)         return `R$ ${(v / 1_000).toFixed(0)} K`
  return `R$ ${v.toLocaleString('pt-BR')}`
}

function fmtBR(v: number): string {
  if (v === 0) return '—'
  return `R$ ${(v / 1_000_000).toFixed(1)}M`
}

function fmtAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

.krec-root, .krec-root * { box-sizing: border-box; }
.krec-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}
.krec-root[data-theme="light"] {
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
.krec-root[data-theme="dark"] {
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
.krec-sidebar {
  background: oklch(0.20 0.10 264);
  border-right: 1px solid oklch(0.26 0.12 264);
  padding: 24px 18px 20px;
  display: flex; flex-direction: column; gap: 22px;
  position: sticky; top: 0; height: 100vh; overflow: hidden;
}
.krec-brand { display: flex; align-items: center; gap: 10px; padding: 0 4px 2px; }
.krec-brand-icon {
  width: 38px; height: 38px; background: var(--green); border-radius: 12px;
  display: grid; place-items: center; flex-shrink: 0; color: #fff;
}
.krec-brand-text .t1 { font-size: 13.5px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.krec-nav-label {
  font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.45);
  font-weight: 700; padding: 0 10px; text-transform: uppercase; margin-bottom: 6px;
}
.krec-nav { display: flex; flex-direction: column; gap: 2px; }
.krec-nav a {
  display: flex; align-items: center; gap: 10px; padding: 10px;
  border-radius: 10px; color: rgba(255,255,255,0.70); text-decoration: none;
  font-size: 13.5px; font-weight: 500; transition: background .12s;
}
.krec-nav a:hover { background: rgba(255,255,255,0.10); color: #fff; }
.krec-nav a.active { background: rgba(255,255,255,0.18); color: #fff; }
.krec-nav a svg { width: 16px; height: 16px; flex-shrink: 0; }

/* ── MAIN ── */
.krec-main {
  padding: 28px 32px 48px;
  display: flex; flex-direction: column; gap: 20px;
  min-width: 0; overflow-y: auto;
}

/* Topbar */
.krec-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.krec-title {
  font-family: 'Instrument Serif', serif;
  font-size: 36px; font-weight: 400; letter-spacing: -0.02em;
  margin: 0; line-height: 1; color: var(--ink);
}
.krec-title em { font-style: italic; color: var(--green); }
.krec-sub { font-size: 13px; color: var(--ink-3); margin: 6px 0 0; }
.krec-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 4px; }

.krec-hdr-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; font-family: inherit; border: 0;
  transition: all .12s;
}
.krec-hdr-btn.primary { background: var(--green); color: #fff; }
.krec-hdr-btn.primary:hover { background: var(--green-deep); }
.krec-hdr-btn.secondary { background: var(--surface); border: 1px solid var(--line); color: var(--ink-2); }
.krec-hdr-btn.secondary:hover { background: var(--surface-2); }

.krec-theme-toggle {
  display: inline-flex; background: var(--surface);
  border: 1px solid var(--line); border-radius: 999px; padding: 3px; gap: 2px;
}
.krec-theme-toggle button {
  padding: 5px 12px; border-radius: 999px; border: 0;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; color: var(--ink-3); background: transparent; transition: all .15s;
}
.krec-theme-toggle button.active { background: var(--green); color: #fff; }

/* KPI Grid — 5 columns */
.krec-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.krec-kpi {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-sm); padding: 18px 20px;
  box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
}
.krec-kpi.accent { background: #0f2d5a; border-color: #0f2d5a; }
.krec-kpi.accent .krec-kpi-label { color: rgba(255,255,255,.65); }
.krec-kpi.accent .krec-kpi-val   { color: #fff; }
.krec-kpi.accent .krec-kpi-sub   { color: rgba(255,255,255,.55); }
.krec-kpi.accent .krec-kpi-arrow { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.7); }
.krec-kpi.warm  { background: oklch(0.96 0.04 75); border-color: oklch(0.88 0.06 75); }
.krec-kpi-label { font-size: 11px; font-weight: 600; color: var(--ink-3); margin-bottom: 8px; letter-spacing: .02em; }
.krec-kpi-val   { font-size: 22px; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; line-height: 1; }
.krec-kpi-sub   { font-size: 11px; color: var(--ink-3); margin-top: 5px; }
.krec-kpi-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10.5px; font-weight: 700; padding: 2px 7px;
  border-radius: 999px; margin-top: 5px;
}
.krec-kpi-badge.up   { background: oklch(0.92 0.12 145); color: oklch(0.32 0.14 145); }
.krec-kpi-badge.down { background: oklch(0.93 0.08 25);  color: oklch(0.38 0.16 25);  }
.krec-kpi-arrow {
  position: absolute; top: 14px; right: 14px;
  width: 24px; height: 24px; border-radius: 7px;
  border: 1px solid var(--line);
  display: grid; place-items: center; color: var(--ink-3);
}

/* Skeleton */
.krec-sk { border-radius: 8px; background: var(--surface-2); animation: krec-pulse 1.4s ease-in-out infinite; }
@keyframes krec-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
.krec-sk-full { border-radius: 12px; background: var(--surface-2); animation: krec-pulse 1.4s ease-in-out infinite; }

/* Cards */
.krec-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 22px 24px; box-shadow: var(--shadow-sm);
}
.krec-card-hdr {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
}
.krec-card-title { font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; }
.krec-detail-btn {
  font-size: 12px; font-weight: 600; color: var(--ink-3);
  background: var(--surface-2); border: 1px solid var(--line);
  border-radius: 8px; padding: 5px 12px; cursor: pointer;
  font-family: inherit; transition: background .12s;
}
.krec-detail-btn:hover { background: var(--green-soft); color: var(--ink); }

/* Year pills */
.krec-year-pills { display: flex; gap: 4px; }
.krec-year-pill {
  font-size: 12px; font-weight: 600; padding: 4px 10px;
  border-radius: 999px; border: 1px solid var(--line);
  background: transparent; color: var(--ink-3);
  cursor: pointer; font-family: inherit; transition: all .12s;
}
.krec-year-pill.active { background: var(--green); color: #fff; border-color: var(--green); }
.krec-year-pill:hover:not(.active) { background: var(--green-soft); color: var(--ink); }

/* Row layouts */
.krec-row2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
.krec-row3 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }

/* Donut */
.krec-donut-wrap  { display: flex; align-items: center; gap: 16px; }
.krec-donut-chart { position: relative; flex-shrink: 0; width: 160px; height: 160px; }
.krec-donut-inner {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); text-align: center; pointer-events: none;
}
.krec-donut-val { font-size: 11px; font-weight: 800; color: var(--ink); letter-spacing: -0.01em; line-height: 1.3; }
.krec-donut-lbl { font-size: 9px; color: var(--ink-3); font-weight: 500; }
.krec-donut-legend { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; }
.krec-donut-leg-row { display: flex; align-items: center; gap: 7px; }
.krec-donut-leg-dot { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
.krec-donut-leg-name { font-size: 10.5px; font-weight: 600; color: var(--ink-2); flex: 1; line-height: 1.3; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.krec-donut-leg-pct  { font-size: 13px; font-weight: 800; color: var(--ink); flex-shrink: 0; }

/* Historical Table */
.krec-table-wrap { overflow-x: auto; }
.krec-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
}
.krec-table thead tr { background: #0f2d5a; color: #fff; }
.krec-table thead th {
  padding: 9px 12px; text-align: right; font-weight: 700;
  font-size: 11.5px; letter-spacing: .02em; white-space: nowrap;
}
.krec-table thead th:first-child { text-align: left; border-radius: 8px 0 0 0; }
.krec-table thead th:last-child  { border-radius: 0 8px 0 0; }
.krec-table tbody tr:nth-child(even) { background: var(--surface-2); }
.krec-table tbody td {
  padding: 7px 12px; text-align: right; color: var(--ink-2);
  border-bottom: 1px solid var(--line); white-space: nowrap;
}
.krec-table tbody td:first-child { text-align: left; font-weight: 600; color: var(--ink); }
`

export default function ReceitaPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [ano, setAno] = useState(2025)
  const [dados, setDados] = useState<DadosReceita | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('k-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    setDados(null)
    fetch(`/api/receita?ano=${ano}`)
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => { if (data) setDados(data as DadosReceita) })
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

  const histAnos = dados ? Object.keys(dados.historico.anos).sort() : []

  return (
    <div className="krec-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── SIDEBAR ── */}
      <aside className="krec-sidebar">
        <div className="krec-brand">
          <img src="/logo-maranhao.png" alt="Governo do Maranhão" style={{ width: '100%', height: 'auto', background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'block' }} />
        </div>

        <div>
          <div className="krec-nav-label">Menu</div>
          <nav className="krec-nav">
            <Link href="/orcamento">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15V9M12 15V5M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Orçamento
            </Link>
            <a className="active" href="/receita">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Receita
            </a>
            <Link href="/despesa">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 3v18M16 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Despesa
            </Link>
            <Link href="/iptu">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              IPTU
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
          <div style={{ fontSize: '13.5px', fontWeight: 700, lineHeight: 1.4, marginBottom: '6px' }}>Receitas Municipais</div>
          <div style={{ fontSize: '11.5px', opacity: .7, lineHeight: 1.5 }}>Arrecadação e previsão · dados mock</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="krec-main">

        {/* Header */}
        <div className="krec-topbar">
          <div>
            <h1 className="krec-title">Receitas <em>do Município</em></h1>
            <p className="krec-sub">Arrecadação e previsão orçamentária · {ano}</p>
          </div>
          <div className="krec-topbar-right">
            <div className="krec-theme-toggle">
              <button className={theme === 'light' ? 'active' : ''} onClick={() => toggleTheme('light')}>☀ Claro</button>
              <button className={theme === 'dark'  ? 'active' : ''} onClick={() => toggleTheme('dark')}>☾ Escuro</button>
            </div>
            <button className="krec-hdr-btn primary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Exportar
            </button>
            <button className="krec-hdr-btn secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 21h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Balancete
            </button>
            <button className="krec-hdr-btn secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.8"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.8"/></svg>
              Detalhe
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="krec-kpi-grid">

          {/* Orçado */}
          <div className="krec-kpi accent">
            <div className="krec-kpi-label">Orçado</div>
            {dados ? (
              <>
                <div className="krec-kpi-val">{fmtM(dados.kpis.orcado.valor)}</div>
                <div className={`krec-kpi-badge ${dados.kpis.orcado.tendencia === 'up' ? 'up' : 'down'}`}>
                  {dados.kpis.orcado.tendencia === 'up' ? '▲' : '▼'} vs. ano ant.
                </div>
              </>
            ) : (
              <><div className="krec-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="krec-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="krec-kpi-arrow">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Orçado Atualizado */}
          <div className="krec-kpi">
            <div className="krec-kpi-label">Orçado Atualizado</div>
            {dados ? (
              <>
                <div className="krec-kpi-val">{fmtM(dados.kpis.orcadoAtualizado.valor)}</div>
                <div className={`krec-kpi-badge ${dados.kpis.orcadoAtualizado.tendencia === 'up' ? 'up' : 'down'}`}>
                  {dados.kpis.orcadoAtualizado.tendencia === 'up' ? '▲' : '▼'} vs. ano ant.
                </div>
              </>
            ) : (
              <><div className="krec-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="krec-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="krec-kpi-arrow">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Arrecadação Mês */}
          <div className="krec-kpi">
            <div className="krec-kpi-label">Arrecadação Mês</div>
            {dados ? (
              <>
                <div className="krec-kpi-val">{fmtM(dados.kpis.arrecadacaoMes.valor)}</div>
                <div className="krec-kpi-sub">
                  {dados.kpis.arrecadacaoMes.vs_ano_anterior_pct > 0 ? '+' : ''}{dados.kpis.arrecadacaoMes.vs_ano_anterior_pct}% vs. ano ant.
                </div>
              </>
            ) : (
              <><div className="krec-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="krec-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="krec-kpi-arrow">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Acumulado */}
          <div className="krec-kpi warm">
            <div className="krec-kpi-label">Arrecadação Acumulada</div>
            {dados ? (
              <>
                <div className="krec-kpi-val">{fmtM(dados.kpis.acumulado.valor)}</div>
                <div className="krec-kpi-sub">
                  {dados.kpis.acumulado.vs_ano_anterior_pct > 0 ? '+' : ''}{dados.kpis.acumulado.vs_ano_anterior_pct}% vs. ano ant.
                </div>
              </>
            ) : (
              <><div className="krec-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="krec-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="krec-kpi-arrow">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Mês Anterior */}
          <div className="krec-kpi">
            <div className="krec-kpi-label">Mês Anterior</div>
            {dados ? (
              <>
                <div className="krec-kpi-val">{fmtM(dados.kpis.mesAnterior.valor)}</div>
                <div className="krec-kpi-sub">arrecadação realizada</div>
              </>
            ) : (
              <><div className="krec-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="krec-sk" style={{ width: '50%', height: '14px' }} /></>
            )}
            <div className="krec-kpi-arrow">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

        </div>

        {/* ── Row 2: Mensal BarChart + Donut Categorias ── */}
        <div className="krec-row2">

          {/* Arrecadação Mensal */}
          <div className="krec-card">
            <div className="krec-card-hdr">
              <h2 className="krec-card-title">Arrecadação Mensal — Meta vs. Realizado</h2>
              <div className="krec-year-pills">
                {ANOS.map(a => (
                  <button key={a} className={`krec-year-pill${ano === a ? ' active' : ''}`} onClick={() => setAno(a)}>{a}</button>
                ))}
              </div>
            </div>
            {dados ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dados.mensal} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barSize={16} barCategoryGap="28%">
                    <XAxis dataKey="mes" {...axisProps} dy={6} />
                    <YAxis tickFormatter={fmtAxis} {...axisProps} width={42} />
                    <Tooltip
                      formatter={(v, name) => [fmtM(Number(v)), name === 'meta' ? 'Meta' : 'Realizado']}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: 'var(--green-soft)' }}
                    />
                    <Bar dataKey="meta"      fill="#d1d5db" radius={[4, 4, 0, 0]} name="meta" />
                    <Bar dataKey="realizado" fill="#2563eb" radius={[4, 4, 0, 0]} name="realizado" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingLeft: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--ink-3)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#d1d5db', flexShrink: 0 }} />
                    Meta
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--ink-3)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#2563eb', flexShrink: 0 }} />
                    Realizado
                  </div>
                </div>
              </>
            ) : (
              <div className="krec-sk-full" style={{ height: '220px' }} />
            )}
          </div>

          {/* Donut Categorias */}
          <div className="krec-card">
            <div className="krec-card-hdr">
              <h2 className="krec-card-title">Por Categoria</h2>
              <button className="krec-detail-btn" type="button">Exportar</button>
            </div>
            {dados ? (
              <div className="krec-donut-wrap">
                <div className="krec-donut-chart">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={dados.categorias}
                        cx="50%" cy="50%"
                        innerRadius={44} outerRadius={72}
                        dataKey="valor" strokeWidth={0}
                      >
                        {dados.categorias.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i] ?? '#93c5fd'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="krec-donut-inner">
                    <div className="krec-donut-val">{fmtM(dados.kpis.acumulado.valor)}</div>
                    <div className="krec-donut-lbl">acumulado</div>
                  </div>
                </div>
                <div className="krec-donut-legend">
                  {dados.categorias.map((c, i) => (
                    <div key={i} className="krec-donut-leg-row">
                      <div className="krec-donut-leg-dot" style={{ background: DONUT_COLORS[i] ?? '#93c5fd' }} />
                      <span className="krec-donut-leg-name" title={c.nome}>{c.nome}</span>
                      <span className="krec-donut-leg-pct">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="krec-sk-full" style={{ height: '180px' }} />
            )}
          </div>
        </div>

        {/* ── Row 3: Histórico + Origens ── */}
        <div className="krec-row3">

          {/* Histórico Mensal */}
          <div className="krec-card">
            <div className="krec-card-hdr">
              <h2 className="krec-card-title">Histórico Mensal de Arrecadação</h2>
              <button className="krec-detail-btn" type="button">Detalhe Receita</button>
            </div>
            {dados ? (
              <div className="krec-table-wrap">
                <table className="krec-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      {histAnos.map(a => <th key={a}>{a}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {dados.historico.meses.map((mes, mi) => (
                      <tr key={mes}>
                        <td>{mes}</td>
                        {histAnos.map(a => (
                          <td key={a}>{fmtBR(dados.historico.anos[a]?.[mi] ?? 0)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="krec-sk-full" style={{ height: '280px' }} />
            )}
          </div>

          {/* Arrecadação por Origem */}
          <div className="krec-card">
            <div className="krec-card-hdr">
              <h2 className="krec-card-title">Arrecadação por Origem</h2>
              <button className="krec-detail-btn" type="button">Detalhes</button>
            </div>
            {dados ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dados.origens} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barSize={18}>
                  <XAxis type="number" tickFormatter={fmtAxis} {...axisProps} />
                  <YAxis dataKey="nome" type="category" {...axisProps} width={112} />
                  <Tooltip
                    formatter={(v) => [fmtM(Number(v)), 'Arrecadado']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--green-soft)' }}
                  />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {dados.origens.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i] ?? '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="krec-sk-full" style={{ height: '260px' }} />
            )}
          </div>

        </div>

      </main>
    </div>
  )
}
