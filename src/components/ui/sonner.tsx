"use client"

import type * as React from "react"
import { CheckCircle2, AlertCircle, AlertTriangle, InfoIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast as sonnerToast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:p-4 group-[.toaster]:rounded-md",
          title: "group-[.toast]:font-medium group-[.toast]:text-foreground",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:text-foreground group-[.toast]:opacity-70 group-[.toast]:hover:opacity-100 group-[.toast]:absolute group-[.toast]:top-0 group-[.toast]:right-2",
        },
        duration: 5000,
      }}
      closeButton
      {...props}
    />
  )
}

// Extend the original toast with custom styling
const toast = {
  ...sonnerToast,
  success: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(
      <div className="flex items-start gap-3 pr-7">
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          {typeof options?.description === "string" ? (
            <>
              <p className="font-medium text-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">{options.description}</p>
            </>
          ) : (
            <p>{message}</p>
          )}
        </div>
      </div>,
      {
        className: "border-l-4 border-l-green-500 pl-3",
        ...options,
      },
    )
  },
  error: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(
      <div className="flex items-start gap-3 pr-7">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          {typeof options?.description === "string" ? (
            <>
              <p className="font-medium text-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">{options.description}</p>
            </>
          ) : (
            <p>{message}</p>
          )}
        </div>
      </div>,
      {
        className: "border-l-4 border-l-destructive pl-3",
        ...options,
      },
    )
  },
  warning: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(
      <div className="flex items-start gap-3 pr-7">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          {typeof options?.description === "string" ? (
            <>
              <p className="font-medium text-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">{options.description}</p>
            </>
          ) : (
            <p>{message}</p>
          )}
        </div>
      </div>,
      {
        className: "border-l-4 border-l-amber-500 pl-3",
        ...options,
      },
    )
  },
  info: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(
      <div className="flex items-start gap-3 pr-7">
        <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          {typeof options?.description === "string" ? (
            <>
              <p className="font-medium text-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">{options.description}</p>
            </>
          ) : (
            <p>{message}</p>
          )}
        </div>
      </div>,
      {
        className: "border-l-4 border-l-blue-500 pl-3",
        ...options,
      },
    )
  },
}

export { Toaster, toast }
