import { Jimp } from 'jimp'
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

// Avoid a createIfNotExists round-trip on every upload once a container is known.
const ensuredContainers = new Set<string>()

// Read GPS from the original image's EXIF. Null if absent. (exifr is pure JS.)
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

// Resize to fit 1920x1920 (no upscaling) and re-encode to JPEG q85.
// jimp auto-orients from EXIF on read (verified: an orientation-6 100x50 image
// reads back as an upright 50x100), so no manual rotation is needed. jimp is
// pure JS, so this works on any host with no native binaries. Re-encoding also
// drops the original EXIF (incl. GPS + the now-applied orientation).
export async function processImage(buffer: Buffer): Promise<Buffer> {
  const img = await Jimp.read(buffer)
  if (img.width > MAX_DIM || img.height > MAX_DIM) {
    img.scaleToFit({ w: MAX_DIM, h: MAX_DIM })
  }
  return await img.getBuffer('image/jpeg', { quality: JPEG_QUALITY })
}

export async function uploadImage(
  buffer: Buffer,
  container: ContainerType,
  entityId?: string,
): Promise<string> {
  const containerClient = getBlobService().getContainerClient(container)
  if (!ensuredContainers.has(container)) {
    await containerClient.createIfNotExists({ access: 'blob' })
    ensuredContainers.add(container)
  }
  const id = globalThis.crypto.randomUUID()
  const blobName = entityId ? `${entityId}/${id}/image.jpg` : `${id}/image.jpg`
  const blob = containerClient.getBlockBlobClient(blobName)
  await blob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: 'image/jpeg' } })
  return blob.url
}

// Full pipeline: pull GPS, auto-orient + process, upload. Returns URL + any GPS.
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
