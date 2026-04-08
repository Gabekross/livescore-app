// app/privacy/page.tsx
// Privacy Policy — static legal page. CCPA + general US privacy compliance.

import type { Metadata } from 'next'
import styles from '@/styles/components/LegalPage.module.scss'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'KoluSports Privacy Policy — how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.effectiveDate}>Effective Date: April 7, 2026</p>

        <div className={styles.body}>
          <p>
            KoluSports (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy
            explains how we collect, use, disclose, and protect your personal information when
            you use the KoluSports website and platform (the &quot;Service&quot;).
          </p>
          <p>
            By using the Service, you agree to the practices described in this Privacy Policy.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>a. Information You Provide</h3>
          <ul>
            <li>
              <strong>Account information:</strong> name, email address, and password when you
              create an account.
            </li>
            <li>
              <strong>Organization data:</strong> organization name, site settings, branding
              preferences, and contact information you configure in the admin dashboard.
            </li>
            <li>
              <strong>Content:</strong> match data, team rosters, player information, news
              articles, images, and other content you upload or create.
            </li>
            <li>
              <strong>Billing information:</strong> payment details are collected and processed
              directly by Stripe. We do not store your full credit card number.
            </li>
            <li>
              <strong>Communications:</strong> messages you send to us via email or support channels.
            </li>
          </ul>

          <h3>b. Information Collected Automatically</h3>
          <ul>
            <li>
              <strong>Usage data:</strong> pages visited, features used, timestamps, referring
              URLs, and interaction patterns, collected through Google Analytics.
            </li>
            <li>
              <strong>Device information:</strong> browser type, operating system, screen
              resolution, and device identifiers.
            </li>
            <li>
              <strong>IP address:</strong> used for security, fraud prevention, and approximate
              geographic location.
            </li>
            <li>
              <strong>Cookies and similar technologies:</strong> see our{' '}
              <a href="/cookies">Cookie Policy</a> for full details.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service.</li>
            <li>Process payments and manage subscriptions.</li>
            <li>Send transactional emails (account confirmations, billing receipts, password resets).</li>
            <li>Respond to your support requests and communications.</li>
            <li>Analyze usage patterns to improve the platform experience.</li>
            <li>Detect, prevent, and address security issues and fraud.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information. We do <strong>not</strong> use
            your information for third-party advertising.
          </p>

          <h2>3. How We Share Your Information</h2>
          <p>We share your information only in the following circumstances:</p>
          <ul>
            <li>
              <strong>Service providers:</strong> We share data with third-party providers that
              help us operate the Service, including:
              <ul>
                <li><strong>Stripe</strong> — payment processing</li>
                <li><strong>Google Analytics</strong> — usage analytics</li>
                <li><strong>Supabase</strong> — database hosting and authentication</li>
                <li><strong>Vercel</strong> — application hosting</li>
              </ul>
              These providers process data on our behalf and are contractually obligated to
              protect it.
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose information if required by law,
              regulation, legal process, or governmental request.
            </li>
            <li>
              <strong>Business transfers:</strong> If KoluSports is involved in a merger,
              acquisition, or asset sale, your information may be transferred as part of that
              transaction.
            </li>
            <li>
              <strong>With your consent:</strong> We may share information with your explicit
              permission.
            </li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as
            needed to provide the Service. If you delete your account, we will delete or
            anonymize your personal information within 90 days, except where we are required
            to retain it for legal, tax, or compliance purposes.
          </p>
          <p>
            Content you created (match data, articles, etc.) associated with an organization
            may be retained if other administrators remain on the organization.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information,
            including encryption in transit (TLS/SSL), encrypted storage, access controls, and
            regular security reviews. However, no method of transmission or storage is 100%
            secure, and we cannot guarantee absolute security.
          </p>

          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have the following rights regarding your
            personal information:
          </p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data.</li>
            <li><strong>Portability:</strong> Request a machine-readable copy of your data.</li>
            <li><strong>Objection:</strong> Object to certain processing of your data.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:support@kolusports.com">support@kolusports.com</a>. We will respond
            within 45 days.
          </p>

          <h3>California Residents (CCPA)</h3>
          <p>
            If you are a California resident, you have the right to:
          </p>
          <ul>
            <li>Know what personal information we collect and how it is used.</li>
            <li>Request deletion of your personal information.</li>
            <li>Opt out of the sale of personal information (we do not sell personal information).</li>
            <li>Not be discriminated against for exercising your privacy rights.</li>
          </ul>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to children under 16. We do not knowingly collect
            personal information from anyone under 16. If we learn that we have collected
            information from a child under 16, we will delete it promptly. If you believe a
            child under 16 has provided us with personal information, please contact us at{' '}
            <a href="mailto:support@kolusports.com">support@kolusports.com</a>.
          </p>

          <h2>8. International Users</h2>
          <p>
            The Service is hosted in the United States. If you access the Service from outside
            the United States, you understand that your information will be transferred to,
            stored in, and processed in the United States. By using the Service, you consent to
            this transfer.
          </p>

          <h2>9. Third-Party Links</h2>
          <p>
            The Service may contain links to third-party websites or services. We are not
            responsible for the privacy practices of those third parties. We encourage you to
            read the privacy policies of any third-party sites you visit.
          </p>

          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes,
            we will notify you by email or by posting a notice on the Service at least 30 days
            before the changes take effect. Your continued use of the Service after the
            effective date constitutes acceptance of the updated policy.
          </p>

          <h2>11. Contact</h2>
          <div className={styles.contactBox}>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your privacy
              rights, contact us at:{' '}
              <a href="mailto:support@kolusports.com">support@kolusports.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
