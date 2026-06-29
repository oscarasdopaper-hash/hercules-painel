'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Info, Plus, Trash2, Loader2, Globe, Target } from 'lucide-react';
import Link from 'next/link';
import { getAdminData } from '../actions';
import { getLocalCampaigns, saveLocalCampaign, deleteLocalCampaign, getLocalCampaignPages } from '../actions';

export default function ZeusPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [form, setForm] = useState({ id: '', service_name: '', target_cities: '', hero_image_url: '' });
  const [isEditing, setIsEditing] = useState(false);
  
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);
  const [campaignPages, setCampaignPages] = useState<any[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCampaigns(selectedCompanyId);
    } else {
      setCampaigns([]);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const data = await getAdminData();
    setCompanies(data.companies || []);
    if (data.companies && data.companies.length > 0) {
      setSelectedCompanyId(data.companies[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCampaigns(selectedCompanyId);
    } else {
      setCampaigns([]);
    }
  }, [selectedCompanyId]);

  const fetchCampaigns = async (companyId: string) => {
    const res = await getLocalCampaigns(companyId);
    if (res.success) {
      setCampaigns(res.campaigns || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return alert('Selecione uma empresa.');
    if (!form.service_name || !form.target_cities) return alert('Preencha os campos obrigatórios.');

    setActionLoading(true);
    const res = await saveLocalCampaign(selectedCompanyId, form);
    setActionLoading(false);

    if (res.success) {
      alert(isEditing ? 'Campanha atualizada!' : 'Campanha criada! O Autopilot começará a gerar em breve.');
      setForm({ id: '', service_name: '', target_cities: '', hero_image_url: '' });
      setIsEditing(false);
      fetchCampaigns(selectedCompanyId);
    } else {
      alert('Erro: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta campanha? (As páginas geradas permanecerão no banco de dados)')) return;
    setActionLoading(true);
    const res = await deleteLocalCampaign(id);
    setActionLoading(false);
    if (res.success) {
      alert('Campanha excluída.');
      fetchCampaigns(selectedCompanyId);
    } else {
      alert('Erro: ' + res.error);
    }
  };

  const handleViewPages = async (campaign: any) => {
    if (viewingCampaign?.id === campaign.id) {
      setViewingCampaign(null);
      return;
    }
    setViewingCampaign(campaign);
    setPagesLoading(true);
    const res = await getLocalCampaignPages(campaign.id);
    if (res.success) {
      setCampaignPages(res.pages || []);
    }
    setPagesLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', fontFamily: 'system-ui, sans-serif' }}>
      {/* ZEUS HEADER */}
      <header style={{ backgroundColor: '#1e1b4b', padding: '20px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #fbbf24' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Sparkles size={32} color="#fbbf24" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '2px', color: '#fbbf24' }}>MÓDULO ZEUS ⚡</h1>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Autopilot de Dominação Local SEO</span>
          </div>
        </div>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={16} /> Voltar ao Painel Geral
        </Link>
      </header>

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        
        {/* INSTRUCTIONS CARD */}
        <div style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #fbbf24', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#78350f', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={20} /> Como operar o ZEUS?
          </h2>
          <p style={{ color: '#451a03', lineHeight: '1.6', margin: 0 }}>
            Este é o módulo Premium para geração massiva de <strong>Páginas de Venda Locais</strong>. 
            Basta criar uma campanha definindo o nome do serviço (Ex: <em>Insulfilm Automotivo</em>) e colar uma lista de cidades separadas por vírgula. 
            O Cron Job do sistema irá processar uma cidade por vez, criando uma Landing Page altamente persuasiva otimizada para SEO Local (Schema Markup injetado).
            <br /><br />
            <strong>🖼️ Mídia de Fundo (Hero):</strong> Você pode inserir a URL de uma Imagem (ex: .jpg, .png, .webp) ou de um Vídeo (ex: .mp4, .webm). 
            Se for um vídeo, ele rodará em loop automático (sem som). 
            <br />
            <strong>Tamanho recomendado:</strong> Para imagens, utilize proporção widescreen (ex: 1920x1080) e arquivos otimizados (abaixo de 300kb). Para vídeos, prefira resolução 720p ou 1080p com alta compressão para não prejudicar a velocidade de carregamento (Performance SEO).
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={40} color="#fbbf24" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            
            {/* LEFT COL: FORM */}
            <div>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #fef3c7' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#92400e', marginBottom: '8px', textTransform: 'uppercase' }}>Cliente Ativo (Marca)</label>
                  <select 
                    value={selectedCompanyId} 
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #fcd34d', backgroundColor: '#fffbeb', color: '#78350f', fontWeight: 'bold' }}
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.domain || 'Sem domínio'})</option>
                    ))}
                  </select>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #fde68a', margin: '24px 0' }} />

                <h3 style={{ margin: '0 0 20px 0', color: '#78350f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isEditing ? '✏️ Editar Campanha' : '🚀 Nova Campanha'}
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#451a03', marginBottom: '8px' }}>Nome do Serviço *</label>
                    <input 
                      type="text" 
                      value={form.service_name}
                      onChange={e => setForm({...form, service_name: e.target.value})}
                      placeholder="Ex: Insulfilm Antivandalismo"
                      style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#451a03', marginBottom: '8px' }}>Cidades / Bairros Alvo *</label>
                    <textarea 
                      value={form.target_cities}
                      onChange={e => setForm({...form, target_cities: e.target.value})}
                      placeholder="Ex: Alphaville, Tamboré, Osasco, Barueri, Santana de Parnaíba"
                      rows={4}
                      style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                      required
                    />
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>Separe os locais por vírgula.</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#451a03', marginBottom: '8px' }}>URL da Imagem de Fundo (Opcional)</label>
                    <input 
                      type="url" 
                      value={form.hero_image_url}
                      onChange={e => setForm({...form, hero_image_url: e.target.value})}
                      placeholder="https://suaimagem.com/foto.jpg"
                      style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      type="submit" 
                      disabled={actionLoading || !selectedCompanyId}
                      style={{ flex: 1, padding: '14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                    >
                      {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      {isEditing ? 'Salvar Edição' : 'Lançar Campanha'}
                    </button>

                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={() => { setIsEditing(false); setForm({ id: '', service_name: '', target_cities: '', hero_image_url: '' }); }}
                        style={{ padding: '14px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT COL: LIST */}
            <div>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 24px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={20} color="#f59e0b" /> Campanhas Ativas
                </h3>

                {campaigns.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <Globe size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p>Nenhuma campanha local encontrada para este cliente.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {campaigns.map(camp => (
                      <React.Fragment key={camp.id}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: camp.status === 'completed' ? '#f8fafc' : '#ffffff' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{camp.service_name}</h4>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', backgroundColor: camp.status === 'completed' ? '#dcfce7' : '#fef3c7', color: camp.status === 'completed' ? '#166534' : '#b45309' }}>
                              {camp.status === 'completed' ? 'CONCLUÍDA' : 'EM ANDAMENTO'}
                            </span>
                          </div>
                          
                          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>
                            <strong>Alvos:</strong> {camp.target_cities}
                          </p>

                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '4px', color: '#334155' }}>
                            <strong>Páginas Geradas:</strong> {camp.pages?.[0]?.count || 0}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleViewPages(camp)}
                            style={{ padding: '8px', backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            title="Ver Páginas"
                          >
                            Ver Páginas
                          </button>
                          <button 
                            onClick={() => { setForm(camp); setIsEditing(true); }}
                            style={{ padding: '8px', backgroundColor: '#f1f5f9', color: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(camp.id)}
                            style={{ padding: '8px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Sub-lista de Páginas Geradas */}
                      {viewingCampaign?.id === camp.id && (
                        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '0 0 8px 8px', border: '1px solid #e2e8f0', borderTop: 'none', marginTop: '-17px' }}>
                          <h5 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '14px' }}>Links Gerados:</h5>
                          {pagesLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                              <Loader2 size={16} className="animate-spin" /> Carregando links...
                            </div>
                          ) : campaignPages.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Nenhuma página gerada ainda para esta campanha.</p>
                          ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {campaignPages.map(p => (
                                <li key={p.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{p.city}</span>
                                  <a 
                                    href={`https://${companies.find(c => c.id === selectedCompanyId)?.domain || 'maben.com.br'}/servicos/${p.slug}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}
                                  >
                                    Abrir Link ↗
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                    </React.Fragment>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
