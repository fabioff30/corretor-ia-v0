importScripts("https://cdn.brevo.com/js/sdk-loader.js")

// Declare Brevo to avoid undefined variable error.  This assumes Brevo is globally available after importScripts.
var Brevo = Brevo || {}

Brevo.push([
  "init",
  {
    client_key: (location.search.match(/[?&]key=([^&]*)/) || [])[1],
  },
])
