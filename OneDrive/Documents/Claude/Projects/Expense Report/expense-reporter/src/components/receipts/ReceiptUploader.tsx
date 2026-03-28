"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadAndExtractReceipt } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UploadResult {
  success: boolean;
  expense?: any;
  extraction?: any;
  error?: string;
}

interface ReceiptUploaderProps {
  onUploadComplete?: (result: UploadResult) => void;
  compact?: boolean;
}

export function ReceiptUploader({ onUploadComplete, compact }: ReceiptUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setError("");
      setProgress("Uploading receipt...");

      for (const file of acceptedFiles) {
        try {
          setProgress(`Extracting data from ${file.name}...`);

          const formData = new FormData();
          formData.append("file", file);

          const result = await uploadAndExtractReceipt(formData);

          if (result.success) {
            setProgress("Extraction complete!");
            onUploadComplete?.(result);
          } else {
            setError(result.error || "Upload failed");
          }
        } catch (err: any) {
          setError(err.message || "Something went wrong");
        }
      }

      setUploading(false);
      setTimeout(() => setProgress(""), 2000);
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {progress}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Drop receipts here or <span className="text-blue-600 font-medium">browse</span>
          </p>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-blue-400 bg-blue-50 scale-[1.01]"
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">{progress}</p>
              <p className="text-xs text-slate-500 mt-1">
                AI is reading your receipt and extracting key details...
              </p>
            </div>
            <div className="w-48 mx-auto h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        ) : isDragActive ? (
          <div className="space-y-2">
            <span className="text-4xl">📥</span>
            <p className="text-lg font-medium text-blue-600">
              Drop your receipt here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-slate-900">
                Upload a receipt
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Drag and drop an image or PDF, or{" "}
                <span className="text-blue-600 font-medium">browse files</span>
              </p>
            </div>
            <p className="text-xs text-slate-400">
              JPG, PNG, WebP, or PDF up to 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {progress && !uploading && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 animate-fade-in">
          <span>✅</span>
          <span>{progress}</span>
        </div>
      )}
    </div>
  );
}
