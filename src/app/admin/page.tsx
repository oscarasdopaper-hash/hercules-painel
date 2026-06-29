'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FolderPlus, 
  BookOpen, 
  Settings, 
  Plus, 
  Trash2, 
  Sparkles, 
  Save, 
  Globe, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Edit,
  Newspaper,
  Image as ImageIcon,
  Link2
} from 'lucide-react';
import Link from 'next/link';
import { Company, Category, Term, BlogPost, AutoLink, HunterSuggestion } from '@/lib/data';
import { 
  getAdminData, 
  saveCompany, 
  deleteCompany, 
  createCategory, 
  deleteCategory, 
  saveTerm, 
  deleteTerm,
  bulkDeleteTerms,
  saveBlogPost,
  deleteBlogPost,
  saveAutoLink,
  deleteAutoLink,
  generateContentWithAI,
  generateBlogWithAI,
  getHunterSuggestions,
  updateHunterSuggestionStatus,
  generateImageSEO,
  generateWhatsAppCTAs,
  autoCategorizeOrphans
} from './actions';
import styles from './admin.module.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'categories' | 'terms' | 'blog' | 'autolinks' | 'settings' | 'hunter'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [autoLinks, setAutoLinks] = useState<AutoLink[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [termsPage, setTermsPage] = useState(1);
  const [blogPage, setBlogPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  
  // Messages
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Forms states
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({
    name: '', slug: '', domain: '', logo_url: '', primary_color: '#25aa00', seo_title: '', seo_description: '',
    status: 'active', language: 'pt-br', redirect_to_company_id: '',
    focus_slot_1: '', focus_slot_2: '', focus_slot_3: '', whatsapp_number: '', whatsapp_phrases: [], whatsapp_avatar_url: '',
    contact_phone: '', contact_email: '', daily_limit: 3,
    business_goals: '', blog_autopilot_context: '',
    company_identity: '', hunter_mode: 'manual', default_term_image_url: '',
    openai_model: 'gpt-4o-mini', default_blog_image_url: '', target_region: '', home_url: ''
  });
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [competitorUrlsRaw, setCompetitorUrlsRaw] = useState('');
  const [hunterSuggestions, setHunterSuggestions] = useState<HunterSuggestion[]>([]);
  
  const [termForm, setTermForm] = useState<Partial<Term>>({
    title: '', slug: '', category_id: '', short_description: '', content: '', meta_title: '', meta_description: '', image_url: '', image_alt: '', image_title: '', status: 'draft'
  });

  const [blogForm, setBlogForm] = useState<Partial<BlogPost & { meta_keywords?: string }>>({
    title: '', slug: '', content: '', meta_title: '', meta_description: '', image_url: '', image_alt: '', image_title: '', status: 'draft'
  });

  const [autoLinkForm, setAutoLinkForm] = useState<Partial<AutoLink>>({
    keyword: '', target_url: '', limit_per_page: 1
  });
  
  // AI Keys
  const [openaiKey, setOpenaiKey] = useState('');
  const [aiPromptContext, setAiPromptContext] = useState('');
  const [blogContext, setBlogContext] = useState('');
  const [isEditingTerm, setIsEditingTerm] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isGeneratingWp, setIsGeneratingWp] = useState(false);

  const handleGenerateWhatsApp = async () => {
    if (!companyForm.company_identity && !companyForm.name) {
      alert('Preencha a Identidade da Empresa ou o Nome antes de gerar CTAs.');
      return;
    }
    setIsGeneratingWp(true);
    try {
      const res = await generateWhatsAppCTAs(
        companyForm.openai_key || '',
        companyForm.company_identity || companyForm.name || '',
        companyForm.tone_of_voice || 'formal'
      );
      if (res.success && res.data) {
        setCompanyForm(prev => ({ ...prev, whatsapp_phrases: res.data }));
      } else {
        alert('Erro ao gerar: ' + res.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
    setIsGeneratingWp(false);
  };
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [isEditingAutoLink, setIsEditingAutoLink] = useState(false);

  // Carrega chave OpenAI do LocalStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setOpenaiKey(savedKey);
    }
    loadData();
  }, []);

  // Recarrega termos e categorias quando muda de empresa selecionada
  useEffect(() => {
    if (selectedCompanyId) {
      loadData(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // Função utilitária para slugify
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const loadData = async (compId?: string) => {
    setLoading(true);
    const data = await getAdminData(compId);
    setCompanies(data.companies);
    setCategories(data.categories);
    setTerms(data.terms);
    setBlogPosts(data.blogPosts);
    setAutoLinks(data.autoLinks || []);
    
    const targetCompId = compId || selectedCompanyId || (data.companies.length > 0 ? data.companies[0].id : '');
    if (targetCompId) {
      setSelectedCompanyId(targetCompId);
      const comp = data.companies.find(c => c.id === targetCompId);
      if (comp) {
        setCompanyForm(comp);
        setCompetitorUrlsRaw(comp.competitor_urls ? comp.competitor_urls.join(', ') : '');
        setIsEditingCompany(true);
      }
      const hunterRes = await getHunterSuggestions(targetCompId);
      if (hunterRes.success) {
        setHunterSuggestions(hunterRes.data || []);
      }
    }
    setLoading(false);
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Salvar Empresa
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.slug) {
      showMsg('error', 'Nome e Slug da Empresa são obrigatórios.');
      return;
    }
    setActionLoading(true);
    const competitor_urls = competitorUrlsRaw
      ? competitorUrlsRaw.split(',').map(url => url.trim()).filter(url => url.length > 0)
      : [];
    
    const payload = { 
      ...companyForm, 
      competitor_urls,
      redirect_to_company_id: companyForm.redirect_to_company_id || null 
    };

    const res = await saveCompany(payload);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', isEditingCompany ? 'Empresa atualizada! Invasão de Esparta iniciada em segundo plano.' : 'Empresa cadastrada! Invasão de Esparta iniciada em segundo plano.');
      
      // Chamar autopiloto em segundo plano para começar a gerar (Apenas 1 item para não dar timeout)
      fetch(`/api/cron/generate?token=saas-glossary-cron-secret-token-123!&count=1`)
        .then(r => r.json())
        .then(data => console.log('Autopilot iniciado:', data))
        .catch(err => console.error('Erro ao iniciar Autopilot:', err));

      setCompanyForm({ 
        name: '', slug: '', domain: '', logo_url: '', primary_color: '#25aa00', seo_title: '', seo_description: '',
        status: 'active', language: 'pt-br', redirect_to_company_id: '',
        focus_slot_1: '', focus_slot_2: '', focus_slot_3: '', whatsapp_number: '', whatsapp_phrases: [], whatsapp_avatar_url: '',
        contact_phone: '', contact_email: '', daily_limit: 3,
        business_goals: '', blog_autopilot_context: '', openai_model: 'gpt-4o-mini', default_blog_image_url: '', target_region: '', tone_of_voice: 'formal', home_url: ''
      });
      setCompetitorUrlsRaw('');
      setIsEditingCompany(false);
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao salvar empresa: ' + res.error);
    }
  };

  // Editar Empresa
  const startEditCompany = (comp: Company) => {
    setCompanyForm(comp);
    setCompetitorUrlsRaw(comp.competitor_urls ? comp.competitor_urls.join(', ') : '');
    setIsEditingCompany(true);
    setActiveTab('companies');
  };

  // Excluir Empresa
  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta empresa e todos os seus termos/categorias/posts?')) return;
    setActionLoading(true);
    const res = await deleteCompany(id);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', 'Empresa excluída com sucesso.');
      if (selectedCompanyId === id) {
        setSelectedCompanyId('');
      }
      loadData();
    } else {
      showMsg('error', 'Erro ao deletar empresa: ' + res.error);
    }
  };

  // Criar Categoria
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      showMsg('error', 'Selecione uma empresa antes.');
      return;
    }
    if (!newCatName) {
      showMsg('error', 'Nome da Categoria é obrigatório.');
      return;
    }
    const slug = newCatSlug || slugify(newCatName);
    setActionLoading(true);
    const res = await createCategory(selectedCompanyId, newCatName, slug);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', 'Categoria criada com sucesso.');
      setNewCatName('');
      setNewCatSlug('');
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao criar categoria: ' + res.error);
    }
  };

  // Excluir Categoria
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir categoria? Termos órfãos serão desvinculados.')) return;
    setActionLoading(true);
    const res = await deleteCategory(id);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', 'Categoria excluída.');
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao excluir: ' + res.error);
    }
  };

  // Salvar Termo
  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      showMsg('error', 'Selecione uma empresa.');
      return;
    }
    if (!termForm.title || !termForm.slug) {
      showMsg('error', 'Título e Slug do termo são obrigatórios.');
      return;
    }
    setActionLoading(true);
    const termPayload = { ...termForm, company_id: selectedCompanyId };
    const res = await saveTerm(termPayload);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', isEditingTerm ? 'Termo atualizado com sucesso!' : 'Termo criado com sucesso!');
      setTermForm({ title: '', slug: '', category_id: '', short_description: '', content: '', meta_title: '', meta_description: '', status: 'draft' });
      setIsEditingTerm(false);
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao salvar termo: ' + res.error);
    }
  };

  // Editar Termo
  const startEditTerm = (term: Term) => {
    setTermForm({
      id: term.id,
      company_id: term.company_id,
      category_id: term.category_id || '',
      title: term.title,
      slug: term.slug,
      short_description: term.short_description || '',
      content: term.content || '',
      meta_title: term.meta_title || '',
      meta_description: term.meta_description || '',
      status: term.status
    });
    setIsEditingTerm(true);
  };

  // Deletar Termo
  const handleDeleteTerm = async (id: string) => {
    if (!confirm('Deseja realmente deletar este termo?')) return;
    setActionLoading(true);
    const res = await deleteTerm(id);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', 'Termo deletado.');
      setSelectedTerms(prev => prev.filter(idToKeep => idToKeep !== id));
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao excluir termo: ' + res.error);
    }
  };

  // Deletar Termos em Massa
  const handleBulkDeleteTerms = async () => {
    if (selectedTerms.length === 0) return;
    if (!confirm(`Deseja realmente excluir ${selectedTerms.length} termos selecionados?`)) return;
    setActionLoading(true);
    const res = await bulkDeleteTerms(selectedTerms);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', `${selectedTerms.length} termos deletados.`);
      setSelectedTerms([]);
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao excluir termos: ' + res.error);
    }
  };

  const toggleSelectAllTerms = () => {
    if (selectedTerms.length === terms.length) {
      setSelectedTerms([]); // Deselect all
    } else {
      setSelectedTerms(terms.map(t => t.id)); // Select all
    }
  };

  const toggleSelectTerm = (id: string) => {
    setSelectedTerms(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  // Salvar Post do Blog
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      showMsg('error', 'Selecione uma empresa.');
      return;
    }
    if (!blogForm.title || !blogForm.slug) {
      showMsg('error', 'Título e Slug do artigo são obrigatórios.');
      return;
    }
    setActionLoading(true);
    const blogPayload = { ...blogForm, company_id: selectedCompanyId };
    const res = await saveBlogPost(blogPayload);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', isEditingBlog ? 'Artigo atualizado!' : 'Artigo do blog publicado!');
      setBlogForm({ title: '', slug: '', content: '', meta_title: '', meta_description: '', image_url: '', status: 'draft' });
      setIsEditingBlog(false);
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao salvar artigo: ' + res.error);
    }
  };

  // Editar Post do Blog
  const startEditBlog = (post: BlogPost) => {
    setBlogForm(post);
    setIsEditingBlog(true);
  };

  // Deletar Post do Blog
  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Deseja realmente excluir este artigo do blog?')) return;
    setActionLoading(true);
    const res = await deleteBlogPost(id);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', 'Artigo excluído do blog.');
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao excluir artigo: ' + res.error);
    }
  };

  // Salvar Link Inteligente
  const handleSaveAutoLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      showMsg('error', 'Selecione uma empresa.');
      return;
    }
    if (!autoLinkForm.keyword || !autoLinkForm.target_url) {
      showMsg('error', 'Palavra-chave e URL são obrigatórios.');
      return;
    }
    setActionLoading(true);
    const linkPayload = { ...autoLinkForm, company_id: selectedCompanyId };
    const res = await saveAutoLink(linkPayload);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', isEditingAutoLink ? 'Link inteligente atualizado!' : 'Link inteligente criado!');
      setAutoLinkForm({ keyword: '', target_url: '', limit_per_page: 1 });
      setIsEditingAutoLink(false);
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao salvar link: ' + res.error);
    }
  };

  // Excluir Link Inteligente
  const handleDeleteAutoLink = async (id: string) => {
    if (!confirm('Deseja realmente deletar este link inteligente?')) return;
    setActionLoading(true);
    const res = await deleteAutoLink(id);
    setActionLoading(false);
    if (res.success) {
      showMsg('success', 'Link inteligente deletado.');
      loadData(selectedCompanyId);
    } else {
      showMsg('error', 'Erro ao deletar link: ' + res.error);
    }
  };

  const startEditAutoLink = (link: AutoLink) => {
    setAutoLinkForm(link);
    setIsEditingAutoLink(true);
  };

  const handleGenerateImageSEO = async (type: 'term' | 'blog') => {
    const companyActive = companies.find(c => c.id === selectedCompanyId);
    const keyToUse = openaiKey || companyActive?.openai_key || '';
    
    if (!keyToUse) {
      showMsg('error', 'Insira a chave da OpenAI na aba Configuração IA ou no formulário do Cliente.');
      return;
    }

    const title = type === 'term' ? termForm.title : blogForm.title;
    const content = type === 'term' ? termForm.content : blogForm.content;
    const companyIdentity = companyActive?.company_identity || '';
    const lang = companyActive?.language || 'pt-br';

    if (!title || !content) {
      showMsg('error', 'O Título e o Conteúdo do texto precisam estar preenchidos para a IA gerar o SEO da Imagem.');
      return;
    }

    setAiLoading(true);
    const res = await generateImageSEO(keyToUse, title, content, companyIdentity, lang);
    setAiLoading(false);

    if (res.success && res.data) {
      if (type === 'term') {
        setTermForm(prev => ({ ...prev, image_alt: res.data.image_alt, image_title: res.data.image_title }));
      } else {
        setBlogForm(prev => ({ ...prev, image_alt: res.data.image_alt, image_title: res.data.image_title }));
      }
      showMsg('success', 'SEO da Imagem gerado com sucesso!');
    } else {
      showMsg('error', 'Erro ao gerar SEO da imagem: ' + res.error);
    }
  };

  // Geração de conteúdo por IA para Termo (Glossário)
  const handleAIGenerate = async () => {
    const companyActive = companies.find(c => c.id === selectedCompanyId);
    const keyToUse = openaiKey || companyActive?.openai_key || '';
    
    if (!keyToUse) {
      showMsg('error', 'Insira a chave da OpenAI na aba Configuração IA ou no formulário do Cliente.');
      return;
    }
    if (!termForm.title) {
      showMsg('error', 'Insira o Título do termo.');
      return;
    }

    setAiLoading(true);
    
    // Distribui o balanceamento de slots como sugestão automática se existir
    const activeSlotsText = companyActive 
      ? `Focos ativos da empresa: 1. ${companyActive.focus_slot_1 || ''}, 2. ${companyActive.focus_slot_2 || ''}, 3. ${companyActive.focus_slot_3 || ''}.`
      : '';

    const prompt = `Gere o termo de glossário SEO para: "${termForm.title}".
Contexto da empresa: "${companyActive?.name || ''} - ${companyActive?.seo_description || ''}".
${activeSlotsText}
Informações extras: "${aiPromptContext}".`;

    const res = await generateContentWithAI(
      keyToUse, 
      prompt, 
      '', // extraContext (já está no prompt)
      companyActive?.company_identity || '', 
      companyActive?.language || 'pt-br', 
      companyActive?.openai_model || 'gpt-4o-mini', 
      companyActive?.target_region || '',
      companyActive?.tone_of_voice || 'roi',
      [] // availableCategories
    );
    setAiLoading(false);
    
    if (res.success && res.data) {
      showMsg('success', 'Conteúdo gerado com IA e aplicado!');
      setTermForm(prev => ({
        ...prev,
        short_description: res.data.short_description,
        content: res.data.content,
        meta_title: res.data.meta_title,
        meta_description: res.data.meta_description,
          faqs: res.data.faqs,
        slug: res.data.seo_slug || prev.slug || slugify(prev.title || '')
      }));
    } else {
      showMsg('error', 'Erro na geração: ' + res.error);
    }
  };

  const handleAutoCategorize = async () => {
    if (!selectedCompanyId) {
      showMsg('error', 'Selecione uma marca primeiro.');
      return;
    }
    const companyActive = companies.find(c => c.id === selectedCompanyId);
    const keyToUse = openaiKey || companyActive?.openai_key || '';
    
    if (!keyToUse) {
      showMsg('error', 'Configure uma chave de IA (OpenAI/Gemini) nas configurações ou na marca.');
      return;
    }

    setIsCategorizing(true);
    const res = await autoCategorizeOrphans(selectedCompanyId, keyToUse);
    setIsCategorizing(false);

    if (res.success) {
      showMsg('success', res.message || 'Órfãos categorizados com sucesso!');
      loadData(selectedCompanyId);
    } else {
      showMsg('error', res.error || 'Erro ao categorizar termos.');
    }
  };

  // Geração de Artigo do Blog com IA (Texto + Capa DALL-E)
  const handleAIBlogGenerate = async () => {
    const companyActive = companies.find(c => c.id === selectedCompanyId);
    const keyToUse = openaiKey || companyActive?.openai_key || '';
    
    if (!keyToUse) {
      showMsg('error', 'Insira a chave da OpenAI na aba Configuração IA ou no formulário do Cliente.');
      return;
    }
    if (!blogForm.title) {
      showMsg('error', 'Insira o Título do artigo do Blog.');
      return;
    }

    setAiLoading(true);

    const res = await generateBlogWithAI(
      keyToUse, 
      blogForm.title, 
      blogContext, 
      companyActive?.company_identity || '', 
      companyActive?.language || 'pt-br', 
      companyActive?.openai_model || 'gpt-4o-mini', 
      companyActive?.target_region || '',
      companyActive?.tone_of_voice || 'formal'
    );
    setAiLoading(false);

    if (res.success && res.data) {
      showMsg('success', 'Artigo de Blog e imagem de destaque criados!');
      setBlogForm(prev => ({
        ...prev,
        title: res.data.optimized_h1_title || prev.title,
        content: res.data.content,
        meta_title: res.data.meta_title,
        meta_description: res.data.meta_description,
          faqs: res.data.faqs,
        slug: res.data.seo_slug || prev.slug || slugify(prev.title || ''),
        image_url: res.data.image_url
      }));
    } else {
      showMsg('error', 'Erro na geração do blog: ' + res.error);
    }
  };

  // Salvar Chave nas Configurações
  const saveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('openai_api_key', openaiKey);
    showMsg('success', 'Chave API da OpenAI salva com sucesso no navegador!');
    setActiveTab('dashboard');
  };

  const activeCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className={styles.adminContainer}>
      {/* Toast Messages */}
      {message && (
        <div className={`${styles.toast} ${message.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Sparkles className={styles.brandIcon} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ lineHeight: '1.2', letterSpacing: '1px' }}>SPARTEAM</h2>
            <span style={{ fontSize: '0.65rem', color: '#ffffff', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Conquistamos territórios digitais.
            </span>
          </div>
        </div>

        {/* Seletor de Tenant Ativo */}
        <div className={styles.tenantSelector}>
          <label>Cliente Ativo (Foco):</label>
          <select 
            value={selectedCompanyId} 
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Selecione uma empresa...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedCompanyId && activeCompany && (
            <a 
              href={`/?preview_domain=${activeCompany.domain || activeCompany.slug}`} 
              target="_blank"
              rel="noopener noreferrer"
              className={styles.previewBtnPrimary}
            >
              <Link2 size={16} style={{ marginRight: '8px' }} />
              VER CRIADO ({activeCompany.name})
            </a>
          )}
        </div>

        <nav className={styles.navMenu}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`${styles.navBtn} ${activeTab === 'dashboard' ? styles.active : ''}`}
          >
            <Settings size={18} />
            <span>Dashboard / Geral</span>
          </button>
          
          <button 
            onClick={() => { 
              setActiveTab('companies'); 
              if (selectedCompanyId) {
                const comp = companies.find(c => c.id === selectedCompanyId);
                if (comp) {
                  setCompanyForm(comp);
                  setCompetitorUrlsRaw(comp.competitor_urls ? comp.competitor_urls.join(', ') : '');
                  setIsEditingCompany(true);
                } else {
                  setIsEditingCompany(false);
                }
              } else {
                setIsEditingCompany(false);
              }
            }} 
            className={`${styles.navBtn} ${activeTab === 'companies' ? styles.active : ''}`}
          >
            <Building2 size={18} />
            <span>Clientes (Marcas)</span>
          </button>

          <button 
            onClick={() => setActiveTab('categories')} 
            disabled={!selectedCompanyId}
            className={`${styles.navBtn} ${activeTab === 'categories' ? styles.active : ''} ${!selectedCompanyId ? styles.disabled : ''}`}
          >
            <FolderPlus size={18} />
            <span>Categorias</span>
          </button>

          <button 
            onClick={() => { setActiveTab('terms'); setIsEditingTerm(false); }} 
            disabled={!selectedCompanyId}
            className={`${styles.navBtn} ${activeTab === 'terms' ? styles.active : ''} ${!selectedCompanyId ? styles.disabled : ''}`}
          >
            <BookOpen size={18} />
            <span>Termos (Glossário)</span>
          </button>

          <button 
            onClick={() => { setActiveTab('blog'); setIsEditingBlog(false); }} 
            disabled={!selectedCompanyId}
            className={`${styles.navBtn} ${activeTab === 'blog' ? styles.active : ''} ${!selectedCompanyId ? styles.disabled : ''}`}
          >
            <Newspaper size={18} />
            <span>Blog da Marca</span>
          </button>

          <button 
            onClick={() => { setActiveTab('autolinks'); setIsEditingAutoLink(false); }} 
            disabled={!selectedCompanyId}
            className={`${styles.navBtn} ${activeTab === 'autolinks' ? styles.active : ''} ${!selectedCompanyId ? styles.disabled : ''}`}
          >
            <Link2 size={18} />
            <span>Os 300 de Esparta</span>
          </button>

          <button 
            onClick={() => setActiveTab('hunter')} 
            disabled={!selectedCompanyId}
            className={`${styles.navBtn} ${activeTab === 'hunter' ? styles.active : ''} ${!selectedCompanyId ? styles.disabled : ''}`}
          >
            <Globe size={18} />
            <span>Olho de Esparta</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')} 
            className={`${styles.navBtn} ${activeTab === 'settings' ? styles.active : ''}`}
          >
            <Settings size={18} />
            <span>Configuração IA</span>
          </button>

          <Link 
            href="/admin/sparta" 
            className={styles.navBtn}
            style={{ 
              marginBottom: '0.5rem', 
              backgroundColor: '#dc2626', 
              color: '#ffffff', 
              fontWeight: 'bold',
              border: '2px solid #b91c1c',
              boxShadow: '0 4px 10px rgba(220, 38, 38, 0.4)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Sparkles size={18} fill="#ffffff" />
            <span>SPARTA (CRIAÇÃO) ⚔️</span>
          </Link>

          <Link 
            href="/admin/zeus" 
            className={styles.navBtn}
            style={{ 
              marginTop: '0.5rem', 
              backgroundColor: '#fbbf24', 
              color: '#78350f', 
              fontWeight: 'bold',
              border: '2px solid #f59e0b',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Sparkles size={18} fill="#78350f" />
            <span>MÓDULO ZEUS ⚡</span>
          </Link>

          <Link 
            href="/admin/oraculo" 
            className={styles.navBtn}
            style={{ 
              marginTop: 'auto', 
              backgroundColor: '#8b5cf6', 
              color: '#ffffff', 
              fontWeight: 'bold',
              border: '2px solid #7c3aed',
              boxShadow: '0 4px 10px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Globe size={18} fill="#ffffff" />
            <span>ORÁCULO 👁️‍🗨️</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <a 
            href={activeCompany ? `/?preview_domain=${activeCompany.domain || activeCompany.slug}` : "/"} 
            target="_blank"
            rel="noopener noreferrer"
            className={styles.backHomeBtn}
          >
            <ArrowLeft size={16} />
            {activeCompany ? `Ver Criado (${activeCompany.name})` : 'Visualizar Glossário'}
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingScreen}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Carregando dados do painel...</p>
          </div>
        ) : (
          <div className={styles.tabContent}>
            
            {/* Tab: Dashboard */}
            {activeTab === 'dashboard' && (
              <div className={styles.dashboardView}>
                <div className={styles.welcomeCard}>
                  <h1>Painel Central de Gestão - Agência</h1>
                  <p>Aqui você gerencia todas as suas marcas ativas de glossário, tráfego SEO e portabilidade.</p>
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <h3>Total de Clientes</h3>
                    <div className={styles.statVal}>{companies.length}</div>
                  </div>
                  <div className={styles.statCard}>
                    <h3>Termos Criados ({activeCompany?.name || 'Selecione'})</h3>
                    <div className={styles.statVal}>{terms.length}</div>
                  </div>
                  <div className={styles.statCard}>
                    <h3>Artigos de Blog ({activeCompany?.name || 'Selecione'})</h3>
                    <div className={styles.statVal}>{blogPosts.length}</div>
                  </div>
                </div>

                {activeCompany && (() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const termsCreatedToday = terms.filter(t => t.created_at && t.created_at.startsWith(todayStr)).length;
                  const blogsCreatedToday = blogPosts.filter(b => b.created_at && b.created_at.startsWith(todayStr)).length;
                  const totalCreatedToday = termsCreatedToday + blogsCreatedToday;
                  const dailyLimit = activeCompany.daily_limit || 30;

                  return (
                    <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} color="#fbbf24" />
                        Relatório de Produção Diária: {activeCompany.name}
                      </h2>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Data (UTC)</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
                            {new Date().toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Termos Hoje</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                            {termsCreatedToday}
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Artigos Hoje</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>
                            {blogsCreatedToday}
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Cota Diária</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: totalCreatedToday >= dailyLimit ? '#ef4444' : '#f59e0b', marginTop: '4px' }}>
                            {totalCreatedToday} / {dailyLimit}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {activeCompany && (
                  <div className={styles.infoCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2>Configuração de Integração de DNS: {activeCompany.name}</h2>
                      <span className={`${styles.statusBadge} ${activeCompany.status === 'active' ? styles.statusPub : styles.statusDraft}`}>
                        {activeCompany.status === 'active' ? 'Ativo / No Ar' : 'Pausado / Suspenso'}
                      </span>
                    </div>
                    
                    <div className={styles.dnsInstructions}>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '600' }}>
                        <Info size={18} color="#0ea5e9" /> 
                        Instruções de Apontamento DNS (Para enviar ao TI do Cliente):
                      </p>
                      <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '16px' }}>
                        Para colocar o glossário do cliente no ar de forma transparente, peça para eles criarem o seguinte registro no painel de domínio (ex: Registro.br, Cloudflare):
                      </p>
                      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', color: '#f8fafc', fontFamily: 'monospace', fontSize: '1rem', display: 'grid', gap: '12px' }}>
                        <div><span style={{ color: '#94a3b8' }}>TIPO:</span> <strong style={{ color: '#38bdf8' }}>CNAME</strong></div>
                        <div><span style={{ color: '#94a3b8' }}>NOME / HOST:</span> <strong style={{ color: '#fbbf24' }}>glossario</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>(ou o subdomínio escolhido)</span></div>
                        <div><span style={{ color: '#94a3b8' }}>DESTINO / APONTA PARA:</span> <strong style={{ color: '#34d399' }}>eugoapp.com.br</strong></div>
                      </div>
                      <p style={{ marginTop: '16px', color: '#475569', fontSize: '0.9rem', padding: '12px', backgroundColor: '#f1f5f9', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
                        <strong>Aviso:</strong> Assim que eles fizerem o apontamento e você preencher o domínio exato (ex: <em>glossario.cliente.com.br</em>) no campo de cadastro abaixo, o sistema reconhecerá automaticamente e o site será servido no piloto automático!
                      </p>
                    </div>

                    <div style={{ marginTop: '24px' }} className={styles.focusSlotsBox}>
                      <h3>Focos Ativos de Geração (Hércules):</h3>
                      <ul>
                        <li><strong>Foco 1:</strong> {activeCompany.focus_slot_1 || <span style={{color: '#94a3b8'}}>Vazio</span>}</li>
                        <li><strong>Foco 2:</strong> {activeCompany.focus_slot_2 || <span style={{color: '#94a3b8'}}>Vazio</span>}</li>
                        <li><strong>Foco 3:</strong> {activeCompany.focus_slot_3 || <span style={{color: '#94a3b8'}}>Vazio</span>}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Companies */}
            {activeTab === 'companies' && (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Form Cadastro/Edição */}
                <div className={styles.formContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>{isEditingCompany ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
                    {isEditingCompany && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCompany(false);
                          setCompanyForm({ 
                            name: '', slug: '', domain: '', logo_url: '', primary_color: '#25aa00', seo_title: '', seo_description: '',
                            status: 'active', language: 'pt-br', redirect_to_company_id: '',
                            focus_slot_1: '', focus_slot_2: '', focus_slot_3: '', whatsapp_number: '', whatsapp_phrases: [], whatsapp_avatar_url: '',
                            contact_phone: '', contact_email: '', daily_limit: 3,
                            business_goals: '', blog_autopilot_context: '',
                            openai_model: 'gpt-4o-mini', default_blog_image_url: '', target_region: '', home_url: ''
                          });
                          setCompetitorUrlsRaw('');
                        }}
                        className={styles.editBtn}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={16} />
                        Cadastrar Novo
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSaveCompany} className={styles.form}>
                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup}>
                        <label>Nome do Cliente *</label>
                        <input 
                          type="text" 
                          value={companyForm.name} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setCompanyForm(prev => ({
                              ...prev, 
                              name: val,
                              slug: isEditingCompany ? prev.slug : slugify(val)
                            }));
                          }}
                          placeholder="Ex: Maben"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fda4af', padding: '16px', borderRadius: '8px', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '-10px', left: '16px', backgroundColor: '#e11d48', color: 'white', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Módulo KRATOS 🗡️
                          </div>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <label style={{ color: '#be123c' }}>Status do Site</label>
                              <select
                                value={companyForm.status}
                                onChange={(e) => setCompanyForm(prev => ({ ...prev, status: e.target.value }))}
                                className={styles.selectInput}
                                style={{ borderColor: companyForm.status === 'inactive' ? '#e11d48' : '#e2e8f0', backgroundColor: companyForm.status === 'inactive' ? '#fff1f2' : 'white' }}
                              >
                                <option value="active">🟢 Ativo (No Ar)</option>
                                <option value="inactive">🔴 Congelado / Suspenso</option>
                              </select>
                            </div>
                            
                            {companyForm.status === 'inactive' && (
                              <div style={{ flex: 2, minWidth: '250px' }}>
                                <label style={{ color: '#be123c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Link2 size={14} /> Redirecionar Tráfego (301) Para:
                                </label>
                                <select
                                  value={companyForm.redirect_to_company_id || ''}
                                  onChange={(e) => setCompanyForm(prev => ({ ...prev, redirect_to_company_id: e.target.value || null }))}
                                  className={styles.selectInput}
                                >
                                  <option value="">Nenhum (Apenas exibir tela de erro)</option>
                                  {companies.filter(c => c.id !== companyForm.id).map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.domain || 'Sem domínio'})</option>
                                  ))}
                                </select>
                                <span style={{ fontSize: '0.75rem', color: '#9f1239', marginTop: '4px', display: 'block' }}>Todo o SEO deste cliente será transferido automaticamente.</span>
                              </div>
                            )}

                            {isEditingCompany && (
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                                <label style={{ color: '#be123c', visibility: 'hidden' }}>Excluir</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (companyForm.id) handleDeleteCompany(companyForm.id);
                                  }}
                                  style={{ padding: '0 16px', height: '42px', display: 'flex', alignItems: 'center', gap: '8px', background: '#be123c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', alignSelf: 'flex-start' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = '#9f1239'}
                                  onMouseOut={(e) => e.currentTarget.style.background = '#be123c'}
                                >
                                  <Trash2 size={16} />
                                  Excluir Projeto
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup}>
                        <label>Slug de URL *</label>
                        <input 
                          type="text" 
                          value={companyForm.slug} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                          placeholder="ex: maben"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Idioma do Glossário</label>
                        <select
                          value={companyForm.language}
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, language: e.target.value }))}
                          className={styles.selectInput}
                        >
                          <option value="pt-br">Português (PT-BR)</option>
                          <option value="en">Inglês (EN)</option>
                          <option value="es">Espanhol (ES)</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Limite Diário (Invasão de Esparta)</label>
                        <select
                          value={companyForm.daily_limit || 3}
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, daily_limit: parseInt(e.target.value, 10) }))}
                          className={styles.selectInput}
                        >
                          <option value="3">3 Itens / dia</option>
                          <option value="5">5 Itens / dia</option>
                          <option value="8">8 Itens / dia</option>
                          <option value="10">10 Itens / dia</option>
                          <option value="20">20 Itens / dia (Agressivo)</option>
                          <option value="30">30 Itens / dia (Insano)</option>
                          <option value="50">50 Itens / dia (Deus da Guerra)</option>
                          <option value="100">100 Itens / dia (Supremo Master)</option>
                        </select>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>Divididos entre glossário e blog. Conta zerada toda meia-noite UTC.</span>
                      </div>
                    </div>

                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Domínio Principal do Cliente</label>
                        <input 
                          type="text" 
                          value={companyForm.domain || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, domain: e.target.value }))}
                          placeholder="ex: glossario.maben.com.br"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>URL do Site Principal (Botão Início)</label>
                        <input 
                          type="url" 
                          value={companyForm.home_url || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, home_url: e.target.value }))}
                          placeholder="ex: https://maben.com.br"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroupRow} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={14} color="#0ea5e9" />
                          Google Search Console (Tag de Verificação HTML)
                        </label>
                        <input 
                          type="text" 
                          value={companyForm.google_site_verification || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, google_site_verification: e.target.value }))}
                          placeholder="Cole apenas o código (ex: 6lV4dKQWvvJNd...)"
                          className={styles.input}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          Acelere o onboarding colando o código gerado pelo Google aqui. Nós injetaremos a metatag <code>&lt;meta name="google-site-verification"&gt;</code> na raiz do site automaticamente.
                        </span>
                      </div>
                    </div>

                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Chave da API (OpenAI ou Gemini)</label>
                        <input 
                          type="password" 
                          value={companyForm.openai_key || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, openai_key: e.target.value }))}
                          placeholder="sk-proj-... ou AIza..."
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Modelo IA (Hércules)</label>
                        <select
                          value={companyForm.openai_model || 'gpt-4o-mini'}
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, openai_model: e.target.value }))}
                          className={styles.selectInput}
                        >
                          <optgroup label="Google Gemini">
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Super Rápido & Barato)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Avançado)</option>
                          </optgroup>
                          <optgroup label="OpenAI">
                            <option value="gpt-4o-mini">GPT-4o-Mini (Padrão OpenAI)</option>
                            <option value="gpt-4o">GPT-4o (Avançado, Completo)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="o1-preview">o1-Preview (Raciocínio Lógico)</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>



                                        <h3 style={{ marginTop: '24px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>Identidade Visual</h3>
                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>URL do Logo</label>
                        <input 
                          type="text" 
                          value={companyForm.logo_url || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, logo_url: e.target.value }))}
                          placeholder="https://site.com/logo.png"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Cor Principal</label>
                        <div className={styles.colorPickerWrapper}>
                          <input 
                            type="color" 
                            value={companyForm.primary_color || '#25aa00'} 
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, primary_color: e.target.value }))}
                            className={styles.colorPicker}
                          />
                          <input 
                            type="text" 
                            value={companyForm.primary_color || '#25aa00'} 
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, primary_color: e.target.value }))}
                            className={styles.input}
                            style={{width: '100px'}}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Imagem Mestra dos Termos</label>
                        <input 
                          type="text" 
                          value={companyForm.default_term_image_url || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, default_term_image_url: e.target.value }))}
                          placeholder="https://site.com/glossario-bg.jpg"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Imagem Mestra do Blog</label>
                        <input 
                          type="text" 
                          value={companyForm.default_blog_image_url || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, default_blog_image_url: e.target.value }))}
                          placeholder="https://site.com/blog-bg.jpg"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <h3 style={{ marginTop: '24px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>Atendimento e WhatsApp</h3>
                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>WhatsApp (com DDD)</label>
                        <input 
                          type="text" 
                          value={companyForm.whatsapp_number || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                          placeholder="Ex: 5511999999999"
                          className={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px dashed #22c55e', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>🤖</span> Configurações do WhatsApp (IA)
                          </h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                            Configure o assistente flutuante de WhatsApp e gere CTAs dinâmicos automaticamente.
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={handleGenerateWhatsApp}
                          disabled={isGeneratingWp}
                          style={{ 
                            padding: '10px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: isGeneratingWp ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          {isGeneratingWp ? 'Gerando...' : '✨ Gerar CTAs com IA'}
                        </button>
                      </div>
                      
                      <div className={styles.formGroupRow}>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                          <label style={{ color: '#166534' }}>URL do Avatar do Atendente (Foto)</label>
                          <input 
                            type="text" 
                            value={companyForm.whatsapp_avatar_url || ''} 
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, whatsapp_avatar_url: e.target.value }))}
                            placeholder="https://images.unsplash.com/..."
                            className={styles.input}
                            style={{ borderColor: '#bbf7d0' }}
                          />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 2 }}>
                          <label style={{ color: '#166534' }}>Frases de Conversão (uma por linha)</label>
                          <textarea 
                            value={Array.isArray(companyForm.whatsapp_phrases) ? companyForm.whatsapp_phrases.join('\n') : (companyForm.whatsapp_phrases || '')} 
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, whatsapp_phrases: e.target.value.split('\n') }))}
                            placeholder="Fale com um Especialista\nTá passando calor? Clica aqui!"
                            className={styles.input}
                            style={{ height: '100px', resize: 'vertical', borderColor: '#bbf7d0' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup}>
                        <label>Telefone de Contato (Exibido no Cabeçalho)</label>
                        <input 
                          type="text" 
                          value={companyForm.contact_phone || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="Ex: (11) 99999-9999"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>E-mail de Contato (Exibido no Cabeçalho)</label>
                        <input 
                          type="email" 
                          value={companyForm.contact_email || ''} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="Ex: contato@empresa.com"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--admin-border)' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Canais de Foco Semântico (Hércules)</h4>
                      <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
                        <label>Slot de Foco 1</label>
                        <input type="text" value={companyForm.focus_slot_1 || ''} onChange={(e) => setCompanyForm(prev => ({ ...prev, focus_slot_1: e.target.value }))} placeholder="Ex: Parafusos Allen para mecânica pesada" className={styles.input} />
                      </div>
                      <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
                        <label>Slot de Foco 2</label>
                        <input type="text" value={companyForm.focus_slot_2 || ''} onChange={(e) => setCompanyForm(prev => ({ ...prev, focus_slot_2: e.target.value }))} placeholder="Ex: Parafusos sextavados de aço inox" className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Slot de Foco 3</label>
                        <input type="text" value={companyForm.focus_slot_3 || ''} onChange={(e) => setCompanyForm(prev => ({ ...prev, focus_slot_3: e.target.value }))} placeholder="Ex: Ferramentas manuais e brocas" className={styles.input} />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Região Alvo (Local SEO)</label>
                      <input 
                        type="text" 
                        value={companyForm.target_region || ''} 
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, target_region: e.target.value }))}
                        placeholder="Ex: Barueri, Alphaville, São Paulo"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Persona de Redação da IA (Customizável)</label>
                      <textarea 
                        className={styles.input}
                        value={companyForm.tone_of_voice || ''}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, tone_of_voice: e.target.value }))}
                        rows={4}
                        placeholder="Ex: Você é um vendedor especialista focado em fechar serviços de alto ticket. Use um tom firme, profissional, apelo à segurança e mostre urgência. O público-alvo são arquitetos de alto padrão e síndicos."
                        style={{ resize: 'vertical' }}
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>Descreva detalhadamente quem a IA deve encarnar (Tom de voz, público alvo, nível de agressividade).</small>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Identidade da Marca (Quem somos? - Âncora do Hércules)</label>
                      <textarea 
                        value={companyForm.company_identity || ''} 
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, company_identity: e.target.value }))}
                        placeholder="Ex: Somos a MABEN, fornecedora de parafusos e ferramentas manuais, maior da zona oeste de São Paulo. B2B focado em indústrias."
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Objetivos de Negócio (ex: Escalar no Google e gerar autoridade)</label>
                      <textarea 
                        value={companyForm.business_goals || ''} 
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, business_goals: e.target.value }))}
                        placeholder="Ex: Escalar no Google, gerar autoridade e atrair leads qualificados para o setor industrial de parafusos."
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Contexto Geral para o Blog (Hércules)</label>
                      <textarea 
                        value={companyForm.blog_autopilot_context || ''} 
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, blog_autopilot_context: e.target.value }))}
                        placeholder="Ex: Escreva artigos de blog sobre manutenção mecânica, a importância de fixadores de qualidade na segurança industrial, etc."
                        className={styles.textarea}
                        rows={4}
                      />
                    </div>

                    <div className={styles.formGroupRow}>
                      <div className={styles.formGroup}>
                        <label>URLs Concorrentes (Olho de Esparta - Separar por vírgula)</label>
                        <input 
                          type="text" 
                          value={competitorUrlsRaw} 
                          onChange={(e) => setCompetitorUrlsRaw(e.target.value)}
                          placeholder="https://concorrente.com.br/blog, https://outro.com/sitemap.xml"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Modo de Ação do Olho de Esparta</label>
                        <select 
                          value={companyForm.hunter_mode || 'manual'} 
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, hunter_mode: e.target.value as 'manual' | 'auto' }))}
                          className={styles.selectInput}
                        >
                          <option value="manual">Aprovação Manual (Sugere pautas no Painel)</option>
                          <option value="auto">Invasão de Esparta (Cria posts automaticamente)</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      {isEditingCompany && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditingCompany(false);
                            setCompanyForm({ 
                              name: '', slug: '', domain: '', logo_url: '', primary_color: '#25aa00', seo_title: '', seo_description: '',
                              status: 'active', language: 'pt-br', redirect_to_company_id: '',
                              focus_slot_1: '', focus_slot_2: '', focus_slot_3: '', whatsapp_number: '', whatsapp_phrases: [], whatsapp_avatar_url: '',
                              contact_phone: '', contact_email: '', daily_limit: 3,
                              business_goals: '', blog_autopilot_context: '', company_identity: '', hunter_mode: 'manual',
                              openai_model: 'gpt-4o-mini', default_blog_image_url: '', target_region: '', home_url: ''
                            });
                          }}
                          className={styles.cancelBtn}
                        >
                          Cancelar
                        </button>
                      )}
                      <button type="submit" disabled={actionLoading} className={styles.saveBtn}>
                        <Save size={16} />
                        {actionLoading ? 'Salvando...' : 'Salvar Marca'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Tab: Categories */}
            {activeTab === 'categories' && (
              <div className={styles.splitLayout}>
                <div className={styles.formContainer}>
                  <h2>Nova Categoria para {activeCompany?.name}</h2>
                  <form onSubmit={handleCreateCategory} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label>Nome da Categoria</label>
                      <input 
                        type="text" 
                        value={newCatName} 
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Ex: Fixadores"
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Slug (Opcional)</label>
                      <input 
                        type="text" 
                        value={newCatSlug} 
                        onChange={(e) => setNewCatSlug(slugify(e.target.value))}
                        placeholder="ex: fixadores"
                        className={styles.input}
                      />
                    </div>
                    <button type="submit" disabled={actionLoading} className={styles.saveBtn}>
                      <Plus size={16} />
                      Adicionar Categoria
                    </button>
                  </form>
                </div>

                <div className={styles.listContainer}>
                  <h2>Categorias Ativas</h2>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Slug</th>
                          <th style={{width: '60px'}}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(cat => (
                          <tr key={cat.id}>
                            <td className={styles.tdBold}>{cat.name}</td>
                            <td>{cat.slug}</td>
                            <td>
                              <button onClick={() => handleDeleteCategory(cat.id)} className={styles.deleteBtn}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Terms */}
            {activeTab === 'terms' && (
              <div className={styles.splitLayoutVertical}>
                <div className={styles.fullFormContainer}>
                  <div className={styles.formHeader}>
                    <h2>{isEditingTerm ? 'Editar Termo' : 'Criar Novo Termo no Glossário'}</h2>
                    <span className={styles.subTitleSpan}>Marca: {activeCompany?.name}</span>
                  </div>

                  <form onSubmit={handleSaveTerm} className={styles.adminTermForm}>
                    <div className={styles.termFormGrid}>
                      <div className={styles.termFormLeft}>
                        <div className={styles.formGroup}>
                          <label>Título do Termo *</label>
                          <input 
                            type="text" 
                            value={termForm.title || ''} 
                            onChange={(e) => {
                              const title = e.target.value;
                              setTermForm(prev => ({
                                ...prev,
                                title,
                                slug: isEditingTerm ? prev.slug : slugify(title)
                              }));
                            }}
                            placeholder="Ex: Cabeça Chata"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.formGroupRow}>
                          <div className={styles.formGroup}>
                            <label>Slug de URL *</label>
                            <input 
                              type="text" 
                              value={termForm.slug || ''} 
                              onChange={(e) => setTermForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                              placeholder="ex: cabeca-chata"
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label>Categoria</label>
                            <select 
                              value={termForm.category_id || ''} 
                              onChange={(e) => setTermForm(prev => ({ ...prev, category_id: e.target.value }))}
                              className={styles.selectInput}
                            >
                              <option value="">Sem Categoria</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={styles.aiHelperBlock}>
                          <div className={styles.aiHelperHeader}>
                            <Sparkles size={16} />
                            <h3>Redator Inteligente Hércules (Otimização SEO/AEO)</h3>
                          </div>
                          <div className={styles.aiHelperBody}>
                            <p className={styles.aiHelpText}>
                              Gera automaticamente em conformidade de segurança e no idioma da marca ({activeCompany?.language || 'pt-br'}).
                            </p>
                            <div className={styles.formGroup}>
                              <label>Instruções específicas para este Termo (Opcional)</label>
                              <input 
                                type="text"
                                value={aiPromptContext}
                                onChange={(e) => setAiPromptContext(e.target.value)}
                                placeholder="Foque no uso industrial deste parafuso..."
                                className={styles.input}
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={handleAIGenerate}
                              disabled={aiLoading}
                              className={styles.aiGenerateBtn}
                            >
                              {aiLoading ? (
                                <>
                                  <Loader2 className={styles.spinner} size={16} />
                                  <span>Hércules Redigindo Termo com Moderação...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={16} />
                                  <span>Gerar Termo com IA</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label>FAQs Geradas (Apenas visualização do JSON)</label>
                          <textarea 
                            value={termForm.faqs ? JSON.stringify(termForm.faqs, null, 2) : "Nenhuma FAQ gerada."} 
                            readOnly 
                            rows={4} 
                            className={styles.input} 
                            style={{backgroundColor: "#f8fafc", fontFamily: "monospace", fontSize: "12px"}} 
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Descrição Curta (AEO / Snippet)</label>
                          <textarea 
                            value={termForm.short_description || ''} 
                            onChange={(e) => setTermForm(prev => ({ ...prev, short_description: e.target.value }))}
                            placeholder="Resposta curta para assistentes de voz e robôs de busca."
                            className={styles.textarea}
                            rows={3}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Conteúdo Explicativo (HTML)</label>
                          <textarea 
                            value={termForm.content || ''} 
                            onChange={(e) => setTermForm(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Conteúdo rico estruturado."
                            className={styles.textarea}
                            rows={10}
                          />
                        </div>
                      </div>

                      <div className={styles.termFormRight}>
                        <div className={styles.metadataCard}>
                          <div className={styles.metadataCardHeader}>
                            <h3>Publicação e SEO</h3>
                          </div>
                          <div className={styles.metadataCardBody}>
                            <div className={styles.formGroup}>
                              <label>Status</label>
                              <div className={styles.radioGroup}>
                                <label className={styles.radioLabel}>
                                  <input type="radio" name="status" value="draft" checked={termForm.status === 'draft'} onChange={() => setTermForm(prev => ({ ...prev, status: 'draft' }))} /> Rascunho
                                </label>
                                <label className={styles.radioLabel}>
                                  <input type="radio" name="status" value="published" checked={termForm.status === 'published'} onChange={() => setTermForm(prev => ({ ...prev, status: 'published' }))} /> Publicado
                                </label>
                              </div>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Meta Título SEO</label>
                              <input type="text" value={termForm.meta_title || ''} onChange={(e) => setTermForm(prev => ({ ...prev, meta_title: e.target.value }))} className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Meta Descrição SEO</label>
                              <textarea value={termForm.meta_description || ''} onChange={(e) => setTermForm(prev => ({ ...prev, meta_description: e.target.value }))} className={styles.textarea} rows={4} />
                            </div>
                          </div>
                        </div>

                        <div className={styles.metadataCard}>
                          <div className={styles.metadataCardHeader}>
                            <h3>Imagem e SEO</h3>
                          </div>
                          <div className={styles.metadataCardBody}>
                            <div className={styles.formGroup}>
                              <label>URL da Imagem de Destaque</label>
                              <input type="text" value={termForm.image_url || ''} onChange={(e) => setTermForm(prev => ({ ...prev, image_url: e.target.value }))} placeholder="Deixe em branco para usar a mestra" className={styles.input} />
                              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Recomendado: 1200x630px (Proporção 1.91:1) - Ideal para Open Graph</p>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Alt Text da Imagem</label>
                              <input type="text" value={termForm.image_alt || ''} onChange={(e) => setTermForm(prev => ({ ...prev, image_alt: e.target.value }))} className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Title da Imagem</label>
                              <input type="text" value={termForm.image_title || ''} onChange={(e) => setTermForm(prev => ({ ...prev, image_title: e.target.value }))} className={styles.input} />
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleGenerateImageSEO('term')}
                              disabled={aiLoading}
                              className={styles.aiGenerateBtn}
                              style={{ width: '100%', marginTop: '10px' }}
                            >
                              {aiLoading ? <Loader2 className={styles.spinner} size={16} /> : <Sparkles size={16} />}
                              <span>Gerar SEO da Imagem 🪄</span>
                            </button>
                          </div>
                        </div>

                        <div className={styles.formActionsRight}>
                          {isEditingTerm && (
                            <button type="button" onClick={() => setIsEditingTerm(false)} className={styles.cancelBtn}>Cancelar</button>
                          )}
                          <button type="submit" disabled={actionLoading} className={styles.saveBtnFull}>
                            <Save size={16} /> Salvar Termo
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className={styles.listContainerFull}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0 }}>Termos Ativos</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={handleAutoCategorize} 
                        disabled={isCategorizing || actionLoading}
                        className={styles.saveBtn}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--admin-accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        {isCategorizing ? <Loader2 className={styles.spin} size={16} /> : <Sparkles size={16} />}
                        {isCategorizing ? 'Categorizando...' : 'Auto-Categorizar Órfãos'}
                      </button>
                      {selectedTerms.length > 0 && (
                        <button 
                          onClick={handleBulkDeleteTerms} 
                          className={styles.deleteBtn}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} /> Apagar Selecionados ({selectedTerms.length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={terms.length > 0 && selectedTerms.length === terms.length}
                              onChange={toggleSelectAllTerms}
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th>Título</th>
                          <th>Slug</th>
                          <th>Categoria</th>
                          <th>Criado em</th>
                          <th>Status</th>
                          <th style={{width: '120px', textAlign: 'center'}}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {terms.slice((termsPage - 1) * ITEMS_PER_PAGE, termsPage * ITEMS_PER_PAGE).map(t => (
                          <tr key={t.id}>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedTerms.includes(t.id)}
                                onChange={() => toggleSelectTerm(t.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td className={styles.tdBold}>{t.title}</td>
                            <td>{t.slug}</td>
                            <td>{t.category?.name || 'Sem Categoria'}</td>
                            <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {new Date(t.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${t.status === 'published' ? styles.statusPub : styles.statusDraft}`}>
                                {t.status === 'published' ? 'Publicado' : 'Rascunho'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.rowActions}>
                                <a 
                                  href={`https://${activeCompany?.domain || activeCompany?.slug}/${t.slug}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={styles.editBtn} 
                                  style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', textDecoration: 'none' }}
                                >
                                  Ver
                                </a>
                                <button onClick={() => startEditTerm(t)} className={styles.editBtn}>Editar</button>
                                <button onClick={() => handleDeleteTerm(t.id)} className={styles.deleteBtn}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {terms.length > ITEMS_PER_PAGE && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', alignItems: 'center', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <button 
                          onClick={() => setTermsPage(p => Math.max(1, p - 1))} 
                          disabled={termsPage === 1}
                          style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: termsPage === 1 ? '#f1f5f9' : 'white', cursor: termsPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500, color: '#334155' }}
                        >
                          Anterior
                        </button>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>
                          Página {termsPage} de {Math.ceil(terms.length / ITEMS_PER_PAGE)} (Total: {terms.length})
                        </span>
                        <button 
                          onClick={() => setTermsPage(p => Math.min(Math.ceil(terms.length / ITEMS_PER_PAGE), p + 1))}
                          disabled={termsPage >= Math.ceil(terms.length / ITEMS_PER_PAGE)}
                          style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: termsPage >= Math.ceil(terms.length / ITEMS_PER_PAGE) ? '#f1f5f9' : 'white', cursor: termsPage >= Math.ceil(terms.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer', fontWeight: 500, color: '#334155' }}
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Blog */}
            {activeTab === 'blog' && (
              <div className={styles.splitLayoutVertical}>
                <div className={styles.fullFormContainer}>
                  <div className={styles.formHeader}>
                    <h2>{isEditingBlog ? 'Editar Artigo' : 'Publicar Artigo no Blog'}</h2>
                    <span className={styles.subTitleSpan}>Marca: {activeCompany?.name}</span>
                  </div>

                  <form onSubmit={handleSaveBlog} className={styles.adminTermForm}>
                    <div className={styles.termFormGrid}>
                      <div className={styles.termFormLeft}>
                        <div className={styles.formGroup}>
                          <label>Título do Artigo *</label>
                          <input 
                            type="text" 
                            value={blogForm.title || ''} 
                            onChange={(e) => {
                              const title = e.target.value;
                              setBlogForm(prev => ({
                                ...prev,
                                title,
                                slug: isEditingBlog ? prev.slug : slugify(title)
                              }));
                            }}
                            placeholder="Ex: Como escolher o parafuso ideal para sua obra"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Slug de URL *</label>
                          <input 
                            type="text" 
                            value={blogForm.slug || ''} 
                            onChange={(e) => setBlogForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                            placeholder="ex: como-escolher-parafuso-ideal"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.aiHelperBlock}>
                          <div className={styles.aiHelperHeader}>
                            <Sparkles size={16} />
                            <h3>Redator de Blog com Geração de Imagem IA</h3>
                          </div>
                          <div className={styles.aiHelperBody}>
                            <p className={styles.aiHelpText}>
                              O robô Hércules vai redigir o artigo completo de blog e gerar uma **imagem fotográfica única de capa** no DALL-E (que será salva no seu CDN Supabase).
                            </p>
                            <div className={styles.formGroup}>
                              <label>Instruções / Contexto do Post (Opcional)</label>
                              <input 
                                type="text"
                                value={blogContext}
                                onChange={(e) => setBlogContext(e.target.value)}
                                placeholder="Enfatize o uso de arruelas de vedação contra vazamentos..."
                                className={styles.input}
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={handleAIBlogGenerate}
                              disabled={aiLoading}
                              className={styles.aiGenerateBtn}
                            >
                              {aiLoading ? (
                                <>
                                  <Loader2 className={styles.spinner} size={16} />
                                  <span>Gerando Texto e Banner da Capa por IA...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={16} />
                                  <span>Escrever Post & Capa por IA</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>


                        <div className={styles.formGroup}>
                          <label>Conteúdo do Artigo (HTML)</label>
                          <textarea 
                            value={blogForm.content || ''} 
                            onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Artigo de blog estruturado."
                            className={styles.textarea}
                            rows={12}
                          />
                        </div>
                      </div>

                      <div className={styles.termFormRight}>
                        <div className={styles.metadataCard}>
                          <div className={styles.metadataCardHeader}>
                            <h3>SEO e Publicação</h3>
                          </div>
                          <div className={styles.metadataCardBody}>
                            <div className={styles.formGroup}>
                              <label>Status</label>
                              <div className={styles.radioGroup}>
                                <label className={styles.radioLabel}>
                                  <input type="radio" name="blog_status" value="draft" checked={blogForm.status === 'draft'} onChange={() => setBlogForm(prev => ({ ...prev, status: 'draft' }))} /> Rascunho
                                </label>
                                <label className={styles.radioLabel}>
                                  <input type="radio" name="blog_status" value="published" checked={blogForm.status === 'published'} onChange={() => setBlogForm(prev => ({ ...prev, status: 'published' }))} /> Publicado
                                </label>
                              </div>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Meta Título SEO</label>
                              <input type="text" value={blogForm.meta_title || ''} onChange={(e) => setBlogForm(prev => ({ ...prev, meta_title: e.target.value }))} className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Meta Descrição SEO</label>
                              <textarea value={blogForm.meta_description || ''} onChange={(e) => setBlogForm(prev => ({ ...prev, meta_description: e.target.value }))} className={styles.textarea} rows={4} />
                            </div>
                          </div>
                        </div>

                        <div className={styles.metadataCard}>
                          <div className={styles.metadataCardHeader}>
                            <h3>Imagem e SEO</h3>
                          </div>
                          <div className={styles.metadataCardBody}>
                            <div className={styles.formGroup}>
                              <label>URL da Imagem de Destaque</label>
                              <input type="text" value={blogForm.image_url || ''} onChange={(e) => setBlogForm(prev => ({ ...prev, image_url: e.target.value }))} placeholder="https://site.com/imagem.jpg" className={styles.input} />
                              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Recomendado: 1200x630px (Proporção 1.91:1) - Ideal para Open Graph</p>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Alt Text da Imagem</label>
                              <input type="text" value={blogForm.image_alt || ''} onChange={(e) => setBlogForm(prev => ({ ...prev, image_alt: e.target.value }))} className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Title da Imagem</label>
                              <input type="text" value={blogForm.image_title || ''} onChange={(e) => setBlogForm(prev => ({ ...prev, image_title: e.target.value }))} className={styles.input} />
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleGenerateImageSEO('blog')}
                              disabled={aiLoading}
                              className={styles.aiGenerateBtn}
                              style={{ width: '100%', marginTop: '10px' }}
                            >
                              {aiLoading ? <Loader2 className={styles.spinner} size={16} /> : <Sparkles size={16} />}
                              <span>Gerar SEO da Imagem 🪄</span>
                            </button>
                          </div>
                        </div>

                        <div className={styles.formActionsRight}>
                          {isEditingBlog && (
                            <button type="button" onClick={() => setIsEditingBlog(false)} className={styles.cancelBtn}>Cancelar</button>
                          )}
                          <button type="submit" disabled={actionLoading} className={styles.saveBtnFull}>
                            <Save size={16} /> Salvar Artigo
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className={styles.listContainerFull}>
                  <h2>Posts Publicados no Blog</h2>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Slug</th>
                          <th>Imagem de Destaque</th>
                          <th>Criado em</th>
                          <th>Status</th>
                          <th style={{width: '120px', textAlign: 'center'}}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogPosts.slice((blogPage - 1) * ITEMS_PER_PAGE, blogPage * ITEMS_PER_PAGE).map(bp => (
                          <tr key={bp.id}>
                            <td className={styles.tdBold}>{bp.title}</td>
                            <td>{bp.slug}</td>
                            <td>
                              {bp.image_url ? (
                                <img src={bp.image_url} alt="capa" style={{ width: '60px', height: '35px', borderRadius: '4px', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>Sem Imagem</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {new Date(bp.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${bp.status === 'published' ? styles.statusPub : styles.statusDraft}`}>
                                {bp.status === 'published' ? 'Publicado' : 'Rascunho'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.rowActions}>
                                <a 
                                  href={`https://${activeCompany?.domain || activeCompany?.slug}/blog/${bp.slug}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={styles.editBtn} 
                                  style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', textDecoration: 'none' }}
                                >
                                  Ver
                                </a>
                                <button onClick={() => startEditBlog(bp)} className={styles.editBtn}>Editar</button>
                                <button onClick={() => handleDeleteBlog(bp.id)} className={styles.deleteBtn}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {blogPosts.length > ITEMS_PER_PAGE && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', alignItems: 'center', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <button 
                          onClick={() => setBlogPage(p => Math.max(1, p - 1))} 
                          disabled={blogPage === 1}
                          style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: blogPage === 1 ? '#f1f5f9' : 'white', cursor: blogPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500, color: '#334155' }}
                        >
                          Anterior
                        </button>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>
                          Página {blogPage} de {Math.ceil(blogPosts.length / ITEMS_PER_PAGE)} (Total: {blogPosts.length})
                        </span>
                        <button 
                          onClick={() => setBlogPage(p => Math.min(Math.ceil(blogPosts.length / ITEMS_PER_PAGE), p + 1))}
                          disabled={blogPage >= Math.ceil(blogPosts.length / ITEMS_PER_PAGE)}
                          style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: blogPage >= Math.ceil(blogPosts.length / ITEMS_PER_PAGE) ? '#f1f5f9' : 'white', cursor: blogPage >= Math.ceil(blogPosts.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer', fontWeight: 500, color: '#334155' }}
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Auto Links */}
            {activeTab === 'autolinks' && (
              <div className={styles.splitLayout}>
                {/* Form Criação/Edição */}
                <div className={styles.formContainer}>
                  <h2>{isEditingAutoLink ? 'Editar Link Inteligente' : 'Novo Link Inteligente'}</h2>
                  <form onSubmit={handleSaveAutoLink} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label>Palavra-Chave / Âncora *</label>
                      <input 
                        type="text" 
                        value={autoLinkForm.keyword || ''} 
                        onChange={(e) => setAutoLinkForm(prev => ({ ...prev, keyword: e.target.value }))}
                        placeholder="Ex: Parafuso"
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>URL de Destino *</label>
                      <input 
                        type="text" 
                        value={autoLinkForm.target_url || ''} 
                        onChange={(e) => setAutoLinkForm(prev => ({ ...prev, target_url: e.target.value }))}
                        placeholder="https://g.page/r/sua-empresa"
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Limite de links por página</label>
                      <input 
                        type="number" 
                        value={autoLinkForm.limit_per_page || 1} 
                        onChange={(e) => setAutoLinkForm(prev => ({ ...prev, limit_per_page: parseInt(e.target.value) }))}
                        className={styles.input}
                        min={1}
                        max={5}
                      />
                      <p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>Evita encher a página com links repetidos. O Google recomenda linkar apenas a primeira ocorrência.</p>
                    </div>
                    <div className={styles.formActions}>
                      {isEditingAutoLink && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditingAutoLink(false);
                            setAutoLinkForm({ keyword: '', target_url: '', limit_per_page: 1 });
                          }}
                          className={styles.cancelBtn}
                        >
                          Cancelar
                        </button>
                      )}
                      <button type="submit" disabled={actionLoading} className={styles.saveBtn}>
                        <Save size={16} />
                        {actionLoading ? 'Salvando...' : 'Salvar Link'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Lista de Auto Links */}
                <div className={styles.listContainer}>
                  <h2>Links Cadastrados nesta Marca</h2>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Palavra</th>
                          <th>URL</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {autoLinks.map(al => (
                          <tr key={al.id}>
                            <td className={styles.tdBold}>{al.keyword}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <a href={al.target_url} target="_blank" rel="noreferrer" style={{ color: 'var(--admin-accent)', textDecoration: 'underline' }}>
                                {al.target_url}
                              </a>
                            </td>
                            <td>
                              <div className={styles.rowActions}>
                                <button onClick={() => startEditAutoLink(al)} className={styles.editBtn}>Editar</button>
                                <button onClick={() => handleDeleteAutoLink(al.id)} className={styles.deleteBtn}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {autoLinks.length === 0 && (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                              Nenhum link automático cadastrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Hunter */}
            {activeTab === 'hunter' && (
              <div className={styles.splitLayoutVertical}>
                <div className={styles.fullFormContainer}>
                  <div className={styles.formHeader}>
                    <h2>Olho de Esparta (Sugestões de Conteúdo)</h2>
                    <span className={styles.subTitleSpan}>Marca: {activeCompany?.name}</span>
                  </div>

                  {activeCompany?.hunter_mode === 'auto' && (
                    <div className={styles.messageBox} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                      <AlertTriangle size={20} />
                      <div>
                        <strong>Modo Invasão de Esparta Ativo!</strong>
                        <p>O Olho de Esparta está configurado para gerar posts diretamente no Blog sem necessidade de aprovação manual. Nenhuma sugestão pendente aparecerá aqui.</p>
                      </div>
                    </div>
                  )}

                  <div className={styles.tableContainer} style={{ marginTop: '24px' }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Ideia / Título</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hunterSuggestions.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                              Nenhuma sugestão pendente.
                            </td>
                          </tr>
                        ) : (
                          hunterSuggestions.map(sug => (
                            <tr key={sug.id}>
                              <td>{new Date(sug.created_at).toLocaleDateString()}</td>
                              <td className={styles.tdBold}>{sug.title_idea}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    onClick={async () => {
                                      setActionLoading(true);
                                      await updateHunterSuggestionStatus(sug.id, 'approved');
                                      // Após aprovar, você pode enviar para o gerador de Blog
                                      const blogRes = await generateBlogWithAI(
      openaiKey, 
      sug.title_idea, 
      activeCompany?.blog_autopilot_context || '', 
      activeCompany?.company_identity || '', 
      activeCompany?.language || 'pt-br',
      activeCompany?.openai_model || 'gpt-4o-mini',
      activeCompany?.target_region || '',
      activeCompany?.tone_of_voice || 'formal'
    );
                                      if (blogRes.success && blogRes.data) {
                                        const slug = slugify(sug.title_idea);
                                        await saveBlogPost({
                                          company_id: activeCompany?.id,
                                          title: sug.title_idea,
                                          slug,
                                          content: blogRes.data.content,
                                          image_url: blogRes.data.image_url,
                                          status: 'published'
                                        });
                                        showMsg('success', 'Post gerado e publicado!');
                                        loadData(selectedCompanyId);
                                      } else {
                                        showMsg('error', 'Erro ao gerar post: ' + blogRes.error);
                                      }
                                      setActionLoading(false);
                                    }}
                                    className={styles.saveBtn}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                    disabled={actionLoading}
                                  >
                                    <CheckCircle size={14} /> Aprovar & Gerar Post
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      setActionLoading(true);
                                      await updateHunterSuggestionStatus(sug.id, 'rejected');
                                      showMsg('success', 'Sugestão descartada.');
                                      loadData(selectedCompanyId);
                                      setActionLoading(false);
                                    }}
                                    className={styles.deleteBtn}
                                    style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
                                    disabled={actionLoading}
                                  >
                                    <Trash2 size={14} /> Descartar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className={styles.settingsView}>
                <h2>Configuração da API de Inteligência Artificial</h2>
                <p className={styles.settingsSub}>Sua chave de API fica armazenada localmente no seu navegador para total segurança e privacidade.</p>
                
                <form onSubmit={saveApiKey} className={styles.settingsForm}>
                  <div className={styles.formGroup}>
                    <label>Chave API da OpenAI (sk-...)</label>
                    <input 
                      type="password" 
                      value={openaiKey} 
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className={styles.input}
                    />
                  </div>
                  <button type="submit" className={styles.saveBtn}>
                    <Save size={16} />
                    Salvar Configurações
                  </button>
                </form>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
