import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import EventPage from './pages/EventPage';
import DonationForm from './pages/DonationForm';
import DonationSuccess from './pages/DonationSuccess';
import CharitiesPage from './pages/CharitiesPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import ManageEvent from './pages/ManageEvent';

// Legal Pages
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import RefundPolicy from './pages/legal/RefundPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/event/:slug" element={<EventPage />} />
            <Route path="/donate/:slug" element={<DonationForm />} />
            <Route path="/donate/:slug/success" element={<DonationSuccess />} />
            <Route path="/charities" element={<CharitiesPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Legal Pages */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refunds" element={<RefundPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/create"
              element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/event/:id"
              element={
                <ProtectedRoute>
                  <ManageEvent />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
