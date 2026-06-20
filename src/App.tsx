import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import ReviewerQueue from './pages/reviewer/Queue';
import SampleDetail from './pages/reviewer/SampleDetail';
import Disputes from './pages/supervisor/Disputes';
import FinalDecision from './pages/supervisor/FinalDecision';
import Export from './pages/supervisor/Export';

const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: 'reviewer' | 'supervisor';
}) => {
  const { currentUser } = useAuthStore();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && currentUser.role !== requiredRole) {
    if (currentUser.role === 'reviewer') {
      return <Navigate to="/reviewer/queue" replace />;
    } else {
      return <Navigate to="/supervisor/disputes" replace />;
    }
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/reviewer/queue" 
          element={
            <ProtectedRoute requiredRole="reviewer">
              <ReviewerQueue />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reviewer/sample/:id" 
          element={
            <ProtectedRoute requiredRole="reviewer">
              <SampleDetail />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/supervisor/disputes" 
          element={
            <ProtectedRoute requiredRole="supervisor">
              <Disputes />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/supervisor/final/:id" 
          element={
            <ProtectedRoute requiredRole="supervisor">
              <FinalDecision />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/supervisor/export" 
          element={
            <ProtectedRoute requiredRole="supervisor">
              <Export />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
