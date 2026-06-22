'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import type { DadosDespesa } from '@/app/api/despesa/route'

const DONUT_COLORS = ['#0f2d5a', '#2563eb', '#93c5fd']
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

.kdes-root, .kdes-root * { box-sizing: border-box; }
.kdes-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}
.kdes-root[data-theme="light"] {
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
.kdes-root[data-theme="dark"] {
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
.kdes-sidebar {
  background: oklch(0.20 0.10 264);
  border-right: 1px solid oklch(0.26 0.12 264);
  padding: 24px 18px 20px;
  display: flex; flex-direction: column; gap: 22px;
  position: sticky; top: 0; height: 100vh; overflow: hidden;
}
.kdes-brand { display: flex; align-items: center; gap: 10px; padding: 0 4px 2px; }
.kdes-brand-icon {
  width: 38px; height: 38px; background: var(--green); border-radius: 12px;
  display: grid; place-items: center; flex-shrink: 0; color: #fff;
}
.kdes-brand-text .t1 { font-size: 13.5px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.kdes-nav-label {
  font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.45);
  font-weight: 700; padding: 0 10px; text-transform: uppercase; margin-bottom: 6px;
}
.kdes-nav { display: flex; flex-direction: column; gap: 2px; }
.kdes-nav a {
  display: flex; align-items: center; gap: 10px; padding: 10px;
  border-radius: 10px; color: rgba(255,255,255,0.70); text-decoration: none;
  font-size: 13.5px; font-weight: 500; transition: background .12s;
}
.kdes-nav a:hover { background: rgba(255,255,255,0.10); color: #fff; }
.kdes-nav a.active { background: rgba(255,255,255,0.18); color: #fff; }
.kdes-nav a svg { width: 16px; height: 16px; flex-shrink: 0; }

/* ── MAIN ── */
.kdes-main {
  padding: 28px 32px 48px;
  display: flex; flex-direction: column; gap: 20px;
  min-width: 0; overflow-y: auto;
}

/* Topbar */
.kdes-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.kdes-title {
  font-family: 'Instrument Serif', serif;
  font-size: 36px; font-weight: 400; letter-spacing: -0.02em;
  margin: 0; line-height: 1; color: var(--ink);
}
.kdes-title em { font-style: italic; color: var(--green); }
.kdes-sub { font-size: 13px; color: var(--ink-3); margin: 6px 0 0; }
.kdes-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 4px; }

.kdes-hdr-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; font-family: inherit; border: 0;
  transition: all .12s;
}
.kdes-hdr-btn.primary { background: var(--green); color: #fff; }
.kdes-hdr-btn.primary:hover { background: var(--green-deep); }
.kdes-hdr-btn.secondary { background: var(--surface); border: 1px solid var(--line); color: var(--ink-2); }
.kdes-hdr-btn.secondary:hover { background: var(--surface-2); }

.kdes-theme-toggle {
  display: inline-flex; background: var(--surface);
  border: 1px solid var(--line); border-radius: 999px; padding: 3px; gap: 2px;
}
.kdes-theme-toggle button {
  padding: 5px 12px; border-radius: 999px; border: 0;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; color: var(--ink-3); background: transparent; transition: all .15s;
}
.kdes-theme-toggle button.active { background: var(--green); color: #fff; }

/* KPI Grid — 5 cols */
.kdes-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.kdes-kpi {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-sm); padding: 18px 20px;
  box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
}
.kdes-kpi.accent { background: #0f2d5a; border-color: #0f2d5a; }
.kdes-kpi.accent .kdes-kpi-label { color: rgba(255,255,255,.65); }
.kdes-kpi.accent .kdes-kpi-val   { color: #fff; }
.kdes-kpi.accent .kdes-kpi-sub   { color: rgba(255,255,255,.70); }
.kdes-kpi.accent .kdes-kpi-arrow { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.7); }
.kdes-kpi.warm  { background: oklch(0.96 0.04 75); border-color: oklch(0.88 0.06 75); }
.kdes-kpi-label { font-size: 11px; font-weight: 600; color: var(--ink-3); margin-bottom: 8px; letter-spacing: .02em; }
.kdes-kpi-val   { font-size: 22px; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; line-height: 1; }
.kdes-kpi-sub   { font-size: 10.5px; margin-top: 6px; display: flex; align-items: center; gap: 4px; font-weight: 600; }
.kdes-kpi-sub.up   { color: oklch(0.42 0.16 145); }
.kdes-kpi-sub.down { color: oklch(0.48 0.18 25);  }
.kdes-kpi-arrow {
  position: absolute; top: 14px; right: 14px;
  width: 24px; height: 24px; border-radius: 7px;
  border: 1px solid var(--line);
  display: grid; place-items: center; color: var(--ink-3);
}

/* Skeleton */
.kdes-sk { border-radius: 8px; background: var(--surface-2); animation: kdes-pulse 1.4s ease-in-out infinite; }
@keyframes kdes-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
.kdes-sk-full { border-radius: 12px; background: var(--surface-2); animation: kdes-pulse 1.4s ease-in-out infinite; }

/* Cards */
.kdes-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 22px 24px; box-shadow: var(--shadow-sm);
}
.kdes-card-hdr {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.kdes-card-title { font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; }
.kdes-detail-btn {
  font-size: 12px; font-weight: 600; color: var(--ink-3);
  background: var(--surface-2); border: 1px solid var(--line);
  border-radius: 8px; padding: 5px 12px; cursor: pointer;
  font-family: inherit; transition: background .12s;
}
.kdes-detail-btn:hover { background: var(--green-soft); color: var(--ink); }

/* Year pills */
.kdes-year-pills { display: flex; gap: 4px; }
.kdes-year-pill {
  font-size: 12px; font-weight: 600; padding: 4px 10px;
  border-radius: 999px; border: 1px solid var(--line);
  background: transparent; color: var(--ink-3);
  cursor: pointer; font-family: inherit; transition: all .12s;
}
.kdes-year-pill.active { background: var(--green); color: #fff; border-color: var(--green); }
.kdes-year-pill:hover:not(.active) { background: var(--green-soft); color: var(--ink); }

/* Row layouts */
.kdes-row2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
.kdes-row3 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }

/* Progress bars (secretarias / modalidades) */
.kdes-bar-list { display: flex; flex-direction: column; gap: 14px; }
.kdes-bar-row  { display: flex; flex-direction: column; gap: 5px; }
.kdes-bar-top  { display: flex; align-items: center; justify-content: space-between; }
.kdes-bar-name { font-size: 11px; font-weight: 700; color: var(--ink-2); letter-spacing: .04em; text-transform: uppercase; }
.kdes-bar-val  { font-size: 11.5px; font-weight: 700; color: var(--ink); }
.kdes-bar-track {
  width: 100%; height: 7px; border-radius: 999px;
  background: var(--bar-track); overflow: hidden;
}
.kdes-bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #0f2d5a 0%, #2563eb 100%);
  transition: width .5s cubic-bezier(.4,0,.2,1);
}

/* Donut */
.kdes-donut-wrap  { display: flex; align-items: center; gap: 24px; }
.kdes-donut-chart { position: relative; flex-shrink: 0; width: 220px; height: 220px; }
.kdes-donut-inner {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); text-align: center; pointer-events: none;
}
.kdes-donut-val { font-size: 16px; font-weight: 800; color: var(--ink); line-height: 1.3; }
.kdes-donut-lbl { font-size: 11px; color: var(--ink-3); font-weight: 500; }
.kdes-donut-legend { display: flex; flex-direction: column; gap: 14px; flex: 1; }
.kdes-donut-leg-row { display: flex; align-items: center; gap: 8px; }
.kdes-donut-leg-dot { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
.kdes-donut-leg-name { font-size: 11px; font-weight: 600; color: var(--ink-2); flex: 1; }
.kdes-donut-leg-pct  { font-size: 13px; font-weight: 800; color: var(--ink); }

/* Elements Table */
.kdes-table-wrap { overflow-x: auto; }
.kdes-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
}
.kdes-table thead tr { background: #0f2d5a; color: #fff; }
.kdes-table thead th {
  padding: 10px 14px; text-align: right;
  font-size: 10.5px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; white-space: nowrap;
}
.kdes-table thead th:first-child { text-align: left; border-radius: 8px 0 0 0; }
.kdes-table thead th:last-child  { border-radius: 0 8px 0 0; }
.kdes-table tbody tr { border-bottom: 1px solid var(--line); }
.kdes-table tbody tr:nth-child(even) { background: var(--surface-2); }
.kdes-table tbody td {
  padding: 9px 14px; text-align: right; color: var(--ink-2);
  font-size: 12px; white-space: nowrap;
}
.kdes-table tbody td:first-child { text-align: left; max-width: 280px; }
.kdes-table tbody td.link { color: #2563eb; font-weight: 600; cursor: pointer; }
.kdes-table tbody td.link:hover { text-decoration: underline; }
.kdes-table td.exec-pct { font-weight: 700; color: var(--ink); }
`

const ArrowIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function DespesaPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [ano, setAno] = useState(2026)
  const [dados, setDados] = useState<DadosDespesa | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('k-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    setDados(null)
    fetch(`/api/despesa?ano=${ano}`)
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => { if (data) setDados(data as DadosDespesa) })
      .catch(() => {})
  }, [ano, router])

  function toggleTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('k-theme', t)
  }

  const maxSec = dados ? Math.max(...dados.secretarias.map(s => s.valor)) : 1
  const maxMod = dados ? Math.max(...dados.modalidades.map(m => m.valor)) : 1

  return (
    <div className="kdes-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── SIDEBAR ── */}
      <aside className="kdes-sidebar">
        <div className="kdes-brand">
          <img src="/logo-maranhao.png" alt="Governo do Maranhão" style={{ width: '100%', height: 'auto', background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'block' }} />
        </div>

        <div>
          <div className="kdes-nav-label">Menu</div>
          <nav className="kdes-nav">
            <Link href="/receita">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Receita
            </Link>
            <a className="active" href="/despesa">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 3v18M16 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Despesa
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
          <div style={{ fontSize: '13.5px', fontWeight: 700, lineHeight: 1.4, marginBottom: '6px' }}>Despesas do Governo</div>
          <div style={{ fontSize: '11.5px', opacity: .7, lineHeight: 1.5 }}>Execução orçamentária · DWPROD16</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="kdes-main">

        {/* Header */}
        <div className="kdes-topbar">
          <div>
            <h1 className="kdes-title">Despesas <em>do Governo</em></h1>
            <p className="kdes-sub">Execução orçamentária da despesa · Atualização: 23/04/26 · Diária</p>
          </div>
          <div className="kdes-topbar-right">
            <div className="kdes-theme-toggle">
              <button className={theme === 'light' ? 'active' : ''} onClick={() => toggleTheme('light')}>☀ Claro</button>
              <button className={theme === 'dark'  ? 'active' : ''} onClick={() => toggleTheme('dark')}>☾ Escuro</button>
            </div>
            <button className="kdes-hdr-btn primary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Exportar
            </button>
            <button className="kdes-hdr-btn secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 21h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Balancete Despesa
            </button>
            <button className="kdes-hdr-btn secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.8"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.8"/></svg>
              Detalhe Despesa
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="kdes-kpi-grid">

          {/* Dotação Inicial */}
          <div className="kdes-kpi accent">
            <div className="kdes-kpi-label">Dotação Inicial</div>
            {dados ? (
              <>
                <div className="kdes-kpi-val">{fmtM(dados.kpis.dotacaoInicial.valor)}</div>
                <div className="kdes-kpi-sub up">
                  ▲{dados.kpis.dotacaoInicial.vs_ano_anterior_pct.toFixed(1)}% vs ano anterior
                </div>
              </>
            ) : (
              <><div className="kdes-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="kdes-sk" style={{ width: '60%', height: '13px' }} /></>
            )}
            <div className="kdes-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* Dotação Atualizada */}
          <div className="kdes-kpi">
            <div className="kdes-kpi-label">Dotação Atualizada</div>
            {dados ? (
              <>
                <div className="kdes-kpi-val">{fmtM(dados.kpis.dotacaoAtualizada.valor)}</div>
                <div className="kdes-kpi-sub up">
                  ▲{dados.kpis.dotacaoAtualizada.vs_ano_anterior_pct.toFixed(1)}% vs ano anterior
                </div>
              </>
            ) : (
              <><div className="kdes-sk" style={{ width: '80%', height: '28px', marginBottom: '8px' }} /><div className="kdes-sk" style={{ width: '60%', height: '13px' }} /></>
            )}
            <div className="kdes-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* Valor Empenho */}
          <div className="kdes-kpi">
            <div className="kdes-kpi-label">Valor Empenho</div>
            {dados ? (
              <div className="kdes-kpi-val">{fmtM(dados.kpis.valorEmpenho.valor)}</div>
            ) : (
              <div className="kdes-sk" style={{ width: '80%', height: '28px' }} />
            )}
            <div className="kdes-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* Valor Liquidado */}
          <div className="kdes-kpi warm">
            <div className="kdes-kpi-label">Valor Liquidado</div>
            {dados ? (
              <div className="kdes-kpi-val">{fmtM(dados.kpis.valorLiquidado.valor)}</div>
            ) : (
              <div className="kdes-sk" style={{ width: '80%', height: '28px' }} />
            )}
            <div className="kdes-kpi-arrow"><ArrowIcon /></div>
          </div>

          {/* Valor Pago */}
          <div className="kdes-kpi">
            <div className="kdes-kpi-label">Valor Pago</div>
            {dados ? (
              <div className="kdes-kpi-val">{fmtM(dados.kpis.valorPago.valor)}</div>
            ) : (
              <div className="kdes-sk" style={{ width: '80%', height: '28px' }} />
            )}
            <div className="kdes-kpi-arrow"><ArrowIcon /></div>
          </div>

        </div>

        {/* ── Row 2: Secretarias + Donut Categorias ── */}
        <div className="kdes-row2">

          {/* Dot. Inicial por Secretaria */}
          <div className="kdes-card">
            <div className="kdes-card-hdr">
              <h2 className="kdes-card-title">Dot. Inicial por Secretaria</h2>
              <div className="kdes-year-pills">
                {ANOS.map(a => (
                  <button key={a} className={`kdes-year-pill${ano === a ? ' active' : ''}`} onClick={() => setAno(a)}>{a}</button>
                ))}
              </div>
            </div>
            {dados ? (
              <div className="kdes-bar-list">
                {dados.secretarias.map((s, i) => (
                  <div key={i} className="kdes-bar-row">
                    <div className="kdes-bar-top">
                      <span className="kdes-bar-name">{s.nome}</span>
                      <span className="kdes-bar-val">{fmtMShort(s.valor)}</span>
                    </div>
                    <div className="kdes-bar-track">
                      <div className="kdes-bar-fill" style={{ width: `${(s.valor / maxSec) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kdes-sk-full" style={{ height: '260px' }} />
            )}
          </div>

          {/* Dotação por Categoria */}
          <div className="kdes-card">
            <div className="kdes-card-hdr">
              <h2 className="kdes-card-title">Dotação por Categoria</h2>
              <button className="kdes-detail-btn" type="button">Detalhes</button>
            </div>
            {dados ? (
              <div className="kdes-donut-wrap">
                <div className="kdes-donut-chart">
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <Pie
                        data={dados.categorias}
                        cx="50%" cy="50%"
                        innerRadius={66} outerRadius={100}
                        dataKey="valor" strokeWidth={0}
                      >
                        {dados.categorias.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i] ?? '#93c5fd'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="kdes-donut-inner">
                    <div className="kdes-donut-val">{fmtM(dados.kpis.dotacaoInicial.valor)}</div>
                    <div className="kdes-donut-lbl">dotação</div>
                  </div>
                </div>
                <div className="kdes-donut-legend">
                  {dados.categorias.map((c, i) => (
                    <div key={i} className="kdes-donut-leg-row">
                      <div className="kdes-donut-leg-dot" style={{ background: DONUT_COLORS[i] ?? '#93c5fd' }} />
                      <span className="kdes-donut-leg-name">{c.nome}</span>
                      <span className="kdes-donut-leg-pct">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="kdes-sk-full" style={{ height: '200px' }} />
            )}
          </div>
        </div>

        {/* ── Row 3: Tabela Elementos + Modalidades ── */}
        <div className="kdes-row3">

          {/* Dotação por Elemento de Despesa */}
          <div className="kdes-card">
            <div className="kdes-card-hdr">
              <h2 className="kdes-card-title">Despesa por Elemento — Empenhado e Liquidado</h2>
              <button className="kdes-detail-btn" type="button">Detalhe</button>
            </div>
            {dados ? (
              <div className="kdes-table-wrap">
                <table className="kdes-table">
                  <thead>
                    <tr>
                      <th>Elemento de Despesa</th>
                      <th>Empenhado</th>
                      <th>Liquidado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.elementos.map((e, i) => (
                      <tr key={i}>
                        <td>{e.nome}</td>
                        <td>{fmtMShort(e.empenhado)}</td>
                        <td>{fmtMShort(e.liquidado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="kdes-sk-full" style={{ height: '220px' }} />
            )}
          </div>

          {/* Dot. Inicial por Modalidade */}
          <div className="kdes-card">
            <div className="kdes-card-hdr">
              <h2 className="kdes-card-title">Dot. Inicial por Modalidade</h2>
              <button className="kdes-detail-btn" type="button">Detalhes</button>
            </div>
            {dados ? (
              <div className="kdes-bar-list">
                {dados.modalidades.map((m, i) => (
                  <div key={i} className="kdes-bar-row">
                    <div className="kdes-bar-top">
                      <span className="kdes-bar-name" style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{m.nome}</span>
                      <span className="kdes-bar-val">{fmtMShort(m.valor)}</span>
                    </div>
                    <div className="kdes-bar-track">
                      <div className="kdes-bar-fill" style={{ width: `${(m.valor / maxMod) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kdes-sk-full" style={{ height: '180px' }} />
            )}
          </div>

        </div>

      </main>
    </div>
  )
}
