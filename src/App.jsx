import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import History from './pages/History';
import BottomNav from './components/BottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a spinner

  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide nav on login/signup or if not logged in
  const hideNav = ['/login', '/signup'].includes(location.pathname) || !user;

  return (
    <div className="bg-background text-white font-sans min-h-screen max-w-lg mx-auto relative shadow-2xl border-x border-slate-800">
      <div className={!hideNav ? "pb-16" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/add" element={
            <PrivateRoute>
              <AddExpense />
            </PrivateRoute>
          } />
          <Route path="/stats" element={
            <PrivateRoute>
              <Stats />
            </PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <Router>
          <AppContent />
        </Router>
      </PreferencesProvider>
    </AuthProvider>
  )
}

export default App
