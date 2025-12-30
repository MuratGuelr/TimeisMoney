import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import BottomNav from './components/BottomNav';

const ProtectedRoute = ({ children, requireProfile = false }) => {
  const { currentUser, loading, userProfile } = useAuth();

  if (loading) {
      // Minimal Loading State
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requireProfile && (!userProfile || !userProfile.profileComplete)) {
    return <Navigate to="/onboarding" />;
  }

  return children;
};

const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

const AppRoutes = () => {
    const location = useLocation();
    const showNav = ['/dashboard', '/calendar', '/analysis', '/profile'].includes(location.pathname);

    return (
        <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-white">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                    <Route path="/onboarding" element={<ProtectedRoute><PageWrapper><Onboarding /></PageWrapper></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute requireProfile={true}><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute requireProfile={true}><PageWrapper><CalendarView /></PageWrapper></ProtectedRoute>} />
                    <Route path="/analysis" element={<ProtectedRoute requireProfile={true}><PageWrapper><Analytics /></PageWrapper></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute requireProfile={true}><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </AnimatePresence>
            {showNav && <BottomNav />}
        </div>
    );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <FinanceProvider>
            <AppRoutes />
        </FinanceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
