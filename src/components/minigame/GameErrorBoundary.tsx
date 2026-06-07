'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  resetKey: string
}

interface State {
  hasError: boolean
}

export default class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Mini game failed to render', error, info)
  }

  componentDidUpdate(previousProps: Props) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center text-white">
          <h2 className="text-2xl font-extrabold">Mini game chưa tải được</h2>
          <p className="mt-3 max-w-md text-sm text-white/60">
            Kết nối tới tệp game vừa bị gián đoạn. Hãy tải lại để tiếp tục chơi.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white"
          >
            Tải lại game
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
