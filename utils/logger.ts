/**
 * Secure Logging System
 * Provides structured, secure logging with environment-based configuration
 */

import { isProduction, isDevelopment } from './env-config'

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Backward compatibility types
type RequestLogData = {
  status: number
  message?: string
  processingTime?: number
  textLength?: number
  ip: string
  fallbackUsed?: boolean
  webhookError?: string
  processingError?: string
  generalError?: string
  [key: string]: any // Allow additional fields
}

type ErrorLogData = {
  status: number
  message: string
  details?: string
  stack?: string
  ip: string
}

// Log configuration based on environment
const LOG_CONFIG = {
  level: isProduction() ? LogLevel.WARN : LogLevel.DEBUG,
  includeStack: !isProduction(),
  includeSensitiveData: isDevelopment(),
  maxLogLength: 1000, // Prevent log flooding
}

interface LogContext {
  requestId?: string
  userId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  status?: number
  duration?: number
  timestamp?: string
  [key: string]: any
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const sensitiveKeys = [
    'password', 'token', 'apikey', 'authorization', 'cookie', 'session',
    'secret', 'key', 'auth', 'credentials', 'passwd', 'pass', 'authToken'
  ]
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data }
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase()
    
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key])
    }
  }
  
  return sanitized
}

/**
 * Format log message with context
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const levelName = LogLevel[level]
  
  let logMessage = `[${timestamp}] [${levelName}]`
  
  if (context?.requestId) {
    logMessage += ` [${context.requestId}]`
  }
  
  if (context?.endpoint) {
    logMessage += ` [${context.method || 'GET'} ${context.endpoint}]`
  }
  
  logMessage += ` ${message}`
  
  // Truncate if too long
  if (logMessage.length > LOG_CONFIG.maxLogLength) {
    logMessage = logMessage.substring(0, LOG_CONFIG.maxLogLength) + '... [TRUNCATED]'
  }
  
  return logMessage
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, data?: any) {
  // Check if this log level should be output
  if (level < LOG_CONFIG.level) {
    return
  }
  
  const formattedMessage = formatLogMessage(level, message, context)
  
  // Sanitize data unless in development and explicitly allowing sensitive data
  const sanitizedData = LOG_CONFIG.includeSensitiveData ? data : sanitizeLogData(data)
  
  // Choose appropriate console method
  const consoleMethod = level >= LogLevel.ERROR ? 'error' 
                      : level >= LogLevel.WARN ? 'warn'
                      : level >= LogLevel.INFO ? 'info'
                      : 'debug'
  
  if (sanitizedData !== undefined) {
    console[consoleMethod](formattedMessage, sanitizedData)
  } else {
    console[consoleMethod](formattedMessage)
  }
}

// Modern logging methods
export function logDebug(message: string, context?: LogContext, data?: any) {
  log(LogLevel.DEBUG, message, context, data)
}

export function logInfo(message: string, context?: LogContext, data?: any) {
  log(LogLevel.INFO, message, context, data)
}

export function logWarn(message: string, context?: LogContext, data?: any) {
  log(LogLevel.WARN, message, context, data)
}

export function logErrorLevel(message: string, context?: LogContext, data?: any) {
  log(LogLevel.ERROR, message, context, data)
}

export function logCritical(message: string, context?: LogContext, data?: any) {
  log(LogLevel.CRITICAL, message, context, data)
}

// Backward compatibility functions - maintained for existing code
export function logRequest(requestId: string, data: RequestLogData) {
  logInfo('Request processed', { requestId, ...data })
}

export function logError(requestId: string, data: ErrorLogData) {
  const context: LogContext = { 
    requestId,
    status: data.status,
    ip: data.ip
  }
  
  logErrorLevel('Request failed', context, {
    message: data.message,
    details: data.details,
    stack: LOG_CONFIG.includeStack ? data.stack : undefined,
  })
}

// Security-focused logging functions
export function logSecurityEvent(event: string, context: LogContext, details?: any) {
  logWarn(`Security Event: ${event}`, context, details)
}

export function logAuthEvent(event: string, success: boolean, context: LogContext) {
  const message = `Authentication ${success ? 'Success' : 'Failure'}: ${event}`
  const level = success ? LogLevel.INFO : LogLevel.WARN
  
  log(level, message, context)
}

export function logRateLimitEvent(context: LogContext) {
  logWarn('Rate limit exceeded', context)
}

// Performance logging
export function logPerformance(operation: string, duration: number, context?: LogContext) {
  if (duration > 1000) {
    logWarn(`Slow operation: ${operation} took ${duration}ms`, context)
  } else {
    logDebug(`Operation: ${operation} completed in ${duration}ms`, context)
  }
}

// API request logging
export function logApiRequest(method: string, endpoint: string, status: number, duration: number, context?: LogContext) {
  const logContext: LogContext = {
    ...context,
    method,
    endpoint,
    status,
    duration,
  }
  
  const message = `API ${method} ${endpoint} ${status} (${duration}ms)`
  
  if (status >= 500) {
    logErrorLevel(message, logContext)
  } else if (status >= 400) {
    logWarn(message, logContext)
  } else {
    logInfo(message, logContext)
  }
}
