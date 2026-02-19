import React, { useState, useEffect, useMemo } from 'react';
import { FiUploadCloud, FiFile, FiDownload, FiTrash2, FiSearch, FiFilter, FiFolder, FiImage, FiFileText } from 'react-icons/fi';

import './AccountantDocuments.css';

const AccountantDocuments = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null,
    category: 'invoice',
    description: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { value: 'invoice', label: 'Invoice', colorClass: 'tag-blue', iconClass: 'icon-blue' },
    { value: 'bill', label: 'Bill', colorClass: 'tag-green', iconClass: 'icon-green' },
    { value: 'receipt', label: 'Receipt', colorClass: 'tag-purple', iconClass: 'icon-purple' },
    { value: 'contract', label: 'Contract', colorClass: 'tag-orange', iconClass: 'icon-orange' },
    { value: 'tax', label: 'Tax Document', colorClass: 'tag-red', iconClass: 'icon-red' },
    { value: 'bank', label: 'Bank Statement', colorClass: 'tag-teal', iconClass: 'icon-blue' },
    { value: 'other', label: 'Other', colorClass: 'tag-gray', iconClass: 'icon-gray' }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${base}/api/accountant/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({ ...uploadData, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('category', uploadData.category);
      formData.append('description', uploadData.description);
      formData.append('reference', uploadData.reference);
      formData.append('date', uploadData.date);

      const response = await fetch(`${base}/api/accountant/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        await fetchDocuments();
        setShowUploadModal(false);
        setUploadData({
          file: null,
          category: 'invoice',
          description: '',
          reference: '',
          date: new Date().toISOString().split('T')[0]
        });
        alert('Document uploaded successfully');
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${base}/api/accountant/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${base}/api/accountant/documents/${doc._id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || 'document';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <FiImage style={{ color: '#2563eb' }} />;
    }
    return <FiFileText style={{ color: '#64748b' }} />;
  };

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.description?.toLowerCase().includes(term) ||
        doc.reference?.toLowerCase().includes(term) ||
        doc.fileName?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }

    return filtered.sort((a, b) => new Date(b.uploadedAt || b.createdAt) - new Date(a.uploadedAt || a.createdAt));
  }, [documents, searchTerm, categoryFilter]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <div className="header-content">
          <h1>Document Upload & Archiving</h1>
          <p>Attach bills, invoices, delivery notes, and more</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary"
        >
          <FiUploadCloud />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-content">
            <p>Total Documents</p>
            <p>{documents.length}</p>
          </div>
          <div className="summary-icon icon-blue">
            <FiFile />
          </div>
        </div>
        {categories.slice(0, 3).map(cat => {
          const count = documents.filter(d => d.category === cat.value).length;
          return (
            <div key={cat.value} className="summary-card">
              <div className="summary-content">
                <p>{cat.label}</p>
                <p>{count}</p>
              </div>
              <div className={`summary-icon ${cat.iconClass}`}>
                <FiFolder />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="search-wrapper">
          <label htmlFor="document-search" className="sr-only">Search documents</label>
          <FiSearch className="search-icon" />
          <input
            id="document-search"
            type="text"
            className="search-input"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      <div className="documents-grid">
        {filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <FiFile className="empty-icon" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No documents found</h3>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>Upload your first document to get started</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
              style={{ margin: '0 auto' }}
            >
              Upload Document
            </button>
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const catInfo = categories.find(c => c.value === doc.category);
            return (
              <div key={doc._id} className="document-card">
                <div className="doc-header">
                  <div className="doc-info">
                    <div className="file-icon">
                      {getFileIcon(doc.fileName)}
                    </div>
                    <div className="doc-title">
                      <h3>{doc.description || doc.fileName}</h3>
                      <p className="doc-date">
                        {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="btn-delete"
                    title="Delete document"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className="doc-body">
                  <div className="doc-tags">
                    <span className={`category-tag ${catInfo?.colorClass || 'tag-gray'}`}>
                      {catInfo?.label || doc.category}
                    </span>
                  </div>
                  <div className="doc-meta">
                    {doc.reference && (
                      <p className="ref-text">Ref: {doc.reference}</p>
                    )}
                    <p>Size: {formatFileSize(doc.fileSize)}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn-download"
                  >
                    <FiDownload />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Upload Document</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">File *</label>
                <input
                  type="file"
                  required
                  onChange={handleFileSelect}
                  className="form-input"
                />
                {uploadData.file && (
                  <p className="file-name-display">{uploadData.file.name}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  required
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                  className="form-select"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reference</label>
                <input
                  type="text"
                  value={uploadData.reference}
                  onChange={(e) => setUploadData({ ...uploadData, reference: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={uploadData.date}
                  onChange={(e) => setUploadData({ ...uploadData, date: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary"
                  style={{ opacity: uploading ? 0.7 : 1 }}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDocuments;
