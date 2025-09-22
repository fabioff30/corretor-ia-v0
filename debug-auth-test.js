// Debug script to test the auth fix
// Run this in browser console on the live site to test the fix

async function testAuthFix() {
  console.log('🧪 Testing auth fix for user fabiofariasf@gmail.com...')

  // Check if we have access to the debug functions
  if (typeof window.debugAuth === 'function') {
    console.log('🔍 Running debug auth...')
    await window.debugAuth()
  } else {
    console.log('❌ Debug function not available')
  }

  // Check if we can refresh auth
  if (typeof window.refreshAuth === 'function') {
    console.log('🔄 Refreshing auth...')
    await window.refreshAuth()
  } else {
    console.log('❌ Refresh function not available')
  }

  console.log('🧪 Test completed. Check the logs above for subscription data.')
}

// Export for use
if (typeof window !== 'undefined') {
  window.testAuthFix = testAuthFix
}

console.log('🧪 Debug script loaded. Run testAuthFix() to test the auth fix.')