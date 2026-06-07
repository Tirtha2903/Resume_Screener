import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Trash2, AlertCircle } from 'lucide-react';

export default function ResumeDropzone({ files, setFiles }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndAddFiles = (uploadedFiles) => {
    setError('');
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const newFiles = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(ext)) {
        setError(`Unsupported file type: ${file.name}. Only PDF, DOCX, and TXT are supported.`);
        continue;
      }
      
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Max size is 10MB.`);
        continue;
      }

      // Avoid duplicates by name
      if (files.some(f => f.name === file.name)) {
        continue;
      }

      newFiles.push(file);
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerInput = () => {
    fileInputRef.current.click();
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="form-group">
      <label className="form-label">Upload Resumes</label>
      
      <div 
        className={`dropzone-container ${isDragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
      >
        <input 
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden-input"
          style={{ display: 'none' }}
          onChange={handleChange}
          accept=".pdf,.docx,.txt"
        />
        
        <div className="dropzone-icon">
          <UploadCloud size={24} />
        </div>
        
        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
          Drag & Drop files here or <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>browse</span>
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Supports PDF, DOCX, TXT (Max 10MB per file)
        </p>
      </div>

      {error && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--color-danger)', 
          fontSize: '0.8rem',
          marginTop: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="file-list">
          <p className="form-label" style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>
            Selected Files ({files.length})
          </p>
          {files.map((file, index) => (
            <div key={index} className="file-item animate-fade-in">
              <div className="file-info">
                <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                <span className="file-name" title={file.name}>{file.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                  ({formatSize(file.size)})
                </span>
              </div>
              <button 
                type="button" 
                className="btn-remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
