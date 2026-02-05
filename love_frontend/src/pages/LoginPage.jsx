import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendConfirmationCode } from '../services/cognito';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'confirm'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, confirmSignup, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect authenticated users to dashboard
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'UserNotConfirmedException') {
        setMode('confirm');
        setMessage('Please verify your email first. Check your inbox for a code.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, firstName, lastName);
      setMode('confirm');
      setMessage('Account created! Check your email for a verification code.');
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignup(email, verificationCode);
      setMessage('Email verified! You can now log in.');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendConfirmationCode(email);
      setMessage('Verification code resent. Check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">
                {mode === 'login' && 'Login'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'confirm' && 'Verify Email'}
              </h2>

              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-info">{message}</div>}

              {/* Login Form */}
              {mode === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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

                  <p className="text-center text-muted mt-3 mb-0">
                    <small>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                      >
                        Sign up
                      </button>
                    </small>
                  </p>
                </form>
              )}

              {/* Signup Form */}
              {mode === 'signup' && (
                <form onSubmit={handleSignup}>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <div className="form-text">
                      Min 8 characters, with uppercase, lowercase, number, and symbol.
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>

                  <p className="text-center text-muted mt-3 mb-0">
                    <small>
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                      >
                        Login
                      </button>
                    </small>
                  </p>
                </form>
              )}

              {/* Verification Form */}
              {mode === 'confirm' && (
                <form onSubmit={handleConfirm}>
                  <p className="text-muted mb-3">
                    Enter the 6-digit code sent to <strong>{email}</strong>
                  </p>

                  <div className="mb-4">
                    <label className="form-label">Verification Code</label>
                    <input
                      type="text"
                      className="form-control text-center"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-2"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-link btn-sm w-100"
                    onClick={handleResendCode}
                  >
                    Resend code
                  </button>

                  <p className="text-center text-muted mt-3 mb-0">
                    <small>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                      >
                        Back to login
                      </button>
                    </small>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
