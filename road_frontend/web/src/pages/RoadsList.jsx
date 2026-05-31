import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { getAllRoads, createRoad, updateRoad, deleteRoad } from '../api/roads';

const RoadsList = () => {
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newRoad, setNewRoad] = useState({ name: '', category: 'NH', coordinates: '', authorityName: '' });

  useEffect(() => {
    fetchRoads();
  }, []);

  const fetchRoads = async () => {
    try {
      const data = await getAllRoads();
      setRoads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch roads', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        name: newRoad.name, 
        category: newRoad.category, 
        coordinates: newRoad.coordinates || [{ lat: 11.0168, lng: 76.9558 }], 
        authorityName: newRoad.authorityName || 'City Admin'
      };
      
      if (editingId) {
        await updateRoad(editingId, payload);
      } else {
        await createRoad(payload);
      }
      
      setShowModal(false);
      setEditingId(null);
      setNewRoad({ name: '', category: 'NH', coordinates: '', authorityName: '' });
      fetchRoads();
    } catch (error) {
      console.error('Failed to save road', error);
      alert(error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save road');
    }
  };

  const handleEditClick = (road) => {
    setNewRoad({ 
      name: road.name, 
      category: road.category, 
      coordinates: road.coordinates, 
      authorityName: road.authorityName 
    });
    setEditingId(road.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this road?')) {
      try {
        await deleteRoad(id);
        fetchRoads();
      } catch (error) {
        console.error('Failed to delete road', error);
      }
    }
  };

  if (loading) return <div className="animate-fade-in">Loading roads...</div>;

  return (
    <>
      <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Road Management</h1>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null);
          setNewRoad({ name: '', category: 'NH', coordinates: '', authorityName: '' });
          setShowModal(true);
        }}>
          <Plus size={20} /> Add New Road
        </button>
      </div>

      <div className="glass-panel data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Road Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roads.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No roads found.</td>
              </tr>
            ) : (
              roads.map((road) => (
                <tr key={road.id}>
                  <td>#{road.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} className="logo-icon" />
                      {road.name}
                    </div>
                  </td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleEditClick(road)} style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.1)' }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(road.id)} style={{ padding: '0.4rem' }}>
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
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Road' : 'Add New Road'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Road Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newRoad.name} 
                  onChange={(e) => setNewRoad({ ...newRoad, name: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Create Road'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default RoadsList;
