import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { Toaster } from './components/ui/sonner';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import Forum from './pages/Forum';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Community from './pages/Community';
import Courses from './pages/Courses';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/community" element={<Community />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AuthGuard requireCoordinator>
                  <Admin />
                </AuthGuard>
              } 
            />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}
