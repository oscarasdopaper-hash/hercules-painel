'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import styles from './layout.module.css';
import HeaderNav from './HeaderNav';

export default function ClientHeader({ company, t, categories }: { company: any, t: any, categories: any }) {
  const pathname = usePathname();
  const isLandingPage = pathname?.includes('/servicos/');
  
  // Apply a transparent header if we are on the landing page
  const headerClass = isLandingPage ? `${styles.header} ${styles.headerTransparent}` : styles.header;
  const logoTextClass = isLandingPage ? `${styles.logoText} ${styles.logoTextLight}` : styles.logoText;
  const contactLinkClass = isLandingPage ? `${styles.contactHeaderLink} ${styles.contactHeaderLinkLight}` : styles.contactHeaderLink;

  return (
    <header className={headerClass}>
      <div className={styles.headerContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" className={styles.logoLink}>
            {company.logo_url ? (
              <div className={styles.logoWrapper}>
                <Image 
                  src={company.logo_url} 
                  alt={company.name} 
                  width={200} 
                  height={60} 
                  className={styles.logoImg} 
                  style={{ objectFit: 'contain' }}
                  priority 
                />
              </div>
            ) : (
              <span className={logoTextClass}>{company.name}</span>
            )}
          </Link>
          <HeaderNav company={company} t={t} categories={categories || []} isLandingPage={isLandingPage} />
        </div>

        {(company.contact_phone || company.contact_email) && (
          <div className={styles.contactHeaderGroup}>
            {company.contact_phone && (
              <a href={`tel:${company.contact_phone.replace(/[^\d+]/g, '')}`} className={contactLinkClass}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.11-.27c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.28 1.11l-2.17 2.2z"/>
                </svg>
                <span>{company.contact_phone}</span>
              </a>
            )}
            {company.contact_email && (
              <a href={`mailto:${company.contact_email}`} className={`${contactLinkClass} ${isLandingPage ? styles.emailHighlight : ''}`}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>{company.contact_email}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
