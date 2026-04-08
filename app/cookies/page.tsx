// app/cookies/page.tsx
// Cookie Policy — static legal page.

import type { Metadata } from 'next'
import styles from '@/styles/components/LegalPage.module.scss'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'KoluSports Cookie Policy — what cookies we use and why.',
}

export default function CookiesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Cookie Policy</h1>
        <p className={styles.effectiveDate}>Effective Date: April 7, 2026</p>

        <div className={styles.body}>
          <p>
            This Cookie Policy explains how KoluSports (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies
            and similar technologies when you visit or use the KoluSports website and platform
            (the &quot;Service&quot;).
          </p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device by a website you visit. They are
            widely used to make websites work efficiently, remember your preferences, and provide
            information to site owners.
          </p>

          <h2>2. Types of Cookies We Use</h2>

          <h3>a. Strictly Necessary Cookies</h3>
          <p>
            These cookies are essential for the Service to function. They enable core features
            like authentication, session management, and security. You cannot opt out of these
            cookies.
          </p>
          <ul>
            <li>
              <strong>Authentication cookies</strong> — managed by Supabase Auth to keep you
              signed in and verify your session.
            </li>
            <li>
              <strong>Security cookies</strong> — used to prevent cross-site request forgery
              (CSRF) and other security threats.
            </li>
          </ul>

          <h3>b. Analytics Cookies</h3>
          <p>
            We use Google Analytics to understand how visitors interact with the Service. These
            cookies collect information about pages visited, time spent on pages, and
            navigation patterns. This data is aggregated and anonymized.
          </p>
          <ul>
            <li><strong>_ga</strong> — distinguishes unique users. Expires after 2 years.</li>
            <li><strong>_ga_*</strong> — maintains session state. Expires after 2 years.</li>
          </ul>
          <p>
            Google Analytics data is processed by Google LLC. For more information, see{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google&apos;s Privacy Policy
            </a>.
          </p>

          <h3>c. Functional Cookies</h3>
          <p>
            These cookies remember choices you make (such as your preferred theme or language)
            to provide a more personalized experience. They do not track browsing activity
            across other websites.
          </p>
          <ul>
            <li>
              <strong>Theme preference</strong> — remembers the active display theme selected
              by the organization administrator.
            </li>
          </ul>

          <h3>d. Payment Cookies</h3>
          <p>
            When you make a payment, Stripe may set cookies to process the transaction securely
            and prevent fraud. These cookies are managed directly by Stripe. For details, see{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              Stripe&apos;s Privacy Policy
            </a>.
          </p>

          <h2>3. How to Manage Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul>
            <li>Block all cookies or specific types of cookies.</li>
            <li>Delete cookies that have already been set.</li>
            <li>Set your browser to notify you when a cookie is being set.</li>
          </ul>
          <p>
            Please note that blocking or deleting cookies may affect the functionality of the
            Service. Strictly necessary cookies cannot be disabled without breaking core
            features like authentication.
          </p>
          <p>
            To opt out of Google Analytics specifically, you can install the{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Analytics Opt-out Browser Add-on
            </a>.
          </p>

          <h2>4. Do Not Track</h2>
          <p>
            Some browsers send a &quot;Do Not Track&quot; (DNT) signal. There is currently no industry
            standard for how websites should respond to DNT signals. At this time, the Service
            does not respond to DNT signals.
          </p>

          <h2>5. Changes to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our
            practices or for operational, legal, or regulatory reasons. We will post the updated
            policy on this page with a new effective date.
          </p>

          <h2>6. Contact</h2>
          <div className={styles.contactBox}>
            <p>
              If you have questions about our use of cookies, contact us at:{' '}
              <a href="mailto:support@kolusports.com">support@kolusports.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
