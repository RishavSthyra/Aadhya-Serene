import Link from 'next/link';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import styles from './privacy-policy-page.module.css';

const RERA_NUMBER = 'PRM/KA/RERA/1251/446/PR/190614/002604';
const EFFECTIVE_DATE = 'July 2, 2026';
const CONTACT_EMAIL = 'info@sthyra.com';
const CONTACT_PHONE = '+91 96209 93333';

const policyTabs = [
  { label: 'User Agreement', href: '#user-agreement' },
  { label: 'Privacy Policy', href: '#privacy-policy' },
  { label: 'Cookie Policy', href: '#cookie-policy' },
  { label: 'Copyright Policy', href: '#copyright-policy' },
  { label: 'California Privacy Disclosure', href: '#california-privacy-disclosure' },
];

const tocItems = [
  { label: 'Introduction', href: '#introduction' },
  { label: 'Data We Collect', href: '#data-we-collect' },
  { label: 'How We Use Your Data', href: '#how-we-use-your-data' },
  { label: 'How We Share Information', href: '#how-we-share-information' },
  { label: 'Retention & Security', href: '#retention-and-security' },
  { label: 'Your Choices & Rights', href: '#your-choices-and-rights' },
  { label: 'Contact Us', href: '#contact-us' },
];

function PolicySection({ id, title, children }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.pageShell}>
      <div className={styles.pageGlow} aria-hidden="true" />

      <section className={styles.policyFrame}>
        <nav className={styles.policyTabs} aria-label="Policy navigation">
          {policyTabs.map((tab) => {
            const isActive = tab.label === 'Privacy Policy';

            return (
              <a
                key={tab.label}
                href={tab.href}
                className={`${styles.policyTab} ${isActive ? styles.policyTabActive : ''}`}
                aria-current={isActive ? 'location' : undefined}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>

        <header id="privacy-policy" className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>Aadhya Serene</p>
            <h1 className={styles.heroTitle}>Privacy Policy</h1>
            <p className={styles.heroCopy}>
              This policy explains how Aadhya Serene collects, uses, and protects
              information shared through our website, enquiry forms, WhatsApp journeys,
              brochure requests, and site-visit interactions.
            </p>
          </div>
        </header>

        <div className={styles.contentGrid}>
          <article className={styles.contentColumn}>
            <div className={styles.introMeta}>
              <p className={styles.effectiveDate}>Effective {EFFECTIVE_DATE}</p>
              <p className={styles.metaCopy}>
                We updated this page to reflect how this project website handles
                enquiries related to pricing, availability, brochures, floor plans,
                walkthroughs, and site visits.
              </p>
            </div>

            <PolicySection id="introduction" title="Your Privacy Matters">
              <p>
                Aadhya Serene is a residential project website designed to help
                prospective buyers explore near-possession 2 and 3 BHK homes in North
                Bengaluru. When you browse this website or submit an enquiry, we may
                collect information that helps us respond to your interest in the
                project.
              </p>
              <p>
                This policy applies to interactions across the public site, including
                home page enquiry forms, WhatsApp lead capture, brochure requests,
                callback requests, site-visit scheduling, and other direct contact
                channels made available on the website.
              </p>
            </PolicySection>

            <PolicySection id="data-we-collect" title="Data We Collect">
              <p>Depending on how you interact with the website, we may collect:</p>
              <ul className={styles.list}>
                <li>Name, phone number, email address, and communication preference.</li>
                <li>Apartment interest such as 2 BHK or 3 BHK preference and budget range.</li>
                <li>Messages you submit about pricing, floor plans, brochures, financing, or visits.</li>
                <li>Engagement details such as pages viewed, forms opened, buttons clicked, or lead-source information.</li>
                <li>Technical data like device, browser, approximate location, IP-related logs, and analytics events.</li>
              </ul>
              <p>
                If you contact us on WhatsApp or by phone after using this site, the
                information shared in those conversations may also be used to continue
                your enquiry and support your purchase journey.
              </p>
            </PolicySection>

            <PolicySection id="how-we-use-your-data" title="How We Use Your Data">
              <p>We use collected information to operate the project website and to:</p>
              <ul className={styles.list}>
                <li>Respond to enquiries about pricing, availability, specifications, and possession status.</li>
                <li>Send brochures, floor plans, project details, and requested follow-up communication.</li>
                <li>Arrange callbacks, WhatsApp responses, and site-visit coordination.</li>
                <li>Understand marketing performance and improve the website experience.</li>
                <li>Maintain records of lead conversations and buyer-interest history.</li>
              </ul>
              <p>
                We do not ask for payment card data through this website, and we do not
                knowingly collect sensitive personal information unless you choose to
                include it in your enquiry.
              </p>
            </PolicySection>

            <PolicySection id="how-we-share-information" title="How We Share Information">
              <p>
                We may share enquiry information with internal sales teams, project
                representatives, CRM or communication tools, hosting providers, and
                service partners who help us operate the website and respond to leads.
              </p>
              <p>
                Information may also be processed through advertising and analytics
                tools used to measure campaign performance, provided those tools are
                configured for legitimate business use related to this project.
              </p>
              <p>
                We do not sell your personal information as part of a public data
                marketplace. We may disclose information if required by law, to protect
                legal rights, or to investigate fraud or misuse of the website.
              </p>
            </PolicySection>

            <PolicySection id="retention-and-security" title="Retention & Security">
              <p>
                We retain enquiry information for as long as reasonably needed to manage
                active sales conversations, buyer support, legal compliance, and project
                reporting. Retention periods may vary depending on whether you remain in
                contact with our team.
              </p>
              <p>
                We use commercially reasonable administrative and technical safeguards to
                protect submitted data. No internet transmission or storage system is
                fully guaranteed to be secure, so we encourage you not to submit
                unnecessary confidential information through public forms.
              </p>
            </PolicySection>

            <PolicySection id="your-choices-and-rights" title="Your Choices & Rights">
              <p>
                You may request that we update, correct, or stop using your enquiry
                information for follow-up communication. You can also ask about the
                details we currently hold in relation to your website enquiry.
              </p>
              <p>
                If you do not want cookies or analytics technologies to operate through
                your browser, you can manage those settings directly in your browser or
                device. Some website features may work differently after such changes.
              </p>
            </PolicySection>

            <PolicySection id="contact-us" title="Contact Us">
              <p>
                For privacy-related questions, data correction requests, or communication
                preferences, contact the Aadhya Serene team using the details below.
              </p>
              <div className={styles.contactCard}>
                <div>
                  <span className={styles.contactLabel}>Email</span>
                  <a href={`mailto:${CONTACT_EMAIL}`} className={styles.contactLink}>
                    {CONTACT_EMAIL}
                  </a>
                </div>
                <div>
                  <span className={styles.contactLabel}>Phone</span>
                  <a href="tel:+919620993333" className={styles.contactLink}>
                    {CONTACT_PHONE}
                  </a>
                </div>
                <div>
                  <span className={styles.contactLabel}>Project</span>
                  <span className={styles.contactText}>Aadhya Serene, Thanisandra Main Road, North Bengaluru</span>
                </div>
              </div>
            </PolicySection>

            <div className={styles.policyNotes}>
              <section id="user-agreement" className={styles.noteCard}>
                <span className={styles.noteLabel}>User Agreement</span>
                <p>
                  By using this website, you agree to use the content only for lawful,
                  personal, and project-enquiry purposes.
                </p>
              </section>

              <section id="cookie-policy" className={styles.noteCard}>
                <span className={styles.noteLabel}>Cookie Policy</span>
                <p>
                  This website may use essential cookies, analytics tools, and ad
                  attribution technologies to understand traffic and lead quality.
                </p>
              </section>

              <section id="copyright-policy" className={styles.noteCard}>
                <span className={styles.noteLabel}>Copyright Policy</span>
                <p>
                  Project visuals, floor plans, renderings, branding, and written content
                  on this site are protected and should not be reused without permission.
                </p>
              </section>

              <section
                id="california-privacy-disclosure"
                className={styles.noteCard}
              >
                <span className={styles.noteLabel}>California Privacy Disclosure</span>
                <p>
                  If a visitor is entitled to specific privacy rights under applicable
                  California law, requests can be submitted through the contact details
                  listed on this page.
                </p>
              </section>
            </div>
          </article>

          <aside className={styles.tocColumn}>
            <div className={styles.stickyRail}>
              <div className={styles.tocCard}>
                <p className={styles.tocTitle}>Table of Contents</p>
                <div className={styles.tocList}>
                  {tocItems.map((item) => (
                    <a key={item.href} href={item.href} className={styles.tocLink}>
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className={styles.metaCard}>
                <div className={styles.reraStrip}>
                  <span className={styles.reraLabel}>
                    <ShieldCheck size={15} strokeWidth={1.8} />
                    K-RERA
                  </span>
                  <strong className={styles.reraValue}>{RERA_NUMBER}</strong>
                </div>
                <p className={styles.metaCardCopy}>
                  This page follows the tone and visual language used across the Aadhya
                  Serene ready-to-move experience.
                </p>
                <Link href="/ready-to-move" className={styles.backLink}>
                  Visit Ready To Move Page
                  <ArrowUpRight size={15} strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
