import React from 'react'

interface SkeletonProps {
  width?:  number | string
  height?: number | string
  radius?: number | string
  style?:  React.CSSProperties
  className?: string
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  style,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width:        typeof width  === 'number' ? `${width}px`  : width,
        height:       typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
