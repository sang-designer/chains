'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: '#fff'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.message && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                color: '#4b5563'
              }}>
                {error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
