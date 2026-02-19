export default function CookiePolicy() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Cookie Policy</h1>
          <p className="text-muted mb-4">Last updated: January 2026</p>

          <div className="card">
            <div className="card-body">
              <section className="mb-4">
                <h2 className="h4">What Are Cookies?</h2>
                <p>
                  Cookies are small text files stored on your device when you visit
                  a website. They help websites remember your preferences and
                  understand how you use the site.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">How We Use Cookies</h2>
                <p>
                  Love In Action uses cookies to provide essential functionality
                  and improve your experience. We keep cookie usage to a minimum.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Cookies We Use</h2>

                <h3 className="h5 mt-4">Essential Cookies (Required)</h3>
                <p>
                  These cookies are necessary for the website to function. You cannot
                  opt out of these cookies.
                </p>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Cookie Name</th>
                        <th>Purpose</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>sessionid</code></td>
                        <td>Keeps you logged in to your account</td>
                        <td>7 days</td>
                      </tr>
                      <tr>
                        <td><code>csrftoken</code></td>
                        <td>Protects against cross-site request forgery attacks</td>
                        <td>1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="h5 mt-4">Third-Party Cookies</h3>

                <h4 className="h6 mt-3">Stripe (Payment Processing)</h4>
                <p>
                  When you make a donation, Stripe sets cookies to process your
                  payment securely and prevent fraud.
                </p>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Cookie Name</th>
                        <th>Purpose</th>
                        <th>Provider</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>__stripe_mid</code></td>
                        <td>Fraud prevention and detection</td>
                        <td>Stripe</td>
                      </tr>
                      <tr>
                        <td><code>__stripe_sid</code></td>
                        <td>Payment session management</td>
                        <td>Stripe</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="small text-muted">
                  For more information, see{' '}
                  <a href="https://stripe.com/cookies-policy" target="_blank" rel="noopener noreferrer">
                    Stripe's Cookie Policy
                  </a>.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Cookies We Don't Use</h2>
                <p>
                  We currently do <strong>not</strong> use:
                </p>
                <ul>
                  <li><strong>Advertising cookies:</strong> We don't run ads or track you for advertising</li>
                  <li><strong>Social media cookies:</strong> We don't embed social media trackers</li>
                  <li><strong>Analytics cookies:</strong> We don't use Google Analytics or similar services</li>
                </ul>
                <p>
                  If we decide to add analytics in the future, we will update this
                  policy and ask for your consent.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Managing Cookies</h2>
                <p>
                  You can control cookies through your browser settings:
                </p>
                <ul>
                  <li>
                    <strong>Chrome:</strong> Settings → Privacy and security → Cookies
                  </li>
                  <li>
                    <strong>Firefox:</strong> Settings → Privacy & Security → Cookies
                  </li>
                  <li>
                    <strong>Safari:</strong> Preferences → Privacy → Cookies
                  </li>
                  <li>
                    <strong>Edge:</strong> Settings → Cookies and site permissions
                  </li>
                </ul>
                <p className="alert alert-warning">
                  <strong>Note:</strong> Blocking essential cookies will prevent you
                  from logging in and using some features of our platform.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Local Storage</h2>
                <p>
                  In addition to cookies, we may use browser local storage to:
                </p>
                <ul>
                  <li>Remember your preferences (like dark mode, if available)</li>
                  <li>Store draft event content temporarily</li>
                </ul>
                <p>
                  Local storage data stays on your device and is not sent to our servers.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Updates to This Policy</h2>
                <p>
                  We may update this cookie policy if we change how we use cookies.
                  Check this page periodically for updates.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Contact Us</h2>
                <p>
                  If you have questions about our use of cookies:
                </p>
                <ul className="list-unstyled">
                  <li><strong>Email:</strong> alanmaizon@icloud.com</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
