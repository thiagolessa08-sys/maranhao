'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QueryResult {
  columns: string[]
  rows: unknown[][]
  count: number
  truncated: boolean
}

interface ColumnDef {
  name: string
  type: string
  nullable: boolean
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

.k-root, .k-root * { box-sizing: border-box; }
.k-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}

.k-root[data-theme="light"] {
  --bg: oklch(0.97 0.008 95);
  --surface: #ffffff;
  --surface-2: oklch(0.96 0.01 240);
  --ink: oklch(0.18 0.02 240);
  --ink-2: oklch(0.42 0.02 240);
  --ink-3: oklch(0.62 0.015 240);
  --line: oklch(0.92 0.012 240);
  --line-2: oklch(0.88 0.015 240);
  --bar-track: oklch(0.95 0.015 240);
  --green: oklch(0.52 0.20 264);
  --green-deep: oklch(0.32 0.14 264);
  --green-ink: oklch(0.20 0.10 264);
  --green-soft: oklch(0.94 0.04 240);
  --amber: oklch(0.78 0.13 75);
  --rose: oklch(0.72 0.14 25);
  --radius: 22px;
  --radius-sm: 14px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --badge-bg: oklch(0.88 0.06 240);
  --stat-warm-bg: oklch(0.96 0.02 85);
  --stat-warm-border: oklch(0.9 0.03 85);
}
.k-root[data-theme="dark"] {
  --bg: oklch(0.16 0.012 150);
  --surface: oklch(0.21 0.014 240);
  --surface-2: oklch(0.26 0.014 240);
  --ink: oklch(0.96 0.008 95);
  --ink-2: oklch(0.78 0.01 240);
  --ink-3: oklch(0.58 0.012 240);
  --line: oklch(0.28 0.014 240);
  --line-2: oklch(0.32 0.014 240);
  --bar-track: oklch(0.26 0.014 240);
  --green: oklch(0.64 0.18 264);
  --green-deep: oklch(0.26 0.10 264);
  --green-ink: oklch(0.20 0.10 264);
  --green-soft: oklch(0.28 0.06 240);
  --amber: oklch(0.78 0.13 75);
  --rose: oklch(0.72 0.14 25);
  --radius: 22px;
  --radius-sm: 14px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.35);
  --badge-bg: oklch(0.34 0.08 240);
  --stat-warm-bg: oklch(0.26 0.03 75);
  --stat-warm-border: oklch(0.32 0.04 75);
}

/* SIDEBAR */
.k-sidebar {
  background: oklch(0.20 0.10 264);
  border-right: 1px solid oklch(0.26 0.12 264);
  padding: 24px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
.k-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px 2px;
}
.k-brand-icon {
  width: 38px; height: 38px;
  background: var(--green);
  border-radius: 12px;
  display: grid; place-items: center;
  flex-shrink: 0;
  color: #fff;
}
.k-brand-text { line-height: 1.2; }
.k-brand-text .t1 { font-size: 13.5px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.k-brand-text .t2 { font-size: 10.5px; color: rgba(255,255,255,0.55); font-weight: 500; }

.k-nav-label {
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.45);
  font-weight: 700;
  padding: 0 10px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.k-nav { display: flex; flex-direction: column; gap: 2px; }
.k-nav a, .k-nav button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 10px;
  color: rgba(255,255,255,0.70);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  border: 0;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background .12s;
}
.k-nav a:hover, .k-nav button:hover { background: rgba(255,255,255,0.10); color: #fff; }
.k-nav a.active { background: rgba(255,255,255,0.18); color: #fff; }
.k-nav a svg, .k-nav button svg { width: 16px; height: 16px; flex-shrink: 0; }

/* Table list inside sidebar */
.k-tables-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.k-tables-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  margin-bottom: 4px;
}
.k-reload-btn {
  width: 24px; height: 24px;
  display: grid; place-items: center;
  border-radius: 6px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--ink-3);
  transition: color .12s, background .12s;
}
.k-reload-btn:hover { background: rgba(255,255,255,0.10); color: #fff; }
.k-reload-btn { color: rgba(255,255,255,0.5); }
.k-table-list {
  flex: 1;
  overflow-y: auto;
  border-radius: 12px;
  background: rgba(255,255,255,0.07);
  padding: 4px;
}
.k-table-list::-webkit-scrollbar { width: 4px; }
.k-table-list::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 999px; }
.k-table-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink-2);
  cursor: pointer;
  border: 0;
  background: transparent;
  width: 100%;
  text-align: left;
  transition: background .1s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.k-table-item { color: rgba(255,255,255,0.70); }
.k-table-item:hover { background: rgba(255,255,255,0.10); color: #fff; }
.k-table-item.selected { background: rgba(255,255,255,0.18); color: #fff; }
.k-table-item svg { width: 13px; height: 13px; flex-shrink: 0; opacity: .6; }

/* MAIN */
.k-main { padding: 24px 28px 32px; display: flex; flex-direction: column; gap: 20px; min-width: 0; }

/* Topbar */
.k-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.k-page-title {
  font-family: 'Instrument Serif', serif;
  font-size: 38px;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1;
  color: var(--ink);
}
.k-page-title em { font-style: italic; color: var(--green); }
.k-page-sub { font-size: 13px; color: var(--ink-3); margin: 5px 0 0; }
.k-topbar-right { display: flex; align-items: center; gap: 12px; }

/* Theme toggle */
.k-theme-toggle {
  display: inline-flex;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}
.k-theme-toggle button {
  width: 30px; height: 30px;
  border: 0; background: transparent;
  border-radius: 999px;
  cursor: pointer;
  display: grid; place-items: center;
  color: var(--ink-3);
  font-family: inherit;
  transition: background .12s;
}
.k-theme-toggle button.on { background: var(--green); color: #fff; }
.k-theme-toggle svg { width: 14px; height: 14px; }

/* Agent badge */
.k-agent-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-2);
}
.k-agent-dot {
  width: 8px; height: 8px;
  border-radius: 999px;
}

/* Logout btn */
.k-logout {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: inherit;
  padding: 6px 4px;
  transition: color .12s;
}
.k-logout:hover { color: var(--ink); }

/* CARD */
.k-card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--line);
  padding: 20px;
}

/* SQL Editor card */
.k-editor-row { display: flex; align-items: flex-start; gap: 12px; }
.k-sql-area {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 14px;
  padding: 12px 14px;
  color: var(--ink);
  resize: vertical;
  outline: none;
  transition: border-color .15s;
  line-height: 1.6;
}
.k-sql-area:focus { border-color: var(--green); }
.k-sql-area::placeholder { color: var(--ink-3); }
.k-run-btn {
  background: var(--green);
  color: #fff;
  border: 0;
  border-radius: 14px;
  font-family: inherit;
  font-weight: 700;
  font-size: 13.5px;
  padding: 0 22px;
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: background .12s, transform .08s;
  flex-shrink: 0;
}
.k-run-btn:hover { background: var(--green-ink); }
.k-run-btn:active { transform: translateY(1px); }
.k-run-btn:disabled { opacity: .5; cursor: not-allowed; }
.k-hint { font-size: 11px; color: var(--ink-3); text-align: center; margin-top: 4px; }

/* Tabs */
.k-tabs {
  display: flex;
  background: var(--surface-2);
  border-radius: 999px;
  padding: 4px;
  gap: 2px;
  width: fit-content;
}
.k-tabs button {
  border: 0;
  background: transparent;
  padding: 7px 18px;
  border-radius: 999px;
  cursor: pointer;
  color: var(--ink-2);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  transition: background .12s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.k-tabs button.on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-sm); }
.k-count {
  background: var(--green);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}

/* Error box */
.k-error {
  background: oklch(0.96 0.02 25);
  border: 1px solid oklch(0.88 0.05 25);
  color: oklch(0.38 0.12 25);
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
}

/* Table */
.k-table-wrap { overflow: auto; border-radius: 14px; border: 1px solid var(--line); }
.k-data-table { width: 100%; font-size: 12.5px; border-collapse: collapse; }
.k-data-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: .08em;
  background: var(--surface-2);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  position: sticky;
  top: 0;
}
.k-data-table td {
  padding: 8px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-2);
  font-family: 'JetBrains Mono', monospace;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.k-data-table tr:last-child td { border-bottom: 0; }
.k-data-table tr:hover td { background: var(--green-soft); }
.k-null { color: var(--ink-3); font-style: italic; }

/* Empty state */
.k-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--ink-3);
  gap: 12px;
}
.k-empty svg { opacity: .25; }
.k-empty p { margin: 0; font-size: 14px; }

/* Type badge */
.k-type-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  background: var(--surface-2);
  color: var(--green);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--line);
}
`

export default function DashboardPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [schema, setSchema] = useState<ColumnDef[]>([])
  const [sql, setSql] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tablesLoading, setTablesLoading] = useState(true)
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<'explorer' | 'sql'>('explorer')

  useEffect(() => {
    const saved = localStorage.getItem('k-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
    checkHealth()
    loadTables()
  }, [])

  function toggleTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('k-theme', t)
  }

  async function checkHealth() {
    try {
      const res = await fetch('/api/health')
      setAgentOnline(res.ok)
    } catch {
      setAgentOnline(false)
    }
  }

  async function loadTables() {
    setTablesLoading(true)
    try {
      const res = await fetch('/api/db/tables')
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      setTables(data.tables || [])
    } catch {
      setError('Erro ao carregar tabelas')
    } finally {
      setTablesLoading(false)
    }
  }

  const loadSchema = useCallback(async (table: string) => {
    setSchema([])
    setResult(null)
    setError('')
    try {
      const res = await fetch(`/api/db/schema/${encodeURIComponent(table)}`)
      const data = await res.json()
      setSchema(data.columns || [])
      setSql(`SELECT TOP 100 *\nFROM pref_aruja_sp.${table}`)
    } catch {
      setError('Erro ao carregar schema')
    }
  }, [])

  async function runQuery() {
    if (!sql.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, limit: 500 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro na query')
        return
      }
      setResult(data)
      setActiveTab('sql')
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function handleSelectTable(table: string) {
    setSelectedTable(table)
    loadSchema(table)
    setActiveTab('explorer')
  }

  const agentColor = agentOnline === true ? 'oklch(0.55 0.20 264)' : agentOnline === false ? 'var(--rose)' : 'var(--amber)'
  const agentLabel = agentOnline === true ? 'Agent online' : agentOnline === false ? 'Agent offline' : 'Verificando…'

  return (
    <div className="k-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── SIDEBAR ── */}
      <aside className="k-sidebar">

        {/* Brand */}
        <div className="k-brand">
          <img src="/logo-maranhao.png" alt="Governo do Maranhão" style={{ width: '100%', height: 'auto', background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'block' }} />
        </div>

        {/* Navigation */}
        <div>
          <div className="k-nav-label">Menu</div>
          <nav className="k-nav">
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
            <Link href="/iptu">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              IPTU
            </Link>
            <Link href="/chat">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Chat IA
            </Link>
            <Link href="/catalogo">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Catálogo
            </Link>
            <a className="active" href="/dashboard">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 13l9-9 9 9M5 11v9h14v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Consulta
            </a>
          </nav>
        </div>

        {/* Table list */}
        <div className="k-tables-section">
          <div className="k-tables-header">
            <div className="k-nav-label" style={{ margin: 0 }}>pref_aruja_sp</div>
            <button className="k-reload-btn" onClick={loadTables} title="Recarregar tabelas">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="k-table-list">
            {tablesLoading ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--ink-3)' }}>Carregando…</div>
            ) : tables.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--ink-3)' }}>Nenhuma tabela</div>
            ) : (
              tables.map(table => (
                <button
                  key={table}
                  className={`k-table-item${selectedTable === table ? ' selected' : ''}`}
                  onClick={() => handleSelectTable(table)}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3 10h18M3 14h18M10 6v12M14 6v12" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                  {table}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Agent status */}
        <div style={{
          background: 'var(--green-ink)',
          borderRadius: '16px',
          padding: '16px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(70% 60% at 0% 100%, oklch(0.42 0.11 155 / 0.85), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '999px', background: agentColor, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{agentLabel}</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'oklch(0.88 0.02 150)', lineHeight: 1.4 }}>
              Sybase IQ · {tables.length} tabelas disponíveis
            </p>
            <button
              onClick={handleLogout}
              style={{
                background: '#fff',
                color: 'var(--green-ink)',
                border: 0,
                borderRadius: '999px',
                padding: '7px 16px',
                fontWeight: 700,
                fontSize: '12px',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="k-main">

        {/* Topbar */}
        <div className="k-topbar">
          <div>
            <h1 className="k-page-title">SQL <em>Explorer</em></h1>
            <p className="k-page-sub">Sybase IQ — pref_aruja_sp</p>
          </div>
          <div className="k-topbar-right">
            <div className="k-theme-toggle" role="group" aria-label="Tema">
              <button
                className={theme === 'light' ? 'on' : ''}
                onClick={() => toggleTheme('light')}
                aria-label="Tema claro"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                className={theme === 'dark' ? 'on' : ''}
                onClick={() => toggleTheme('dark')}
                aria-label="Tema escuro"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* SQL Editor */}
        <div className="k-card">
          <div className="k-editor-row">
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  runQuery()
                }
              }}
              rows={4}
              className="k-sql-area"
              placeholder="SELECT TOP 100 * FROM pref_aruja_sp.TABELA"
            />
            <div>
              <button
                onClick={runQuery}
                disabled={loading || !sql.trim()}
                className="k-run-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                </svg>
                {loading ? 'Executando…' : 'Executar'}
              </button>
              <div className="k-hint">Ctrl + Enter</div>
            </div>
          </div>
        </div>

        {/* Tabs + Error */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div className="k-tabs">
            <button
              className={activeTab === 'explorer' ? 'on' : ''}
              onClick={() => setActiveTab('explorer')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 10h18M3 14h18M10 6v12M14 6v12" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              Estrutura
            </button>
            <button
              className={activeTab === 'sql' ? 'on' : ''}
              onClick={() => setActiveTab('sql')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 19V5M4 19h16M8 15V9M12 15V6M16 15v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Resultado
              {result && <span className="k-count">{result.count}</span>}
            </button>
          </div>
          {result?.truncated && (
            <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 600 }}>
              ⚠ Resultado truncado pelo limite
            </span>
          )}
        </div>

        {error && <div className="k-error">{error}</div>}

        {/* Content */}
        {activeTab === 'explorer' && (
          <div className="k-card" style={{ flex: 1 }}>
            {!selectedTable ? (
              <div className="k-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M3 10h18M3 14h18M10 6v12M14 6v12" stroke="var(--ink)" strokeWidth="1.5"/>
                </svg>
                <p>Selecione uma tabela na barra lateral</p>
              </div>
            ) : schema.length === 0 ? (
              <div className="k-empty">
                <p>Carregando schema…</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)' }}>
                    {selectedTable}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{schema.length} colunas</span>
                </div>
                <div className="k-table-wrap">
                  <table className="k-data-table">
                    <thead>
                      <tr>
                        <th>Coluna</th>
                        <th>Tipo</th>
                        <th>Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schema.map(col => (
                        <tr key={col.name}>
                          <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{col.name}</td>
                          <td><span className="k-type-badge">{col.type}</span></td>
                          <td style={{ color: col.nullable ? 'var(--ink-3)' : 'var(--ink-2)' }}>
                            {col.nullable ? 'YES' : 'NO'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="k-card" style={{ flex: 1 }}>
            {!result ? (
              <div className="k-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M4 19V5M4 19h16M8 15V9M12 15V6M16 15v-3" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p>Execute uma query para ver os resultados</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--ink-3)', fontWeight: 600 }}>
                  {result.count} linha{result.count !== 1 ? 's' : ''} retornada{result.count !== 1 ? 's' : ''}
                </div>
                <div className="k-table-wrap">
                  <table className="k-data-table">
                    <thead>
                      <tr>
                        {result.columns.map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>
                              {cell === null || cell === undefined
                                ? <span className="k-null">null</span>
                                : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
