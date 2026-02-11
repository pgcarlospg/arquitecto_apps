import { ReactNode } from 'react'
import { clsx } from 'clsx'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  children: ReactNode
  variant: AlertVariant
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
}

export function Alert({ children, variant }: AlertProps) {
  return (
    <div className={clsx('border rounded-lg p-4', variantStyles[variant])}>
      <div className="text-sm">{children}</div>
    </div>
  )
}
