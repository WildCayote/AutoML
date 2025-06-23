"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Database,
  BarChart2,
  FilterX,
  Brain,
  Rocket,
  LineChart,
  FileBarChart,
  Settings,
  CuboidIcon as Cube,
  UserIcon,
} from "lucide-react"
import { cn } from "@/libb/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  {
    name: "Data",
    icon: Database,
    path: "data",
    description: "Manage your datasets",
    projectSpecific: true,
  },
  {
    name: "EDA",
    icon: BarChart2,
    path: "eda",
    description: "Exploratory Data Analysis",
    projectSpecific: true,
  },
  {
    name: "Data Prep",
    icon: FilterX,
    path: "data-prep",
    description: "Clean and prepare your data",
    projectSpecific: true,
  },
  {
    name: "Model Training",
    icon: Brain,
    path: "model-training",
    description: "Train and evaluate models",
    projectSpecific: true,
  },
  // {
  //   name: "Deploy & Test",
  //   icon: Rocket,
  //   path: "deploy-test",
  //   description: "Deploy and test your models",
  //   projectSpecific: true,
  // },
  // {
  //   name: "Predictions",
  //   icon: LineChart,
  //   path: "predictions",
  //   description: "Make predictions with your models",
  //   projectSpecific: true,
  // },
  {
    name: "Reports",
    icon: FileBarChart,
    path: "reports",
    description: "View reports and insights",
    projectSpecific: true,
  },
  // {
  //   name: "Settings",
  //   icon: Settings,
  //   path: "settings",
  //   description: "Configure your workspace",
  //   projectSpecific: false,
  //   fullPath: "/settings",
  // },
]

export function MainSidebar() {
  const pathname = usePathname()
  console.log("pathname",pathname)

  // Get the current active section
  const pathParts = pathname.split("/")
  const currentSection = pathParts.length > 2 ? pathParts[2] : ""
  const projectId = pathParts.length > 3 ? pathParts[3] : ""

  return (
    <div className="h-screen w-16 bg-white border-r flex flex-col items-center py-8">
      <div className="mb-12">
        <Link href="/dashboard">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Cube className="h-6 w-6 text-blue-600" />
          </div>
        </Link>
      </div>

      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col items-center space-y-8 flex-1">
          {navItems.map((item, index) => {
            // Determine if this is active
            let isActive = false
            if (item.projectSpecific) {
              isActive = currentSection === item.path
            } else if (item.fullPath) {
              isActive = pathname === item.fullPath
            } else {
              isActive = pathname === `/dashboard/${item.path}`
            }

            // Check if this item is related to the active item
            // const isRelated = relatedPaths.includes(item.path)

            // Determine the link href
            const href = item.fullPath
              ? item.fullPath
              : item.projectSpecific
                ? projectId
                  ? `/dashboard/${item.path}/${projectId}`
                  : "#"
                : `/dashboard/${item.path}`

            // Determine if the link should be disabled
            const isDisabled = item.projectSpecific && !projectId

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                      isDisabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}

          <div className="mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/profile"
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>User Profile</p>
                <p className="text-xs text-gray-500">Manage your account</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}