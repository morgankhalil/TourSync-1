import * as React from "react"
import { ThemeProvider as ThemeProviderBase } from "@/components/ui/theme-provider"

export function ThemeProvider({ children, ...props }: { children: React.ReactNode } & any) {
  return <ThemeProviderBase {...props}>{children}</ThemeProviderBase>
}
