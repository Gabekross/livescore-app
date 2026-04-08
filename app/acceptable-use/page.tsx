// app/acceptable-use/page.tsx
// Acceptable Use Policy — static legal page.

import type { Metadata } from 'next'
import styles from '@/styles/components/LegalPage.module.scss'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description: 'KoluSports Acceptable Use Policy — what you can and cannot do on our platform.',
}

export default function AcceptableUsePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Acceptable Use Policy</h1>
        <p className={styles.effectiveDate}>Effective Date: April 7, 2026</p>

        <div className={styles.body}>
          <p>
            This Acceptable Use Policy (&quot;AUP&quot;) describes the rules that apply to all users
            and organizations using the KoluSports platform (the &quot;Service&quot;). This AUP is part
            of our <a href="/terms">Terms of Service</a>.
          </p>
          <p>
            By using the Service, you agree to comply with this AUP. Violations may result in
            content removal, account suspension, or termination.
          </p>

          <h2>1. Lawful Use</h2>
          <p>
            You must use the Service only for lawful purposes and in compliance with all
            applicable local, state, national, and international laws and regulations.
          </p>

          <h2>2. Prohibited Content</h2>
          <p>You must not upload, publish, or distribute content that:</p>
          <ul>
            <li>Is illegal, defamatory, obscene, or sexually explicit.</li>
            <li>Promotes violence, hatred, or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or any other protected characteristic.</li>
            <li>Infringes on intellectual property rights (copyright, trademark, etc.) of any third party.</li>
            <li>Contains personally identifiable information of others without their consent.</li>
            <li>Is fraudulent, deceptive, or misleading.</li>
            <li>Contains malware, viruses, or other harmful code.</li>
          </ul>

          <h2>3. Prohibited Activities</h2>
          <p>You must not:</p>
          <ul>
            <li>Use the Service to send spam, unsolicited messages, or bulk communications.</li>
            <li>Attempt to gain unauthorized access to the Service, other accounts, or connected systems.</li>
            <li>Scrape, crawl, or use automated tools to extract data from the Service without prior written consent.</li>
            <li>Interfere with or disrupt the Service, its servers, or connected networks.</li>
            <li>Circumvent or attempt to circumvent any security measures, rate limits, or access controls.</li>
            <li>Impersonate any person, organization, or entity.</li>
            <li>Use the Service to facilitate match-fixing, gambling, or any form of sports corruption.</li>
            <li>Resell, sublicense, or provide the Service to third parties as a competing product without our authorization.</li>
          </ul>

          <h2>4. Organization Responsibilities</h2>
          <p>
            If you create and manage an organization on KoluSports, you are responsible for:
          </p>
          <ul>
            <li>All content published on your organization&apos;s public site.</li>
            <li>The actions of administrators and match operators you invite to your organization.</li>
            <li>Ensuring that team names, player data, and media comply with this AUP.</li>
            <li>Responding to any complaints related to your organization&apos;s content.</li>
          </ul>

          <h2>5. Reporting Violations</h2>
          <p>
            If you become aware of any content or activity that violates this AUP, please
            report it to us at{' '}
            <a href="mailto:support@kolusports.com">support@kolusports.com</a>. We will review
            all reports and take appropriate action.
          </p>

          <h2>6. Enforcement</h2>
          <p>
            We reserve the right, but are not obligated, to monitor the Service for AUP
            violations. If we determine that a violation has occurred, we may take one or more
            of the following actions at our sole discretion:
          </p>
          <ul>
            <li>Issue a warning to the account holder.</li>
            <li>Remove or disable access to the offending content.</li>
            <li>Temporarily suspend the account or organization.</li>
            <li>Permanently terminate the account or organization.</li>
            <li>Report the activity to law enforcement if required.</li>
          </ul>

          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this AUP from time to time. Changes will be posted on this page
            with an updated effective date. Continued use of the Service after changes are
            posted constitutes acceptance of the updated AUP.
          </p>

          <h2>8. Contact</h2>
          <div className={styles.contactBox}>
            <p>
              If you have questions about this Acceptable Use Policy, contact us at:{' '}
              <a href="mailto:support@kolusports.com">support@kolusports.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
