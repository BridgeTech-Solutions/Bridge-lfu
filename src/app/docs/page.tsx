"use client"

import { useEffect, useRef, useState } from 'react'

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Inject Swagger UI CSS
    const cssHref = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css'
    const existingLink = document.querySelector(`link[href="${cssHref}"]`)
    if (!existingLink) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = cssHref
      document.head.appendChild(link)
    }

    // Load Swagger UI script
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js'
    script.async = true
    script.onload = () => setReady(true)
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return (
    <div style={{ height: '100vh', width: '100%', margin: 0, padding: 0 }}>
      <div ref={containerRef} id="swagger-ui" style={{ height: '100%', width: '100%' }} />
      {ready && (
        <InitSwagger target={containerRef} />
      )}
    </div>
  )
}

function InitSwagger({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    if (!target.current) return
    const base = `${window.location.protocol}//${window.location.host}`
    const specUrl = `${base}/api/docs`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (w.SwaggerUIBundle) {
      w.SwaggerUIBundle({
        url: specUrl,
        domNode: target.current,
        deepLinking: true,
        presets: [w.SwaggerUIBundle.presets.apis],
      })
    }
  }, [target])
  return null
}


