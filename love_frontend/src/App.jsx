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
