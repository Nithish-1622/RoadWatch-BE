import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoadsList from './pages/RoadsList';
import BudgetsList from './pages/BudgetsList';
import ComplaintsList from './pages/ComplaintsList';
import ContractorsList from './pages/ContractorsList';
import DocumentsList from './pages/DocumentsList';
import Search from './pages/Search';
import AIPredictor from './pages/AIPredictor';
import Notifications from './pages/Notifications';

const PrivateRoute = ({ children, requiredRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requiredRoles && !requiredRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/roads" element={<PrivateRoute requiredRoles={['GOVERNMENT']}><RoadsList /></PrivateRoute>} />
      <Route path="/budgets" element={<PrivateRoute><BudgetsList /></PrivateRoute>} />
      <Route path="/contractors" element={<PrivateRoute requiredRoles={['GOVERNMENT']}><ContractorsList /></PrivateRoute>} />
      <Route path="/complaints" element={<PrivateRoute><ComplaintsList /></PrivateRoute>} />
      <Route path="/documents" element={<PrivateRoute><DocumentsList /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute requiredRoles={['GOVERNMENT']}><Search /></PrivateRoute>} />
      <Route path="/ai" element={<PrivateRoute requiredRoles={['GOVERNMENT']}><AIPredictor /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
