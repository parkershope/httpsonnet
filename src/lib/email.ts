import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail(
  to: string,
  name: string,
  submissionId: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@example.com',
      to: [to],
      subject: 'Tea App Removal - Payment Received',
      html: `
        <h1>Payment Received</h1>
        <p>Hi ${name},</p>
        <p>We've received your payment and are processing your Tea app removal request.</p>
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p>We will submit DMCA takedown notices to the relevant platforms and send you a confirmation once complete.</p>
        <p>This process typically takes 1-2 business days.</p>
        <p>Thank you for using our service!</p>
      `,
    })

    if (error) {
      console.error('Error sending confirmation email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    throw error
  }
}

export async function sendCompletionEmail(
  to: string,
  name: string,
  submissionId: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@example.com',
      to: [to],
      subject: 'Tea App Removal - DMCA Submission Complete',
      html: `
        <h1>DMCA Submission Complete</h1>
        <p>Hi ${name},</p>
        <p>Great news! We've successfully submitted DMCA takedown notices to:</p>
        <ul>
          <li>Apple App Store</li>
          <li>Google Play Store</li>
        </ul>
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p>The platforms will review your request according to their policies. You should hear back from them within 5-7 business days.</p>
        <p>If you have any questions, please reply to this email.</p>
        <p>Thank you for using our service!</p>
      `,
    })

    if (error) {
      console.error('Error sending completion email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send completion email:', error)
    throw error
  }
}
