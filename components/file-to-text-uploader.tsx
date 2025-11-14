"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    // Validate
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Arquivo inválido",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    setUploadedFileName(file.name);
    onConversionStateChange?.(true);

    try {
      // Get Supabase session
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Você precisa estar logado para converter documentos");
      }

      // Upload to API
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Conversão falhou");
      }

      // Extract plain text and send to parent
      const extractedText = data.plain_text || data.markdown;
      onTextExtracted(extractedText);

      toast({
        title: "Arquivo convertido!",
        description: `${data.metadata.words} palavras extraídas de ${file.name}`,
      });
    } catch (err) {
      toast({
        title: "Erro na conversão",
        description: err instanceof Error ? err.message : "Erro desconhecido",
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
        <label htmlFor="file-upload-correction">
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
