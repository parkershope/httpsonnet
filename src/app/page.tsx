export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Tea App Removal Service API</h1>
      <p>Backend API for automated DMCA takedown notice submissions.</p>

      <h2>Available Endpoints:</h2>
      <ul>
        <li>
          <strong>POST /api/submit-removal</strong> - Submit a removal request
        </li>
        <li>
          <strong>POST /api/create-checkout</strong> - Create Stripe checkout session
        </li>
        <li>
          <strong>POST /api/webhook/stripe</strong> - Stripe webhook handler
        </li>
      </ul>

      <p>
        See <a href="https://github.com/yourusername/tea-removal-api">README</a> for documentation.
      </p>
    </main>
  )
}
