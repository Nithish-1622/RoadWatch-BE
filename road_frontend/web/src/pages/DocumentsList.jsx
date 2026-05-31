import React, { useState, useEffect, useContext } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getAllDocuments, uploadDocument, updateDocument, deleteDocument } from '../api/documents';

const DocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newDocument, setNewDocument] = useState({ title: '', content: '' });
  const { user } = useContext(AuthContext);
  const isCitizen = user?.role === 'CITIZEN';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await getAllDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newDocument.title,
        fileBase64: newDocument.fileBase64
      };
      if (editingId) {
        await updateDocument(editingId, payload);
      } else {
        await uploadDocument(payload);
      }
      setShowModal(false);
      setEditingId(null);
      setNewDocument({ title: '', fileBase64: '' });
      fetchDocuments();
    } catch (error) {
      console.error('Failed to save document', error);
      alert(error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save document');
    }
  };

  const handleEditClick = (doc) => {
    setNewDocument({ 
      title: doc.title || '', 
      fileBase64: '' // We don't load the existing file into base64 for edit 
    });
    setEditingId(doc.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
        fetchDocuments();
      } catch (error) {
        console.error('Failed to delete document', error);
      }
    }
  };

  const handleViewDocument = async (url) => {
    try {
      // Create a temporary "Loading" window so popup blockers don't block the async window.open
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write('Loading document, please wait...');
      }
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Ensure the blob is treated as a PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      if (newWindow) {
        newWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to open document inline, opening direct link', error);
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="animate-fade-in">Loading documents...</div>;

  return (
    <>
      <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Document Repository</h1>
        {!isCitizen && (
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setNewDocument({ title: '', content: '' });
            setShowModal(true);
          }}>
            <Plus size={20} /> Upload Document
          </button>
        )}
      </div>

      <div className="glass-panel data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Document Link</th>
              <th>Date Added</th>
              {!isCitizen && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={isCitizen ? "4" : "5"} style={{ textAlign: 'center', padding: '2rem' }}>No documents found.</td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td>#{doc.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      <FileText size={16} className="logo-icon" />
                      {doc.title}
                    </div>
                  </td>
                  <td>
                    {doc.fileUrl ? (
                      <button onClick={() => handleViewDocument(doc.fileUrl)} className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none', cursor: 'pointer' }}>
                        View Document
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>No file</span>
                    )}
                  </td>
                  <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                  {!isCitizen && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => handleEditClick(doc)} style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.1)' }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(doc.id)} style={{ padding: '0.4rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Document' : 'Upload Document'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Document Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newDocument.title} 
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Document File (PDF)</label>
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="input-field" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewDocument({ ...newDocument, fileBase64: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  required={!editingId}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentsList;
