/**
 * app/privacy/page.js
 * Privacy Policy page.
 */

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="container-app py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-ink mb-2">Privacy Policy</h1>
      <p className="text-sm text-ink-tertiary mb-10">Last updated: April 2025</p>

      <div className="space-y-8 text-sm text-ink-secondary leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">1. Information We Collect</h2>
          <p>
            When you register, we collect your email address, username, and optionally a phone
            number. When you post a listing, we store the content you provide including title,
            description, price, images, and address. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">2. How We Use Your Information</h2>
          <p>
            Your information is used solely to operate the platform — to display your listings,
            allow other users to contact you, and to keep your account secure. We may send
            transactional emails (e.g. password reset) but no marketing emails without your consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">3. Data Storage</h2>
          <p>
            All data is stored securely via Supabase (hosted on AWS). Images are stored in
            Supabase Storage. Authentication tokens are stored in your browser&apos;s local storage
            and cookies and are never shared with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">4. Cookies</h2>
          <p>
            We use session cookies for authentication only. We do not use advertising or
            tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">5. Your Rights</h2>
          <p>
            You may request deletion of your account and all associated data at any time by
            contacting us. You can edit or delete your own listings from your profile page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">6. Contact</h2>
          <p>
            For any privacy-related questions, please reach out via the feedback form on the
            homepage.
          </p>
        </section>
      </div>
    </div>
  );
}
