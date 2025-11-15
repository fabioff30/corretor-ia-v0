/**
 * Document Conversion API
 * Converts documents (PDF, DOCX, etc.) to Markdown using MarkItDown VPS
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canUserPerformOperation, incrementUserUsage } from "@/utils/limit-checker";
import { dailyRateLimiter } from "@/lib/api/daily-rate-limit";

// Environment variables
const MARKITDOWN_API_URL =
  process.env.NEXT_PUBLIC_MARKITDOWN_API_URL ||
  "https://markitdown-markitdown.3j5ljv.easypanel.host";
const MARKITDOWN_API_TOKEN = process.env.MARKITDOWN_API_TOKEN || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// File size limits (bytes)
const FREE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const PREMIUM_MAX_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed formats
const FREE_FORMATS = ["pdf", "docx", "txt", "html"];
const PREMIUM_FORMATS = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "txt",
  "html",
  "csv",
  "xml",
  "json",
];

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
    return { userId: null, error: null }; // Allow guest users
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { userId: null, error: null }; // Treat as guest
    }

    return { userId: user.id, error: null };
  } catch (error) {
    return { userId: null, error: null }; // Treat as guest
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

function validateFile(
  filename: string,
  fileSize: number,
  isPremium: boolean
): { valid: boolean; error: string | null } {
  // Get file extension
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (!ext) {
    return { valid: false, error: "Arquivo sem extensão válida" };
  }

  // Check format
  const allowedFormats = isPremium ? PREMIUM_FORMATS : FREE_FORMATS;
  if (!allowedFormats.includes(ext)) {
    if (isPremium) {
      return { valid: false, error: `Formato não suportado: .${ext}` };
    } else {
      return {
        valid: false,
        error: `Formato não disponível no plano gratuito. Formatos permitidos: ${FREE_FORMATS.join(", ")}`,
      };
    }
  }

  // Check size
  const maxSize = isPremium ? PREMIUM_MAX_SIZE : FREE_MAX_SIZE;
  if (fileSize > maxSize) {
    const maxMB = maxSize / 1024 / 1024;
    const fileMB = fileSize / 1024 / 1024;
    if (isPremium) {
      return {
        valid: false,
        error: `Arquivo muito grande (${fileMB.toFixed(1)}MB). Tamanho máximo: ${maxMB.toFixed(1)}MB`,
      };
    } else {
      return {
        valid: false,
        error: `Arquivo muito grande (${fileMB.toFixed(1)}MB). Plano gratuito permite até ${maxMB.toFixed(1)}MB. Faça upgrade para Premium!`,
      };
    }
  }

  if (fileSize === 0) {
    return { valid: false, error: "Arquivo vazio" };
  }

  return { valid: true, error: null };
}

async function convertDocument(
  fileData: ArrayBuffer,
  filename: string
): Promise<ConversionResult> {
  try {
    // Create FormData
    const formData = new FormData();
    const blob = new Blob([fileData]);
    formData.append("file", blob, filename);

    // Call VPS API
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
        errorData.message || errorData.error || "Conversion failed"
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Timeout ao converter documento");
      }
      throw new Error(`Erro ao comunicar com API: ${error.message}`);
    }
    throw new Error("Erro desconhecido ao converter documento");
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
    // Don't fail the request if logging fails
    console.error("[WARNING] Failed to log conversion:", error);
  }
}

/**
 * Sanitizes text extracted from documents to prevent JSON parsing errors.
 * Removes control characters, zero-width spaces, BOM, and other problematic characters.
 */
function sanitizeForJson(text: string): string {
  if (!text) return text;

  return text
    // Remove control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove zero-width spaces and other invisible characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Replace line/paragraph separators with newlines
    .replace(/[\u2028\u2029]/g, '\n')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace while preserving paragraph breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace
    .trim();
}

// GET /api/convert - Health check
export async function GET() {
  return NextResponse.json({
    status: "OK",
    service: "document-conversion",
    version: "1.0.0",
  });
}

// POST /api/convert - Convert document
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

    // Get user from Authorization header (optional for guests)
    const authHeader = request.headers.get("authorization") || "";
    const { userId } = await getUserFromToken(authHeader);

    let isPremium = false;
    let plan: string | null = null;

    // If user is logged in, get their plan
    if (userId) {
      const { plan: userPlan, error: planError } = await getUserPlan(userId);
      if (!planError && userPlan) {
        plan = userPlan;
        isPremium = plan === "pro" || plan === "admin";
      }
    }

    // Check file upload limits
    if (userId && !isPremium) {
      // Logged-in free user: check database limits
      const limitCheck = await canUserPerformOperation(userId, 'file_upload');

      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: "Limite atingido",
            message: limitCheck.reason || "Você atingiu o limite de uploads diários.",
            upgrade_message: "Faça upgrade para o plano Premium e tenha uploads ilimitados!",
            upgrade_required: true,
            limit: limitCheck.limit,
            remaining: limitCheck.remaining || 0,
          },
          { status: 429 }
        );
      }
    } else if (!userId) {
      // Guest user: check IP-based rate limit (1 upload per day)
      const rateLimitResult = await dailyRateLimiter(request, "file-upload-guest", 1);

      if (rateLimitResult) {
        // Rate limit exceeded
        const errorData = await rateLimitResult.json();
        return NextResponse.json(
          {
            error: "Limite atingido",
            message: "Você atingiu o limite de 1 upload gratuito por dia.",
            upgrade_message: "Crie uma conta gratuita para ter 1 upload por dia, ou assine o plano Premium para uploads ilimitados!",
            upgrade_required: true,
            resetAt: errorData.resetAt,
          },
          { status: 429 }
        );
      }
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: "No file provided",
          message: "Nenhum arquivo foi enviado",
        },
        { status: 400 }
      );
    }

    // Read file
    const filename = file.name;
    const fileData = await file.arrayBuffer();
    const fileSize = fileData.byteLength;

    // Validate file
    const { valid, error: validationError } = validateFile(
      filename,
      fileSize,
      isPremium
    );
    if (!valid) {
      return NextResponse.json(
        {
          error: "Invalid file",
          message: validationError,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Convert API] Converting ${filename} (${fileSize} bytes) for ${userId ? `user ${userId} (${plan})` : 'guest user'}`
    );

    // Convert document
    try {
      const result = await convertDocument(fileData, filename);

      if (!result.success) {
        const errorMsg = result.error || "Conversion failed";
        if (userId) {
          await logConversion(userId, filename, fileSize, result, false, errorMsg);
        }

        return NextResponse.json(
          {
            error: "Conversion failed",
            message: errorMsg,
          },
          { status: 500 }
        );
      }

      // Log successful conversion (only for logged-in users)
      if (userId) {
        await logConversion(userId, filename, fileSize, result, true);

        // Increment usage counter for file uploads (only for non-premium users)
        if (!isPremium) {
          await incrementUserUsage(userId, 'file_upload');
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(
        `[Convert API] Success! Processed in ${processingTime}ms (VPS: ${result.processing_time_ms}ms)`
      );

      // Sanitize extracted text to prevent JSON parsing errors
      const sanitizedMarkdown = sanitizeForJson(result.markdown);
      const sanitizedPlainText = sanitizeForJson(result.plain_text);

      // Return result
      return NextResponse.json(
        {
          success: true,
          markdown: sanitizedMarkdown,
          plain_text: sanitizedPlainText,
          metadata: result.metadata,
          processing_time_ms: processingTime,
          vps_processing_time_ms: result.processing_time_ms,
        },
        {
          headers: {
            "X-Processing-Time": `${processingTime}ms`,
            "X-VPS-Processing-Time": `${result.processing_time_ms}ms`,
          },
        }
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (userId) {
        await logConversion(userId, filename, fileSize, {}, false, errorMsg);
      }

      return NextResponse.json(
        {
          error: "Conversion error",
          message: errorMsg,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("[Convert API] Unexpected error:", error);

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
