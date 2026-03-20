import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

/**
 * Vite plugin that serves files from a local directory and handles uploads.
 * Files are stored outside the project so app updates don't affect them.
 *
 * - GET  /local-files/<path>  → serves the file
 * - POST /api/upload          → saves file, returns { url, storagePath }
 * - POST /api/delete-file     → deletes a local file
 */
export function localFilesPlugin(localDir: string): Plugin {
  // Ensure the directory exists
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true })
  }

  return {
    name: 'local-files',
    configureServer(server) {
      // Serve local files
      server.middlewares.use('/local-files', (req, res, next) => {
        if (req.method !== 'GET') return next()
        const filePath = path.join(localDir, decodeURIComponent(req.url || ''))
        // Prevent path traversal
        if (!filePath.startsWith(localDir)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.end('Not found')
          return
        }
        const ext = path.extname(filePath).toLowerCase()
        const mimeTypes: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.bmp': 'image/bmp',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.txt': 'text/plain',
        }
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
        res.setHeader('Access-Control-Allow-Origin', '*')
        fs.createReadStream(filePath).pipe(res)
      })

      // Upload endpoint
      server.middlewares.use('/api/upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks)

            // Parse multipart form data
            const contentType = req.headers['content-type'] || ''
            const boundaryMatch = contentType.match(/boundary=(.+)/)
            if (!boundaryMatch) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing boundary' }))
              return
            }

            const boundary = boundaryMatch[1]
            const parts = parseMultipart(body, boundary)

            const filePart = parts.find(p => p.name === 'file')
            const pathPart = parts.find(p => p.name === 'path')

            if (!filePart || !pathPart) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing file or path' }))
              return
            }

            const storagePath = pathPart.data.toString('utf-8')
            // Prevent path traversal
            const fullPath = path.join(localDir, storagePath)
            if (!fullPath.startsWith(localDir)) {
              res.statusCode = 403
              res.end(JSON.stringify({ error: 'Invalid path' }))
              return
            }

            // Create subdirectories
            fs.mkdirSync(path.dirname(fullPath), { recursive: true })
            fs.writeFileSync(fullPath, filePart.data)

            const url = `/local-files/${encodeURIComponent(storagePath).replace(/%2F/g, '/')}`

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ url, storagePath }))
          } catch (err) {
            console.error('Upload error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Upload failed' }))
          }
        })
      })

      // Delete endpoint
      server.middlewares.use('/api/delete-file', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          try {
            const { storagePath } = JSON.parse(Buffer.concat(chunks).toString())
            const fullPath = path.join(localDir, storagePath)
            if (!fullPath.startsWith(localDir)) {
              res.statusCode = 403
              res.end(JSON.stringify({ error: 'Invalid path' }))
              return
            }
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath)
              // Clean up empty parent directories
              let dir = path.dirname(fullPath)
              while (dir !== localDir && fs.existsSync(dir)) {
                const contents = fs.readdirSync(dir)
                if (contents.length === 0) {
                  fs.rmdirSync(dir)
                  dir = path.dirname(dir)
                } else break
              }
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            console.error('Delete error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Delete failed' }))
          }
        })
      })
    },
  }
}

/** Simple multipart parser */
function parseMultipart(body: Buffer, boundary: string) {
  const parts: { name: string; filename?: string; data: Buffer }[] = []
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const crlf = Buffer.from('\r\n\r\n')

  let start = indexOf(body, boundaryBuf, 0)
  while (start !== -1) {
    start += boundaryBuf.length + 2 // skip boundary + \r\n
    const nextBoundary = indexOf(body, boundaryBuf, start)
    if (nextBoundary === -1) break

    const partData = body.subarray(start, nextBoundary - 2) // -2 for \r\n before boundary
    const headerEnd = indexOf(partData, crlf, 0)
    if (headerEnd === -1) { start = nextBoundary; continue }

    const headers = partData.subarray(0, headerEnd).toString()
    const data = partData.subarray(headerEnd + 4) // skip \r\n\r\n

    const nameMatch = headers.match(/name="([^"]+)"/)
    const filenameMatch = headers.match(/filename="([^"]+)"/)

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch?.[1],
        data,
      })
    }

    start = nextBoundary
  }

  return parts
}

function indexOf(buf: Buffer, search: Buffer, from: number): number {
  for (let i = from; i <= buf.length - search.length; i++) {
    let found = true
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break }
    }
    if (found) return i
  }
  return -1
}
