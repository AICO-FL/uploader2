import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { SiteFooter } from "@/components/site-footer"
import { db } from "@/lib/db"

const inter = Inter({ subsets: ['latin'] })

async function getSettings() {
  const database = db()
  const settings = database.prepare(`
    SELECT site_name
    FROM settings
    WHERE id = 1
  `).get() as { site_name: string } || {
    site_name: "File Uploader"
  }
  return settings
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  
  return {
    title: settings.site_name,
    description: 'Secure file upload and sharing platform',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <div className="flex-1">
          {children}
        </div>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  )
}