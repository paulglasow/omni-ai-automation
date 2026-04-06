'use client';

import { useState, useRef } from 'react';

export default function FileUpload({ workspaceId, onFileUploaded, onAnalysis }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null); // fileId being analyzed
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  async function handleUpload(file) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (workspaceId) formData.append('workspaceId', workspaceId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setFiles((prev) => [data.file, ...prev]);
      onFileUploaded?.(data.file);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(fileId, fileName) {
    setAnalyzing(fileId);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onAnalysis?.({ fileId, fileName, ...data });
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(null);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
        />
        {uploading ? (
          <div className="text-blue-600 animate-pulse">Uploading…</div>
        ) : (
          <>
            <div className="text-2xl mb-1">📎</div>
            <div className="text-sm text-gray-600">
              Drop a file here or click to browse
            </div>
            <div className="text-xs text-gray-400 mt-1">
              PDF, text, images, Word, Excel, code — up to 25MB
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">⚠️ {error}</div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">
                  {f.type?.includes('pdf') ? '📄' : f.type?.includes('image') ? '🖼️' : '📝'}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{f.name}</div>
                  <div className="text-xs text-gray-400">{formatSize(f.size)}</div>
                </div>
              </div>
              <button
                onClick={() => handleAnalyze(f.id, f.name)}
                disabled={analyzing === f.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 whitespace-nowrap"
              >
                {analyzing === f.id ? 'Analyzing…' : '🔍 Analyze with AI'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
