import type React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressCircleProps extends React.ComponentProps<'svg'> {
  value: number
  className?: string
  strokeWidth?: number
  showValue?: boolean // Nova prop para controlar se o valor deve ser exibido
  valueSize?: number // Tamanho da fonte do valor
}

function clamp(input: number, a: number, b: number): number {
  return Math.max(Math.min(input, Math.max(a, b)), Math.min(a, b))
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar_role
 */
export const ProgressCircle = ({ 
  value, 
  className, 
  strokeWidth = 2,
  showValue = true, // Por padrão, mostra o valor
  valueSize,
  ...restSvgProps 
}: ProgressCircleProps) => {
  // match values with lucide icons for compatibility
  const size = 24
  const total = 100
  
  const normalizedValue = clamp(value, 0, total)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (normalizedValue / total) * circumference
  const halfSize = size / 2

  // Define o tamanho da fonte do valor baseado no tamanho do SVG
  const fontSize = valueSize || size / 3

  const commonParams = {
    cx: halfSize,
    cy: halfSize,
    r: radius,
    fill: 'none',
    strokeWidth,
  }

  return (
    <svg
      role="progressbar"
      viewBox={`0 0 ${size} ${size}`}
      className={cn('text-primary', className)}
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...restSvgProps}
    >
      <circle {...commonParams} className="stroke-muted-foreground/30" />
      <circle
        {...commonParams}
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        transform={`rotate(-90 ${halfSize} ${halfSize})`}
        className="stroke-current"
      />
      
      {/* Texto do valor no centro do círculo */}
      {showValue && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-current font-medium"
          style={{ fontSize: `${fontSize}px` }}
        >
          {Math.round(normalizedValue)} %
        </text>
      )}
    </svg>
  )
}