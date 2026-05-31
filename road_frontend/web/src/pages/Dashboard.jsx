import React, { useEffect, useState } from 'react';
import { Map, Wallet, AlertTriangle } from 'lucide-react';
import { getAllRoads } from '../api/roads';
import { getAllBudgets } from '../api/budgets';
import { getAllComplaints } from '../api/complaints';

const Dashboard = () => {
  const [stats, setStats] = useState({ roads: 0, budget: 0, complaints: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentRoads, setRecentRoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [roads, budgets, complaints] = await Promise.all([
          getAllRoads().catch(() => []),
          getAllBudgets().catch(() => []),
          getAllComplaints().catch(() => [])
        ]);
        
        const totalBudget = Array.isArray(budgets) ? budgets.reduce((acc, curr) => acc + (Number(curr.sanctionedAmount) || 0), 0) : 0;
        
        if (isMounted) {
          setStats({
            roads: Array.isArray(roads) ? roads.length : 0,
            budget: totalBudget,
            complaints: Array.isArray(complaints) ? complaints.length : 0
          });
          setRecentComplaints(Array.isArray(complaints) ? complaints.slice(-5).reverse() : []);
          setRecentRoads(Array.isArray(roads) ? roads.slice(-5).reverse() : []);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <div className="animate-fade-in">Loading dashboard...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
      
      <div className="dashboard-stats">
        <div className="glass-panel card stat-card">
          <div className="stat-icon">
            <Map size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.roads}</span>
            <span className="stat-label">Total Roads Monitored</span>
          </div>
        </div>
        
        <div className="glass-panel card stat-card">
          <div className="stat-icon" style={{ color: 'var(--success-color)', background: 'rgba(34, 197, 94, 0.1)' }}>
            <Wallet size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">${stats.budget.toLocaleString()}</span>
            <span className="stat-label">Total Allocated Budget</span>
          </div>
        </div>
        
        <div className="glass-panel card stat-card">
          <div className="stat-icon" style={{ color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.complaints}</span>
            <span className="stat-label">Active Complaints</span>
          </div>
        </div>
      </div>
      
      <div className="grid-cards">
        <div className="glass-panel card">
          <h3 className="card-title">Recent Complaints</h3>
          <p className="card-subtitle">Latest issues reported</p>
          {recentComplaints.length > 0 ? (
            <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentComplaints.map((complaint, index) => (
                <li key={index} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{complaint.description || complaint.title || `Complaint #${complaint.id || index}`}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status: {complaint.status || 'Pending'}</div>
                  </div>
                  <span className={`badge ${complaint.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>
                    {complaint.severity || 'Normal'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No recent complaints.
            </div>
          )}
        </div>
        
        <div className="glass-panel card">
          <h3 className="card-title">Recent Roads</h3>
          <p className="card-subtitle">Latest monitored roads</p>
          {recentRoads.length > 0 ? (
            <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentRoads.map((road, index) => (
                <li key={index} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{road.name || `Road #${road.id || index}`}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Location: {road.location || road.type || 'Unknown'}</div>
                  </div>
                  <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                    {road.length ? `${road.length} km` : 'Active'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No roads monitored yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
