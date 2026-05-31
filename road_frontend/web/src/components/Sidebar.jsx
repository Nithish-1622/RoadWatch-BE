import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Wallet, 
  AlertTriangle, 
  FileText, 
  Search, 
  Cpu, 
  Bell,
  LogOut,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Sidebar = () => {
  const { logoutUser, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/roads', label: 'Roads', icon: <MapIcon size={20} />, roles: ['GOVERNMENT'] },
    { path: '/budgets', label: 'Budgets', icon: <Wallet size={20} /> },
    { path: '/contractors', label: 'Contractors', icon: <Users size={20} />, roles: ['GOVERNMENT'] },
    { path: '/complaints', label: 'Complaints', icon: <AlertTriangle size={20} /> },
    { path: '/documents', label: 'Documents', icon: <FileText size={20} /> },
    { path: '/search', label: 'Search', icon: <Search size={20} />, roles: ['GOVERNMENT'] },
    { path: '/ai', label: 'AI Predictor', icon: <Cpu size={20} />, roles: ['GOVERNMENT'] },
    { path: '/notifications', label: 'Notifications', icon: <Bell size={20} /> },
  ].filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="sidebar">
      <div className="logo-container">
        <MapIcon className="logo-icon" size={32} />
        <h2 className="text-gradient">RoadWatch</h2>
      </div>
      
      <div className="nav-menu" style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      
      <div className="nav-menu">
        <button className="nav-item" onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginBottom: '0.5rem' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        <button className="nav-item" onClick={logoutUser} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
