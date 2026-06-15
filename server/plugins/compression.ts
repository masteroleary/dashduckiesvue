import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { getRequestHeader } from 'h3'

// Compress dynamic SSR HTML responses (compressPublicAssets only handles static
// files). Picks brotli, then gzip, based on the client's Accept-Encoding.
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    try {
      if (!response || typeof response.body !== 'string' || response.body.length < 1400) return

      const accept = String(getRequestHeader(event, 'accept-encoding') || '')
      const raw = Buffer.from(response.body)
      let encoded: Buffer | null = null
      let encoding = ''

      if (/\bbr\b/.test(accept)) {
        encoded = brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })
        encoding = 'br'
      } else if (/\bgzip\b/.test(accept)) {
        encoded = gzipSync(raw)
        encoding = 'gzip'
      }
      if (!encoded) return

      response.body = encoded as unknown as string
      response.headers = response.headers || {}
      response.headers['content-encoding'] = encoding
      response.headers['content-length'] = String(encoded.length)
      response.headers.vary = 'accept-encoding'
    } catch {
      /* fall back to the uncompressed response */
    }
  })
})
