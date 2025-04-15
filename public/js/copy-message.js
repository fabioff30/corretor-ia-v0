document.addEventListener("DOMContentLoaded", () => {
  const copyButtons = document.querySelectorAll(".copy-button")

  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const text = this.getAttribute("data-text")

      navigator.clipboard
        .writeText(text)
        .then(() => {
          // Change the icon to a checkmark temporarily
          const originalHTML = this.innerHTML
          this.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>'

          // Send event to Google Tag Manager
          if (window.dataLayer) {
            window.dataLayer.push({
              event: "message_copied",
              message_type: "birthday",
              message_length: text.length,
            })
          }

          // Reset after 2 seconds
          setTimeout(() => {
            this.innerHTML = originalHTML
          }, 2000)
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err)
        })
    })
  })
})
