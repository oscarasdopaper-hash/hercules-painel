'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

interface HeaderNavProps {
  company: {
    home_url?: string | null;
  };
  t: Record<string, string>;
  categories?: { id: string, name: string, slug: string }[];
  isLandingPage?: boolean;
}

export default function HeaderNav({ company, t, categories = [], isLandingPage = false }: HeaderNavProps) {
  const pathname = usePathname();
  
  // A lógica para saber se está ativo
  const isBlog = pathname?.startsWith('/blog');
  const isCategory = pathname?.startsWith('/categoria/');
  const isGlossary = !isBlog && !isCategory && pathname === '/'; 

  return (
    <div style={{ display: 'flex', gap: isLandingPage ? '32px' : '8px', alignItems: 'center' }}>
      {/* Botão Home / Início (Externo) */}
      {company.home_url && (
        <a 
          href={company.home_url} 
          target="_blank"
          rel="noopener noreferrer"
          className={isLandingPage ? styles.navLink : styles.glossaryBadge}
          style={isLandingPage ? { color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' } : { 
            textDecoration: 'none', 
            backgroundColor: '#f1f5f9',
            color: 'var(--tenant-primary)', 
            border: '1px solid #e2e8f0',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          {t.home}
        </a>
      )}

      {/* Botão Glossário */}
      <Link 
        href="/" 
        className={isLandingPage ? styles.navLink : styles.glossaryBadge} 
        style={isLandingPage ? { color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' } : { 
          textDecoration: 'none',
          backgroundColor: isGlossary ? 'var(--tenant-primary)' : '#f1f5f9',
          color: isGlossary ? 'white' : 'var(--tenant-primary)',
          border: isGlossary ? '1px solid var(--tenant-primary)' : '1px solid #e2e8f0',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}
      >
        Glossário
      </Link>

      {/* Botão Blog */}
      <Link 
        href="/blog" 
        className={isLandingPage ? styles.navLink : styles.glossaryBadge} 
        style={isLandingPage ? { color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' } : { 
          textDecoration: 'none',
          backgroundColor: isBlog ? 'var(--tenant-primary)' : '#f1f5f9',
          color: isBlog ? 'white' : 'var(--tenant-primary)',
          border: isBlog ? '1px solid var(--tenant-primary)' : '1px solid #e2e8f0',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}
      >
        Blog
      </Link>

      {/* Dropdown de Categorias */}
      {categories.length > 0 && (
        <div className={styles.dropdownContainer}>
          <div 
            className={isLandingPage ? styles.navLink : styles.glossaryBadge}
            style={isLandingPage ? { 
              color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            } : { 
              backgroundColor: isCategory ? 'var(--tenant-primary)' : '#f1f5f9',
              color: isCategory ? 'white' : 'var(--tenant-primary)',
              border: isCategory ? '1px solid var(--tenant-primary)' : '1px solid #e2e8f0',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Categorias
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          <div className={styles.dropdownMenu}>
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/categoria/${cat.slug}`}
                className={styles.dropdownItem}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
