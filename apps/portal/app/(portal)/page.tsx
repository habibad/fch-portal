"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSessionInfo } from "@/hooks/use-session-info"
import AdminOverview from "./admin/_components/admin-overview"
import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Page() {
  const { data: session, isLoading } = useSessionInfo()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && session?.user) {
      const roles = session.user.roles || []
      const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN")
      const isBoard = roles.includes("BOARD")
      
      if (!isAdmin) {
        if (isBoard) {
          router.replace("/board")
        } else if (roles.includes("PASTORAL")) {
          router.replace("/pastoral")
        } else if (roles.includes("MEMBER")) {
          router.replace("/general")
        } else {
          const webUrl =
            process.env.NEXT_PUBLIC_WEB_URL ||
            (process.env.NEXT_PUBLIC_LOGIN_URL
              ? new URL(process.env.NEXT_PUBLIC_LOGIN_URL).origin
              : "http://localhost:3000")
          window.location.href = `${webUrl.replace(/\/$/, "")}/membership`
        }
      }
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
        <Skeleton className="h-9 w-64 mb-4" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  const roles = session?.user?.roles || []
  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN")

  if (!isAdmin) {
    return (
      <div className="flex-1 p-8 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
        <Skeleton className="h-9 w-64 mb-4" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="">
      <AdminOverview />
    </div>
  )
}
