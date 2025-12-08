/**
 * Document Conversion API - URL-based
 * Converts documents from Supabase Storage URL to text
 * Used for files > 4MB that bypass Vercel's serverless limit
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canUserPerformOperation, incrementUserUsage } from "@/utils/limit-checker";

// Environment variables
const MARKITDOWN_API_URL =
  process.env.NEXT_PUBLIC_MARKITDOWN_API_URL ||
  "https://markitdown-markitdown.3j5ljv.easypanel.host";
const MARKITDOWN_API_TOKEN = process.env.MARKITDOWN_API_TOKEN || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Max file size for URL-based conversion (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface ConversionMetadata {
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  characters: number;
  words: number;
  estimated_pages: number;
  detected_format: string;
}

interface ConversionResult {
  success: boolean;
  markdown: string;
  plain_text: string;
  metadata: ConversionMetadata;
  processing_time_ms: number;
  error?: string;
}

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function getUserFromToken(authHeader: string): Promise<{
  userId: string | null;
  error: string | null;
}> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, error: null };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { userId: null, error: null };
    }

    return { userId: user.id, error: null };
  } catch (error) {
    return { userId: null, error: null };
  }
}

async function getUserPlan(userId: string): Promise<{
  plan: string | null;
  error: string | null;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return { plan: null, error: "User profile not found" };
    }

    return { plan: data.plan_type || "free", error: null };
  } catch (error) {
    return {
      plan: null,
      error: `Error fetching profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Sanitizes text extracted from documents
 */
function sanitizeForJson(text: string): string {
  if (!text) return text;

  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Download file from URL and convert using MarkItDown
 */
async function convertFromUrl(
  fileUrl: string,
  filename: string
): Promise<ConversionResult> {
  const startTime = Date.now();

  try {
    // Download file from URL
    console.log('[ConvertFromUrl] Downloading file from URL');
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const fileBlob = await fileResponse.blob();
    const fileSize = fileBlob.size;

    console.log('[ConvertFromUrl] File downloaded:', {
      size: fileSize,
      type: fileBlob.type
    });

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    // Create FormData and send to MarkItDown
    const formData = new FormData();
    formData.append("file", fileBlob, filename);

    console.log('[ConvertFromUrl] Sending to MarkItDown VPS');
    const response = await fetch(`${MARKITDOWN_API_URL}/convert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MARKITDOWN_API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `Conversion failed: ${response.status}`
      );
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      processing_time_ms: processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[ConvertFromUrl] Error:', error);

    return {
      success: false,
      markdown: '',
      plain_text: '',
      metadata: {
        file_name: filename,
        file_size_bytes: 0,
        file_type: 'unknown',
        characters: 0,
        words: 0,
        estimated_pages: 0,
        detected_format: 'unknown',
      },
      processing_time_ms: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function logConversion(
  userId: string,
  filename: string,
  fileSize: number,
  result: Partial<ConversionResult>,
  success: boolean,
  errorMessage?: string
) {
  try {
    const supabase = getSupabaseClient();
    const metadata = result.metadata || ({} as ConversionMetadata);

    await supabase.from("document_conversions").insert({
      user_id: userId,
      file_name: filename,
      file_size: fileSize,
      file_type: metadata.file_type || "unknown",
      pages: metadata.estimated_pages || 0,
      words: metadata.words || 0,
      characters: metadata.characters || 0,
      processing_time_ms: result.processing_time_ms || 0,
      success: success,
      error_message: errorMessage || null,
    });
  } catch (error) {
    console.error("[ConvertFromUrl] Failed to log conversion:", error);
  }
}

// GET /api/convert-from-url - Health check
export async function GET() {
  return NextResponse.json({
    status: "OK",
    service: "document-conversion-url",
    version: "1.0.0",
  });
}

// POST /api/convert-from-url - Convert document from URL
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check API token
    if (!MARKITDOWN_API_TOKEN) {
      return NextResponse.json(
        {
          error: "Service temporarily unavailable",
          message: "Document conversion service is not configured",
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { fileUrl, filename, storagePath } = body;

    if (!fileUrl || !filename) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          message: "fileUrl and filename are required",
        },
        { status: 400 }
      );
    }

    // Get user from Authorization header
    const authHeader = request.headers.get("authorization") || "";
    const { userId } = await getUserFromToken(authHeader);

    let isPremium = false;
    let plan: string | null = null;

    if (userId) {
      const { plan: userPlan } = await getUserPlan(userId);
      if (userPlan) {
        plan = userPlan;
        isPremium = plan === "pro" || plan === "admin";
      }
    }

    // Check limits for free users
    if (userId && !isPremium) {
      const limitCheck = await canUserPerformOperation(userId, 'file_upload');
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: "Limite atingido",
            message: limitCheck.reason || "Você atingiu o limite de uploads diários.",
            upgrade_required: true,
          },
          { status: 429 }
        );
      }
    }

    console.log(`[ConvertFromUrl] Converting ${filename} for ${userId ? `user ${userId} (${plan})` : 'guest'}`);

    // Convert document
    const result = await convertFromUrl(fileUrl, filename);

    if (!result.success) {
      if (userId) {
        await logConversion(userId, filename, 0, result, false, result.error);
      }
      return NextResponse.json(
        {
          error: "Conversion failed",
          message: result.error,
        },
        { status: 500 }
      );
    }

    // Log success and increment usage
    if (userId) {
      await logConversion(userId, filename, result.metadata.file_size_bytes, result, true);

      if (!isPremium) {
        await incrementUserUsage(userId, 'file_upload');
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`[ConvertFromUrl] Success! Processed in ${processingTime}ms`);

    // Sanitize text
    const sanitizedMarkdown = sanitizeForJson(result.markdown);
    const sanitizedPlainText = sanitizeForJson(result.plain_text);

    return NextResponse.json(
      {
        success: true,
        markdown: sanitizedMarkdown,
        plain_text: sanitizedPlainText,
        metadata: result.metadata,
        processing_time_ms: processingTime,
        storagePath, // Return for cleanup
      },
      {
        headers: {
          "X-Processing-Time": `${processingTime}ms`,
        },
      }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("[ConvertFromUrl] Unexpected error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        processing_time_ms: processingTime,
      },
      { status: 500 }
    );
  }
}
