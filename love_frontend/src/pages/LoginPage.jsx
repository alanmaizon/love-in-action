import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocialProviders, getSocialLoginUrl } from '../services/api';

// Google icon SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="me-2">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialProviders, setSocialProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const { login, refreshUser, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || '/dashboard';

  // Check for social login callback
  useEffect(() => {
    const socialLogin = searchParams.get('social_login');
    if (socialLogin === 'success') {
      // Social login succeeded, refresh user data and redirect
      refreshUser().then(() => {
        navigate(from, { replace: true });
      });
    } else if (socialLogin === 'failed') {
      setError('Social login failed. Please try again or use email/password.');
    }
  }, [searchParams, navigate, from, refreshUser]);

  // Fetch available social providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await getSocialProviders();
        setSocialProviders(response.data.providers || []);
      } catch (err) {
        console.error('Failed to fetch social providers:', err);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  // Redirect authenticated users to dashboard (after all hooks)
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = getSocialLoginUrl('google');
  };

  const hasGoogle = socialProviders.some(p => p.provider === 'google');

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Login</h2>

              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              {/* Google Sign-In Button */}
              {!loadingProviders && hasGoogle && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center"
                    onClick={handleGoogleLogin}
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <div className="d-flex align-items-center mb-3">
                    <hr className="flex-grow-1" />
                    <span className="px-3 text-muted small">or</span>
                    <hr className="flex-grow-1" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className="text-center text-muted mt-4 mb-0">
                <small>
                  Don't have an account? Contact us to get started.
                </small>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
