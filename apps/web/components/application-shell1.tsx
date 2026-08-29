"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react"
import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SonarLogo } from "@/components/sonar-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type ApplicationShell1Props = {
  children: ReactNode
  className?: string
}

type NavigationItem = {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  activePath?: string
}

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, activePath: "/dashboard" },
  { label: "Saloon", href: "/saloon", icon: MessageSquareText, activePath: "/saloon" },
  { label: "Mandate", href: "/dashboard#mandate", icon: ShieldCheck },
] satisfies ReadonlyArray<NavigationItem>

function SonarNavigation() {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Fund</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={item.activePath === pathname}
                  tooltip={item.label}
                  render={<Link href={item.href} />}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function FundStatus() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          render={<div role="status" aria-label="Fixture mode, historical replay, system ready" />}
        >
          <Avatar className="size-8 rounded-lg border border-sidebar-border">
            <AvatarFallback className="rounded-lg bg-[var(--status-complete-soft)] text-[10px] font-semibold text-[var(--status-complete)]">
              FX
            </AvatarFallback>
          </Avatar>
          <span className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">Fixture mode</span>
            <span className="truncate text-xs text-muted-foreground">Historical replay</span>
          </span>
          <span className="size-2 rounded-full bg-[var(--status-complete)]" aria-hidden="true" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SonarLogo />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">
          <SonarNavigation />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <FundStatus />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function ApplicationShell1({ children, className }: ApplicationShell1Props) {
  const pathname = usePathname()
  const currentPage = pathname === "/saloon" ? "Saloon" : "Overview"

  return (
    <SidebarProvider
      className={cn(className)}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
