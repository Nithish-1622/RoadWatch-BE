import React, { useState, useEffect, useContext } from 'react';
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getAllBudgets, createBudget, deleteBudget } from '../api/budgets';

const BudgetsList = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBudget, setNewBudget] = useState({ sanctionedAmount: '', roadId: '', contractorId: '', tenderReference: '', sanctionDate: '' });
  const { user } = useContext(AuthContext);
  const isCitizen = user?.role === 'CITIZEN';

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const data = await getAllBudgets();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch budgets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        sanctionedAmount: Number(newBudget.sanctionedAmount), 
        roadId: Number(newBudget.roadId),
        contractorId: Number(newBudget.contractorId),
        tenderReference: newBudget.tenderReference,
        sanctionDate: new Date(newBudget.sanctionDate).toISOString()
      };
      
      let response;
      if (editingId) {
        response = await updateBudget(editingId, payload);
      } else {
        response = await createBudget(payload);
      }
      
      // If the backend returns null, it usually means the Contractor ID doesn't exist
      if (response === null || response === '') {
        alert("Failed to save budget. Please check if the Contractor ID exists.");
        return;
      }
      
      setShowModal(false);
      setEditingId(null);
      setNewBudget({ sanctionedAmount: '', roadId: '', contractorId: '', tenderReference: '', sanctionDate: '' });
      fetchBudgets();
    } catch (error) {
      console.error('Failed to save budget', error);
      alert(error.response?.data?.message?.join(', ') || error.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleEditClick = (budget) => {
    const formattedDate = budget.sanctionDate ? new Date(budget.sanctionDate).toISOString().split('T')[0] : '';
    setNewBudget({ 
      sanctionedAmount: budget.sanctionedAmount || '', 
      roadId: budget.roadId || '', 
      contractorId: budget.contractor?.id || budget.contractorId || '', 
      tenderReference: budget.tenderReference || '', 
      sanctionDate: formattedDate 
    });
    setEditingId(budget.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget allocation?')) {
      try {
        await deleteBudget(id);
        fetchBudgets();
      } catch (error) {
        console.error('Failed to delete budget', error);
      }
    }
  };

  if (loading) return <div className="animate-fade-in">Loading budgets...</div>;

  return (
    <>
      <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Budget Management</h1>
        {!isCitizen && (
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setNewBudget({ sanctionedAmount: '', roadId: '', contractorId: '', tenderReference: '', sanctionDate: '' });
            setShowModal(true);
          }}>
            <Plus size={20} /> Allocate Budget
          </button>
        )}
      </div>

      <div className="glass-panel data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Road ID</th>
              <th>Amount ($)</th>
              <th>Status</th>
              {!isCitizen && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr>
                <td colSpan={isCitizen ? "4" : "5"} style={{ textAlign: 'center', padding: '2rem' }}>No budgets found.</td>
              </tr>
            ) : (
              budgets.map((budget) => (
                <tr key={budget.id}>
                  <td>#{budget.id}</td>
                  <td>Road #{budget.roadId}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)' }}>
                      <Wallet size={16} />
                      {budget.sanctionedAmount?.toLocaleString() || 0}
                    </div>
                  </td>
                  <td><span className="badge badge-success">Approved</span></td>
                  {!isCitizen && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => handleEditClick(budget)} style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.1)' }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(budget.id)} style={{ padding: '0.4rem' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 'auto', padding: '2rem', position: 'relative' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Budget' : 'Allocate New Budget'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Sanctioned Amount ($)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newBudget.sanctionedAmount} 
                  onChange={(e) => setNewBudget({ ...newBudget, sanctionedAmount: e.target.value })} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Target Road ID</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newBudget.roadId} 
                  onChange={(e) => setNewBudget({ ...newBudget, roadId: e.target.value })} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Contractor ID</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newBudget.contractorId} 
                  onChange={(e) => setNewBudget({ ...newBudget, contractorId: e.target.value })} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Tender Reference</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newBudget.tenderReference} 
                  onChange={(e) => setNewBudget({ ...newBudget, tenderReference: e.target.value })} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Sanction Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newBudget.sanctionDate} 
                  onChange={(e) => setNewBudget({ ...newBudget, sanctionDate: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Save Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetsList;
