import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import FacultyDashboard from './components/FacultyDashboard';
import FacultyDashboardLayout from './components/FacultyDashboardLayout';
import FacultyCohortAnalytics from './components/FacultyCohortAnalytics';
import AdminPortal from './components/AdminPortal';
import Profile from './components/Profile';
import StudentAnalytics from './components/StudentAnalytics';
import ForcePasswordChange from './components/ForcePasswordChange';

function App() {
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [needsPasswordChange, setNeedsPasswordChange] = useState(localStorage.getItem('needs_password_change') === 'true');

  useEffect(() => {
    const handleStorage = () => {
      setRole(localStorage.getItem('role'));
      setNeedsPasswordChange(localStorage.getItem('needs_password_change') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (role && needsPasswordChange) {
    return (
      <Router>
        <div className="bg-background text-text min-h-screen font-sans">
          <Routes>
            <Route path="*" element={<ForcePasswordChange onComplete={() => {
              localStorage.setItem('needs_password_change', 'false');
              setNeedsPasswordChange(false);
            }} />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="bg-background text-text min-h-screen font-sans">
        <Routes>
          <Route path="/login" element={!role ? <Login /> : <Navigate to={role === 'admin' ? '/admin-dashboard' : role === 'faculty' ? '/teacher-dashboard' : '/student-dashboard'} />} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={role === 'admin' ? <AdminPortal /> : <Navigate to="/login" />} />
          
          {/* Student Layout Nested Routes */}
          {role === 'student' && (
            <Route element={<DashboardLayout />}>
              <Route path="/student-dashboard" element={<Dashboard />} />
              <Route path="/student-analytics" element={<StudentAnalytics />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          )}

          {/* Teacher/Faculty Layout Nested Routes */}
          {role === 'faculty' && (
            <Route element={<FacultyDashboardLayout />}>
              <Route path="/teacher-dashboard" element={<FacultyDashboard />} />
              <Route path="/faculty-cohort-analytics" element={<FacultyCohortAnalytics />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          )}

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
