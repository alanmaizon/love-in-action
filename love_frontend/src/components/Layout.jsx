import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          Love In Action
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/charities">Charities</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <button className="nav-link btn btn-link" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-3 mb-md-0">
            <h5 className="fw-bold">Love In Action</h5>
            <p className="small text-light mb-0">
              Celebrating life's moments through charitable giving.
            </p>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <h6>Quick Links</h6>
            <ul className="list-unstyled small ">
              <li><Link to="/charities" className="text-light text-decoration-none">Our Charities</Link></li>
              <li><Link to="/login" className="text-light text-decoration-none">Host an Event</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6>Legal</h6>
            <ul className="list-unstyled small">
              <li><Link to="/terms" className="text-light text-decoration-none">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-light text-decoration-none">Privacy Policy</Link></li>
              <li><Link to="/refunds" className="text-light text-decoration-none">Refund Policy</Link></li>
              <li><Link to="/cookies" className="text-light text-decoration-none">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <hr className="my-3 border-secondary" />
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <small className="text-light">
              &copy; {new Date().getFullYear()} Love In Action. All rights reserved.
            </small>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <small className="text-light">
              Contact: <a href="mailto:alanmaizon@icloud.com" className="text-light">alanmaizon@icloud.com</a>
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
