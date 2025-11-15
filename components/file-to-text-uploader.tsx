"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendGTMEvent } from "@/utils/gtm-helper";

interface FileToTextUploaderProps {
  onTextExtracted: (text: string) => void;
  isPremium: boolean;
  onConversionStateChange?: (isConverting: boolean) => void;
}

const FREE_FORMATS = ["pdf", "docx", "txt", "html"];
const PREMIUM_FORMATS = ["pdf", "docx", "xlsx", "pptx", "txt", "html", "csv", "xml", "json"];
const FREE_MAX_SIZE_MB = 10;
const PREMIUM_MAX_SIZE_MB = 50;

export function FileToTextUploader({ onTextExtracted, isPremium, onConversionStateChange }: FileToTextUploaderProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const allowedFormats = isPremium ? PREMIUM_FORMATS : FREE_FORMATS;
  const maxSizeMB = isPremium ? PREMIUM_MAX_SIZE_MB : FREE_MAX_SIZE_MB;

  const validateFile = (file: File): string | null => {
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
    const ext = file.name.toLowerCase().split(".").pop() || "";
    const sizeMB = file.size / 1024 / 1024;

    // Validate
    const error = validateFile(file);
    if (error) {
      // Send analytics event for validation error
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
      return;
    }

    // Send analytics event for upload start
    sendGTMEvent('file_upload_started', {
      file_type: ext,
      file_size_mb: sizeMB.toFixed(2),
      plan: isPremium ? 'premium' : 'free',
    });

    setIsConverting(true);
    setUploadedFileName(file.name);
    onConversionStateChange?.(true);

    try {
      // Get Supabase session (optional - works for guests too)
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Upload to API
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

      const data = await response.json();

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

      // Extract plain text and send to parent
      const extractedText = data.plain_text || data.markdown;
      onTextExtracted(extractedText);

      // Send analytics event for successful conversion
      sendGTMEvent('file_upload_completed', {
        file_type: ext,
        file_size_mb: sizeMB.toFixed(2),
        file_size_bytes: file.size,
        words_extracted: data.metadata.words,
        characters_extracted: data.metadata.characters,
        processing_time_ms: data.processing_time_ms,
        plan: isPremium ? 'premium' : 'free',
      });

      toast({
        title: "Arquivo convertido!",
        description: `${data.metadata.words} palavras extraídas de ${file.name}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

      // Send analytics event for conversion error (if not already sent above)
      if (!errorMessage.includes("Limite")) {
        sendGTMEvent('file_upload_error', {
          file_type: ext,
          file_size_mb: sizeMB.toFixed(2),
          error_message: errorMessage,
          plan: isPremium ? 'premium' : 'free',
        });
      }

      toast({
        title: "Erro na conversão",
        description: errorMessage,
        variant: "destructive",
      });
      setUploadedFileName(null);
    } finally {
      setIsConverting(false);
      onConversionStateChange?.(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const clearFile = () => {
    setUploadedFileName(null);
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

      {!uploadedFileName ? (
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
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar arquivo
                </>
              )}
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
        <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md border border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300 max-w-[200px] truncate">
            {uploadedFileName}
          </span>
          <button
            type="button"
            onClick={clearFile}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <span className="text-xs text-muted-foreground">
        {allowedFormats.slice(0, 4).join(", ").toUpperCase()}
        {isPremium && ` +${allowedFormats.length - 4}`} | {maxSizeMB}MB
      </span>
    </div>
  );
}
