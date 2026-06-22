import { NextRequest, NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@prefeitura.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

interface Usuario { email: string; senha: string; nome: string }

// Lista de usuários: admin (env) + usuários adicionais via APP_USERS (fora do repo).
// Formato APP_USERS: "email|senha|nome" separando vários usuários por ";"
//   ex: seplan@seplan.com.br|S3plan@@|SEPLAN;outro@x.com|senha|Outro
function getUsuarios(): Usuario[] {
  const lista: Usuario[] = [{ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD, nome: 'Administrador' }]
  const extra = process.env.APP_USERS
  if (extra) {
    for (const linha of extra.split(';')) {
      const [email, senha, nome] = linha.split('|').map(s => s.trim())
      if (email && senha) lista.push({ email, senha, nome: nome || email })
    }
  }
  return lista
}

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json()
    if (!email || !senha) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    const usuarios = getUsuarios()
    const idx = usuarios.findIndex(u => u.email === email && u.senha === senha)
    if (idx === -1) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }
    const user = usuarios[idx]

    const token = signToken({ userId: idx + 1, email: user.email, nome: user.nome })

    const res = NextResponse.json({ ok: true, nome: user.nome })
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[login]', msg)
    return NextResponse.json({ error: 'Erro interno', detail: msg }, { status: 500 })
  }
}
