# Security Guide - CorretorIA

This document outlines the security measures implemented in the CorretorIA application and provides guidelines for maintaining security best practices.

## 🛡️ Security Measures Implemented

### 1. Environment Variables & Configuration Security

**✅ FIXED**: Secure environment variable validation
- Implemented comprehensive validation in `utils/env-validation.ts`
- Automatic detection of insecure default tokens
- Production startup validation prevents deployment with insecure configurations
- Critical environment variables are mandatory in production

**Environment Variables Required:**
\`\`\`env
# Critical - Must be set in production
AUTH_TOKEN=your-secure-32-character-token
REVALIDATION_TOKEN=your-secure-revalidation-token
WEBHOOK_SECRET=your-secure-webhook-secret
ADMIN_API_KEY=your-secure-admin-api-key

# Optional but recommended
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
MERCADO_PAGO_ACCESS_TOKEN=your-mercadopago-token
OPENAI_API_KEY=your-openai-key
\`\`\`

### 2. Authentication & Authorization

**✅ FIXED**: Replaced client-side admin authentication with server-side JWT
- Server-side JWT authentication using `jose` library
- HTTP-only cookies for session management
- Secure session validation middleware
- Protected API routes with session verification

**Security Features:**
- JWT tokens with 24-hour expiration
- Secure cookie settings (HTTPOnly, Secure in production, SameSite=strict)
- Rate limiting on authentication endpoints
- Failed login attempt logging

### 3. Input Validation & Sanitization

**✅ ENHANCED**: Comprehensive input validation and sanitization
- Enhanced pattern matching for malicious content detection
- Multi-layer validation with Zod schemas
- HTML content sanitization with DOMPurify
- File upload validation with type and size restrictions

**Validation Features:**
- Script injection prevention
- SQL injection pattern detection
- Command injection blocking
- Path traversal prevention
- Control character filtering
- Spam detection (repetition analysis)

### 4. XSS Prevention

**✅ FIXED**: HTML sanitization for user-generated content
- All `dangerouslySetInnerHTML` usage now uses DOMPurify sanitization
- Configurable sanitization levels (STRICT, BLOG, DEFAULT)
- Content Security Policy implementation
- Automatic dangerous content detection

**Components Updated:**
- `blog-post-card.tsx` - Title and excerpt sanitization
- `blog-post-content.tsx` - Content sanitization
- `related-posts.tsx` - Title sanitization

### 5. Rate Limiting

**✅ ENHANCED**: Robust rate limiting with fallbacks
- Redis-based primary rate limiting
- In-memory fallback when Redis unavailable
- Different limits for different endpoints (auth: 5/min, API: 20/min, default: 10/min)
- Automatic cleanup of expired entries
- Proper HTTP headers for rate limit information

### 6. Content Security Policy (CSP)

**✅ IMPLEMENTED**: Comprehensive CSP headers
- Strict script-src policies for allowed external scripts
- Image, font, and style source restrictions
- Frame protection against clickjacking
- Development vs production configurations
- Additional security headers (X-Frame-Options, X-Content-Type-Options, etc.)

### 7. Secure Logging System

**✅ IMPLEMENTED**: Environment-aware secure logging
- Automatic sensitive data redaction
- Configurable log levels by environment
- Structured logging with request IDs
- Security event logging
- Performance monitoring

**Log Levels:**
- Production: WARN and above
- Development: DEBUG and above
- Automatic sanitization of passwords, tokens, and secrets

## 🔧 Configuration Guide

### Production Deployment Checklist

1. **Environment Variables**
   \`\`\`bash
   # Generate secure tokens
   openssl rand -hex 32  # For AUTH_TOKEN
   openssl rand -hex 32  # For REVALIDATION_TOKEN
   openssl rand -hex 32  # For WEBHOOK_SECRET
   \`\`\`

2. **Security Headers**
   - Ensure `NODE_ENV=production` is set
   - Verify HTTPS is enforced
   - Check CSP policies are appropriate for your domain

3. **Rate Limiting**
   - Configure Redis for production rate limiting
   - Adjust rate limits based on expected traffic
   - Monitor rate limit violations

4. **Logging**
   - Set up log aggregation service (optional)
   - Configure log rotation
   - Set up alerts for security events

### Development Setup

1. **Environment File**
   \`\`\`env
   NODE_ENV=development
   AUTH_TOKEN=development-token-change-in-production
   REVALIDATION_TOKEN=dev-revalidation-token
   WEBHOOK_SECRET=dev-webhook-secret
   \`\`\`

2. **Security Testing**
   \`\`\`bash
   # Run security audit
   npm audit
   
   # Check for vulnerable dependencies
   npm audit fix
   \`\`\`

## 🚨 Security Incident Response

### Monitoring & Detection

**Automated Detection:**
- Failed authentication attempts (logged with IP and user agent)
- Rate limit violations (logged with endpoint and frequency)
- Input validation failures (logged with patterns detected)
- Suspicious content detection (logged with security patterns)

**Log Analysis:**
\`\`\`bash
# Check for security events
grep "Security Event" logs/
grep "Rate limit exceeded" logs/
grep "Input validation failed" logs/
\`\`\`

### Response Procedures

1. **Immediate Response**
   - Check logs for attack patterns
   - Verify rate limiting is functioning
   - Review CSP violations in browser console
   - Check for unusual traffic patterns

2. **Investigation**
   - Analyze request patterns from suspicious IPs
   - Review authentication logs for brute force attempts
   - Check input validation logs for injection attempts
   - Verify no unauthorized admin access

3. **Mitigation**
   - Block malicious IPs at infrastructure level
   - Increase rate limiting if necessary
   - Update input validation patterns if new threats detected
   - Rotate sensitive tokens if compromise suspected

## 🛠️ Security Tools & Dependencies

### Core Security Libraries
- `jose` - JWT authentication
- `dompurify` + `jsdom` - HTML sanitization
- `zod` - Input validation
- `@upstash/redis` - Rate limiting storage

### Security Testing Tools
\`\`\`bash
# Vulnerability scanning
npm audit

# Static code analysis
eslint --ext .ts,.tsx .

# Type checking
tsc --noEmit
\`\`\`

## 📋 Security Best Practices

### For Developers

1. **Input Handling**
   - Always validate input at API boundaries
   - Use type-safe validation with Zod schemas
   - Sanitize HTML content before rendering
   - Never trust client-side validation alone

2. **Authentication**
   - Use server-side session management
   - Implement proper CSRF protection
   - Use secure cookie settings
   - Log authentication events

3. **API Security**
   - Apply rate limiting to all public endpoints
   - Use proper HTTP status codes
   - Implement request logging with sanitization
   - Validate all parameters including URL params

4. **Error Handling**
   - Never expose sensitive information in error messages
   - Log errors with appropriate detail level
   - Use generic error messages for users
   - Implement proper fallback mechanisms

### For Deployment

1. **Environment Security**
   - Use secure, randomly generated tokens
   - Never commit secrets to version control
   - Use environment variable validation
   - Implement proper secret rotation

2. **Infrastructure**
   - Use HTTPS in production
   - Configure proper firewall rules
   - Implement DDoS protection
   - Use CDN with security features

3. **Monitoring**
   - Set up log aggregation
   - Monitor for security events
   - Implement alerting for critical issues
   - Regular security audits

## 🔄 Regular Security Maintenance

### Weekly Tasks
- Review security logs for anomalies
- Check for new npm security advisories
- Verify rate limiting effectiveness

### Monthly Tasks
- Rotate authentication tokens
- Update security dependencies
- Review and update CSP policies
- Security penetration testing

### Quarterly Tasks
- Full security audit
- Review and update security policies
- Update incident response procedures
- Security training for development team

## 📞 Support & Reporting

### Reporting Security Issues
If you discover a security vulnerability, please:
1. Do not create a public GitHub issue
2. Email security concerns privately
3. Provide detailed reproduction steps
4. Allow reasonable time for response and fix

### Getting Help
- Review this security guide first
- Check the implementation in the codebase
- Consult the Next.js security documentation
- Consider professional security audit for production deployments

---

**Last Updated**: 2024-08-19
**Version**: 1.0

This security guide should be reviewed and updated regularly as new threats emerge and the application evolves.
