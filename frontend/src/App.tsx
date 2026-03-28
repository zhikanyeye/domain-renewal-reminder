import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Verify } from './pages/Verify';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fullscreen-loader ink-wash-bg">
        <div className="ink-pattern"></div>
        <div className="fullscreen-loader__panel animate-slideUp">
          <div className="fullscreen-loader__spinner"></div>
          <div className="fullscreen-loader__label">正在同步控制台状态...</div>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fullscreen-loader ink-wash-bg">
        <div className="ink-pattern"></div>
        <div className="fullscreen-loader__panel animate-slideUp">
          <div className="fullscreen-loader__spinner"></div>
          <div className="fullscreen-loader__label">正在同步首页状态...</div>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : <Home />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
