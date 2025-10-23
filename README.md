# Tea App Removal Service API

A Next.js 14 backend API for automating DMCA takedown notice submissions to remove unauthorized content from the Tea app and other platforms.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript**
- **Prisma** with PostgreSQL (SQLite for development)
- **Stripe** for payments
- **Resend** for email notifications
- **Puppeteer** for automated form submissions

## Features

### API Endpoints

#### 1. POST `/api/submit-removal`
Submit a removal request with photo evidence.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `name` (string, required): User's full name
  - `email` (string, required): User's email
  - `platform` (string, required): Either "tea" or "other"
  - `photo` (file, required): Image evidence (JPEG, PNG, GIF, WebP, max 5MB)
  - `details` (string, optional): Additional details (max 2000 chars)

**Response:**
```json
{
  "success": true,
  "submissionId": "clxxx...",
  "message": "Submission received successfully"
}
```

#### 2. POST `/api/create-checkout`
Create a Stripe checkout session for payment.

**Request:**
```json
{
  "submissionId": "clxxx..."
}
```

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

#### 3. POST `/api/webhook/stripe`
Webhook endpoint for Stripe payment events.

- Handles `checkout.session.completed` events
- Updates submission status to "PAID"
- Triggers automated DMCA submission
- Sends confirmation email

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string (or SQLite path for dev)
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `RESEND_API_KEY`: Your Resend API key
- `FROM_EMAIL`: Email address for sending notifications
- `NEXT_PUBLIC_APP_URL`: Your application URL

### 3. Database Setup

#### For Development (SQLite)
Update `DATABASE_URL` in `.env`:
```
DATABASE_URL="file:./dev.db"
```

Then run:
```bash
npx prisma generate
npx prisma db push
```

#### For Production (PostgreSQL)
Update `DATABASE_URL` in `.env` with your PostgreSQL connection string, then run:
```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Create Uploads Directory

```bash
mkdir -p public/uploads
touch public/uploads/.gitkeep
```

### 5. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Dashboard
3. Set up webhook endpoint:
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhook/stripe`
   - Select events: `checkout.session.completed`, `checkout.session.expired`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 6. Email Setup (Resend)

1. Create a Resend account at https://resend.com
2. Get your API key from the dashboard
3. Add and verify your sending domain
4. Update `RESEND_API_KEY` and `FROM_EMAIL` in `.env`

### 7. Run Development Server

```bash
npm run dev
```

The API will be available at http://localhost:3000

## Testing the API

### Submit a removal request

```bash
curl -X POST http://localhost:3000/api/submit-removal \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "platform=tea" \
  -F "details=This is a test submission" \
  -F "photo=@/path/to/photo.jpg"
```

### Create checkout session

```bash
curl -X POST http://localhost:3000/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"clxxx..."}'
```

### Test Stripe webhook locally

Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
stripe trigger checkout.session.completed
```

## Database Schema

### Submission
- `id`: Unique identifier
- `name`: User's name
- `email`: User's email
- `photoUrl`: Path to uploaded photo
- `platform`: "tea" or "other"
- `details`: Additional details
- `status`: PENDING, PAID, PROCESSING, COMPLETED, FAILED
- `createdAt`, `updatedAt`: Timestamps

### Payment
- `id`: Unique identifier
- `submissionId`: Related submission
- `stripeSessionId`: Stripe checkout session ID
- `amount`: Payment amount in cents
- `status`: PENDING, COMPLETED, FAILED, REFUNDED
- `createdAt`, `updatedAt`: Timestamps

## DMCA Automation

The system automatically:
1. Generates a properly formatted DMCA takedown notice
2. Submits to Apple's App Store reporting system
3. Submits to Google Play Store legal troubleshooter
4. Sends confirmation email to the user

**Note:** The Puppeteer automation scripts are scaffolded but need to be customized based on the actual form structures of Apple and Google's submission portals.

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note:** For Puppeteer to work on Vercel, you may need to:
- Use `@sparticuz/chromium` instead of bundled Chromium
- Configure the function timeout
- Consider using a separate serverless function or queue for long-running DMCA submissions

### Alternative: Background Jobs

For production, consider using a job queue like:
- **Bull** with Redis
- **Vercel Cron Jobs**
- **AWS Lambda** or **Google Cloud Functions**

This ensures DMCA submissions don't timeout during webhook processing.

## Error Handling

All endpoints include:
- Input validation with Zod
- Proper error messages
- Database transaction handling
- Graceful error recovery
- Detailed logging

## Security Considerations

1. **File Upload**: Limited to 5MB, specific image types only
2. **Stripe Webhook**: Signature verification required
3. **Input Validation**: All inputs validated with Zod
4. **Environment Variables**: Sensitive data stored securely
5. **HTTPS Only**: Use HTTPS in production

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
