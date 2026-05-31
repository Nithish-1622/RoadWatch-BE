import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { getAllComplaints, createComplaint, updateComplaint, deleteComplaint, updateComplaintStatus } from '../api/complaints';
import { getAllRoads, suggestRoad } from '../api/roads';

const ComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newComplaint, setNewComplaint] = useState({ description: '', roadName: '', latitude: '', longitude: '', status: 'SUBMITTED', imageBase64: '' });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const [complaintsData, roadsData] = await Promise.all([
        getAllComplaints(),
        getAllRoads().catch(() => [])
      ]);
      setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
      setRoads(Array.isArray(roadsData) ? roadsData : []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewComplaint(prev => ({ ...prev, imageBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalRoadId = null;
      const existingRoad = roads.find(r => r.name.toLowerCase() === newComplaint.roadName.toLowerCase());
      
      if (existingRoad) {
        finalRoadId = existingRoad.id;
      } else {
        const newRoad = await suggestRoad({ 
          name: newComplaint.roadName, 
          lat: Number(newComplaint.latitude), 
          lng: Number(newComplaint.longitude) 
        });
        finalRoadId = newRoad.id;
      }

      const payload = { 
        description: newComplaint.description, 
        roadId: finalRoadId,
        imageBase64: newComplaint.imageBase64
      };
      
      if (!editingId) {
        payload.latitude = Number(newComplaint.latitude) || 0;
        payload.longitude = Number(newComplaint.longitude) || 0;
      }
      
      if (editingId) {
        await updateComplaint(editingId, payload);
        if (newComplaint.status) {
          await updateComplaintStatus(editingId, { status: newComplaint.status, remarks: 'Status updated from admin panel' });
        }
      } else {
        await createComplaint(payload);
      }
      
      setShowModal(false);
      setEditingId(null);
      setNewComplaint({ description: '', roadName: '', latitude: '', longitude: '', status: 'SUBMITTED', imageBase64: '' });
      fetchComplaints();
    } catch (error) {
      console.error('Failed to save complaint', error);
      alert(error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save complaint');
    }
  };

  const handleEditClick = (complaint) => {
    const road = roads.find(r => r.id === complaint.roadId);
    setNewComplaint({ 
      description: complaint.description || '', 
      roadName: road ? road.name : String(complaint.roadId || ''), 
      latitude: complaint.location?.coordinates?.[1] || complaint.latitude || '', 
      longitude: complaint.location?.coordinates?.[0] || complaint.longitude || '',
      status: complaint.status || 'SUBMITTED',
      imageBase64: complaint.imageUrl || ''
    });
    setEditingId(complaint.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await deleteComplaint(id);
        fetchComplaints();
      } catch (error) {
        console.error('Failed to delete complaint', error);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateComplaintStatus(id, { status: newStatus, remarks: 'Status updated from admin panel' });
      fetchComplaints();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    }
  };


  const handleLogComplaintClick = () => {
    setEditingId(null);
    setNewComplaint({ description: '', roadName: '', latitude: '', longitude: '', status: 'SUBMITTED', imageBase64: '' });
    setShowModal(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewComplaint(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  if (loading) return <div className="animate-fade-in">Loading complaints...</div>;

  return (
    <>
      <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Complaint Management</h1>
        <button className="btn btn-danger" onClick={handleLogComplaintClick}>
          <Plus size={20} /> Log Complaint
        </button>
      </div>

      <div className="glass-panel data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Road ID</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No complaints found.</td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td>#{complaint.id}</td>
                  <td>Road #{complaint.roadId}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} className="logo-icon" style={{ color: 'var(--danger-color)' }} />
                        {complaint.description}
                      </div>
                      {complaint.imageUrl && (
                        <a href={complaint.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={complaint.imageUrl} alt="Complaint" style={{ maxHeight: '100px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      complaint.status === 'RESOLVED' ? 'badge-success' : 
                      complaint.status === 'VERIFYING' ? 'badge-warning' : 
                      'badge-secondary'
                    }`} style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                      {complaint.status === 'VERIFYING' ? 'REVIEWED' : 
                       complaint.status === 'RESOLVED' ? 'COMPLETED' : 
                       complaint.status || 'SUBMITTED'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleEditClick(complaint)} style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.1)' }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(complaint.id)} style={{ padding: '0.4rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 'auto', padding: '2rem', position: 'relative' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Complaint' : 'Log New Complaint'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea 
                  className="input-field" 
                  value={newComplaint.description} 
                  onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })} 
                  required 
                  rows={3}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Target Road Name</label>
                <input 
                  list="roads-list"
                  className="input-field" 
                  value={newComplaint.roadName} 
                  onChange={(e) => setNewComplaint({ ...newComplaint, roadName: e.target.value })} 
                  required
                  placeholder="Select or enter new road name..."
                />
                <datalist id="roads-list">
                  {roads.map(road => (
                    <option key={road.id} value={road.name} />
                  ))}
                </datalist>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="input-label">Detected Latitude</label>
                  <input type="text" className="input-field" value={newComplaint.latitude || (editingId ? 'N/A' : 'Detecting...')} disabled style={{ background: 'var(--bg-color)', cursor: 'not-allowed', opacity: 0.7 }} />
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="input-label">Detected Longitude</label>
                  <input type="text" className="input-field" value={newComplaint.longitude || (editingId ? 'N/A' : 'Detecting...')} disabled style={{ background: 'var(--bg-color)', cursor: 'not-allowed', opacity: 0.7 }} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Complaint Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="input-field" 
                  onChange={handleImageChange} 
                />
                {newComplaint.imageBase64 && (
                  <div style={{ marginTop: '1rem' }}>
                    <img src={newComplaint.imageBase64} alt="Preview" style={{ maxHeight: '150px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} />
                  </div>
                )}
              </div>

              {editingId && (
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select 
                    className="input-field" 
                    value={newComplaint.status}
                    onChange={(e) => setNewComplaint({ ...newComplaint, status: e.target.value })}
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="VERIFYING">Reviewed</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="RESOLVED">Completed</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Submit Complaint'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ComplaintsList;
