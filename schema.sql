-- Schema Consolidation para a Plataforma SaaS Multi-tenant de Glossários

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Empresas (Tenants)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE, -- ex: glossario.maben.com.br
  logo_url TEXT,
  primary_color TEXT DEFAULT '#25aa00',
  seo_title TEXT,
  seo_description TEXT,
  status TEXT DEFAULT 'active',
  language TEXT DEFAULT 'pt-br',
  redirect_to_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  focus_slot_1 TEXT,
  focus_slot_2 TEXT,
  focus_slot_3 TEXT,
  competitor_urls TEXT[],
  contact_phone TEXT,
  contact_email TEXT,
  daily_limit INTEGER DEFAULT 3,
  business_goals TEXT,
  blog_autopilot_context TEXT,
  openai_key TEXT,
  openai_model TEXT DEFAULT 'gpt-4o-mini',
  company_identity TEXT,
  hunter_mode TEXT DEFAULT 'manual',
  default_term_image_url TEXT,
  default_blog_image_url TEXT,
  target_region TEXT,
  tone_of_voice TEXT DEFAULT 'formal',
  whatsapp_phrases JSONB,
  whatsapp_avatar_url TEXT,
  home_url TEXT,
  google_site_verification TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categorias (Para classificar os termos)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug) -- O slug é único por empresa
);

-- 3. Termos (Os artigos do glossário)
CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  letter CHAR(1) NOT NULL, -- Letra inicial para o filtro A-Z
  short_description TEXT,
  content TEXT, -- Conteúdo rico/HTML gerado pela IA
  meta_title TEXT,
  meta_description TEXT,
  image_url TEXT,
  image_alt TEXT,
  image_title TEXT,
  status TEXT DEFAULT 'draft', -- draft, published
  faqs JSONB DEFAULT '[]'::jsonb, -- FAQ/People Also Ask estruturado em JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug) -- O slug do termo é único por empresa
);

-- 4. Tabela de Posts do Blog (blog_posts)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT, -- Artigo do Blog
  image_url TEXT, -- Imagem de destaque otimizada
  image_alt TEXT,
  image_title TEXT,
  meta_title TEXT, 
  meta_description TEXT,
  status TEXT DEFAULT 'draft', -- draft, published
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- 5. Tabela de Links Inteligentes (auto_links)
CREATE TABLE IF NOT EXISTS auto_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  target_url TEXT NOT NULL,
  limit_per_page INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, keyword)
);

-- 6. Tabela de Sugestões do Caçador Atômico
CREATE TABLE IF NOT EXISTS hunter_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  url_source TEXT NOT NULL,
  title_idea TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, url_source, title_idea)
);

-- 7. Tabela de Campanhas Locais (A "Matriz" que o Administrador preenche)
CREATE TABLE IF NOT EXISTS local_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- Ex: "Insulfilm Antivandalismo"
  hero_image_url TEXT, -- O link da imagem de fundo
  target_cities TEXT NOT NULL, -- Lista de cidades (Ex: "Alphaville, Barueri, Osasco")
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Páginas Locais (As páginas geradas pela IA)
CREATE TABLE IF NOT EXISTS local_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES local_campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  city TEXT NOT NULL, -- Ex: "Alphaville"
  slug TEXT NOT NULL, -- Ex: "insulfilm-antivandalismo-em-alphaville"
  content TEXT NOT NULL, -- O HTML longo de alta conversão gerado pela IA
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug) -- Impede que o mesmo slug seja gerado duas vezes na mesma empresa
);

-- 9. Índices para ganho de performance e SEO
CREATE INDEX IF NOT EXISTS idx_terms_company_id ON terms(company_id);
CREATE INDEX IF NOT EXISTS idx_terms_letter ON terms(letter);
CREATE INDEX IF NOT EXISTS idx_categories_company_id ON categories(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_hunter_suggestions_company_id ON hunter_suggestions(company_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_company_id ON blog_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_auto_links_company_id ON auto_links(company_id);

-- Índices Compostos para rotas de Next.js /[slug]
CREATE INDEX IF NOT EXISTS idx_terms_company_slug ON terms(company_id, slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_company_slug ON blog_posts(company_id, slug);
CREATE INDEX IF NOT EXISTS idx_local_pages_company_slug ON local_pages(company_id, slug);
CREATE INDEX IF NOT EXISTS idx_categories_company_slug ON categories(company_id, slug);


-- 10. Segurança (RLS - Row Level Security)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunter_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_pages ENABLE ROW LEVEL SECURITY;

-- 11. Políticas de Leitura Pública
-- Permitir que a API acesse os dados para renderizar as páginas
CREATE POLICY "Public can view companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view published terms" ON terms FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view published blog posts" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view auto links" ON auto_links FOR SELECT USING (true);
CREATE POLICY "Public cannot view hunter suggestions" ON hunter_suggestions FOR SELECT USING (false);
CREATE POLICY "Public can view local campaigns" ON local_campaigns FOR SELECT USING (true);
CREATE POLICY "Public can view local pages" ON local_pages FOR SELECT USING (true);

-- 12. Tabela do Oráculo (Buscas de Domínios Expirados)
CREATE TABLE IF NOT EXISTS oracle_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  domains_found JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE oracle_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public cannot view oracle searches" ON oracle_searches FOR SELECT USING (false);
