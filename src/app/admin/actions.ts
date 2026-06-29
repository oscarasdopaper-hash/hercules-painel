'use server';

import { getServiceSupabase } from '@/lib/supabase';
import { Company, Category, Term, BlogPost, AutoLink } from '@/lib/data';
import { GoogleGenerativeAI } from '@google/generative-ai';

const adminSupabase = getServiceSupabase();

/**
 * Cria ou atualiza um link inteligente.
 */
export async function saveAutoLink(linkData: Partial<AutoLink>) {
  try {
    const isEdit = !!linkData.id;
    const dataToSave = {
      company_id: linkData.company_id,
      keyword: linkData.keyword,
      target_url: linkData.target_url,
      limit_per_page: linkData.limit_per_page || 1
    };

    if (isEdit) {
      const { data, error } = await adminSupabase
        .from('auto_links')
        .update(dataToSave)
        .eq('id', linkData.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { success: true, data };
    } else {
      const { data, error } = await adminSupabase
        .from('auto_links')
        .insert([dataToSave])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Error saving auto link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui um link inteligente.
 */
export async function deleteAutoLink(id: string) {
  try {
    const { error } = await adminSupabase
      .from('auto_links')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting auto link:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Cria ou atualiza uma empresa com as novas configurações (idioma, slots, status, redirecionamentos).
 */
export async function saveCompany(companyData: Partial<Company>) {
  try {
    const isEdit = !!companyData.id;
    
    const dataToSave = {
      name: companyData.name,
      slug: companyData.slug,
      domain: companyData.domain || null,
      logo_url: companyData.logo_url || null,
      primary_color: companyData.primary_color || '#25aa00',
      seo_title: companyData.seo_title || null,
      seo_description: companyData.seo_description || null,
      status: companyData.status || 'active',
      language: companyData.language || 'pt-br',
      tone_of_voice: companyData.tone_of_voice || 'formal',
      redirect_to_company_id: companyData.redirect_to_company_id || null,
      focus_slot_1: companyData.focus_slot_1 || null,
      focus_slot_2: companyData.focus_slot_2 || null,
      focus_slot_3: companyData.focus_slot_3 || null,
      competitor_urls: companyData.competitor_urls || null,
      whatsapp_number: companyData.whatsapp_number || null,
      contact_phone: companyData.contact_phone || null,
      contact_email: companyData.contact_email || null,
      daily_limit: typeof companyData.daily_limit === 'number' ? companyData.daily_limit : 3,
      business_goals: companyData.business_goals || null,
      blog_autopilot_context: companyData.blog_autopilot_context || null,
      openai_key: companyData.openai_key || null,
      openai_model: companyData.openai_model || 'gpt-4o-mini',
      company_identity: companyData.company_identity || null,
      hunter_mode: companyData.hunter_mode || 'manual',
      default_term_image_url: companyData.default_term_image_url || null,
      default_blog_image_url: companyData.default_blog_image_url || null,
      target_region: companyData.target_region || null,
      google_site_verification: companyData.google_site_verification || null,
      home_url: companyData.home_url || null,
      whatsapp_phrases: companyData.whatsapp_phrases || null,
      whatsapp_avatar_url: companyData.whatsapp_avatar_url || null,
      updated_at: new Date().toISOString()
    };

    if (isEdit) {
      const { data, error } = await adminSupabase
        .from('companies')
        .update(dataToSave)
        .eq('id', companyData.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { success: true, data };
    } else {
      const { data, error } = await adminSupabase
        .from('companies')
        .insert([dataToSave])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Error saving company:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deleta uma empresa.
 */
export async function deleteCompany(id: string) {
  try {
    const { error } = await adminSupabase
      .from('companies')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cria uma categoria.
 */
export async function createCategory(companyId: string, name: string, slug: string) {
  try {
    const { data, error } = await adminSupabase
      .from('categories')
      .insert([{ company_id: companyId, name, slug }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deleta uma categoria.
 */
export async function deleteCategory(id: string) {
  try {
    const { error } = await adminSupabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cria ou atualiza um termo.
 */
export async function saveTerm(termData: Partial<Term>) {
  try {
    const isEdit = !!termData.id;
    const initial = termData.title ? termData.title.trim().charAt(0).toUpperCase() : 'A';

    const dataToSave = {
      company_id: termData.company_id,
      category_id: termData.category_id || null,
      title: termData.title,
      slug: termData.slug,
      letter: initial,
      short_description: termData.short_description || null,
      content: termData.content || null,
      meta_title: termData.meta_title || null,
      meta_description: termData.meta_description || null,
      image_url: termData.image_url || null,
      image_alt: termData.image_alt || null,
      image_title: termData.image_title || null,
      faqs: termData.faqs || null,
      status: termData.status || 'draft',
      updated_at: new Date().toISOString()
    };

    if (isEdit) {
      const { data, error } = await adminSupabase
        .from('terms')
        .update(dataToSave)
        .eq('id', termData.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { success: true, data };
    } else {
      const { data, error } = await adminSupabase
        .from('terms')
        .insert([dataToSave])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Error saving term:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deleta um termo.
 */
export async function deleteTerm(id: string) {
  try {
    const { error } = await adminSupabase
      .from('terms')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting term:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deleta múltiplos termos.
 */
export async function bulkDeleteTerms(ids: string[]) {
  try {
    const { error } = await adminSupabase
      .from('terms')
      .delete()
      .in('id', ids);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('Error bulk deleting terms:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cria ou atualiza post do blog.
 */
export async function saveBlogPost(postData: Partial<BlogPost>) {
  try {
    const isEdit = !!postData.id;

    const dataToSave = {
      company_id: postData.company_id,
      title: postData.title,
      slug: postData.slug,
      content: postData.content || null,
      meta_title: postData.meta_title || null,
      meta_description: postData.meta_description || null,
      image_url: postData.image_url || null,
      image_alt: postData.image_alt || null,
      image_title: postData.image_title || null,
      status: postData.status || 'draft',
      updated_at: new Date().toISOString()
    };

    if (isEdit) {
      const { data, error } = await adminSupabase
        .from('blog_posts')
        .update(dataToSave)
        .eq('id', postData.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { success: true, data };
    } else {
      const { data, error } = await adminSupabase
        .from('blog_posts')
        .insert([dataToSave])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Error saving blog post:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui post do blog.
 */
export async function deleteBlogPost(id: string) {
  try {
    const { error } = await adminSupabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca todos os dados da empresa de forma irrestrita para o Admin.
 */
export async function getAdminData(companyId?: string) {
  try {
    const { data: companies } = await adminSupabase
      .from('companies')
      .select('*')
      .order('name');

    let categories: Category[] = [];
    let terms: Term[] = [];
    let blogPosts: BlogPost[] = [];
    let autoLinks: AutoLink[] = [];

    if (companyId) {
      const { data: catData } = await adminSupabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      const { data: termData } = await adminSupabase
        .from('terms')
        .select('*, category:categories(*)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      const { data: blogData } = await adminSupabase
        .from('blog_posts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      const { data: linkData } = await adminSupabase
        .from('auto_links')
        .select('*')
        .eq('company_id', companyId)
        .order('keyword');

      categories = catData || [];
      terms = termData || [];
      blogPosts = blogData || [];
      autoLinks = linkData || [];
    }

    return {
      companies: companies || [],
      categories,
      terms,
      blogPosts,
      autoLinks
    };
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return { companies: [], categories: [], terms: [], blogPosts: [], autoLinks: [] };
  }
}

/**
 * Validação com a API de Moderação da OpenAI (Segurança de Conteúdo)
 */
async function checkContentModeration(apiKey: string, text: string): Promise<{ flaggeed: boolean; categories: string[] }> {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ input: text })
    });

    if (!response.ok) {
      throw new Error("Erro na API de Moderação");
    }

    const resData = await response.json();
    const result = resData.results[0];

    if (result.flagged) {
      const violatedCategories = Object.keys(result.categories).filter(key => result.categories[key] === true);
      return { flaggeed: true, categories: violatedCategories };
    }

    return { flaggeed: false, categories: [] };
  } catch (err) {
    console.error("Moderation Check Failed:", err);
    return { flaggeed: false, categories: [] }; // Fallback em caso de erro leve da api
  }
}

/**
 * Geração de conteúdo por IA utilizando OpenAI (Adaptado para Idiomas e Moderação)
 */
export async function generateContentWithAI(
  apiKey: string, 
  promptText: string, 
  extraContext: string = '',
  companyIdentity: string = '',
  language: string = 'pt-br',
  model: string = 'gpt-4o-mini',
  targetRegion: string = '',
  toneOfVoice: string = 'formal',
  availableCategories: { id: string, name: string }[] = []
) {
  try {
    // 1. Moderação de Segurança
    const modCheck = await checkContentModeration(apiKey, promptText);
    if (modCheck.flaggeed) {
      return { 
        success: false, 
        error: `Conteúdo bloqueado pelas regras de moderação. Categorias violadas: ${modCheck.categories.join(', ')}` 
      };
    }

    // 2. Idioma de Destino
    let langInstruction = "O artigo e os metadados devem ser redigidos obrigatoriamente em Português do Brasil (PT-BR).";
    if (language === 'en') {
      langInstruction = "The article and metadata must be written strictly in English (EN).";
    } else if (language === 'es') {
      langInstruction = "El artículo y los metadatos deben estar redactados estrictamente em Español (ES).";
    }

    // 3. Persona / Tom de Voz (Customizável)
    const personaInstruction = toneOfVoice 
      ? `ASSUMA A SEGUINTE PERSONA E DIRETRIZ DE REDAÇÃO: "${toneOfVoice}"` 
      : "Mantenha uma redação equilibrada, persuasiva e focada em conversão.";

    const categoriesInstruction = availableCategories.length > 0 
      ? `\nREGRA DE CATEGORIZAÇÃO: Analise o termo e escolha a melhor categoria para ele dentre a seguinte lista: ${JSON.stringify(availableCategories)}. Você deve retornar ESTRITAMENTE o "id" da categoria escolhida na chave "category_id". Se NENHUMA categoria fizer sentido, retorne null na chave "category_id".`
      : `\nNão há categorias disponíveis no momento. Retorne null na chave "category_id".`;

    const systemPrompt = `Você é o "Hércules", um redator SEO sênior especialista em fechar negócios e dominar o tráfego orgânico (pSEO). O seu objetivo não é ser um dicionário, mas sim criar páginas de altíssima conversão focadas na intenção de busca (Intent Search) de potenciais clientes.
${langInstruction}
${personaInstruction}
${categoriesInstruction}
${companyIdentity ? `\nQuem somos (Identidade da Empresa): "${companyIdentity}". MANTENHA-SE ESTRITAMENTE NESTE CONTEXTO. Você OBRIGATORIAMENTE deve se posicionar como parte desta empresa, vendendo a nossa solução. A grafia exata do nome da empresa é inegociável.` : ''}

REGRA CRÍTICA DE BRAND SAFETY E VENDA: 
Este é um texto de vendas disfarçado de conteúdo informativo. A qualquer momento de intenção de compra, você DEVE indicar EXCLUSIVAMENTE a nossa empresa (citada no contexto). NÃO mencione concorrentes. Insira a "Venda Disfarçada": pelo menos 1 a 2 vezes no texto, faça uma transição natural e persuasiva conectando o problema do usuário com a nossa solução. 

${targetRegion ? `\nREGRA DE SEO LOCAL (Região Alvo: "${targetRegion}"): Crie um "meta_title" e "meta_description" altamente focados em CTR inserindo a região organicamente. O conteúdo do artigo deve considerar a região, mas de forma sutil e conectada ao contexto de "Quem somos", sem parecer spam.` : ''}

Retorne a resposta estritamente em formato JSON com as seguintes chaves de primeiro nível:
- "category_id": O id da categoria escolhida (string) ou null.
- "seo_slug": Uma URL curta focada na palavra-chave (sem stopwords, hifenizada).
- "short_description": Resumo persuasivo (até 160 caracteres).
- "content": HTML rico. OBRIGATÓRIO ter tamanho entre 600-800 palavras. NÃO SEJA UM DICIONÁRIO NERD. Modele o conteúdo com base nas seguintes INTENÇÕES DE BUSCA (escolha as que se aplicam melhor ao título): [O que é, Benefícios, Vantagens, Tipos, Melhores, Quanto custa, Onde comprar, Vale a pena, Erros comuns, Problemas e Soluções, Mitos e Verdades]. 
  Estrutura Obrigatória do "content" (sem usar <h1>):
  1. Introdução "LLM Bait" (Parágrafo curto e direto respondendo à dúvida principal logo de cara, para otimizar para Google SGE).
  2. Subtítulos <h2> usando as Intenções de Busca listadas acima cruzadas com o tema (Ex: "Os Maiores Erros ao Escolher [Termo] em [Região]").
  3. Corpo do texto usando listas (ul/li) para escaneabilidade e negrito (strong).
  4. Pelo menos 1 parágrafo persuasivo recomendando nossa empresa como a melhor escolha.
  5. Conclusão breve fechando o assunto.
- "meta_title": Título ultra atrativo (CTR). DEVE TER A PALAVRA CHAVE EXATA ("${promptText}") e a Região ("${targetRegion}"). Tamanho: 30 a 60 caracteres.
- "meta_description": Resumo irresistível para cliques. Inclua a Palavra Chave e Região. Tamanho: 125 a 150 caracteres.
- "faqs": EXATAMENTE 5 perguntas estratégicas (FAQ) baseadas em intenções de busca. Respostas devem ser OBRIGATORIAMENTE ricas, detalhadas e longas (mínimo 3 frases). Formato: [{"question": "...", "answer": "..."}].

REGRA CRÍTICA: NÃO adicione a tag <h1> dentro do "content".
Importante: Responda APENAS com o JSON bruto, sem blocos \`\`\`json.`;

    let resultText = '';

    if (model.includes('gemini') || apiKey.trim().startsWith('AIza') || apiKey.trim().startsWith('AQ.')) {
      // Usa Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });
      const userPromptText = `Título do Artigo: "${promptText}". ${extraContext ? `\nContexto extra do artigo: "${extraContext}".` : ''}`;
      
      let result = await geminiModel.generateContent(userPromptText);

      if (!result) {
        let availableModelsStr = "";
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const data = await res.json();
          if (data.models) {
            const modelNames = data.models.map((m: any) => m.name.replace('models/', '')).join(', ');
            availableModelsStr = ` | MÁGICA REVELADA! Modelos permitidos pela sua chave: ${modelNames}`;
          } else {
            availableModelsStr = ` | A API do Google não retornou nenhum modelo para essa chave.`;
          }
        } catch (e) {
          availableModelsStr = " | (Não foi possível listar os modelos permitidos).";
        }
        throw new Error(`Falha em TODOS os modelos. Detalhes: ${allErrors.join(' | ')}${availableModelsStr}`);
      }
      
      resultText = result.response.text();
    } else {
      // Usa OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model.includes('gemini') ? 'gpt-4o-mini' : model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Título do Artigo: "${promptText}". ${extraContext ? `\nContexto extra do artigo: "${extraContext}".` : ''}` }
          ],
          temperature: (model.includes('o1') || model.includes('o3') || model.includes('5.5')) ? 1 : 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${errorDetail}`);
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(`OpenAI API Error: ${resData.error.message}`);
      }
      resultText = resData.choices?.[0]?.message?.content || '';
    }



    const match = resultText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    const cleanJson = match ? match[0] : resultText;
    const parsedData = JSON.parse(cleanJson);
    
    // Tratativa para caso a IA retorne a chave "faq" no singular
    if (parsedData.faq && !parsedData.faqs) {
      parsedData.faqs = parsedData.faq;
      delete parsedData.faq;
    }

    // Pós-processamento absoluto de Brand Safety (Garante a capitalização exata da marca)
    if (companyIdentity) {
      const escapedCompany = companyIdentity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const companyRegex = new RegExp(escapedCompany, 'gi');
      if (parsedData.meta_title) parsedData.meta_title = parsedData.meta_title.replace(companyRegex, companyIdentity);
      if (parsedData.meta_description) parsedData.meta_description = parsedData.meta_description.replace(companyRegex, companyIdentity);
      if (parsedData.short_description) parsedData.short_description = parsedData.short_description.replace(companyRegex, companyIdentity);
      if (parsedData.content) parsedData.content = parsedData.content.replace(companyRegex, companyIdentity);
    }

    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Geração de Post de Blog com Geração de Imagem por IA e upload seguro ao Supabase Storage.
 */
export async function generateBlogWithAI(
  apiKey: string,
  title: string,
  extraContext: string,
  companyIdentity: string = '',
  language: string = 'pt-br',
  model: string = 'gpt-4o-mini',
  targetRegion: string = '',
  toneOfVoice: string = 'formal'
) {
  try {
    // 1. Moderação
    const modCheck = await checkContentModeration(apiKey, `${title} ${extraContext}`);
    if (modCheck.flaggeed) {
      return { 
        success: false, 
        error: `Conteúdo bloqueado pelas regras de moderação. Categorias violadas: ${modCheck.categories.join(', ')}` 
      };
    }

    let langInstruction = "O artigo deve ser redigido obrigatoriamente em Português do Brasil (PT-BR).";
    if (language === 'en') {
      langInstruction = "The article must be written strictly in English (EN).";
    } else if (language === 'es') {
      langInstruction = "El artículo debe estar redactado estrictamente em Español (ES).";
    }

    // 3. Persona
    const personaInstruction = toneOfVoice 
      ? `ASSUMA A SEGUINTE PERSONA E DIRETRIZ DE REDAÇÃO: "${toneOfVoice}"` 
      : "Mantenha uma redação equilibrada, jornalística e persuasiva.";

    // 2. Cria o Post do Blog
    const systemPrompt = `Você é um redator chefe de portal de notícias e especialista em SEO. Crie um artigo jornalístico e editorial, longo, profundo, extremamente legível e otimizado para SEO.
${langInstruction}
${personaInstruction}
${companyIdentity ? `\nQuem somos (Identidade da Empresa): "${companyIdentity}". MANTENHA-SE ESTRITAMENTE NESTE CONTEXTO. ATENÇÃO: Você DEVE respeitar ESTRITAMENTE a forma de escrita e as letras maiúsculas/minúsculas do nome da empresa. A grafia exata é inegociável.` : ''}
${targetRegion ? `\nREGRA ESTRATÉGICA DE SEO LOCAL: Adicione obrigatoriamente a região "${targetRegion}" na "meta_description" e no "meta_title". O conteúdo do artigo deve seguir o contexto geral da empresa, não é obrigatório poluir o texto com a região alvo.` : ''}

Retorne a resposta estritamente em formato JSON com as seguintes chaves de primeiro nível:
- "seo_slug": Uma URL curta, focada puramente na palavra-chave principal do blog, separada por hífens e removendo "stop words" (de, do, da, em, para). Ex: "abracadeira-cano-u".
- "optimized_h1_title": Título H1 para leitura do usuário. Melhore o título fornecido tornando-o um título "ultra clickbait das galáxias" estilo portal de notícias (G1, UOL), muito atrativo e que gere curiosidade extrema, OBRIGATORIAMENTE mantendo a palavra-chave original.
- "content": HTML rico estruturado. MODO EDITORIAL: Escreva no formato Dinâmico e Retentivo (Tamanho alvo: entre 800 e 1.000 palavras). Use um Lide (Lead) inicial forte. Faça parágrafos extremamente CURTOS (2 a 3 frases no máximo) para facilitar escaneabilidade mobile. Use múltiplos intertítulos H2 e H3. Utilize largamente listas (ul/ol/li) e palavras em negrito (strong) para destacar conceitos-chave. É OBRIGATÓRIO gerar EXATAMENTE 3 blocos de citação <blockquote> com frases fortes de impacto visual. Posicione o 1º logo no início do texto (abaixo da introdução), o 2º no meio do texto, e o 3º próximo à conclusão.
OBRIGATÓRIO: A cada ~300 palavras, injete EXATAMENTE a tag [INJECT_RELATED_POST] em uma linha separada. Não gere blocos HTML fictícios para recomendação de leitura, apenas use a tag.
- "meta_title": Título focado em CTR (Click-Through Rate). DEVE INCLUIR A PALAVRA-CHAVE EXATA ("${title}"). PROIBIDO usar parênteses "( )" ou colchetes "[ ]" para isolar a região. A região alvo ("${targetRegion}") deve estar integrada fluidamente. Tamanho Exato: OBRIGATORIAMENTE entre 30 e 60 caracteres. IMPORTANTE: NÃO ADICIONE o nome da empresa no final do título.
- "meta_description": Resumo altamente persuasivo que complemente o título. NÃO REPITA a frase do título. DEVE INCLUIR A PALAVRA-CHAVE EXATA ("${title}") e a REGIÃO ALVO ("${targetRegion}") organicamente. Finalize incitando uma ação ou autoridade citando a empresa. Tamanho Exato: OBRIGATORIAMENTE entre 125 e 150 caracteres.
- "meta_keywords": 5 a 8 palavras-chave curtas separadas por vírgula relacionadas ao tema.

REGRA DE SEO CRÍTICA PARA O CONTEÚDO: É EXTREMAMENTE PROIBIDO utilizar a tag <h1> dentro do campo "content". O título principal da página é injetado externamente. Use <h2> como o maior nível de título dentro do conteúdo.

Importante: Não adicione blocos de markdown adicionais como \`\`\`json no início ou no fim. Responda apenas com o JSON bruto válido.`;

    const userPrompt = `Título do Artigo: "${title}". Contexto extra do artigo: "${extraContext}".`;

    let resultText = '';

    if (model.includes('gemini') || apiKey.trim().startsWith('AIza') || apiKey.trim().startsWith('AQ.')) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });
      let result = await geminiModel.generateContent(userPrompt);

      if (!result) {
        let availableModelsStr = "";
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const data = await res.json();
          if (data.models) {
            const modelNames = data.models.map((m: any) => m.name.replace('models/', '')).join(', ');
            availableModelsStr = ` | MÁGICA REVELADA! Modelos permitidos pela sua chave: ${modelNames}`;
          } else {
            availableModelsStr = ` | A API do Google não retornou nenhum modelo para essa chave.`;
          }
        } catch (e) {
          availableModelsStr = " | (Não foi possível listar os modelos permitidos).";
        }
        throw new Error(`Falha em TODOS os modelos. Detalhes: ${allErrors.join(' | ')}${availableModelsStr}`);
      }
      
      resultText = result.response.text();
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model.includes('gemini') ? 'gpt-4o-mini' : model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: (model.includes('o1') || model.includes('o3') || model.includes('5.5')) ? 1 : 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Chat Completion Error: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(`OpenAI API Error: ${resData.error.message}`);
      }
      resultText = resData.choices?.[0]?.message?.content || '';
    }

    const match = resultText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    const cleanJson = match ? match[0] : resultText;
    const blogJson = JSON.parse(cleanJson);

    // Pós-processamento absoluto de Brand Safety (Garante a capitalização exata da marca)
    if (companyIdentity) {
      const escapedCompany = companyIdentity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const companyRegex = new RegExp(escapedCompany, 'gi');
      if (blogJson.meta_title) blogJson.meta_title = blogJson.meta_title.replace(companyRegex, companyIdentity);
      if (blogJson.meta_description) blogJson.meta_description = blogJson.meta_description.replace(companyRegex, companyIdentity);
      if (blogJson.content) blogJson.content = blogJson.content.replace(companyRegex, companyIdentity);
      if (blogJson.optimized_h1_title) blogJson.optimized_h1_title = blogJson.optimized_h1_title.replace(companyRegex, companyIdentity);
    }

    return {
      success: true,
      data: {
        seo_slug: blogJson.seo_slug || null,
        optimized_h1_title: blogJson.optimized_h1_title || title,
        content: blogJson.content,
        image_url: null, // DALL-E removido, agora usa imagem manual
        meta_title: blogJson.meta_title || null,
        meta_description: blogJson.meta_description || null,
        meta_keywords: blogJson.meta_keywords || null
      }
    };
  } catch (error: any) {
    console.error('Blog Generation Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca sugestões do Caçador Atômico
 */
export async function getHunterSuggestions(companyId: string) {
  try {
    const { data, error } = await adminSupabase
      .from('hunter_suggestions')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching hunter suggestions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza o status de uma sugestão do Caçador Atômico (approved, rejected)
 */
export async function updateHunterSuggestionStatus(id: string, status: string) {
  try {
    const { error } = await adminSupabase
      .from('hunter_suggestions')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating hunter suggestion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Gera os metadados de SEO para uma imagem com base no conteúdo
 */
export async function generateImageSEO(apiKey: string, title: string, content: string, companyIdentity: string, lang: string) {
  try {
    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) throw new Error('API Key não fornecida');
    }

    const langInstruction = lang === 'en' ? 'Idioma: INGLÊS' : lang === 'es' ? 'Idioma: ESPANHOL' : 'Idioma: PORTUGUÊS DO BRASIL';

    const prompt = `Você é um Especialista de SEO Técnico. Sua tarefa é criar a tag ALT e a tag TITLE ideais para a imagem principal de um artigo.
Quem somos (Identidade): "${companyIdentity || 'Empresa'}".
Título do Artigo: "${title}".
Trecho do conteúdo: "${(content || '').substring(0, 800)}...".

INSTRUÇÕES:
1. O texto Alt (image_alt) deve ser descritivo, focado em acessibilidade e nas palavras-chave, sem passar de 100 caracteres.
2. O Title (image_title) deve ser curto, chamativo e focado no usuário (tool-tip), sem passar de 60 caracteres.
${langInstruction}

Responda ESTRITAMENTE em formato JSON puro, sem marcações markdown como \`\`\`json:
{
  "image_alt": "sua sugestao aqui",
  "image_title": "sua sugestao aqui"
}`;

    const extraInfo = `\n\nDiretrizes da Empresa (Siga estritamente para manter a brand persona): "${companyIdentity}"`;
    const finalPrompt = prompt + extraInfo;

    let resultText = '';

    if (apiKey.trim().startsWith('AIza') || apiKey.trim().startsWith('AQ.')) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: prompt,
        generationConfig: {
          temperature: 0.5,
          responseMimeType: "application/json"
        }
      });
      let result;
      try {
        result = await geminiModel.generateContent("Gere as tags ALT e TITLE.");
      } catch (geminiError: any) { throw geminiError; }
      resultText = result.response.text();
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error(`Chat Completion Error: ${response.status}`);
      }

      const resData = await response.json();
      resultText = resData.choices[0]?.message?.content || '';
    }

    const cleanJson = resultText.trim().replace(/^```json/, '').replace(/```$/, '');
    const data = JSON.parse(cleanJson);

    return {
      success: true,
      data: {
        image_alt: data.image_alt || '',
        image_title: data.image_title || ''
      }
    };
  } catch (error: any) {
    console.error('Image SEO Generation Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * AÇÕES DO MÓDULO ZEUS (LOCAL SEO)
 */

export async function getLocalCampaigns(companyId: string) {
  try {
    const adminSupabase = getServiceSupabase();
    const { data, error } = await adminSupabase
      .from('local_campaigns')
      .select('*, pages:local_pages(count)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, campaigns: data || [] };
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return { success: false, error: error.message };
  }
}

export async function saveLocalCampaign(companyId: string, campaignData: any) {
  try {
    const adminSupabase = getServiceSupabase();
    const payload = {
      company_id: companyId,
      service_name: campaignData.service_name,
      target_cities: campaignData.target_cities,
      hero_image_url: campaignData.hero_image_url || null,
      status: campaignData.status || 'active'
    };

    if (campaignData.id) {
      const { error } = await adminSupabase
        .from('local_campaigns')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', campaignData.id);
      if (error) throw error;
    } else {
      const { error } = await adminSupabase
        .from('local_campaigns')
        .insert([payload]);
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving campaign:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteLocalCampaign(campaignId: string) {
  try {
    const adminSupabase = getServiceSupabase();
    const { error } = await adminSupabase
      .from('local_campaigns')
      .delete()
      .eq('id', campaignId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return { success: false, error: error.message };
  }
}

export async function getLocalCampaignPages(campaignId: string) {
  try {
    const adminSupabase = getServiceSupabase();
    const { data, error } = await adminSupabase
      .from('local_pages')
      .select('city, slug, status, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, pages: data || [] };
  } catch (error: any) {
    console.error('Error fetching campaign pages:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Gera CTAs de WhatsApp via IA baseados na identidade e tom de voz
 */
export async function generateWhatsAppCTAs(apiKey: string, identity: string, toneOfVoice: string) {
  try {
    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) throw new Error('API Key não fornecida');
    }

    let personaInstruction = "Linguagem profissional, direta e clara.";
    if (toneOfVoice === 'comercial') {
      personaInstruction = "Foco extremo em conversão. Use linguagem comercial forte, gatilhos de urgência, chamadas para ação impulsionadoras. O objetivo é fazer o leitor clicar e iniciar o atendimento.";
    } else if (toneOfVoice === 'tecnico') {
      personaInstruction = "Foco em precisão, solução de problemas complexos e autoridade. Mostre que somos especialistas e podemos resolver o problema técnico dele.";
    } else if (toneOfVoice === 'envolvente') {
      personaInstruction = "Linguagem amigável, criativa, carismática. Prenda a atenção com empatia.";
    }

    const prompt = `Você é um especialista em Conversão e Copywriting para WhatsApp.
O perfil da empresa (Quem Somos): "${identity || 'Empresa de prestação de serviços'}".
Instrução de Tom: "${personaInstruction}"

Crie EXATAMENTE 5 frases curtas (CTAs - Call to Actions) para um balão flutuante de WhatsApp que fica no canto do site. 
As frases devem ser dinâmicas, altamente conversivas e quebrar o gelo. 
Devem ser curtas (máximo de 8 a 12 palavras). 
Exemplos genéricos: "Fale com um Especialista", "Tá passando calor? Clica aqui!", "Resolva isso em 2 minutos!".

Responda ESTRITAMENTE em formato JSON puro (sem marcações de markdown como \`\`\`json), contendo um array de strings.
Exemplo de resposta:
["Frase 1", "Frase 2", "Frase 3"]`;

    let resultText = '';

    if (apiKey.trim().startsWith('AIza') || apiKey.trim().startsWith('AQ.')) {
            const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: prompt,
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json"
        }
      });
      let result;
      try {
        result = await geminiModel.generateContent("Gere as 5 frases de CTA.");
      } catch(e) { throw e; }
      resultText = result.response.text();
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`Chat Completion Error: ${response.status}`);
      }

      const resData = await response.json();
      resultText = resData.choices[0]?.message?.content || '';
    }

    const cleanJson = resultText.trim().replace(/^\s*\`\`\`json/, '').replace(/\`\`\`\s*$/, '');
    const data = JSON.parse(cleanJson);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error generating WhatsApp CTAs:', error);
    return { success: false, error: error.message };
  }
}

export async function autoCategorizeOrphans(companyId: string, apiKey: string) {
  try {
    const { data: categories } = await adminSupabase
      .from('categories')
      .select('id, name')
      .eq('company_id', companyId);

    if (!categories || categories.length === 0) {
      return { success: false, error: 'Nenhuma categoria cadastrada nesta marca.' };
    }

    const { data: terms } = await adminSupabase
      .from('terms')
      .select('id, title')
      .eq('company_id', companyId)
      .is('category_id', null);

    if (!terms || terms.length === 0) {
      return { success: true, message: 'Nenhum termo órfão encontrado!' };
    }

    const batchSize = 50;
    let totalCategorized = 0;

    for (let i = 0; i < terms.length; i += batchSize) {
      const batch = terms.slice(i, i + batchSize);
      
      const systemPrompt = `Você é um classificador inteligente. Sua função é analisar uma lista de Títulos de Artigos e mapeá-los para a Categoria que faz mais sentido.
Categorias Disponíveis:
${JSON.stringify(categories)}

Regras:
1. Escolha estritamente o "id" da categoria correspondente para cada termo.
2. Se nenhuma categoria for coerente, retorne null.
3. A resposta DEVE ser estritamente um array JSON no formato: [{"term_id": "ID_DO_TERMO", "category_id": "ID_DA_CATEGORIA_OU_NULL"}]
4. Responda APENAS com o JSON puro, sem blocos markdown.

Termos para categorizar:
${JSON.stringify(batch)}
`;

      let resultText = '';
      if (apiKey.trim().startsWith('AIza') || apiKey.trim().startsWith('AQ.')) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash', 
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        });
        const result = await geminiModel.generateContent("Prossiga com a categorização");
        resultText = result.response.text();
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Prossiga com a categorização' }],
            temperature: 0.2
          })
        });
        const resData = await response.json();
        resultText = resData.choices[0]?.message?.content || '';
      }

      const cleanJson = resultText.trim().replace(/^\s*\`\`\`json/, '').replace(/\`\`\`\s*$/, '');
      const mappedData = JSON.parse(cleanJson);

      for (const mapping of mappedData) {
        if (mapping.category_id) {
          await adminSupabase.from('terms').update({ category_id: mapping.category_id }).eq('id', mapping.term_id);
          totalCategorized++;
        }
      }
    }

    return { success: true, message: `${totalCategorized} termos categorizados com sucesso!` };
  } catch (error: any) {
    console.error('Error in autoCategorizeOrphans:', error);
    return { success: false, error: error.message };
  }
}
