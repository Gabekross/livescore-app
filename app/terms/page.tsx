// app/terms/page.tsx
// Terms of Service — static legal page.

import type { Metadata } from 'next'
import styles from '@/styles/components/LegalPage.module.scss'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'KoluSports Terms of Service — the rules that govern use of our platform.',
}

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.effectiveDate}>Effective Date: April 7, 2026</p>

        <div className={styles.body}>
          <p>
            Welcome to KoluSports. These Terms of Service (&quot;Terms&quot;) govern your access to and
            use of the KoluSports website, platform, and services (collectively, the &quot;Service&quot;).
            By creating an account or using the Service, you agree to be bound by these Terms.
          </p>
          <p>
            If you do not agree to these Terms, do not use the Service.
          </p>

          <h2>1. Who We Are</h2>
          <p>
            KoluSports (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates a multi-organization sports platform
            that allows sports organizers to create and manage league and tournament websites
            with live scores, fixtures, standings, team pages, and news. Our Service is hosted
            in the United States.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 16 years old to create an account or use the Service. By using
            the Service, you represent that you meet this age requirement. If you are under 18,
            you confirm that a parent or legal guardian has reviewed and agreed to these Terms
            on your behalf.
          </p>

          <h2>3. Accounts</h2>
          <p>
            To access certain features, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete registration information.</li>
            <li>Keep your login credentials confidential.</li>
            <li>Notify us immediately of any unauthorized use of your account.</li>
          </ul>
          <p>
            You are responsible for all activity that occurs under your account. We reserve the
            right to suspend or terminate accounts that violate these Terms.
          </p>

          <h2>4. Subscriptions and Billing</h2>
          <p>
            KoluSports offers a free trial and paid subscription plans (&quot;Pro&quot;). By subscribing
            to a paid plan, you agree to the following:
          </p>
          <ul>
            <li>
              <strong>Payment.</strong> Payments are processed by Stripe. You agree to Stripe&apos;s
              terms of service as they apply to payment processing.
            </li>
            <li>
              <strong>Recurring billing.</strong> Subscriptions automatically renew at the end of
              each billing cycle (weekly, monthly, or yearly) unless you cancel before the renewal date.
            </li>
            <li>
              <strong>Cancellation.</strong> You may cancel your subscription at any time from your
              account settings. Cancellation takes effect at the end of the current billing period.
              No partial refunds are issued for unused time.
            </li>
            <li>
              <strong>Price changes.</strong> We may change subscription prices with at least 30 days&apos;
              notice. Continued use after a price change constitutes acceptance.
            </li>
          </ul>

          <h2>5. Your Content</h2>
          <p>
            You retain ownership of all content you upload, create, or manage through the Service
            (&quot;Your Content&quot;), including team data, match data, news articles, images, and
            organization settings.
          </p>
          <p>
            By uploading Your Content, you grant KoluSports a non-exclusive, worldwide,
            royalty-free license to host, display, and distribute Your Content solely for the
            purpose of operating the Service.
          </p>
          <p>
            You are solely responsible for ensuring that Your Content does not violate any
            applicable law or the rights of any third party.
          </p>

          <h2>6. Acceptable Use</h2>
          <p>
            You agree to use the Service only for lawful purposes and in accordance with our{' '}
            <a href="/acceptable-use">Acceptable Use Policy</a>. You must not:
          </p>
          <ul>
            <li>Use the Service for any illegal or unauthorized purpose.</li>
            <li>Upload harmful, offensive, or infringing content.</li>
            <li>Attempt to disrupt, overload, or compromise the Service or its infrastructure.</li>
            <li>Scrape, data-mine, or reverse-engineer any part of the Service.</li>
            <li>Impersonate another person or organization.</li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service — including its design, code, branding, and documentation — is owned by
            KoluSports and protected by intellectual property laws. You may not copy, modify,
            distribute, or create derivative works from any part of the Service without our
            prior written consent.
          </p>

          <h2>8. Third-Party Services</h2>
          <p>
            The Service integrates with third-party providers, including Stripe (payments) and
            Google Analytics (usage analytics). Your use of these services is subject to their
            respective terms and privacy policies. KoluSports is not responsible for the
            practices or policies of any third-party service.
          </p>

          <h2>9. Availability and Modifications</h2>
          <p>
            We strive to keep the Service available at all times but do not guarantee
            uninterrupted access. We may modify, suspend, or discontinue any part of the
            Service at any time, with or without notice. We are not liable for any modification,
            suspension, or discontinuation.
          </p>

          <h2>10. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
            whether express or implied, including but not limited to warranties of
            merchantability, fitness for a particular purpose, and non-infringement.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, KoluSports shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of
            profits, data, or goodwill, arising out of or related to your use of the Service.
            Our total liability for any claim shall not exceed the amount you paid us in the
            12 months preceding the claim.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless KoluSports and its officers,
            employees, and agents from any claims, damages, losses, or expenses (including
            reasonable attorney&apos;s fees) arising from your use of the Service, your violation of
            these Terms, or your violation of any rights of a third party.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United States,
            without regard to its conflict of law provisions. Any disputes arising under these
            Terms shall be resolved in the state or federal courts located in Delaware.
          </p>

          <h2>14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will
            notify you by email or by posting a notice on the Service at least 30 days before
            the changes take effect. Your continued use of the Service after the effective date
            constitutes acceptance of the updated Terms.
          </p>

          <h2>15. Termination</h2>
          <p>
            We may terminate or suspend your account at any time if you violate these Terms.
            Upon termination, your right to use the Service ceases immediately. Sections that
            by their nature should survive termination (including intellectual property,
            disclaimers, limitations of liability, and indemnification) will survive.
          </p>

          <h2>16. Contact</h2>
          <div className={styles.contactBox}>
            <p>
              If you have questions about these Terms, contact us at:{' '}
              <a href="mailto:support@kolusports.com">support@kolusports.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
