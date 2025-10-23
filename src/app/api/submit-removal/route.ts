import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { submissionSchema } from '@/lib/validations'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()

    // Extract fields
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const platform = formData.get('platform') as string
    const details = formData.get('details') as string | null
    const photo = formData.get('photo') as File

    // Validate required fields
    if (!name || !email || !platform || !photo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
    if (photo.size > maxFileSize) {
      return NextResponse.json(
        { error: `File size must be less than ${maxFileSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' },
        { status: 400 }
      )
    }

    // Validate input with Zod
    const validationResult = submissionSchema.safeParse({
      name,
      email,
      platform,
      details: details || undefined,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = path.extname(photo.name)
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`
    const filepath = path.join(uploadDir, filename)

    // Save file
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate public URL
    const photoUrl = `/uploads/${filename}`

    // Create submission in database
    const submission = await prisma.submission.create({
      data: {
        name: validationResult.data.name,
        email: validationResult.data.email,
        platform: validationResult.data.platform,
        details: validationResult.data.details,
        photoUrl,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        success: true,
        submissionId: submission.id,
        message: 'Submission received successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error processing submission:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
