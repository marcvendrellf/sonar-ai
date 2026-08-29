"use client"

import Link from "next/link"
import {
  CircleUserRound,
  LayoutDashboard,
  MessageSquareText,
  RadioTower,
  ReceiptText,
  ShieldCheck,
} from "lucide-react"
import type { ComponentType, ReactNode, SVGProps } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  active?: boolean
}

const navigation = [
  { label: "Dashboard", href: "#dashboard", icon: LayoutDashboard, active: true },
  { label: "Saloon", href: "#saloon", icon: MessageSquareText },
  { label: "Decisions", href: "#decisions", icon: ReceiptText },
  { label: "Mandate", href: "#mandate", icon: ShieldCheck },
] satisfies ReadonlyArray<NavigationItem>

function SonarBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link href="#dashboard" />}>
          <span className="grid aspect-square size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <RadioTower className="size-4" aria-hidden="true" />
          </span>
          <span className="grid flex-1 text-left leading-tight">
            <span className="truncate font-semibold">Sonar AI</span>
            <span className="truncate text-xs text-muted-foreground">Paper fund operations</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function SonarNavigation() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Fund</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton isActive={item.active} tooltip={item.label} render={<Link href={item.href} />}>
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
        <SidebarMenuButton size="lg">
          <Avatar className="size-8 rounded-lg border border-sidebar-border">
            <AvatarFallback className="rounded-lg bg-[var(--status-complete-soft)] text-[10px] font-semibold text-[var(--status-complete)]">
              FX
            </AvatarFallback>
          </Avatar>
          <span className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">Fixture mode</span>
            <span className="truncate text-xs text-muted-foreground">Historical replay</span>
          </span>
          <span className="size-2 rounded-full bg-[var(--status-complete)]" aria-label="System ready" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SonarBrand />
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
  return (
    <SidebarProvider className={cn(className)}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <CircleUserRound className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">All orders simulated</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
