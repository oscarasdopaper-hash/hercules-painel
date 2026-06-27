'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

export default function HeroWrapper({ t, alphabet }: { t: any, alphabet: string[] }) {
  const pathname = usePathname();

  // Esconde o Hero/Alfabeto se estiver em qualquer rota de Blog ou Serviços (Landing Pages)
  if (pathname && (pathname.includes('/blog') || pathname.includes('/servicos'))) {
    return null;
  }

  const isHome = pathname === '/';

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {isHome ? (
          <h1 className={styles.heroTitle}>{t.titleHero}</h1>
        ) : (
          <div className={styles.heroTitle}>{t.titleHero}</div>
        )}
        
        {isHome ? (
          <h2 className={styles.heroSubtitle}>{t.subtitleHero}</h2>
        ) : (
          <p className={styles.heroSubtitle}>{t.subtitleHero}</p>
        )}

        {/* Letras A-Z */}
        <div className={styles.azNav}>
          <span className={styles.azLabel}>{t.browseLetter}</span>
          <div className={styles.azList}>
            {alphabet.map((letter) => (
              <Link 
                key={letter} 
                href={`/letra/${letter.toLowerCase()}`}
                className={styles.azLetter}
              >
                {letter}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
