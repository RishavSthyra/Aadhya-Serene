import Link from 'next/link';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import styles from './legal-page.module.css';

const RERA_NUMBER = 'PRM/KA/RERA/1251/446/PR/190614/002604';

function PolicyTab({ href, label, isActive }) {
  const className = `${styles.policyTab} ${isActive ? styles.policyTabActive : ''}`;

  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} aria-current={isActive ? 'location' : undefined}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-current={isActive ? 'page' : undefined}>
      {label}
    </Link>
  );
}

export function PolicySection({ id, title, children }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function PolicyContactCard({ items }) {
  return (
    <div className={styles.contactCard}>
      {items.map((item) => (
        <div key={item.label}>
          <span className={styles.contactLabel}>{item.label}</span>
          {item.href ? (
            <a href={item.href} className={styles.contactLink}>
              {item.value}
            </a>
          ) : (
            <span className={styles.contactText}>{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function PolicyNotes({ items }) {
  return (
    <div className={styles.policyNotes}>
      {items.map((item) => (
        <section key={item.id} id={item.id} className={styles.noteCard}>
          <span className={styles.noteLabel}>{item.label}</span>
          <p>{item.copy}</p>
        </section>
      ))}
    </div>
  );
}

export default function LegalPage({
  activeTab,
  tabs,
  heroEyebrow = 'Aadhya Serene',
  heroId,
  heroTitle,
  heroCopy,
  effectiveDate,
  metaCopy,
  tocItems,
  metaCardCopy,
  backLink = { href: '/ready-to-move', label: 'Visit Ready To Move Page' },
  children,
}) {
  return (
    <main className={styles.pageShell}>
      <div className={styles.pageGlow} aria-hidden="true" />

      <section className={styles.policyFrame}>
        <nav className={styles.policyTabs} aria-label="Policy navigation">
          {tabs.map((tab) => (
            <PolicyTab
              key={tab.key}
              href={tab.href}
              label={tab.label}
              isActive={tab.key === activeTab}
            />
          ))}
        </nav>

        <header id={heroId} className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>{heroEyebrow}</p>
            <h1 className={styles.heroTitle}>{heroTitle}</h1>
            <p className={styles.heroCopy}>{heroCopy}</p>
          </div>
        </header>

        <div className={styles.contentGrid}>
          <article className={styles.contentColumn}>
            <div className={styles.introMeta}>
              <p className={styles.effectiveDate}>Effective {effectiveDate}</p>
              <p className={styles.metaCopy}>{metaCopy}</p>
            </div>

            {children}
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
                <p className={styles.metaCardCopy}>{metaCardCopy}</p>
                <Link href={backLink.href} className={styles.backLink}>
                  {backLink.label}
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
