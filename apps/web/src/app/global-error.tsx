'use client';

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the
 * layout, so it brings its own <html>/<body> and inline styles (globals.css and
 * the fonts may not have loaded).
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', color: '#231f20', background: '#fff' }}>
        <main style={{ maxWidth: 520, margin: '18vh auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ letterSpacing: 2, fontSize: 12, textTransform: 'uppercase', color: '#6f6f6f' }}>Welt &amp; Grain</p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, margin: '12px 0' }}>Something went wrong</h1>
          <p style={{ color: '#4a4a4a' }}>The shop could not load. Please try again.</p>
          {error.digest && <p style={{ fontSize: 12, color: '#6f6f6f' }}>Reference: {error.digest}</p>}
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 24, height: 44, padding: '0 40px', border: 0, background: '#243a3e', color: '#fff', letterSpacing: 2, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
