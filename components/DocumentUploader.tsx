"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  result?: {
    markdown: string;
    plain_text: string;
    metadata: {
      words: number;
      characters: number;
      estimated_pages: number;
      file_size_bytes: number;
    };
    processing_time_ms: number;
  };
  error?: string;
}

interface Props {
  isPremium: boolean;
}

const FREE_FORMATS = ["pdf", "docx", "txt", "html"];
const PREMIUM_FORMATS = ["pdf", "docx", "xlsx", "pptx", "txt", "html", "csv", "xml", "json"];
const FREE_MAX_SIZE_MB = 10;
const PREMIUM_MAX_SIZE_MB = 50;

export function DocumentUploader({ isPremium }: Props) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const allowedFormats = isPremium ? PREMIUM_FORMATS : FREE_FORMATS;
  const maxSizeMB = isPremium ? PREMIUM_MAX_SIZE_MB : FREE_MAX_SIZE_MB;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

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

  const handleFile = async (file: File) => {
    // Validate
    const error = validateFile(file);
    if (error) {
      setUploadedFile({
        file,
        status: "error",
        error,
      });
      return;
    }

    // Set uploading
    setUploadedFile({
      file,
      status: "uploading",
    });

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

      // Success
      setUploadedFile({
        file,
        status: "success",
        result: data,
      });
    } catch (err) {
      setUploadedFile({
        file,
        status: "error",
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [isPremium]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const reset = () => {
    setUploadedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!uploadedFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center
            transition-all duration-200
            ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          `}
        >
          <input
            type="file"
            id="file-upload"
            className="sr-only"
            accept={allowedFormats.map((f) => `.${f}`).join(",")}
            onChange={handleChange}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Arraste um documento ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos permitidos: {allowedFormats.join(", ").toUpperCase()}
            </p>
            <p className="text-xs text-gray-400">
              Tamanho máximo: {maxSizeMB}MB
            </p>
          </label>
        </div>
      )}

      {/* File Status */}
      {uploadedFile && (
        <div className="border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {uploadedFile.status === "uploading" && (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              )}
              {uploadedFile.status === "success" && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              {uploadedFile.status === "error" && (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              {uploadedFile.status === "pending" && (
                <FileText className="w-6 h-6 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {uploadedFile.file.name}
              </p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
              </p>

              {uploadedFile.status === "uploading" && (
                <p className="text-sm text-blue-600 mt-2">
                  Convertendo documento...
                </p>
              )}

              {uploadedFile.status === "error" && (
                <p className="text-sm text-red-600 mt-2">
                  {uploadedFile.error}
                </p>
              )}

              {uploadedFile.status === "success" && uploadedFile.result && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{uploadedFile.result.metadata.words} palavras</span>
                    <span>•</span>
                    <span>{uploadedFile.result.metadata.estimated_pages} páginas</span>
                    <span>•</span>
                    <span>{uploadedFile.result.processing_time_ms}ms</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Markdown:</h4>
                    <div className="max-h-64 overflow-y-auto bg-gray-50 rounded p-4">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {uploadedFile.result.markdown}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Texto Puro:</h4>
                    <div className="max-h-64 overflow-y-auto bg-gray-50 rounded p-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {uploadedFile.result.plain_text}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Converter outro documento
            </button>

            {uploadedFile.status === "success" && uploadedFile.result && (
              <>
                <button
                  onClick={() => {
                    const blob = new Blob([uploadedFile.result!.markdown], {
                      type: "text/markdown",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = uploadedFile.file.name.replace(/\.[^/.]+$/, "") + ".md";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Download Markdown
                </button>

                <button
                  onClick={() => {
                    const blob = new Blob([uploadedFile.result!.plain_text], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = uploadedFile.file.name.replace(/\.[^/.]+$/, "") + ".txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Download TXT
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-medium">Seu plano: {isPremium ? "Premium" : "Gratuito"}</p>
        {!isPremium && (
          <p className="text-blue-600">
            Faça upgrade para Premium e converta arquivos maiores e mais formatos!
          </p>
        )}
      </div>
    </div>
  );
}
