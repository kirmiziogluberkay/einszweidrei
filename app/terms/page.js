/**
 * app/terms/page.js
 * Terms of Service page.
 */

export const metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="container-app py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-ink mb-2">Terms of Service</h1>
      <p className="text-sm text-ink-tertiary mb-10">Last updated: April 2025</p>

      <div className="space-y-8 text-sm text-ink-secondary leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using EinsZweiDrei, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">2. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            You must not create accounts using false information or impersonate another person.
            We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">3. Listings & Content</h2>
          <p>
            You are solely responsible for the content of your listings. You must not post
            illegal items, stolen goods, counterfeit products, or any content that violates
            applicable laws. We reserve the right to remove any listing without notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">4. Transactions</h2>
          <p>
            EinsZweiDrei is a listing platform only. We are not a party to any transaction
            between buyers and sellers. We are not responsible for the quality, safety, or
            legality of listed items, nor for any disputes between users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">5. Prohibited Conduct</h2>
          <p>
            You may not use the platform to spam other users, scrape data, attempt to gain
            unauthorized access to any part of the service, or engage in any activity that
            disrupts or damages the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">6. Limitation of Liability</h2>
          <p>
            EinsZweiDrei is provided &quot;as is&quot; without warranties of any kind. We shall not be
            liable for any indirect, incidental, or consequential damages arising from your
            use of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">7. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of the platform after changes
            constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  );
}
