"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/header"
import { UserManagement } from "@/components/admin/user-management"
import { SystemSettings } from "@/components/admin/system-settings"
import { FileManagement } from "@/components/admin/file-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 container mx-auto py-8">
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">ユーザー管理</TabsTrigger>
            <TabsTrigger value="settings">システム設定</TabsTrigger>
            <TabsTrigger value="files">ファイル管理</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
          <TabsContent value="files">
            <FileManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}