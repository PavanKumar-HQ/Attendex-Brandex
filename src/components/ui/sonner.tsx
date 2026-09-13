"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-600" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-rose-600" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-slate-700" />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "#e2e8f0",
          "--success-bg": "#ffffff",
          "--success-text": "#0f172a",
          "--success-border": "#bbf7d0",
          "--error-bg": "#ffffff",
          "--error-text": "#0f172a",
          "--error-border": "#fecdd3",
          "--warning-bg": "#ffffff",
          "--warning-text": "#0f172a",
          "--warning-border": "#fde68a",
          "--info-bg": "#ffffff",
          "--info-text": "#0f172a",
          "--info-border": "#bfdbfe",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !bg-white !text-slate-900 border !border-slate-200 shadow-2xl rounded-2xl p-4 font-sans",
          description: "!text-slate-600 !opacity-100 font-medium text-xs mt-0.5",
          title: "!text-slate-950 font-bold text-sm",
          actionButton: "!bg-slate-900 !text-white text-xs font-semibold rounded-lg",
          cancelButton: "!bg-slate-100 !text-slate-700 text-xs font-semibold rounded-lg",
          closeButton: "!bg-slate-100 !text-slate-500 hover:!text-slate-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
