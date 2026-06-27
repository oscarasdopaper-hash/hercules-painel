'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, Search, ArrowLeft, ExternalLink, Activity, Link as LinkIcon, AlertCircle } from 'lucide-react';
import styles from '../admin.module.css';

interface DomainResult {
  domain: string;
  price?: string;
  status: string;
  da?: number;
  backlinks?: number;
}

export default function OraculoPage() {
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;

    setIsSearching(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/oraculo/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao invocar o Oráculo.');
      }

      setResults(data.domains || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '1rem', fontWeight: 'bold', transition: 'color 0.2s' }}>
        <ArrowLeft size={18} />
        Voltar ao Painel
      </Link>

      <div style={{ background: '#7c3aed', padding: '2rem', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '50%' }}>
          <Globe size={48} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>MÓDULO ORÁCULO 👁️‍🗨️</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>O Caçador de Domínios Expirados. Encontre autoridade esquecida na web.</p>
        </div>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #f1f5f9' }}>
        <h2 style={{ fontSize: '1.3rem', marginTop: 0, marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={20} color="#7c3aed" />
          Configurar Varredura
        </h2>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Palavra-chave ou Nicho Alvo</label>
            <input 
              type="text" 
              placeholder="Ex: energia solar, clínica odontológica..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSearching || !keyword}
            style={{ 
              background: isSearching ? '#94a3b8' : '#7c3aed', 
              color: 'white', 
              padding: '1rem 2rem', 
              borderRadius: '10px', 
              border: 'none', 
              cursor: isSearching || !keyword ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', 
              fontSize: '1rem',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              boxShadow: isSearching ? 'none' : '0 4px 14px rgba(124, 58, 237, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {isSearching ? (
              <span className={styles.spin} style={{ display: 'inline-block' }}>O</span>
            ) : (
              <Globe size={20} />
            )}
            {isSearching ? 'Consultando o Oráculo...' : 'Iniciar Varredura'}
          </button>
        </form>
        {error && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#1e293b' }}>Visões Reveladas</h2>
            <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
              {results.length} domínios encontrados
            </span>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: 800 }}>{r.domain}</h3>
                    <span style={{ background: r.status === 'Disponível' ? '#dcfce7' : '#f1f5f9', color: r.status === 'Disponível' ? '#16a34a' : '#64748b', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.status === 'Disponível' ? '#16a34a' : '#64748b' }}></span>
                      {r.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '2rem', color: '#475569', fontSize: '0.95rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Activity size={16} color="#7c3aed" />
                      <strong>DA:</strong> {r.da || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <LinkIcon size={16} color="#3b82f6" />
                      <strong>Backlinks:</strong> {r.backlinks?.toLocaleString('pt-BR') || 'N/A'}
                    </div>
                  </div>
                </div>

                <div>
                  <a 
                    href={`https://registro.br/busca-dominio/?qr=${r.domain.replace('.com.br', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                  >
                    Comprar no Registro.br
                    <ExternalLink size={16} />
                  </a>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
