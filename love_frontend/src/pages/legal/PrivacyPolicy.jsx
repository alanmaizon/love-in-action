export default function PrivacyPolicy() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Privacy Policy</h1>
          <p className="text-muted mb-4">Last updated: January 2026</p>

          <div className="card">
            <div className="card-body">
              <section className="mb-4">
                <h2 className="h4">1. Introduction</h2>
                <p>
                  Love That Gives Back ("we", "us", "our") is committed to protecting
                  your privacy. This policy explains how we collect, use, and protect
                  your personal data in compliance with the General Data Protection
                  Regulation (GDPR) and Irish data protection law.
                </p>
                <p>
                  <strong>Data Controller:</strong> Alan Maizon, operating as Love That
                  Gives Back, based in Ireland.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">2. Information We Collect</h2>

                <h3 className="h5 mt-3">For Event Hosts (Account Holders)</h3>
                <ul>
                  <li>Name and email address</li>
                  <li>Password (encrypted)</li>
                  <li>Event details you create (titles, stories, dates)</li>
                  <li>Photos you upload</li>
                </ul>

                <h3 className="h5 mt-3">For Donors</h3>
                <ul>
                  <li>Name (or "Anonymous" if you choose)</li>
                  <li>Email address (for receipts)</li>
                  <li>Donation amount and charity selected</li>
                  <li>Optional message to the hosts</li>
                </ul>

                <h3 className="h5 mt-3">Automatically Collected</h3>
                <ul>
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent</li>
                  <li>Device information</li>
                </ul>

                <p className="alert alert-info">
                  <strong>Note:</strong> We do NOT store payment card details. All payment
                  processing is handled securely by Stripe. See{' '}
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                    Stripe's Privacy Policy
                  </a>.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">3. How We Use Your Information</h2>
                <p>We use your data to:</p>
                <ul>
                  <li>Provide and improve our platform services</li>
                  <li>Process donations and send receipts</li>
                  <li>Allow hosts to see who donated to their event</li>
                  <li>Send important service updates</li>
                  <li>Respond to your enquiries</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">4. Legal Basis for Processing (GDPR)</h2>
                <p>We process your data based on:</p>
                <ul>
                  <li><strong>Contract:</strong> To provide services you've requested (creating events, processing donations)</li>
                  <li><strong>Legitimate Interest:</strong> To improve our platform and prevent fraud</li>
                  <li><strong>Legal Obligation:</strong> To comply with tax and charity regulations</li>
                  <li><strong>Consent:</strong> For optional marketing communications (you can opt out anytime)</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">5. Who We Share Data With</h2>
                <p>We share your data with:</p>
                <ul>
                  <li><strong>Stripe:</strong> Payment processing</li>
                  <li><strong>Charities:</strong> Donation amounts and donor names (unless anonymous)</li>
                  <li><strong>Event Hosts:</strong> Donor names and messages (unless anonymous)</li>
                  <li><strong>Hosting Providers:</strong> Render (cloud infrastructure)</li>
                </ul>
                <p>
                  We do NOT sell your personal data to third parties.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">6. Data Retention</h2>
                <ul>
                  <li><strong>Account data:</strong> Kept while your account is active, deleted within 30 days of account closure</li>
                  <li><strong>Donation records:</strong> Kept for 7 years for tax/legal compliance</li>
                  <li><strong>Event data:</strong> Kept for 1 year after event closes, then anonymised</li>
                  <li><strong>Analytics data:</strong> Anonymised after 26 months</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">7. Your Rights (GDPR)</h2>
                <p>Under GDPR, you have the right to:</p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate data</li>
                  <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                  <li><strong>Restriction:</strong> Limit how we use your data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                  <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
                </ul>
                <p>
                  To exercise these rights, email us at{' '}
                  <a href="mailto:alanmaizon@icloud.com">alanmaizon@icloud.com</a>.
                  We will respond within 30 days.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">8. Data Security</h2>
                <p>We protect your data through:</p>
                <ul>
                  <li>HTTPS encryption for all data transmission</li>
                  <li>Encrypted password storage</li>
                  <li>Regular security updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure cloud hosting with Render</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">9. International Transfers</h2>
                <p>
                  Your data may be processed outside the EEA (e.g., by our hosting
                  providers in the US). Where this happens, we ensure appropriate
                  safeguards are in place, such as Standard Contractual Clauses or
                  adequacy decisions.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">10. Children's Privacy</h2>
                <p>
                  Our platform is not intended for children under 16. We do not
                  knowingly collect data from children. If you believe a child has
                  provided us with personal data, please contact us.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">11. Cookies</h2>
                <p>
                  We use cookies to operate our platform. See our{' '}
                  <a href="/cookies">Cookie Policy</a> for details.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">12. Changes to This Policy</h2>
                <p>
                  We may update this policy from time to time. We'll notify you of
                  significant changes by email or through the platform.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">13. Complaints</h2>
                <p>
                  If you're unhappy with how we handle your data, you can complain to:
                </p>
                <ul className="list-unstyled">
                  <li><strong>Data Protection Commission (Ireland)</strong></li>
                  <li>Website: <a href="https://www.dataprotection.ie" target="_blank" rel="noopener noreferrer">www.dataprotection.ie</a></li>
                  <li>Phone: +353 (0)1 765 0100</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">14. Contact Us</h2>
                <ul className="list-unstyled">
                  <li><strong>Email:</strong> alanmaizon@icloud.com</li>
                  <li><strong>Data Controller:</strong> Alan Maizon</li>
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
