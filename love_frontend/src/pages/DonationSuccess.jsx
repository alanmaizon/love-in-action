import { useParams, useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaHeart } from 'react-icons/fa';

export default function DonationSuccess() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 text-center">
          <FaCheckCircle size={80} className="text-success mb-4" />

          <h1 className="mb-3">Thank You!</h1>

          <p className="lead text-muted mb-4">
            Your donation has been received. You're making a real difference.
          </p>

          <div className="card bg-light mb-4">
            <div className="card-body">
              <FaHeart className="text-primary mb-2" size={24} />
              <p className="mb-0">
                The hosts will be notified of your generous contribution.
              </p>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-center">
            <Link to={`/event/${slug}`} className="btn btn-primary">
              Return to Event Page
            </Link>
            <Link to="/" className="btn btn-outline-secondary">
              Go Home
            </Link>
          </div>

          {sessionId && (
            <p className="text-muted small mt-4">
              Reference: {sessionId.substring(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
