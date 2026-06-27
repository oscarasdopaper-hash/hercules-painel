"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Check, X, RefreshCw, Send, Shield, Crosshair, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from '../admin.module.css';

interface Company {
  id: string;
  name: string;
  target_region: string;
  daily_limit: number;
}

interface Idea {
  id: string; // id local para gerenciar no react
  type: 'term' | 'blog';
  title: string;
  summary: string;
  meta_title: string;
  meta_description: string;
  selected: boolean;
  status: 'pending' | 'producing' | 'done' | 'error';
  errorMsg?: string;
}

export default function SpartaPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [dripInterval, setDripInterval] = useState<number>(5); // Default 5 minutes
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  
  // Progresso
  const totalSelected = ideas.filter(i => i.selected).length;
  const totalDone = ideas.filter(i => i.selected && i.status === 'done').length;

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('id, name, target_region, daily_limit').eq('status', 'active');
    if (data) {
      setCompanies(data);
      if (data.length > 0) setSelectedCompanyId(data[0].id);
    }
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  async function handleGeneratePlan() {
    if (!selectedCompany) return;
    setIsGeneratingIdeas(true);
    setIdeas([]);
    try {
      const res = await fetch('/api/sparta/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: selectedCompany.id,
          limit: selectedCompany.daily_limit || 30
        })
      });
      const data = await res.json();
      if (data.success) {
        setIdeas(data.data.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(7),
          selected: true,
          status: 'pending'
        })));
      } else {
        alert("Erro ao gerar plano: " + data.error);
      }
    } catch (e) {
      alert("Erro de comunicação ao gerar plano.");
    }
    setIsGeneratingIdeas(false);
  }

  async function handleReSummary(ideaId: string) {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea || !selectedCompany) return;
    
    // UI Loading state just for this item if we wanted, but we'll do a simple block
    try {
      const res = await fetch('/api/sparta/re-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          title: idea.title,
          type: idea.type
        })
      });
      const data = await res.json();
      if (data.success) {
        setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, summary: data.summary, meta_title: data.meta_title, meta_description: data.meta_description } : i));
      }
    } catch(e) {
      console.error(e);
    }
  }

  async function handleProduce() {
    if (!selectedCompany || totalSelected === 0) return;
    setIsProducing(true);

    const queue = ideas.filter(i => i.selected && i.status !== 'done');
    
    let generatedCount = 0;
    
    for (const item of queue) {
      // Calcular data programada (Pingo)
      const scheduledDate = new Date();
      scheduledDate.setMinutes(scheduledDate.getMinutes() + (generatedCount * dripInterval));
      
      // Update status to producing
      setIdeas(prev => prev.map(i => i.id === item.id ? { ...i, status: 'producing' } : i));
      
      try {
        const res = await fetch('/api/sparta/produce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: selectedCompany.id,
            title: item.title,
            summary: item.summary,
            meta_title: item.meta_title,
            meta_description: item.meta_description,
            type: item.type,
            scheduled_at: scheduledDate.toISOString()
          })
        });
        const data = await res.json();
        
        if (data.success) {
          setIdeas(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done' } : i));
          generatedCount++;
        } else {
          setIdeas(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMsg: data.error } : i));
        }
      } catch (e: any) {
        setIdeas(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMsg: e.message } : i));
      }
    }

    setIsProducing(false);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '1rem', fontWeight: 'bold' }}>
        <ArrowLeft size={18} />
        Voltar ao Painel
      </Link>

      <div style={{ background: '#b91c1c', padding: '1.5rem', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(185, 28, 28, 0.3)' }}>
        <Shield size={40} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>MÓDULO SPARTA ⚔️</h1>
          <p style={{ margin: '0.2rem 0 0 0', opacity: 0.9 }}>Sala de Guerra Estratégica. Você no controle do exército de conteúdo.</p>
        </div>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>1. Configurar Operação</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Selecionar Empresa</label>
            <select 
              value={selectedCompanyId} 
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Local Alvo da Invasão</label>
            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
              <Crosshair size={16} />
              {selectedCompany?.target_region || 'Nacional / Não definido'}
            </div>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Meta Diária</label>
            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }}>
              {selectedCompany?.daily_limit || 3} Itens
            </div>
          </div>

          <button 
            onClick={handleGeneratePlan}
            disabled={isGeneratingIdeas || isProducing || !selectedCompany}
            style={{ padding: '0.75rem 1.5rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isGeneratingIdeas ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isGeneratingIdeas ? <RefreshCw size={18} className={styles.spin} /> : <Sparkles size={18} />}
            {isGeneratingIdeas ? 'Mapeando Terreno...' : 'Gerar Plano de Batalha'}
          </button>
        </div>
      </div>

      {ideas.length > 0 && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>2. Analisar e Editar Títulos ({ideas.length})</h2>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Intervalo (Pingo):</label>
                <select 
                  value={dripInterval} 
                  onChange={(e) => setDripInterval(Number(e.target.value))}
                  disabled={isProducing}
                  style={{ background: 'transparent', border: 'none', fontWeight: 'bold', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                >
                  <option value={0}>0 min (Imediato)</option>
                  <option value={2}>2 minutos</option>
                  <option value={5}>5 minutos</option>
                  <option value={10}>10 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                </select>
              </div>

              <button 
                onClick={handleProduce}
                disabled={isProducing || totalSelected === 0}
                style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isProducing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)' }}
              >
                {isProducing ? <RefreshCw size={18} className={styles.spin} /> : <Send size={18} />}
                {isProducing ? 'Invasão em Andamento...' : `Iniciar Invasão (${totalSelected})`}
              </button>
            </div>
          </div>

          {isProducing && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                <span>Progresso da Invasão</span>
                <span>{totalDone} / {totalSelected} ({Math.round((totalDone/totalSelected)*100)}%)</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(totalDone/totalSelected)*100}%`, background: '#22c55e', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {ideas.map((idea) => (
              <div key={idea.id} style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', opacity: idea.selected ? 1 : 0.6 }}>
                
                <div style={{ paddingTop: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={idea.selected}
                    disabled={isProducing}
                    onChange={(e) => setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, selected: e.target.checked } : i))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: idea.type === 'term' ? '#e0f2fe' : '#fce7f3', color: idea.type === 'term' ? '#0369a1' : '#be185d' }}>
                      {idea.type === 'term' ? 'GLOSSÁRIO' : 'BLOG'}
                    </span>
                    {idea.status === 'producing' && <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: '#fef3c7', color: '#b45309' }}>Gerando...</span>}
                    {idea.status === 'done' && <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: '#dcfce7', color: '#15803d' }}>Concluído!</span>}
                    {idea.status === 'error' && <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: '#fee2e2', color: '#b91c1c' }}>Erro: {idea.errorMsg}</span>}
                  </div>
                  
                  <input 
                    type="text" 
                    value={idea.title} 
                    disabled={isProducing}
                    onChange={(e) => setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, title: e.target.value } : i))}
                    style={{ width: '100%', padding: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.5rem', color: '#0f172a' }}
                  />
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Meta Title</label>
                      <input 
                        type="text" 
                        value={idea.meta_title || ''} 
                        disabled={isProducing}
                        onChange={(e) => setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, meta_title: e.target.value } : i))}
                        style={{ width: '100%', padding: '0.4rem', fontSize: '0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Meta Description</label>
                      <input 
                        type="text" 
                        value={idea.meta_description || ''} 
                        disabled={isProducing}
                        onChange={(e) => setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, meta_description: e.target.value } : i))}
                        style={{ width: '100%', padding: '0.4rem', fontSize: '0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <textarea 
                      value={idea.summary} 
                      disabled={isProducing}
                      onChange={(e) => setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, summary: e.target.value } : i))}
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#475569', minHeight: '60px', resize: 'vertical' }}
                    />
                    <button 
                      onClick={() => handleReSummary(idea.id)}
                      disabled={isProducing}
                      title="Refazer Resumo Baseado no Novo Título"
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '0 0.5rem', color: '#64748b' }}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
