import { Suspense } from "react"
import { GuestDashboardContent } from "@/components/guest-dashboard-content"
import { DashboardHeader } from "@/components/dashboard-header"

export const dynamic = "force-dynamic"

export default function GuestDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <GuestDashboardContent />
        </Suspense>
      </main>
    </div>
  )
}