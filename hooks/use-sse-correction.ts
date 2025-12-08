/**
 * Hook for consuming Server-Sent Events (SSE) from correction endpoint
 * Provides real-time progress updates and streaming chunks
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface CorrectionEvaluation {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
  toneChanges?: string[]
  improvements?: string[]
  analysis?: string
  model?: string
}

export interface PainBanner {
  id: string
  title: string
  description: string
  highlight: string
}

export interface CorrectionResult {
  correctedText: string
  evaluation: CorrectionEvaluation
  painBanner?: PainBanner
  cached?: boolean
}

export interface SSECorrectionOptions {
  text: string
  authToken: string
  tone?: string
  styleGuide?: string
  apiUrl?: string
}

export interface SSECorrectionState {
  status: 'idle' | 'connecting' | 'processing' | 'completed' | 'error'
  progress: number // 0-100
  totalChunks: number
  completedChunks: number
  chunks: Array<{ index: number; text: string }>
  result: CorrectionResult | null
  error: string | null
  isLoading: boolean
}

export function useSSECorrection() {
  const [state, setState] = useState<SSECorrectionState>({
    status: 'idle',
    progress: 0,
    totalChunks: 0,
    completedChunks: 0,
    chunks: [],
    result: null,
    error: null,
    isLoading: false,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Start correction with SSE streaming
  const startCorrection = useCallback(async (options: SSECorrectionOptions) => {
    // Cleanup any previous connection
    cleanup()

    // Reset state
    setState({
      status: 'connecting',
      progress: 0,
      totalChunks: 0,
      completedChunks: 0,
      chunks: [],
      result: null,
      error: null,
      isLoading: true,
    })

    try {
      const apiUrl = options.apiUrl || '/api/correct'

      // For SSE, we need to use a different approach since EventSource doesn't support POST
      // We'll use fetch with streaming instead
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          text: options.text,
          authToken: options.authToken,
          tone: options.tone,
          styleGuide: options.styleGuide,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      // Check if response is SSE
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('text/event-stream')) {
        // Fallback to JSON response
        const jsonData = await response.json()
        setState({
          status: 'completed',
          progress: 100,
          totalChunks: 1,
          completedChunks: 1,
          chunks: [],
          result: jsonData,
          error: null,
          isLoading: false,
        })
        return
      }

      // Process SSE stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let isStreamComplete = false

      setState(prev => ({ ...prev, status: 'processing' }))

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue

            // Parse SSE format: "event: eventName\ndata: jsonData" or "data: jsonData" (DeepSeek format)
            const eventMatch = line.match(/^event:\s*(.+)/m)
            const dataMatch = line.match(/^data:\s*(.+)/m)

            if (!dataMatch) continue

            let eventData
            try {
              eventData = JSON.parse(dataMatch[1])
            } catch (parseErr) {
              console.error('Failed to parse SSE event data:', dataMatch[1])
              continue
            }

            // Determine event type - either from explicit event: line or from data.type (DeepSeek format)
            const eventType = eventMatch ? eventMatch[1].trim() : eventData.type

          switch (eventType) {
            case 'status':
              // Worker sends: { message, totalChunks }
              setState(prev => ({
                ...prev,
                status: 'processing',
                totalChunks: eventData.totalChunks || prev.totalChunks,
              }))
              break

            case 'progress':
              // Worker sends: { progress, chunk, totalChunks }
              // DeepSeek sends: { type: 'progress', partial, length }
              if (eventData.partial !== undefined) {
                // DeepSeek format - show partial text being corrected
                setState(prev => ({
                  ...prev,
                  status: 'processing',
                  progress: Math.min(90, Math.round((eventData.length || 0) / 100)), // Estimate progress
                }))
              } else {
                // Original format
                setState(prev => ({
                  ...prev,
                  totalChunks: eventData.totalChunks || prev.totalChunks,
                  completedChunks: eventData.chunk || prev.completedChunks,
                  progress: eventData.progress || prev.progress,
                }))
              }
              break

            case 'chunk':
              // Worker sends: { index, correctedText, evaluation }
              setState(prev => ({
                ...prev,
                chunks: [
                  ...prev.chunks,
                  { index: eventData.index, text: eventData.correctedText },
                ].sort((a, b) => a.index - b.index),
                completedChunks: prev.completedChunks + 1,
              }))
              break

            case 'complete':
              // DeepSeek sends: { type: 'complete', content: stringifiedJson }
              // Worker sends: { correctedText, evaluation, ... }
              let resultData = eventData
              if (eventData.content && typeof eventData.content === 'string') {
                // DeepSeek format - content is the raw JSON string
                try {
                  resultData = JSON.parse(eventData.content)
                } catch (e) {
                  console.warn('Failed to parse DeepSeek complete content, using as-is')
                }
              }

              setState(prev => ({
                ...prev,
                status: 'completed',
                progress: 100,
                result: resultData,
                isLoading: false,
              }))
              isStreamComplete = true
              break

            case 'error':
              setState(prev => ({
                ...prev,
                status: 'error',
                error: eventData.error || eventData.details || eventData.message || 'Unknown error',
                isLoading: false,
              }))
              isStreamComplete = true
              break
          }
        }
      }
      } catch (streamErr) {
        console.error('SSE stream error:', streamErr)
        throw streamErr
      } finally {
        // Only cleanup once
        if (!isStreamComplete) {
          cleanup()
        }
      }

      // Final cleanup after stream completes successfully
      cleanup()
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        // Request was cancelled - don't update state
        console.log('SSE request was cancelled')
        return
      }

      console.error('SSE error:', err)

      // Handle specific error types
      let errorMessage = 'Erro desconhecido ao processar texto'

      if (err instanceof Error) {
        if (err.message.includes('BodyStreamBuffer')) {
          errorMessage = 'Conexão interrompida. Tente novamente.'
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Tempo limite excedido. Tente com um texto menor.'
        } else {
          errorMessage = err.message
        }
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        isLoading: false,
      }))
      cleanup()
    }
  }, [cleanup])

  // Cancel ongoing correction
  const cancel = useCallback(() => {
    cleanup()
    setState(prev => ({
      ...prev,
      status: 'idle',
      isLoading: false,
    }))
  }, [cleanup])

  // Reset state
  const reset = useCallback(() => {
    cleanup()
    setState({
      status: 'idle',
      progress: 0,
      totalChunks: 0,
      completedChunks: 0,
      chunks: [],
      result: null,
      error: null,
      isLoading: false,
    })
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    startCorrection,
    cancel,
    reset,
  }
}
