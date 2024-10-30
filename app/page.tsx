"use client"

import { Suspense } from "react"
import { HomeContent } from "@/components/home-content"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Suspense fallback={<SiteHeader settings={{ site_name: "File Uploader", logo_url: null }} />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Suspense fallback={<div>Loading...</div>}>
          <HomeContent />
        </Suspense>
      </main>
    </div>
  )
}