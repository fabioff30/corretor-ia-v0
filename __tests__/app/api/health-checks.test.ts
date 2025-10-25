/**
 * Tests for health check endpoints
 * Validates GET endpoints return { "status": "OK" }
 */

import { GET as correctHealthCheck } from '@/app/api/correct/route'
import { GET as rewriteHealthCheck } from '@/app/api/rewrite/route'
import { GET as aiDetectorHealthCheck } from '@/app/api/ai-detector/route'

describe('Health Check Endpoints', () => {
  describe('GET /api/correct', () => {
    it('should return status OK', async () => {
      const response = await correctHealthCheck()
      const json = await response.json()

      expect(json).toEqual({ status: 'OK' })
    })

    it('should return 200 status code', async () => {
      const response = await correctHealthCheck()
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/rewrite', () => {
    it('should return status OK', async () => {
      const response = await rewriteHealthCheck()
      const json = await response.json()

      expect(json).toEqual({ status: 'OK' })
    })

    it('should return 200 status code', async () => {
      const response = await rewriteHealthCheck()
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/ai-detector', () => {
    it('should return status OK', async () => {
      const response = await aiDetectorHealthCheck()
      const json = await response.json()

      expect(json).toEqual({ status: 'OK' })
    })

    it('should return 200 status code', async () => {
      const response = await aiDetectorHealthCheck()
      expect(response.status).toBe(200)
    })
  })

  describe('Health Check Format Compliance', () => {
    it('all health checks should return same format', async () => {
      const correctResponse = await correctHealthCheck()
      const rewriteResponse = await rewriteHealthCheck()
      const aiDetectorResponse = await aiDetectorHealthCheck()

      const correctJson = await correctResponse.json()
      const rewriteJson = await rewriteResponse.json()
      const aiDetectorJson = await aiDetectorResponse.json()

      expect(correctJson).toEqual(rewriteJson)
      expect(rewriteJson).toEqual(aiDetectorJson)
      expect(correctJson).toEqual({ status: 'OK' })
    })
  })
})
