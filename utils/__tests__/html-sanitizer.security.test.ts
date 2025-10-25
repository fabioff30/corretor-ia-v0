import { sanitizeHtml } from '@/utils/html-sanitizer'

describe('sanitizeHtml security hardening', () => {
  it('strips script tags even when nested inside container elements', () => {
    const payload = '<div><span><script>alert(1)</script></span></div>'
    const sanitized = sanitizeHtml(payload, 'BLOG')

    expect(sanitized).not.toContain('<script')
    expect(sanitized).toContain('<div')
  })

  it('removes dangerous event handler attributes', () => {
    const payload = '<img src="x" onerror="alert(1)" />'
    const sanitized = sanitizeHtml(payload, 'DEFAULT')

    expect(sanitized).not.toContain('onerror')
  })

  it('drops attributes that attempt to tamper with object prototypes', () => {
    const payload = '<div __proto__="{&quot;polluted&quot;:true}">unsafe</div>'
    const sanitized = sanitizeHtml(payload, 'DEFAULT')

    expect(sanitized).not.toContain('__proto__')
  })
})
