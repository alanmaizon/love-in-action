export default function RefundPolicy() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Refund Policy</h1>
          <p className="text-muted mb-4">Last updated: January 2026</p>

          <div className="card">
            <div className="card-body">
              <section className="mb-4">
                <h2 className="h4">Overview</h2>
                <p>
                  Love That Gives Back facilitates donations to registered Irish
                  charities. Because donations are charitable gifts, our refund
                  policy differs from typical retail purchases.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Pending Donations</h2>
                <div className="alert alert-success">
                  <strong>Can be cancelled:</strong> If your donation is still in
                  "pending" status (payment not yet completed), you can cancel it
                  by closing the payment page or contacting us.
                </div>
                <p>
                  Pending donations occur when you start the checkout process but
                  don't complete payment. These automatically expire after 30 minutes.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Completed Donations</h2>
                <div className="alert alert-warning">
                  <strong>Generally non-refundable:</strong> Once a donation is
                  successfully processed, it is considered a charitable gift and
                  is generally non-refundable.
                </div>
                <p>
                  This is because:
                </p>
                <ul>
                  <li>Donations are aggregated and transferred to charities monthly</li>
                  <li>Once transferred, we cannot reclaim funds from charities</li>
                  <li>Charitable donations are intended to be permanent gifts</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">Exceptions</h2>
                <p>We may consider refunds in the following situations:</p>

                <h3 className="h5 mt-3">Before Transfer to Charity</h3>
                <p>
                  If your donation has not yet been transferred to the charity
                  (typically within the same calendar month), we may be able to
                  process a refund for:
                </p>
                <ul>
                  <li>Duplicate donations (accidental double payment)</li>
                  <li>Incorrect amounts (significantly more than intended)</li>
                  <li>Technical errors on our platform</li>
                  <li>Fraudulent use of your payment method</li>
                </ul>

                <h3 className="h5 mt-3">After Transfer to Charity</h3>
                <p>
                  Once donations are transferred, refunds are only possible if:
                </p>
                <ul>
                  <li>There was fraud or unauthorised use of your payment method</li>
                  <li>The charity agrees to return the funds</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">How to Request a Refund</h2>
                <p>To request a refund, please:</p>
                <ol>
                  <li>Email us at <a href="mailto:alanmaizon@icloud.com">alanmaizon@icloud.com</a></li>
                  <li>Include your donation receipt or email</li>
                  <li>Explain the reason for your request</li>
                  <li>Provide any supporting information</li>
                </ol>
                <p>
                  We aim to respond within 5 business days.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Refund Processing</h2>
                <p>If a refund is approved:</p>
                <ul>
                  <li>Refunds are returned to the original payment method</li>
                  <li>Processing takes 5-10 business days</li>
                  <li>Stripe processing fees may not be refundable</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4">Platform Tips</h2>
                <p>
                  If you added an optional tip to support Love That Gives Back,
                  this follows the same refund policy as donations. Tips are
                  generally non-refundable once processed.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Chargebacks</h2>
                <p>
                  If you dispute a charge with your bank (chargeback), please
                  contact us first. Chargebacks incur fees and may result in
                  account restrictions. We're happy to resolve issues directly.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Event Cancellations</h2>
                <p>
                  If an event is cancelled by the host:
                </p>
                <ul>
                  <li>Donations already transferred cannot be refunded through us</li>
                  <li>Pending donations may be refundable if not yet transferred</li>
                  <li>Contact the event host directly for their preferences</li>
                </ul>
                <p>
                  Note: Donations still go to the selected charities even if an
                  event is cancelled. The donation remains a valid charitable gift.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4">Contact Us</h2>
                <p>
                  For refund requests or questions:
                </p>
                <ul className="list-unstyled">
                  <li><strong>Email:</strong> alanmaizon@icloud.com</li>
                  <li><strong>Response time:</strong> Within 5 business days</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
