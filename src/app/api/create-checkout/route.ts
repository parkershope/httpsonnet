import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { checkoutSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = checkoutSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { submissionId } = validationResult.data

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { payment: true },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (submission.payment?.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'This submission has already been paid for' },
        { status: 400 }
      )
    }

    // Get payment amount from environment
    const amount = parseInt(process.env.PAYMENT_AMOUNT || '2000') // $20.00 in cents

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tea App Removal Service',
              description: 'Professional DMCA takedown notice submission',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      metadata: {
        submissionId,
      },
      customer_email: submission.email,
    })

    // Create or update payment record
    if (submission.payment) {
      await prisma.payment.update({
        where: { id: submission.payment.id },
        data: {
          stripeSessionId: session.id,
          amount,
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          submissionId,
          stripeSessionId: session.id,
          amount,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
