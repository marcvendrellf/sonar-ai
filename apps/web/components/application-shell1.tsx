"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronUp,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SonarLogo } from "@/components/sonar-logo"
import { ThemeToggle } from "@/components/theme-toggle"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { clearDemoUser, useDemoUser } from "@/lib/client/demo-auth"
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

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "DU"
}

function UserAccount() {
  const router = useRouter()
  const user = useDemoUser()
  const { isMobile } = useSidebar()
  const displayName = user?.name || "Demo user"
  const email = user?.email || "demo@sonar.ai"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar className="size-8 rounded-lg border border-sidebar-border">
              <AvatarFallback className="rounded-lg bg-sidebar-accent text-[10px] font-semibold text-sidebar-accent-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </span>
            <ChevronUp aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            side={isMobile ? "top" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="grid gap-0.5">
                <span className="truncate text-foreground">{displayName}</span>
                <span className="truncate font-normal">{email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {user ? (
              <DropdownMenuItem
                onClick={() => {
                  clearDemoUser()
                  router.push("/login")
                }}
              >
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => router.push("/login")}>
                  <LogIn aria-hidden="true" />
                  Sign in
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/signup")}>
                  <UserPlus aria-hidden="true" />
                  Sign up
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
        <UserAccount />
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
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
