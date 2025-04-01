import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Симулятор Мозга Программиста',
  description: 'Интерактивный симулятор мыслительных процессов программиста',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <nav className="bg-slate-900 text-white py-2 px-4">
          <div className="container mx-auto flex gap-4">
            <Link href="/" className="hover:text-slate-300">Дашборд</Link>
            <Link href="/task-chat" className="hover:text-slate-300">Чат с задачами</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
