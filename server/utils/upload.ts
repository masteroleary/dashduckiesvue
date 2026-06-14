import { createError, getHeader, readMultipartFormData, type H3Event } from 'h3'
import type { MultiPartData } from 'h3'

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB
const MULTIPART_OVERHEAD = 1 * 1024 * 1024 // allow room for fields + boundaries
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
]

// Parse a multipart form into text fields + the (single) uploaded file part.
export async function readMultipart(
  event: H3Event,
  maxBytes = MAX_IMAGE_BYTES,
): Promise<{ fields: Record<string, string>; file: MultiPartData | null }> {
  // Reject grossly oversized bodies before buffering them into memory.
  const len = Number(getHeader(event, 'content-length') || 0)
  if (len && len > maxBytes + MULTIPART_OVERHEAD) {
    throw createError({ statusCode: 413, statusMessage: 'Upload too large' })
  }
  const parts = (await readMultipartFormData(event)) || []
  const fields: Record<string, string> = {}
  let file: MultiPartData | null = null
  for (const p of parts) {
    if (p.filename) file = p
    else if (p.name) fields[p.name] = p.data.toString('utf-8')
  }
  return { fields, file }
}

// Validate an uploaded image's size and declared content-type. No-op if no file.
export function validateImage(file: MultiPartData | null, maxBytes = MAX_IMAGE_BYTES) {
  if (!file) return
  if (file.data.length > maxBytes) {
    throw createError({
      statusCode: 413,
      statusMessage: `Image must be under ${Math.round(maxBytes / 1024 / 1024)}MB`,
    })
  }
  const type = (file.type || '').toLowerCase()
  if (type && !ALLOWED_IMAGE_TYPES.includes(type)) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported image type' })
  }
}
