import sharp from 'sharp'
import exifr from 'exifr'
import { BlobServiceClient } from '@azure/storage-blob'

export type ContainerType = 'profile-images' | 'duck-images' | 'sighting-images'

const MAX_DIM = 1920
const JPEG_QUALITY = 85

let blobService: BlobServiceClient | null = null
function getBlobService() {
  if (!blobService) {
    const cs = process.env.AZURE_STORAGE_CONNECTION_STRING
    if (!cs) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set')
    blobService = BlobServiceClient.fromConnectionString(cs)
  }
  return blobService
}

// Read GPS from the ORIGINAL image's EXIF (before we strip it). Null if absent.
export async function extractGps(buffer: Buffer): Promise<{ lat: number; lng: number } | null> {
  try {
    const gps = await exifr.gps(buffer)
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      return { lat: gps.latitude, lng: gps.longitude }
    }
  } catch {
    /* not all images carry GPS */
  }
  return null
}

// Auto-orient, strip all metadata, resize to fit 1920x1920, output JPEG q85.
export async function processImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .rotate() // auto-orient from EXIF, then metadata is dropped by default
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()
}

export async function uploadImage(
  buffer: Buffer,
  container: ContainerType,
  entityId?: string,
): Promise<string> {
  const containerClient = getBlobService().getContainerClient(container)
  await containerClient.createIfNotExists({ access: 'blob' })
  const id = globalThis.crypto.randomUUID()
  const blobName = entityId ? `${entityId}/${id}/image.jpg` : `${id}/image.jpg`
  const blob = containerClient.getBlockBlobClient(blobName)
  await blob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: 'image/jpeg' } })
  return blob.url
}

// Full pipeline: pull GPS, process, upload. Returns the public URL + any GPS.
export async function processAndUpload(
  buffer: Buffer,
  container: ContainerType,
  entityId?: string,
): Promise<{ url: string; gps: { lat: number; lng: number } | null }> {
  const gps = await extractGps(buffer)
  const processed = await processImage(buffer)
  const url = await uploadImage(processed, container, entityId)
  return { url, gps }
}
