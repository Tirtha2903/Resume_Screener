import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

export default function ResumeDropzone({ files, setFiles }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const addFiles = (incoming) => {
    setError('');
    const valid = ['.pdf', '.docx', '.txt'];
    const toAdd = [];

    for (const file of incoming) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!valid.includes(ext)) {
        setError(`"${file.name}" is not supported. Please upload PDF, DOCX, or TXT files.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 10 MB.`);
        continue;
      }
      if (files.some(f => f.name === file.name)) continue;
      toAdd.push(file);
    }

    if (toAdd.length) setFiles(prev => [...prev, ...toAdd]);
  };

  const onDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
  };
  const onChange = (e) => { if (e.target.files.length) addFiles(Array.from(e.target.files)); };
  const remove = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const fmt = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  return (
    <div className="field-group">
      <label className="field-label">Resume Files</label>

      <div
        className={`dropzone${isDragging ? ' active' : ''}`}
        onDragEnter={onDragEnter}
        onDragOver={onDrag}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={onChange}
        />
        <div className="dropzone-icon">
          <UploadCloud size={20} />
        </div>
        <p className="dropzone-heading">
          <span className="dropzone-link">Browse files</span>&nbsp;or drag and drop
        </p>
        <p className="dropzone-sub">PDF, DOCX, TXT · Max 10 MB each</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, i) => (
            <div key={i} className="file-item animate-in">
              <div className="file-item-name">
                <FileText size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                <span>{file.name}</span>
                <span className="file-item-size">({fmt(file.size)})</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); remove(i); }}
                title="Remove file"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
