"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LayoutDashboard, Settings, Menu, X, ChevronRight } from "lucide-react"
import { useStore } from "@/lib/store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface SidebarProps {
  className?: string
}

export function AppSidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { userProfile } = useStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile sidebar when path changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-[100] lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 z-[95] h-full bg-background border-r transition-transform duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[240px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center px-3 justify-between border-b">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="font-bold text-primary">AI Interview</span>
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden lg:flex" 
              onClick={toggleSidebar}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2">
              <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                Menu
              </div>
              <div className="space-y-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      route.active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <route.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{route.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto px-3 py-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(userProfile?.name || "User")}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[120px]">{userProfile?.name || "User"}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {userProfile?.email || "No email"}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && mounted && <ThemeToggle />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

