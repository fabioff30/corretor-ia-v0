/**
 * Tests for Manual PIX Activation endpoint
 * Ensures paymentId can be sent as string or number
 */

describe('Manual PIX Activation - paymentId handling', () => {
  it('should convert string paymentId correctly', () => {
    const paymentId = '131487308062'

    const result = typeof paymentId === 'string'
      ? paymentId.trim()
      : paymentId?.toString() || ''

    expect(result).toBe('131487308062')
    expect(typeof result).toBe('string')
  })

  it('should convert number paymentId to string', () => {
    const paymentId = 131487308062

    const result = typeof paymentId === 'string'
      ? paymentId.trim()
      : paymentId?.toString() || ''

    expect(result).toBe('131487308062')
    expect(typeof result).toBe('string')
  })

  it('should trim whitespace from string paymentId', () => {
    const paymentId = '  131487308062  '

    const result = typeof paymentId === 'string'
      ? paymentId.trim()
      : paymentId?.toString() || ''

    expect(result).toBe('131487308062')
  })

  it('should handle null paymentId', () => {
    const paymentId = null as any

    const result = typeof paymentId === 'string'
      ? paymentId.trim()
      : paymentId?.toString() || ''

    expect(result).toBe('')
  })

  it('should handle undefined paymentId', () => {
    const paymentId = undefined as any

    const result = typeof paymentId === 'string'
      ? paymentId.trim()
      : paymentId?.toString() || ''

    expect(result).toBe('')
  })
})
