"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-lcars-black flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 rounded-full bg-lcars-red flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-lcars-black" />
          </div>
          <h1 className="text-lcars-red text-2xl font-bold mb-4">Application Error</h1>
          <p className="text-lcars-text text-center mb-6 max-w-md">
            An unexpected error has occurred. The LCARS system needs to be restarted.
          </p>
          <div className="bg-lcars-black/50 border border-lcars-red p-4 rounded-lg mb-6 max-w-md overflow-auto max-h-60">
            <p className="text-lcars-orange font-mono">{this.state.error?.toString()}</p>
            {this.state.errorInfo && (
              <pre className="text-lcars-text/70 text-xs mt-2 font-mono">{this.state.errorInfo.componentStack}</pre>
            )}
          </div>
          <div className="flex space-x-4">
            <LcarsButton onClick={() => window.location.reload()} variant="primary">
              RESTART APPLICATION
            </LcarsButton>
            <LcarsButton onClick={() => this.setState({ hasError: false })} variant="secondary">
              TRY TO CONTINUE
            </LcarsButton>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
