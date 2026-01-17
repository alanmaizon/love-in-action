import { Link } from 'react-router-dom';
import { FaHeart, FaGift, FaHandHoldingHeart, FaUsers } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Celebrate Life's Moments with Purpose
              </h1>
              <p className="lead mb-4">
                Transform your special occasions into opportunities for giving.
                Create a celebration page and invite guests to donate to charities you care about.
              </p>
              <div className="d-flex gap-3">
                <Link to="/login" className="btn btn-light btn-lg">
                  Create Your Page
                </Link>
                <Link to="/charities" className="btn btn-outline-light btn-lg">
                  View Charities
                </Link>
              </div>
            </div>
            <div className="col-lg-6 text-center mt-5 mt-lg-0">
              <FaHandHoldingHeart size={200} className="opacity-75" />
            </div>
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">Perfect for Every Celebration</h2>
          <div className="row g-4">
            {[
              { icon: FaHeart, title: 'Weddings', desc: 'Invite guests to give to causes you love instead of traditional gifts' },
              { icon: FaGift, title: 'Christenings', desc: 'Welcome new life with gifts that keep on giving' },
              { icon: FaUsers, title: 'Birthdays', desc: 'Celebrate milestones by making a difference' },
              { icon: FaHandHoldingHeart, title: 'Memorials', desc: "Honor loved ones through their legacy causes" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm text-center p-4">
                  <Icon size={48} className="text-primary mb-3 mx-auto" />
                  <h5>{title}</h5>
                  <p className="text-muted small mb-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="text-center mb-5">How It Works</h2>
          <div className="row g-4">
            {[
              { step: 1, title: 'Create Your Page', desc: 'Sign up and create a celebration page for your event' },
              { step: 2, title: 'Choose Charities', desc: 'Select from our curated list of verified Irish charities' },
              { step: 3, title: 'Share with Guests', desc: 'Send your unique link to friends and family' },
              { step: 4, title: 'Celebrate Giving', desc: 'Watch donations come in and share the impact' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="col-md-6 col-lg-3">
                <div className="text-center">
                  <div
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 60, height: 60, fontSize: '1.5rem' }}
                  >
                    {step}
                  </div>
                  <h5>{title}</h5>
                  <p className="text-muted small">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5">
        <div className="container text-center">
          <h2 className="mb-4">Ready to Make Your Celebration Meaningful?</h2>
          <Link to="/login" className="btn btn-primary btn-lg">
            Get Started Free
          </Link>
        </div>
      </section>
    </>
  );
}
