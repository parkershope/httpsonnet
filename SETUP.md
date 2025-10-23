# Setup Instructions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Note:** If you're in a restricted network environment where Puppeteer/Chromium downloads are blocked, use:

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Database - Use SQLite for development
DATABASE_URL="file:./dev.db"

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email - Get from https://resend.com/api-keys
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PAYMENT_AMOUNT=2000  # $20.00 in cents
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

### 3. Setup Database

For development with SQLite:

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

For production with PostgreSQL:

```bash
# Update DATABASE_URL in .env first
DATABASE_URL="postgresql://user:password@localhost:5432/tea_removal"

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npx prisma migrate deploy
```

### 4. Create Upload Directory

```bash
mkdir -p public/uploads
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at http://localhost:3000

## Stripe Webhook Setup

### For Local Development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) to your `.env` file

### For Production

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhook/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy the webhook signing secret to your production environment variables

## Testing the API

### 1. Submit a Removal Request

```bash
curl -X POST http://localhost:3000/api/submit-removal \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "platform=tea" \
  -F "details=Test submission for Tea app removal" \
  -F "photo=@./test-image.jpg"
```

Response:
```json
{
  "success": true,
  "submissionId": "clxxxxx...",
  "message": "Submission received successfully"
}
```

### 2. Create Checkout Session

```bash
curl -X POST http://localhost:3000/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"clxxxxx..."}'
```

Response:
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

### 3. Test Webhook (with Stripe CLI)

```bash
# In one terminal, run stripe listen
stripe listen --forward-to localhost:3000/api/webhook/stripe

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

## Database Management

### View Database with Prisma Studio

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 to view and edit your database.

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

## Troubleshooting

### Puppeteer Installation Issues

If Puppeteer fails to download Chromium:

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

Note: You'll need to provide your own Chrome/Chromium binary in production, or use `@sparticuz/chromium` for serverless environments.

### Prisma Client Not Found

If you see "Cannot find module '@prisma/client'":

```bash
npm run prisma:generate
```

### File Upload Errors

Ensure the uploads directory exists:

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
```

## Production Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Important:** Configure these in Vercel:
- Add all environment variables from `.env.example`
- Set `PUPPETEER_SKIP_DOWNLOAD=true`
- Consider using `@sparticuz/chromium` for serverless Puppeteer
- Increase function timeout for DMCA processing

### Docker

```bash
# Build image
docker build -t tea-removal-api .

# Run container
docker run -p 3000:3000 --env-file .env tea-removal-api
```

### Environment-Specific Notes

- **Vercel/Netlify**: Use PostgreSQL (Vercel Postgres or Neon)
- **AWS Lambda**: Consider splitting DMCA processing to separate function
- **Google Cloud Run**: Works out of the box with Docker
- **Traditional VPS**: Use PM2 or systemd for process management

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong `STRIPE_WEBHOOK_SECRET`
- [ ] Use proper PostgreSQL credentials (not default)
- [ ] Configure CORS if needed
- [ ] Enable rate limiting for API routes
- [ ] Backup database regularly
- [ ] Monitor error logs
- [ ] Keep dependencies updated

## Support

For issues or questions:
1. Check the main [README.md](./README.md)
2. Review [Prisma documentation](https://www.prisma.io/docs)
3. Review [Next.js documentation](https://nextjs.org/docs)
4. Check [Stripe API docs](https://stripe.com/docs/api)
