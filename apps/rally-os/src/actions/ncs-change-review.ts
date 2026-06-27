'use server'

import { prisma } from '@rally/core-data'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const reviewActionSchema = z.object({
  reviewId: z.string().min(1),
  action: z.enum(['accept', 'ignore']),
})

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string }

export async function updateNcsChangeReview(formData: FormData): Promise<ReviewActionResult> {
  const parsed = reviewActionSchema.safeParse({
    reviewId: formData.get('reviewId'),
    action: formData.get('action'),
  })

  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const newStatus = parsed.data.action === 'accept' ? 'accepted' : 'ignored'

  try {
    await prisma.ncsChangeReview.update({
      where: { id: parsed.data.reviewId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
      },
    })

    revalidatePath('/ncs-change-review')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update review' }
  }
}
