import { render, screen } from '@testing-library/react'
import { TrendingUp } from 'lucide-react'
import { describe, it, expect } from 'vitest'

import { MetricCard } from '../shared/MetricCard'

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: 1234,
    icon: TrendingUp,
  }

  it('should render with required props', () => {
    render(<MetricCard {...defaultProps} />)
    expect(screen.getByText('Test Metric')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
  })

  it('should render subtitle when provided', () => {
    render(<MetricCard {...defaultProps} subtitle="Additional info" />)
    expect(screen.getByText('Additional info')).toBeInTheDocument()
  })

  it('should render change with positive styling', () => {
    render(<MetricCard {...defaultProps} change="+12.5%" changeType="positive" />)
    const changeElement = screen.getByText('+12.5%')
    expect(changeElement).toBeInTheDocument()
    expect(changeElement).toHaveClass('text-emerald-400')
  })

  it('should render change with negative styling', () => {
    render(<MetricCard {...defaultProps} change="-5.2%" changeType="negative" />)
    const changeElement = screen.getByText('-5.2%')
    expect(changeElement).toBeInTheDocument()
    expect(changeElement).toHaveClass('text-red-400')
  })

  it('should render change with neutral styling', () => {
    render(<MetricCard {...defaultProps} change="0.0%" changeType="neutral" />)
    const changeElement = screen.getByText('0.0%')
    expect(changeElement).toBeInTheDocument()
    expect(changeElement).toHaveClass('text-slate-400')
  })

  it('should not render change section when change is not provided', () => {
    const { container } = render(<MetricCard {...defaultProps} />)
    // The change paragraph should not exist
    expect(container.querySelector('p.text-sm.mt-2')).not.toBeInTheDocument()
  })
})
