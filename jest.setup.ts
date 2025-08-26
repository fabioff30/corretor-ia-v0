// Extend Jest with helpful DOM matchers
// Note: install peer deps before running tests:
// npm i -D @testing-library/jest-dom @testing-library/react jest-environment-jsdom whatwg-fetch
import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfills for Node/JSDOM environment
import { TextEncoder, TextDecoder } from 'util'
// @ts-ignore
if (!(global as any).TextEncoder) {
  // @ts-ignore
  ;(global as any).TextEncoder = TextEncoder
}
// @ts-ignore
if (!(global as any).TextDecoder) {
  // @ts-ignore
  ;(global as any).TextDecoder = TextDecoder as any
}

// Ensure global crypto has randomUUID and getRandomValues
try {
  // @ts-ignore
  const nodeCrypto = require('crypto')
  // @ts-ignore
  const g: any = global
  g.crypto = g.crypto || {}
  if (!g.crypto.randomUUID && nodeCrypto.randomUUID) {
    g.crypto.randomUUID = nodeCrypto.randomUUID.bind(nodeCrypto)
  }
  if (!g.crypto.getRandomValues && nodeCrypto.webcrypto?.getRandomValues) {
    g.crypto.getRandomValues = nodeCrypto.webcrypto.getRandomValues.bind(nodeCrypto.webcrypto)
  }
} catch {}
