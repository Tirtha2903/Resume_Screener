import React, { useState, useRef } from 'react';
import { Upload, Camera, Download, LayoutTemplate, X, CheckCircle, PenTool } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ResumeBuilder = ({ onBack }) => {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const fileInputRef = useRef(null);
  const printRef = useRef(null);

  const handleParseText = async () => {
    if (!rawText.trim()) return;
    
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('raw_text', rawText);
      
      const res = await fetch('http://localhost:8000/api/build-resume', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        setParsedData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    
    const opt = {
      margin: 0,
      filename: `${parsedData?.name || 'Resume'}_generated.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Create a temporary clone for printing to remove dark mode and scale issues
    const clone = printRef.current.cloneNode(true);
    clone.style.width = '816px'; // 8.5in
    clone.style.height = '1056px'; // 11in
    clone.style.backgroundColor = 'white';
    clone.style.color = 'black';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);
    
    html2pdf().set(opt).from(clone).save().then(() => {
      document.body.removeChild(clone);
    });
  };

  if (parsedData) {
    return (
      <div className="builder-layout animate-in">
        <div className="builder-sidebar card">
          <div className="card-header-bar" style={{ marginBottom: 20 }}>
            <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LayoutTemplate size={16} /> Resume Settings
            </p>
            <button onClick={() => setParsedData(null)} className="btn-ghost" style={{ padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="section-label">Profile Photo</label>
            <div className="photo-upload-area" onClick={() => fileInputRef.current?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="photo-preview" />
              ) : (
                <div className="photo-placeholder">
                  <Camera size={24} />
                  <span>Upload Photo</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="section-label">Template Style</label>
            <div className="template-grid">
              {['modern', 'classic', 'minimal'].map(t => (
                <button
                  key={t}
                  className={`template-btn ${selectedTemplate === t ? 'active' : ''}`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  {selectedTemplate === t && <CheckCircle size={14} className="template-check" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={handleDownloadPDF}>
            <Download size={16} /> Download PDF
          </button>
        </div>

        <div className="builder-preview">
          <div className="preview-container" ref={printRef}>
            <ResumeTemplate data={parsedData} photo={photoPreview} template={selectedTemplate} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-in" style={{ maxWidth: 800, margin: '40px auto' }}>
      <div className="card-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }}>
            ← Back
          </button>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PenTool size={16} /> Resume Builder
          </p>
        </div>
      </div>
      
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Paste the improved resume text generated by ChatGPT or Claude here. We will instantly organize it and generate a beautiful, ATS-friendly resume for you.
        </p>

        <textarea
          className="resume-input"
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="Paste full resume text here..."
          style={{ height: 350, marginBottom: 20, width: '100%' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleParseText}
            disabled={!rawText.trim() || isParsing}
          >
            {isParsing ? 'Generating...' : 'Generate Resume Templates'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component for rendering the actual resume templates
const ResumeTemplate = ({ data, photo, template }) => {
  // Styles for the print-view container
  const baseStyle = {
    fontFamily: 'Inter, sans-serif',
    color: '#000', // Always black for print
    lineHeight: 1.5,
    padding: '40px',
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff'
  };

  const getTemplateStyles = () => {
    switch (template) {
      case 'modern':
        return {
          header: { display: 'flex', alignItems: 'center', borderBottom: '2px solid #5b6af0', paddingBottom: '20px', marginBottom: '20px' },
          name: { fontSize: '32px', fontWeight: 800, color: '#1a1a1a', margin: 0 },
          title: { fontSize: '18px', color: '#5b6af0', margin: '4px 0 0 0', fontWeight: 600 },
          contact: { fontSize: '12px', color: '#666', marginTop: '10px', display: 'flex', gap: '15px', flexWrap: 'wrap' },
          sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#5b6af0', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '12px' },
          photo: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #5b6af0', marginRight: '24px' }
        };
      case 'classic':
        return {
          header: { textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '15px', marginBottom: '20px' },
          name: { fontSize: '36px', fontWeight: 400, fontFamily: 'serif', margin: 0 },
          title: { fontSize: '16px', fontStyle: 'italic', margin: '5px 0' },
          contact: { fontSize: '12px', color: '#333', display: 'flex', justifyContent: 'center', gap: '15px' },
          sectionTitle: { fontSize: '18px', fontWeight: 'bold', fontFamily: 'serif', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '10px', marginTop: '20px' },
          photo: { width: '90px', height: '100px', objectFit: 'cover', position: 'absolute', top: '40px', right: '40px' }
        };
      case 'minimal':
        return {
          header: { marginBottom: '30px' },
          name: { fontSize: '28px', fontWeight: 300, letterSpacing: '2px', margin: 0 },
          title: { fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#888', margin: '10px 0' },
          contact: { fontSize: '11px', color: '#999', display: 'flex', gap: '20px' },
          sectionTitle: { fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#111', marginTop: '25px', marginBottom: '15px' },
          photo: { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', float: 'right', marginLeft: '20px' }
        };
      default: return {};
    }
  };

  const s = getTemplateStyles();

  return (
    <div style={baseStyle} className="resume-document">
      <div style={s.header}>
        {photo && template !== 'minimal' && <img src={photo} alt="Profile" style={s.photo} />}
        {photo && template === 'minimal' && <img src={photo} alt="Profile" style={s.photo} />}
        
        <div style={{ flex: 1 }}>
          <h1 style={s.name}>{data.name}</h1>
          {data.title && <h2 style={s.title}>{data.title}</h2>}
          <div style={s.contact}>
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>{data.phone}</span>}
            {data.location && <span>{data.location}</span>}
            {data.linkedin && <span>{data.linkedin.replace('linkedin.com/in/', 'in/')}</span>}
            {data.github && <span>{data.github.replace('github.com/', 'git/')}</span>}
            {data.website && <span>{data.website.replace('https://', '').replace('http://', '')}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: template === 'modern' ? '1fr 2fr' : '1fr', gap: '30px' }}>
        
        {/* Left Column (Modern) or Top (Classic/Minimal) */}
        <div>
          {data.summary && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={s.sectionTitle}>Profile</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.skills && data.skills.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={s.sectionTitle}>Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {data.skills.map((skill, i) => (
                  <span key={i} style={{ 
                    fontSize: '12px', 
                    padding: template === 'modern' ? '3px 8px' : '0', 
                    backgroundColor: template === 'modern' ? '#f0f2ff' : 'transparent',
                    color: template === 'modern' ? '#5b6af0' : '#333',
                    borderRadius: '4px',
                    marginRight: template === 'modern' ? '0' : '10px'
                  }}>
                    {template !== 'modern' && '• '} {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={s.sectionTitle}>Education</h3>
              {data.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '14px', color: '#111' }}>{ed.school}</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>{ed.dates}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#444' }}>{ed.degree}</div>
                  {ed.gpa && <div style={{ fontSize: '12px', color: '#666' }}>GPA: {ed.gpa}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (Modern) or Bottom (Classic/Minimal) */}
        <div>
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={s.sectionTitle}>Experience</h3>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '14px', color: '#111' }}>{exp.title}</strong>
                    <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>{exp.dates}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#5b6af0', fontWeight: 500, marginBottom: '6px' }}>
                    {exp.company} {exp.location && `| ${exp.location}`}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#333' }}>
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: '4px' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {data.projects && data.projects.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={s.sectionTitle}>Projects</h3>
              {data.projects.map((proj, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px', color: '#111' }}>{proj.name}</strong>
                  {proj.tech && <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Tech: {proj.tech}</div>}
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#333' }}>
                    {proj.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: '2px' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ResumeBuilder;
