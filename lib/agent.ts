const AGENT_URL = process.env.AGENT_URL!
const AGENT_API_KEY = process.env.AGENT_API_KEY!

function headers() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (AGENT_API_KEY) h['X-API-Key'] = AGENT_API_KEY
  // Cloudflare Access (service token) — necessário no endpoint protegido (demo.sqltech.app)
  if (process.env.CF_ACCESS_CLIENT_ID) h['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID
  if (process.env.CF_ACCESS_CLIENT_SECRET) h['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET
  return h
}

export async function agentHealth(): Promise<{ status: string; db: string }> {
  const res = await fetch(`${AGENT_URL}/health`, { headers: headers() })
  if (!res.ok) throw new Error(`Agent health check failed: ${res.status}`)
  return res.json()
}

export async function agentListTables(): Promise<string[]> {
  const res = await fetch(`${AGENT_URL}/tables`, { headers: headers() })
  if (!res.ok) throw new Error(`Failed to list tables: ${res.status}`)
  // O agente retorna { tables: [{ name, type }] } com nomes preenchidos com espaços
  const data = await res.json() as { tables: Array<{ name: string; type: string }> }
  return data.tables.map(t => t.name.trim())
}

export interface ColumnDef {
  name: string
  type: string
  nullable: boolean
}

export async function agentSchema(table: string): Promise<ColumnDef[]> {
  const res = await fetch(`${AGENT_URL}/schema/${encodeURIComponent(table)}`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`Failed to get schema for ${table}: ${res.status}`)
  // O agente retorna { table, columns: [{ name, type, width, nullable }] } com padding de espaços
  const data = await res.json() as { columns: Array<{ name: string; type: string; nullable: boolean }> }
  return data.columns.map(c => ({
    name: c.name.trim(),
    type: c.type.trim(),
    nullable: c.nullable,
  }))
}

export interface QueryResult {
  columns: string[]
  rows: unknown[][]
  count: number
  truncated: boolean
}

export async function agentQuery(sql: string, limit = 500): Promise<QueryResult> {
  const res = await fetch(`${AGENT_URL}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ sql, limit }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Query failed (${res.status}): ${err}`)
  }
  return res.json()
}

export async function listSchemaTables(schema = 'pref_aruja_sp'): Promise<string[]> {
  const result = await agentQuery(
    `SELECT table_name FROM sys.systable WHERE user_name(creator) = '${schema}' AND table_type IN ('BASE', 'VIEW') ORDER BY table_name`,
    1000
  )
  return result.rows.map(r => String(r[0]))
}
