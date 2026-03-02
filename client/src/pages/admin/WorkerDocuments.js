import React, { useState } from 'react';
import { uploadDocument, addSelfWorkerDocument } from '../../services/adminService';
import './WorkerDocuments.css';

const WorkerDocuments = () => {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onUpload = async () => {
    setError(''); setMessage('');
    try {
      if (!file) throw new Error('Select a file');
      const res = await uploadDocument(file);
      setUrl(res?.file?.path || '');
      setMessage('Uploaded successfully. Now save to worker profile.');
    } catch (e) { setError(e?.response?.data?.message || e?.message || 'Upload failed'); }
  };

  const onSave = async () => {
    setError(''); setMessage('');
    try {
      if (!url) throw new Error('Upload file first');
      await addSelfWorkerDocument({ label, url });
      setMessage('Document saved to worker profile successfully');
      setFile(null); setLabel(''); setUrl('');
    } catch (e) { setError(e?.response?.data?.message || e?.message || 'Save failed'); }
  };

  return (
    <div className="worker-documents-container">
      <div className="worker-documents-header">
        <h1 className="worker-documents-title">Worker Documents</h1>
        <p className="worker-documents-subtitle">Document management</p>
      </div>

      <div className="upload-card">
        <div className="upload-section">
          <h3 className="upload-section-title">Upload Document</h3>
          
          <div className="form-group">
            <label className="form-label">Select File</label>
            <input 
              type="file" 
              className="file-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
            {file && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                Selected: {file.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Label (Optional)</label>
            <input 
              type="text"
              className="text-input"
              placeholder="e.g., ID Card, Certificate, Contract" 
              value={label} 
              onChange={(e) => setLabel(e.target.value)} 
            />
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={onUpload}>
              Upload File
            </button>
            <button className="btn btn-secondary" onClick={onSave} disabled={!url}>
              Save to Profile
            </button>
          </div>
        </div>

        {url && (
          <>
            <div className="divider"></div>
            <div className="url-display">
              <div className="url-label">Uploaded File URL:</div>
              <code className="url-code">{url}</code>
            </div>
          </>
        )}

        {message && (
          <div className="message-box message-success">
            <span className="message-icon">✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="message-box message-error">
            <span className="message-icon">✕</span>
            {error}
          </div>
        )}
      </div>

      <div className="info-box">
        <div className="info-title">How to use:</div>
        <ul className="info-list">
          <li>Select a document file from your computer</li>
          <li>Add an optional label to identify the document</li>
          <li>Click "Upload File" to upload the document to the server</li>
          <li>Once uploaded, click "Save to Profile" to attach it to the worker profile</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkerDocuments;
