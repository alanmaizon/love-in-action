export default function TermsOfService() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Terms of Service</h1>
          <p className="text-muted mb-4">Last updated: January 2026</p>

          <div className="card">
            <div className="card-body">
              <section className="mb-4">
                <h2 className="h4">1. About Love That Gives Back</h2>
                <p>
                  Love That Gives Back is a donation platform operated by Alan Maizon,
                  a sole trader based in Ireland. We provide a service that allows event
                  hosts to create celebration pages where guests can donate to curated
                  charities instead of giving traditional gifts.
                </p>
                <p className="alert alert-info">
                  <strong>Important:</strong> Love That Gives Back is a platform that
                  facilitates donations to registered charities. We are NOT a charity
                  ourselves. Donations made through our platform go directly to the
                  charities you select.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">2. How It Works</h2>
                <ul>
                  <li>Event hosts create celebration pages (weddings, christenings, birthdays, memorials)</li>
                  <li>Hosts select from our curated list of verified Irish charities</li>
                  <li>Guests visit the event page and make donations to their chosen charity</li>
                  <li>Payments are processed securely through Stripe</li>
                  <li>Donations are aggregated and transferred to charities on a monthly basis</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">3. User Accounts</h2>
                <p>
                  To create events, you must register for an account. You agree to:
                </p>
                <ul>
                  <li>Provide accurate and complete information</li>
                  <li>Keep your login credentials secure</li>
                  <li>Notify us immediately of any unauthorised access</li>
                  <li>Be responsible for all activity under your account</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">4. Donations</h2>
                <p>
                  When you make a donation through our platform:
                </p>
                <ul>
                  <li>Your donation goes to the charity you select</li>
                  <li>Donations are processed in Euros (EUR)</li>
                  <li>A small processing fee may apply (Stripe fees)</li>
                  <li>Optional tips to support the platform may be offered</li>
                  <li>Donations are typically transferred to charities monthly</li>
                </ul>
                <p>
                  Please see our <a href="/refunds">Refund Policy</a> for information
                  about cancellations and refunds.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">5. Event Host Responsibilities</h2>
                <p>As an event host, you agree to:</p>
                <ul>
                  <li>Create events only for legitimate personal celebrations</li>
                  <li>Not use the platform for fraudulent purposes</li>
                  <li>Not impersonate others or create misleading events</li>
                  <li>Respect the privacy of your guests</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">6. Charities</h2>
                <p>
                  All charities on our platform are verified Irish registered charities
                  with valid CHY (Charity) numbers. We carefully select charities but
                  do not control their operations. We are not responsible for how
                  charities use the donations they receive.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">7. Prohibited Uses</h2>
                <p>You may not use our platform to:</p>
                <ul>
                  <li>Violate any laws or regulations</li>
                  <li>Commit fraud or money laundering</li>
                  <li>Harass, abuse, or harm others</li>
                  <li>Distribute malware or spam</li>
                  <li>Interfere with the platform's operation</li>
                  <li>Scrape or collect user data without permission</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">8. Intellectual Property</h2>
                <p>
                  The Love That Gives Back name, logo, and website design are our
                  property. Content you upload (photos, text) remains yours, but you
                  grant us a licence to display it on the platform for your event.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">9. Limitation of Liability</h2>
                <p>
                  We provide the platform "as is" and make no warranties about its
                  availability or reliability. To the maximum extent permitted by
                  Irish law, we are not liable for:
                </p>
                <ul>
                  <li>Indirect or consequential damages</li>
                  <li>Loss of data or profits</li>
                  <li>Service interruptions</li>
                  <li>Actions of charities or other users</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">10. Changes to Terms</h2>
                <p>
                  We may update these terms from time to time. We'll notify registered
                  users of significant changes by email. Continued use of the platform
                  after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">11. Governing Law</h2>
                <p>
                  These terms are governed by the laws of Ireland. Any disputes will
                  be resolved in the courts of Ireland.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">12. Contact Us</h2>
                <p>
                  If you have questions about these terms, please contact us:
                </p>
                <ul className="list-unstyled">
                  <li><strong>Email:</strong> alanmaizon@icloud.com</li>
                  <li><strong>Operator:</strong> Alan Maizon</li>
                  <li><strong>Location:</strong> Ireland</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
