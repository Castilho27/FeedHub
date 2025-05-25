import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'; 

export const metadata: Metadata = {
  title: 'FeedHub',
  description: 'FeedBacks de uma maneira segura!',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br">
      <body>
        {children}
        <Toaster /> 
      </body>
    </html>
  )
}