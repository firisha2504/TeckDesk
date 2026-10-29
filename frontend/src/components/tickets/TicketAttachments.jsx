import React, { useRef, useState } from 'react';
import { Paperclip, UploadCloud, File, Download, Loader2 } from 'lucide-react';
import { Button } from '../common/Button.jsx';

export const TicketAttachments = ({
  attachments = [],
  onUpload,
  isUploading = false,
}) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await onUpload(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-slate-200 dark:border-navy-750 hover:border-blue-500/60 dark:hover:border-cyan-500/60 bg-white/40 dark:bg-navy-900/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip"
        />

        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-navy-800 text-blue-500 dark:text-cyan-400 mx-auto flex items-center justify-center mb-3">
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UploadCloud className="w-5 h-5" />
          )}
        </div>

        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isUploading ? 'Uploading file...' : 'Click or drag files here to attach'}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          PNG, JPG, PDF, TXT, CSV, DOC, or ZIP (Max 10MB)
        </p>
      </div>

      {/* Attachments List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((file) => (
          <div
            key={file._id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 dark:text-cyan-400 shrink-0">
                <File className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {file.originalName}
                </p>
                <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <a
              href={file.path}
              target="_blank"
              rel="noreferrer"
              download={file.originalName}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
