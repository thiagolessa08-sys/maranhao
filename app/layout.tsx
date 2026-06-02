import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Governo do Maranhão — Analytics',
  description: 'Sistema de análise de dados do Estado do Maranhão',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
