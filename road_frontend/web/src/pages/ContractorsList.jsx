import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { getAllContractors, createContractor, updateContractor, deleteContractor } from '../api/budgets';

const ContractorsList = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newContractor, setNewContractor] = useState({ name: '', licenseNumber: '', email: '', phone: '' });

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      const data = await getAllContractors();
      setContractors(data);
    } catch (error) {
      console.error('Failed to fetch contractors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        name: newContractor.name, 
        licenseNumber: newContractor.licenseNumber,
        email: newContractor.email,
        phone: newContractor.phone
      };
      
      if (editingId) {
        await updateContractor(editingId, payload);
      } else {
        await createContractor(payload);
      }
      
      setShowModal(false);
      setEditingId(null);
      setNewContractor({ name: '', licenseNumber: '', email: '', phone: '' });
      fetchContractors();
    } catch (error) {
      console.error('Failed to save contractor', error);
      alert(error.response?.data?.message?.join?.(', ') || error.response?.data?.message || 'Failed to save contractor');
    }
  };

  const handleEditClick = (contractor) => {
    setNewContractor({ 
      name: contractor.name || '', 
      licenseNumber: contractor.licenseNumber || '', 
      email: contractor.email || '', 
      phone: contractor.phone || '' 
    });
    setEditingId(contractor.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contractor?")) return;
    try {
      await deleteContractor(id);
      fetchContractors();
    } catch (error) {
      console.error('Failed to delete contractor', error);
      alert('Failed to delete contractor');
    }
  };

  if (loading) return <div className="animate-fade-in">Loading contractors...</div>;

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Contractor Management</h1>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setNewContractor({ name: '', licenseNumber: '', email: '', phone: '' });
            setShowModal(true);
          }}>
            <Plus size={20} /> Add Contractor
          </button>
        </div>

        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>License Number</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor.id}>
                  <td>#{contractor.id}</td>
                  <td>{contractor.name}</td>
                  <td>{contractor.licenseNumber}</td>
                  <td>{contractor.email}</td>
                  <td>{contractor.phone}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleEditClick(contractor)} style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.1)' }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(contractor.id)} style={{ padding: '0.4rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contractors.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No contractors found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 'auto', padding: '2rem', position: 'relative' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Contractor' : 'Add New Contractor'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newContractor.name}
                  onChange={(e) => setNewContractor({...newContractor, name: e.target.value})}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">License Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newContractor.licenseNumber}
                  onChange={(e) => setNewContractor({...newContractor, licenseNumber: e.target.value})}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={newContractor.email}
                  onChange={(e) => setNewContractor({...newContractor, email: e.target.value})}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Phone</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newContractor.phone}
                  onChange={(e) => setNewContractor({...newContractor, phone: e.target.value})}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Save Changes' : 'Save Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ContractorsList;
