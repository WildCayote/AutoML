import type React from "react"
import { MainSidebar } from "@/components/sidebar/main-sidebar"
import { ProjectsSidebar } from "@/components/sidebar/projects-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ChatButton } from "@/components/chat/chat-button"
import { ProjectsProvider } from "@/libb/projects-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProjectsProvider>
      <div className="flex h-screen bg-gray-50">
        <MainSidebar />
        <ProjectsSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
        {/* <ChatButton /> */}
      </div>
    </ProjectsProvider>
  )
}
