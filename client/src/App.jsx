import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';

// Code-split heavy routes for better page speed (Core Web Vitals)
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Auction = lazy(() => import('./pages/Auction'));
const Results = lazy(() => import('./pages/Results'));
const Rules = lazy(() => import('./pages/Rules'));
const About = lazy(() => import('./pages/About'));
const Guide = lazy(() => import('./pages/Guide'));
const CompletedAuctions = lazy(() => import('./pages/CompletedAuctions'));

function PageLoader() {
  return <div className="page-loader"><div className="spinner"></div></div>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/lobby') || location.pathname.startsWith('/auction');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/about" element={<About />} />
          <Route path="/guide" element={<Guide />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/lobby/:id" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/auction/:id" element={<ProtectedRoute><Auction /></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/completed" element={<ProtectedRoute><CompletedAuctions /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
