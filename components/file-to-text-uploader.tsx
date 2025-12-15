"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendGTMEvent } from "@/utils/gtm-helper";
import {
  uploadToStorage,
  deleteFromStorage,
  STORAGE_UPLOAD_THRESHOLD,
  shouldUseStorageUpload,
} from "@/lib/supabase/storage";

interface FileToTextUploaderProps {
  onTextExtracted: (text: string) => void;
  isPremium: boolean;
  onConversionStateChange?: (isConverting: boolean) => void;
}

const FREE_FORMATS = ["pdf", "docx", "txt", "html"];
const PREMIUM_FORMATS = ["pdf", "docx", "xlsx", "pptx", "txt", "html", "csv", "xml", "json"];

const FREE_MAX_SIZE_MB = 10;
const PREMIUM_MAX_SIZE_MB = 50;

// Vercel serverless function limit is 4.5MB
// Files larger than this use Supabase Storage upload
const DIRECT_UPLOAD_LIMIT_MB = STORAGE_UPLOAD_THRESHOLD / 1024 / 1024;

/**
 * Sanitizes text extracted from documents to prevent JSON parsing errors.
 * This is a client-side defense layer in addition to server-side sanitization.
 */
function sanitizeExtractedText(text: string): string {
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

export function FileToTextUploader({ onTextExtracted, isPremium, onConversionStateChange }: FileToTextUploaderProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const allowedFormats = isPremium ? PREMIUM_FORMATS : FREE_FORMATS;
  const maxSizeMB = isPremium ? PREMIUM_MAX_SIZE_MB : FREE_MAX_SIZE_MB;

  const validateFile = (file: File): string | null => {
    // Check if file exists and has size
    if (!file || file.size === 0) {
      return "Arquivo vazio ou inválido";
    }

    // Check extension
    const ext = file.name.toLowerCase().split(".").pop() || "";
    if (!allowedFormats.includes(ext)) {
      if (isPremium) {
        return `Formato não suportado: .${ext}`;
      }
      return `Formato não disponível no plano gratuito. Formatos permitidos: ${FREE_FORMATS.join(", ")}`;
    }

    // Check size
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
      if (isPremium) {
        return `Arquivo muito grande (${sizeMB.toFixed(1)}MB). Tamanho máximo: ${maxSizeMB}MB`;
      }
      return `Arquivo muito grande (${sizeMB.toFixed(1)}MB). Plano gratuito permite até ${maxSizeMB}MB. Faça upgrade para Premium!`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    console.log('handleFileSelect: Starting conversion', { name: file.name, size: file.size });

    const ext = file.name.toLowerCase().split(".").pop() || "";
    const sizeMB = file.size / 1024 / 1024;
    const useStorageUpload = shouldUseStorageUpload(file.size);

    // Send analytics event for upload start
    sendGTMEvent('file_upload_started', {
      file_type: ext,
      file_size_mb: sizeMB.toFixed(2),
      plan: isPremium ? 'premium' : 'free',
      upload_method: useStorageUpload ? 'storage' : 'direct',
    });

    setIsConverting(true);
    setUploadedFileName(file.name);
    onConversionStateChange?.(true);

    let storagePath: string | undefined;

    try {
      // Get Supabase session (optional - works for guests too)
      console.log('handleFileSelect: Getting Supabase session');

      let session = null;
      let userId: string | undefined;
      try {
        const supabase = createClient();

        // Get user with timeout to prevent hanging
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );

        const { data: { user }, error: userError } = await Promise.race([
          getUserPromise,
          timeoutPromise
        ]) as any;

        if (userError) {
          console.warn('handleFileSelect: getUser error:', userError.message);
        } else if (user) {
          userId = user.id;
          // Get session for token (with timeout)
          try {
            const sessionPromise = supabase.auth.getSession();
            const { data: sessionData } = await Promise.race([
              sessionPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000))
            ]) as any;
            session = sessionData?.session || null;
          } catch {
            console.warn('handleFileSelect: Session timeout, continuing without token');
          }
        }

        console.log('handleFileSelect: Auth check completed', {
          authenticated: !!user,
          userId: userId || 'guest',
          hasSession: !!session
        });
      } catch (authError) {
        console.warn('handleFileSelect: Auth timeout/error, continuing as guest', authError);
        // Continue as guest user - this is fine for file upload
      }

      let data: any;

      // For large files (> 4MB), try Storage upload first, fallback to direct upload
      if (useStorageUpload) {
        console.log(`handleFileSelect: Using Storage upload for large file (${sizeMB.toFixed(1)}MB)`);

        // Step 1: Try to upload to Supabase Storage
        toast({
          title: "Enviando arquivo...",
          description: "Processando arquivo grande...",
        });

        let useDirectUploadFallback = false;

        try {
          const uploadResult = await uploadToStorage(file, userId);

          if (!uploadResult.success || !uploadResult.url) {
            console.warn('handleFileSelect: Storage upload failed, trying direct upload', uploadResult.error);
            useDirectUploadFallback = true;
          } else {
            storagePath = uploadResult.path;
            console.log('handleFileSelect: File uploaded to Storage', { path: storagePath });

            // Step 2: Call convert-from-url endpoint
            toast({
              title: "Convertendo documento...",
              description: "Extraindo texto do arquivo.",
            });

            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            };
            if (session) {
              headers.Authorization = `Bearer ${session.access_token}`;
            }

            const response = await fetch("/api/convert-from-url", {
              method: "POST",
              headers,
              body: JSON.stringify({
                fileUrl: uploadResult.url,
                filename: file.name,
                storagePath: storagePath,
              }),
            });

            const responseText = await response.text();

            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('handleFileSelect: Non-JSON response from convert-from-url', {
                status: response.status,
                body: responseText.slice(0, 200)
              });

              if (response.status === 502 || response.status === 504) {
                throw new Error('O serviço de conversão está temporariamente indisponível. Tente novamente em alguns segundos.');
              }

              throw new Error(responseText.slice(0, 100) || `Erro do servidor: ${response.status}`);
            }

            if (!response.ok) {
              throw new Error(data.message || data.error || "Conversão falhou");
            }
          }
        } catch (storageError) {
          console.warn('handleFileSelect: Storage upload error, trying direct upload', storageError);
          useDirectUploadFallback = true;
        }

        // Fallback: Try direct upload even for large files
        if (useDirectUploadFallback) {
          console.log('handleFileSelect: Using direct upload fallback for large file');
          toast({
            title: "Tentando método alternativo...",
            description: "Enviando arquivo diretamente.",
          });

          const formData = new FormData();
          formData.append("file", file);

          const headers: HeadersInit = {};
          if (session) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }

          const response = await fetch("/api/convert", {
            method: "POST",
            headers,
            body: formData,
          });

          const responseText = await response.text();

          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('handleFileSelect: Non-JSON response from direct upload', {
              status: response.status,
              body: responseText.slice(0, 200)
            });

            if (response.status === 413) {
              throw new Error(`Arquivo muito grande (${sizeMB.toFixed(1)}MB). O limite é 4.5MB para upload direto. Por favor, configure o Supabase Storage.`);
            }

            throw new Error(responseText.slice(0, 100) || `Erro do servidor: ${response.status}`);
          }

          if (!response.ok) {
            throw new Error(data.message || data.error || "Conversão falhou");
          }
        }

      } else {
        // For small files, use direct upload
        console.log('handleFileSelect: Using direct upload');

        const formData = new FormData();
        formData.append("file", file);

        const headers: HeadersInit = {};
        if (session) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        console.log('handleFileSelect: Sending fetch to /api/convert');
        const response = await fetch("/api/convert", {
          method: "POST",
          headers,
          body: formData,
        });
        console.log('handleFileSelect: Fetch response received', { status: response.status, ok: response.ok });

        // Handle response - try JSON first, fallback to text for error handling
        const responseText = await response.text();

        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // Response is not valid JSON - likely a platform error (413, 502, etc)
          console.error('handleFileSelect: Non-JSON response', {
            status: response.status,
            body: responseText.slice(0, 200) // Log first 200 chars
          });

          // Handle specific platform errors
          if (response.status === 413 ||
              responseText.toLowerCase().includes('too large') ||
              responseText.toLowerCase().includes('request entity') ||
              responseText.toLowerCase().includes('payload too large')) {
            throw new Error(`Arquivo muito grande para upload direto (${sizeMB.toFixed(1)}MB). Tente novamente - o sistema vai usar um método alternativo.`);
          }

          if (response.status === 502 || response.status === 504) {
            throw new Error('O serviço de conversão está temporariamente indisponível. Tente novamente em alguns segundos.');
          }

          throw new Error(responseText.slice(0, 100) || `Erro do servidor: ${response.status}`);
        }

        if (!response.ok) {
          // Check if it's a rate limit error (429)
          if (response.status === 429) {
            sendGTMEvent('file_upload_limit_reached', {
              file_type: ext,
              file_size_mb: sizeMB.toFixed(2),
              plan: isPremium ? 'premium' : 'free',
              upgrade_required: data.upgrade_required || false,
            });

            // Show upgrade message with link to premium page
            const errorMessage = data.message || "Limite de uploads atingido";
            const upgradeMessage = data.upgrade_message || "Faça upgrade para o plano Premium!";

            toast({
              title: "Limite atingido",
              description: (
                <div className="space-y-2">
                  <p>{errorMessage}</p>
                  <p className="text-sm font-medium text-primary">
                    {upgradeMessage}
                  </p>
                  <a
                    href="/premium"
                    className="inline-block text-sm underline text-primary hover:opacity-80"
                    onClick={() => sendGTMEvent('upgrade_cta_click', { source: 'file_upload_limit' })}
                  >
                    Ver planos →
                  </a>
                </div>
              ) as any,
              variant: "destructive",
              duration: 8000, // Show for longer
            });

            setUploadedFileName(null);
            setIsConverting(false);
            onConversionStateChange?.(false);
            return; // Exit early to avoid duplicate error handling
          } else {
            sendGTMEvent('file_upload_error', {
              file_type: ext,
              file_size_mb: sizeMB.toFixed(2),
              error_status: response.status,
              error_message: data.message || data.error,
              plan: isPremium ? 'premium' : 'free',
            });
          }
          throw new Error(data.message || data.error || "Conversão falhou");
        }
      }

      // Extract plain text and sanitize before sending to parent
      const extractedText = data.plain_text || data.markdown;
      const sanitizedText = sanitizeExtractedText(extractedText);
      onTextExtracted(sanitizedText);

      // Send analytics event for successful conversion
      sendGTMEvent('file_upload_completed', {
        file_type: ext,
        file_size_mb: sizeMB.toFixed(2),
        file_size_bytes: file.size,
        words_extracted: data.metadata?.words || 0,
        characters_extracted: data.metadata?.characters || 0,
        processing_time_ms: data.processing_time_ms,
        plan: isPremium ? 'premium' : 'free',
        upload_method: useStorageUpload ? 'storage' : 'direct',
      });

      toast({
        title: "Arquivo convertido!",
        description: `${data.metadata?.words || 0} palavras extraídas de ${file.name}`,
      });

      // Clean up storage file after successful conversion
      if (storagePath) {
        console.log('handleFileSelect: Cleaning up storage file', storagePath);
        deleteFromStorage(storagePath).catch(err => {
          console.warn('handleFileSelect: Failed to delete storage file', err);
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

      // Send analytics event for conversion error (if not already sent above)
      if (!errorMessage.includes("Limite")) {
        sendGTMEvent('file_upload_error', {
          file_type: ext,
          file_size_mb: sizeMB.toFixed(2),
          error_message: errorMessage,
          plan: isPremium ? 'premium' : 'free',
          upload_method: useStorageUpload ? 'storage' : 'direct',
        });
      }

      toast({
        title: "Erro na conversão",
        description: errorMessage,
        variant: "destructive",
      });
      setUploadedFileName(null);

      // Clean up storage file on error
      if (storagePath) {
        console.log('handleFileSelect: Cleaning up storage file after error', storagePath);
        deleteFromStorage(storagePath).catch(err => {
          console.warn('handleFileSelect: Failed to delete storage file', err);
        });
      }
    } finally {
      setIsConverting(false);
      onConversionStateChange?.(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      console.log('handleChange: File selected', { name: file.name, size: file.size, type: file.type });

      // Validate file before setting
      const error = validateFile(file);
      if (error) {
        const ext = file.name.toLowerCase().split(".").pop() || "";
        const sizeMB = file.size / 1024 / 1024;

        console.error('handleChange: Validation failed', error);

        sendGTMEvent('file_upload_validation_error', {
          file_type: ext,
          file_size_mb: sizeMB.toFixed(2),
          error_reason: error.includes('formato') ? 'invalid_format' : 'file_too_large',
          plan: isPremium ? 'premium' : 'free',
        });

        toast({
          title: "Arquivo inválido",
          description: error,
          variant: "destructive",
        });

        e.target.value = "";
        return;
      }

      // Set selected file (don't upload yet)
      console.log('handleChange: File validated successfully, setting selectedFile');
      setSelectedFile(file);
      setUploadedFileName(file.name);
    }

    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleConvert = async () => {
    console.log('handleConvert: Called', {
      hasSelectedFile: !!selectedFile,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      isConverting
    });

    if (!selectedFile) {
      console.error('handleConvert: No file selected');
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (isConverting) {
      console.warn('handleConvert: Already converting, ignoring');
      return;
    }

    console.log('handleConvert: Starting conversion for', selectedFile.name);
    await handleFileSelect(selectedFile);
  };

  const clearFile = () => {
    setUploadedFileName(null);
    setSelectedFile(null);
    // Clear text in parent form to allow new file upload
    onTextExtracted("");
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        id="file-upload-correction"
        className="sr-only"
        accept={allowedFormats.map((f) => `.${f}`).join(",")}
        onChange={handleChange}
        disabled={isConverting}
      />

      {!selectedFile ? (
        <label htmlFor="file-upload-correction" className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={isConverting}
            asChild
          >
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Selecionar arquivo
            </span>
          </Button>
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800"
          >
            Beta
          </Badge>
        </label>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 max-w-[200px] truncate">
              {uploadedFileName}
            </span>
            <button
              type="button"
              onClick={clearFile}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              disabled={isConverting}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleConvert}
            disabled={isConverting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Convertendo...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Converter
              </>
            )}
          </Button>
        </>
      )}

      <span className="text-xs text-muted-foreground">
        {allowedFormats.slice(0, 4).join(", ").toUpperCase()}
        {isPremium && ` +${allowedFormats.length - 4}`} | {maxSizeMB}MB
      </span>
    </div>
  );
}
