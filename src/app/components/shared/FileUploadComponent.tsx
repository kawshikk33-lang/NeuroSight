import { useState, useEffect } from "react";
import { Upload, File, X, Check, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { apiClient } from "../../services/api/client";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  columns: number;
  uploadDate: string;
  status: "active" | "archived";
}

export function FileUploadComponent() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const uploadedFiles = await apiClient.getUploadedFiles();
      setFiles(uploadedFiles.map(file => ({
        ...file,
        status: (file.status === "active" || file.status === "archived" ? file.status : "active") as "active" | "archived"
      })));
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to load files"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setMessage({
        type: "error",
        text: "Please upload a CSV file"
      });
      return;
    }

    try {
      setUploading(true);
      const response = await apiClient.uploadFile(file);
      
      if ((response as { success: boolean }).success) {
        setMessage({
          type: "success",
          text: `File "${file.name}" uploaded successfully`
        });
        loadFiles();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      await apiClient.deleteFile(filename);
      setMessage({
        type: "success",
        text: "File deleted successfully"
      });
      loadFiles();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to delete file"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Upload Data</h2>
        </div>

        <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-slate-300 font-medium">
              {uploading ? "Uploading..." : "Drop CSV file here or click to select"}
            </p>
            <p className="text-sm text-slate-500">CSV files only</p>
          </div>
        </label>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : message.type === "error"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-blue-500/10 border border-blue-500/20"
          }`}
        >
          {message.type === "success" && (
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          )}
          {message.type === "error" && (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <p
            className={
              message.type === "success"
                ? "text-emerald-200"
                : message.type === "error"
                ? "text-red-200"
                : "text-blue-200"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Files List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
            <File className="w-5 h-5 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Uploaded Files</h2>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No files uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {file.columns} columns • {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
