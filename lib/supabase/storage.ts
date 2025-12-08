/**
 * Supabase Storage utilities for large file uploads
 * Bypasses Vercel's 4.5MB serverless function limit
 */

import { createClient } from './client'

// Bucket name for temporary document uploads
export const DOCUMENTS_BUCKET = 'document-uploads'

// Files are auto-deleted after this time (in seconds)
export const FILE_EXPIRY_SECONDS = 3600 // 1 hour

// Size threshold for using Storage upload (bytes)
export const STORAGE_UPLOAD_THRESHOLD = 4 * 1024 * 1024 // 4MB

interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Upload a file directly to Supabase Storage
 * Used for files > 4MB to bypass Vercel's serverless limit
 */
export async function uploadToStorage(file: File, userId?: string): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Generate unique file path
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = userId
      ? `${userId}/${timestamp}-${randomId}-${sanitizedName}`
      : `anonymous/${timestamp}-${randomId}-${sanitizedName}`

    console.log('[Storage] Uploading file:', {
      name: file.name,
      size: file.size,
      path: filePath
    })

    // Upload file to Storage
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[Storage] Upload error:', error)
      return {
        success: false,
        error: error.message || 'Erro ao fazer upload do arquivo'
      }
    }

    // Get signed URL (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, FILE_EXPIRY_SECONDS)

    if (signedError || !signedData?.signedUrl) {
      console.error('[Storage] Signed URL error:', signedError)
      // Try to delete uploaded file
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath])
      return {
        success: false,
        error: 'Erro ao gerar URL do arquivo'
      }
    }

    console.log('[Storage] Upload successful:', { path: data.path })

    return {
      success: true,
      url: signedData.signedUrl,
      path: data.path,
    }
  } catch (err) {
    console.error('[Storage] Unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido no upload',
    }
  }
}

/**
 * Delete a file from Supabase Storage
 * Called after processing is complete
 */
export async function deleteFromStorage(filePath: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('[Storage] Delete error:', error)
      return false
    }

    console.log('[Storage] File deleted:', filePath)
    return true
  } catch (err) {
    console.error('[Storage] Delete unexpected error:', err)
    return false
  }
}

/**
 * Check if a file should use Storage upload based on size
 */
export function shouldUseStorageUpload(fileSize: number): boolean {
  return fileSize >= STORAGE_UPLOAD_THRESHOLD
}
