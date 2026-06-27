import { supabase } from './supabase';

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  seo_title: string | null;
  seo_description: string | null;
  status: string; // 'active', 'inactive'
  language: string; // 'pt-br', 'en', 'es'
  tone_of_voice?: string | null;
  redirect_to_company_id: string | null;
  focus_slot_1: string | null;
  focus_slot_2: string | null;
  focus_slot_3: string | null;
  competitor_urls: string[] | null;
  whatsapp_number: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  daily_limit: number;
  business_goals: string | null;
  blog_autopilot_context?: string | null;
  openai_key?: string | null;
  openai_model?: string | null;
  company_identity?: string | null;
  hunter_mode?: 'manual' | 'auto';
  default_blog_image_url?: string | null;
  default_term_image_url: string | null;
  target_region?: string | null;
  google_site_verification?: string | null;
  home_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Term {
  id: string;
  company_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  letter: string;
  short_description: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_title: string | null;
  status: string;
  faqs?: Array<{question: string; answer: string}> | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface HunterSuggestion {
  id: string;
  company_id: string;
  url_source: string;
  title_idea: string;
  status: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AutoLink {
  id: string;
  company_id: string;
  keyword: string;
  target_url: string;
  limit_per_page: number;
  created_at: string;
}

export interface LocalCampaign {
  id: string;
  company_id: string;
  service_name: string;
  hero_image_url: string | null;
  target_cities: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LocalPage {
  id: string;
  campaign_id: string;
  company_id: string;
  city: string;
  slug: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  campaign?: LocalCampaign;
}

// Dicionário de traduções estáticas da UI por idioma
export const translations: { [key: string]: { [key: string]: string } } = {
  'pt-br': {
    searchPlaceholder: 'Pesquise por termos, conceitos ou definições...',
    clearBtn: 'Limpar',
    categoriesTitle: 'Categorias',
    allTerms: 'Todos os termos',
    noTerms: 'Nenhum termo encontrado',
    noTermsSub: 'Tente ajustar a sua busca ou selecione outra categoria.',
    readDefinition: 'Ler definição',
    updatedAt: 'Atualizado em',
    backHome: 'Voltar para a página inicial do Glossário',
    otherTerms: 'Outros termos com',
    noRelated: 'Nenhum termo adicional listado.',
    browseLetter: 'Navegar por letra:',
    titleHero: 'Glossário de Termos e Conceitos',
    subtitleHero: 'Explore termos técnicos, definições e conceitos sobre o nosso ecossistema de mercado.',
    home: 'Início',
    admin: 'Painel',
    filteredLetter: 'Filtrado pela letra:'
  },
  'en': {
    searchPlaceholder: 'Search for terms, concepts or definitions...',
    clearBtn: 'Clear',
    categoriesTitle: 'Categories',
    allTerms: 'All terms',
    noTerms: 'No terms found',
    noTermsSub: 'Try adjusting your search or select another category.',
    readDefinition: 'Read definition',
    updatedAt: 'Updated at',
    backHome: 'Back to Glossary Home',
    otherTerms: 'Other terms with',
    noRelated: 'No additional terms listed.',
    browseLetter: 'Browse by letter:',
    titleHero: 'Glossary of Terms & Concepts',
    subtitleHero: 'Explore technical terms, definitions and concepts in our business ecosystem.',
    home: 'Home',
    admin: 'Panel',
    filteredLetter: 'Filtered by letter:'
  },
  'es': {
    searchPlaceholder: 'Buscar términos, conceptos o definiciones...',
    clearBtn: 'Limpiar',
    categoriesTitle: 'Categorías',
    allTerms: 'Todos los términos',
    noTerms: 'No se encontraron términos',
    noTermsSub: 'Intente ajustar su búsqueda o seleccione otra categoría.',
    readDefinition: 'Leer definición',
    updatedAt: 'Actualizado el',
    backHome: 'Volver al Inicio del Glosario',
    otherTerms: 'Otros términos con',
    noRelated: 'No hay más términos enumerados.',
    browseLetter: 'Navegar por letra:',
    titleHero: 'Glosario de Términos y Conceptos',
    subtitleHero: 'Explore términos técnicos, definiciones y conceptos en nuestro ecosistema comercial.',
    home: 'Inicio',
    admin: 'Panel',
    filteredLetter: 'Filtrado por la letra:'
  }
};

/**
 * Busca a empresa ativa pelo domínio ou slug.
 */
export async function getCompanyByDomain(hostOrSlug: string): Promise<Company | null> {
  let target = hostOrSlug;
  if (target.includes('localhost') || target.includes('127.0.0.1')) {
    target = 'maben';
  }

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .or(`domain.eq.${hostOrSlug},slug.eq.${target}`)
    .single();

  if (error || !data) {
    const { data: fallbackData } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (fallbackData && fallbackData.length > 0) {
      return fallbackData[0] as Company;
    }
    return null;
  }

  return data as Company;
}

/**
 * Busca redirecionamento para outra empresa caso esteja inativo
 */
export async function getRedirectCompany(company: Company): Promise<Company | null> {
  if (company.status === 'inactive' && company.redirect_to_company_id) {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company.redirect_to_company_id)
      .single();
    return data as Company | null;
  }
  return null;
}

/**
 * Busca as categorias de uma empresa.
 */
export async function getCategories(companyId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
  return data || [];
}

/**
 * Busca termos publicados de uma empresa, com filtros opcionais.
 */
export async function getTerms(params: {
  companyId: string;
  letter?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<Term[]> {
  let query = supabase
    .from('terms')
    .select('*, category:categories(*)')
    .eq('company_id', params.companyId)
    .eq('status', 'published')
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (params.letter) {
    query = query.eq('letter', params.letter.toUpperCase());
  }

  if (params.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('company_id', params.companyId)
      .eq('slug', params.categorySlug)
      .single();
    
    if (cat) {
      query = query.eq('category_id', cat.id);
    } else {
      return [];
    }
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar termos:', error);
    return [];
  }
  return data || [];
}

/**
 * Busca um termo detalhado pelo slug e empresa.
 */
export async function getTermBySlug(companyId: string, slug: string): Promise<Term | null> {
  const { data, error } = await supabase
    .from('terms')
    .select('*, category:categories(*)')
    .eq('company_id', companyId)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('created_at', new Date().toISOString())
    .single();

  if (error) {
    console.error('Erro ao buscar termo por slug:', error);
    return null;
  }
  return data;
}

/**
 * Busca posts do blog
 */
export async function getBlogPosts(companyId: string, limit?: number): Promise<BlogPost[]> {
  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'published')
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar posts de blog:', error);
    return [];
  }
  return data || [];
}

/**
 * Busca posts do blog com paginação e contagem total
 */
export async function getBlogPostsPaginated(companyId: string, limit: number, offset: number): Promise<{ posts: BlogPost[], totalCount: number }> {
  const from = offset;
  const to = offset + limit - 1;

  const { data, error, count } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .eq('status', 'published')
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Erro ao buscar posts de blog paginados:', error);
    return { posts: [], totalCount: 0 };
  }
  return { posts: data || [], totalCount: count || 0 };
}

/**
 * Busca post específico do blog por slug
 */
export async function getBlogPostBySlug(companyId: string, slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('company_id', companyId)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('created_at', new Date().toISOString())
    .single();

  if (error) {
    console.error('Erro ao buscar post do blog por slug:', error);
    return null;
  }
  return data;
}

/**
 * Busca todos os Auto Links de uma empresa
 */
export async function getAutoLinks(companyId: string): Promise<AutoLink[]> {
  const { data, error } = await supabase
    .from('auto_links')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    console.error('Erro ao buscar Auto Links:', error);
    return [];
  }
  return data || [];
}

/**
 * Motor de Linkagem Automática (Auto-Linker)
 * Substitui palavras chaves por links de forma segura usando Cheerio (AST)
 * em vez de Expressões Regulares, evitando quebrar tags HTML existentes.
 */
import * as cheerio from 'cheerio';

export function applyAutoLinks(htmlContent: string, links: AutoLink[]): string {
  if (!htmlContent || links.length === 0) return htmlContent;
  
  try {
    // Carrega o fragmento HTML
    const $ = cheerio.load(htmlContent, null, false);
    
    // Para cada link configurado, varre os nós de texto
    for (const link of links) {
      if (link.limit_per_page <= 0) continue;
      
      const escapedKeyword = link.keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Busca a palavra inteira respeitando limites
      const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])(${escapedKeyword})(?=$|[^\\p{L}\\p{N}])`, 'giu');
      
      let count = 0;
      
      // Encontra nós de texto e processa
      // Utiliza find('*') para pegar todos os elementos e examina o contents
      $('*').contents().each(function() {
        if (count >= link.limit_per_page) return false; // break if limit reached
        
        // Verifica se é um nó de texto (nodeType 3)
        if (this.type === 'text') {
          // Ignora se estiver dentro de uma tag <a> ou tag que não deve ter links
          const parentTag = $(this).parent().get(0)?.tagName?.toLowerCase();
          if (['a', 'script', 'style', 'button'].includes(parentTag || '')) return true; // continue
          
          const text = this.data;
          if (text && regex.test(text)) {
            // Conta quantas substituições seriam feitas neste nó
            const matches = text.match(regex);
            if (matches) {
              let newHtml = text;
              // Substitui respeitando o limite
              newHtml = newHtml.replace(regex, (match) => {
                if (count < link.limit_per_page) {
                  count++;
                  return `<a href="${link.target_url}" target="_blank" rel="noopener noreferrer" style="color: var(--tenant-primary); font-weight: 700; text-decoration: underline;">${match}</a>`;
                }
                return match;
              });
              
              // Substitui o nó de texto pelo HTML gerado
              $(this).replaceWith(newHtml);
            }
          }
        }
      });
    }
    
    return $.html();
  } catch (error) {
    console.error("Erro no motor de auto-link (Cheerio):", error);
    return htmlContent; // Em caso de falha severa, retorna o original seguro
  }
}

/**
 * Busca todas as Páginas Locais de uma empresa
 */
export async function getLocalPages(companyId: string, limit: number = 100): Promise<LocalPage[]> {
  const { data, error } = await supabase
    .from('local_pages')
    .select('*, campaign:local_campaigns(*)')
    .eq('company_id', companyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar páginas locais:', error);
    return [];
  }
  return data || [];
}

/**
 * Busca uma Página Local específica pelo slug
 */
export async function getLocalPageBySlug(companyId: string, slug: string): Promise<LocalPage | null> {
  const { data, error } = await supabase
    .from('local_pages')
    .select('*, campaign:local_campaigns(*)')
    .eq('company_id', companyId)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Erro ao buscar página local por slug:', error);
    return null;
  }
  return data;
}
