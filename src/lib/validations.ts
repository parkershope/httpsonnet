import { z } from 'zod'

export const submissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  platform: z.enum(['tea', 'other'], {
    errorMap: () => ({ message: 'Platform must be either "tea" or "other"' })
  }),
  details: z.string().max(2000, 'Details must be less than 2000 characters').optional(),
})

export type SubmissionInput = z.infer<typeof submissionSchema>

export const checkoutSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
