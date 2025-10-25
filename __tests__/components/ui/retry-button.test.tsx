/**
 * Tests for RetryButton component
 * Validates retry functionality per frontend-api.md spec
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RetryButton } from '@/components/ui/retry-button'

describe('RetryButton Component', () => {
  describe('Rendering', () => {
    it('should render with default text', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} />)

      expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
    })

    it('should render with custom text', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick}>Retry Custom</RetryButton>)

      expect(screen.getByText('Retry Custom')).toBeInTheDocument()
    })

    it('should render refresh icon by default', () => {
      const onClick = jest.fn()
      const { container } = render(<RetryButton onClick={onClick} />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not render icon when showIcon is false', () => {
      const onClick = jest.fn()
      const { container } = render(
        <RetryButton onClick={onClick} showIcon={false} />
      )

      const svg = container.querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })
  })

  describe('Behavior', () => {
    it('should call onClick when clicked', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} disabled={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when loading', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} isLoading={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should be disabled when disabled prop is true', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} disabled={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should be disabled when isLoading is true', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('should show spin animation when loading', () => {
      const onClick = jest.fn()
      const { container } = render(
        <RetryButton onClick={onClick} isLoading={true} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('animate-spin')
    })

    it('should not show spin animation when not loading', () => {
      const onClick = jest.fn()
      const { container } = render(
        <RetryButton onClick={onClick} isLoading={false} />
      )

      const svg = container.querySelector('svg')
      expect(svg).not.toHaveClass('animate-spin')
    })
  })

  describe('Styling', () => {
    it('should apply custom className', () => {
      const onClick = jest.fn()
      render(
        <RetryButton onClick={onClick} className="custom-class" />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should accept different variants', () => {
      const onClick = jest.fn()
      const { rerender } = render(
        <RetryButton onClick={onClick} variant="default" />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()

      rerender(<RetryButton onClick={onClick} variant="outline" />)
      expect(button).toBeInTheDocument()

      rerender(<RetryButton onClick={onClick} variant="secondary" />)
      expect(button).toBeInTheDocument()
    })

    it('should accept different sizes', () => {
      const onClick = jest.fn()
      const { rerender } = render(
        <RetryButton onClick={onClick} size="default" />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()

      rerender(<RetryButton onClick={onClick} size="sm" />)
      expect(button).toBeInTheDocument()

      rerender(<RetryButton onClick={onClick} size="lg" />)
      expect(button).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible as a button', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have proper disabled state for screen readers', () => {
      const onClick = jest.fn()
      render(<RetryButton onClick={onClick} disabled={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('disabled')
    })
  })

  describe('Integration with Error Alerts', () => {
    it('should work within error alert context', () => {
      const onClick = jest.fn()
      const error = 'Test error message'

      render(
        <div role="alert">
          <p>{error}</p>
          <RetryButton onClick={onClick} size="sm" variant="outline" />
        </div>
      )

      expect(screen.getByText(error)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalled()
    })
  })
})
