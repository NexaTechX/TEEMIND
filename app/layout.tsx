import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tee Shine AI Assistant',
  description: 'Your personal AI assistant that helps solve any problem with clear explanations and visual mind maps.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <div className="h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}