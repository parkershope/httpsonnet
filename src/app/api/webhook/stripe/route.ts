import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { processDMCASubmission } from '@/lib/dmca'
import { sendConfirmationEmail } from '@/lib/email'
import Stripe from 'stripe'

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get submission ID from metadata
        const submissionId = session.metadata?.submissionId
        if (!submissionId) {
          console.error('No submissionId in session metadata')
          return NextResponse.json(
            { error: 'Missing submissionId in metadata' },
            { status: 400 }
          )
        }

        // Update payment status
        const payment = await prisma.payment.findUnique({
          where: { stripeSessionId: session.id },
          include: { submission: true },
        })

        if (!payment) {
          console.error(`Payment not found for session: ${session.id}`)
          return NextResponse.json(
            { error: 'Payment not found' },
            { status: 404 }
          )
        }

        // Update payment and submission status
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' },
        })

        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'PAID' },
        })

        console.log(`Payment completed for submission: ${submissionId}`)

        // Send confirmation email
        try {
          await sendConfirmationEmail(
            payment.submission.email,
            payment.submission.name,
            submissionId
          )
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't fail the webhook if email fails
        }

        // Process DMCA submission asynchronously
        // In production, you might want to use a job queue like Bull or a serverless function
        processDMCASubmission(submissionId).catch((error) => {
          console.error('Error processing DMCA submission:', error)
        })

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        // Update payment status to failed
        const payment = await prisma.payment.findUnique({
          where: { stripeSessionId: session.id },
        })

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          })
        }

        console.log(`Checkout session expired: ${session.id}`)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        // Find payment by charge ID and update status
        // Note: You may need to store charge ID in your payment model for this
        console.log(`Charge refunded: ${charge.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
