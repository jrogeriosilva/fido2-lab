import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import { Button, type ButtonProps } from './button'
import { cn } from '@/lib/utils'

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  value: string
  label?: string
}

function CopyButton({ value, label, className, size = 'sm', variant = 'outline', ...props }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-1.5', className)}
      onClick={handleCopy}
      {...props}
    >
      {copied ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} />
      )}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  )
}

export { CopyButton }
