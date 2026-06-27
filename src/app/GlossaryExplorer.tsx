'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, BookOpen, ArrowRight } from 'lucide-react';
import { Company, Category, Term, translations } from '@/lib/data';
import styles from './page.module.css';

interface GlossaryExplorerProps {
  company: Company;
  categories: Category[];
  initialTerms: Term[];
}

export default function GlossaryExplorer({ company, categories, initialTerms }: GlossaryExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Seleciona dicionário de tradução
  const lang = company.language || 'pt-br';
  const t = translations[lang] || translations['pt-br'];

  // Filtra os termos com base apenas na busca (barra lateral foi removida para focar no Grid)
  const filteredTerms = useMemo(() => {
    if (!searchQuery) return initialTerms;
    
    return initialTerms.filter((term) => {
      return term.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (term.short_description && term.short_description.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [initialTerms, searchQuery]);

  // Agrupa os termos filtrados pela primeira letra
  const groupedTerms = useMemo(() => {
    const groups: { [key: string]: Term[] } = {};
    
    filteredTerms.forEach((term) => {
      const letter = term.letter.toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(term);
    });

    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return acc;
      }, {} as { [key: string]: Term[] });
  }, [filteredTerms]);

  return (
    <div className={styles.explorer}>
      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className={styles.clearSearch}
            >
              {t.clearBtn}
            </button>
          )}
        </div>
      </div>

      {/* Main Full Width Grid */}
      <div className={styles.layoutGrid}>
        <section className={styles.resultsArea}>
          {filteredTerms.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpen size={48} className={styles.emptyIcon} />
              <h3>{t.noTerms}</h3>
              <p>{t.noTermsSub}</p>
            </div>
          ) : (
            <div className={styles.charmingGrid}>
              {Object.entries(groupedTerms).map(([letter, terms]) => {
                const visibleTerms = terms.slice(0, 5); // Limite de 5 termos
                const hasMore = terms.length > 5;
                
                return (
                  <div key={letter} className={styles.charmingCard} id={`letter-${letter.toLowerCase()}`}>
                    {/* Marca d'agua charmosa (Letra Gigante de Fundo) */}
                    <span className={styles.watermarkLetter}>{letter}</span>
                    
                    <div className={styles.cardContent}>
                      <div className={styles.cardHeader}>
                        <span className={styles.headerLetter}>{letter}</span>
                        <span className={styles.termCount}>{terms.length} termos</span>
                      </div>
                      
                      <ul className={styles.termList}>
                        {visibleTerms.map((term) => (
                          <li key={term.id}>
                            <Link href={`/${term.slug}`} className={styles.termLinkItem}>
                              <span className={styles.termLinkText}>{term.title}</span>
                              <ArrowRight size={16} className={styles.termLinkArrow} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Botão de Ver todos condicional */}
                      {hasMore && (
                        <Link href={`/letra/${letter.toLowerCase()}`} className={styles.viewAllBtn}>
                          Ver todos os {terms.length} termos
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
