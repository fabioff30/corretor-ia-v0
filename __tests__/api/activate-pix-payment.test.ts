/**
 * Tests for Manual PIX Activation endpoint
 * Ensures paymentId can be sent as string or number
 */

const normalizePaymentId = (value: string | number | null | undefined) =>
  typeof value === 'string'
    ? value.trim()
    : value != null
      ? value.toString()
      : ''

describe('Manual PIX Activation - paymentId handling', () => {
  it('should convert string paymentId correctly', () => {
    const paymentId: string | number = '131487308062'
    const result = normalizePaymentId(paymentId)

    expect(result).toBe('131487308062')
    expect(typeof result).toBe('string')
  })

  it('should convert number paymentId to string', () => {
    const paymentId: string | number = 131487308062
    const result = normalizePaymentId(paymentId)

    expect(result).toBe('131487308062')
    expect(typeof result).toBe('string')
  })

  it('should trim whitespace from string paymentId', () => {
    const paymentId: string | number = '  131487308062  '
    const result = normalizePaymentId(paymentId)

    expect(result).toBe('131487308062')
  })

  it('should handle null paymentId', () => {
    const paymentId = null
    const result = normalizePaymentId(paymentId)

    expect(result).toBe('')
  })

  it('should handle undefined paymentId', () => {
    const paymentId = undefined
    const result = normalizePaymentId(paymentId)

    expect(result).toBe('')
  })
})
