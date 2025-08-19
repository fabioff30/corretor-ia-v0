import { formatCurrency, generateTransactionId } from '@/utils/format'

describe('utils/format', () => {
  test('formatCurrency formats BRL correctly', () => {
    expect(formatCurrency(0)).toBe('R$\u00A00,00')
    expect(formatCurrency(1234.5)).toBe('R$\u00A01.234,50')
  })

  test('generateTransactionId matches expected pattern', () => {
    const id = generateTransactionId()
    expect(id).toMatch(/^TRX-[0-9A-Z]+-[0-9A-Z]{5}$/)
  })
})

