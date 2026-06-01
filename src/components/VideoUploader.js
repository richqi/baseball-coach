'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileVideo, XCircle } from 'lucide-react';

export default function VideoUploader({ onAnalyze }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setFileError(null);
    if (selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFileError(`"${selectedFile.name}" is not a video file. Please upload an .mp4, .mov, or similar video.`);
    }
  };

  const clearFile = () => {
    setFileError(null);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submitAnalysis = () => {
    if (file) {
      onAnalyze(file, previewUrl);
    }
  };

  return (
    <div className="uploader-container glass-panel" style={{ padding: '2rem' }}>
      {!file ? (
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <UploadCloud className="drop-icon" />
          <h3 className="drop-text">Drag & Drop your video clip here</h3>
          <p className="drop-subtext">or click to browse from your device</p>
          <p className="drop-subtext" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Accepts .mp4, .mov (Max ~20MB for best results)</p>
          {fileError && (
            <p style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem', textAlign: 'center', maxWidth: '400px' }}>
              {fileError}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
            <video 
              src={previewUrl} 
              controls 
              className="video-preview"
            />
            <button 
              onClick={clearFile}
              style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--background)', borderRadius: '50%', padding: '2px', color: 'var(--text-primary)' }}
            >
              <XCircle size={28} />
            </button>
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileVideo size={24} color="var(--primary)" />
            <span style={{ fontWeight: 500 }}>{file.name}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>

          <button className="btn-primary" onClick={submitAnalysis}>
            Analyze Motion
          </button>
        </div>
      )}
    </div>
  );
}
