import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateContentWithAI, generateBlogWithAI } from '@/app/admin/actions';

export const maxDuration = 60; // Max duration for a single generation

export async function POST(request: Request) {
  try {
    const { companyId, title, summary, meta_title, meta_description, type, scheduled_at } = await request.json();

    if (!companyId || !title || !type) {
      return NextResponse.json({ success: false, error: 'Faltam parâmetros obrigatórios' }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();
    
    // Buscar empresa
    const { data: company, error: compError } = await adminSupabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (compError || !company) {
      throw new Error('Empresa não encontrada');
    }

    const apiKey = company.openai_key || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Chave de API não configurada');
    }

    const slugify = (text: string) => {
      return text.toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    };

    const trimmedTitle = title.trim();
    let slug = slugify(trimmedTitle);
    
    // Verificar se já existe para evitar erro de constraint única
    if (type === 'term') {
      const { data: existing } = await adminSupabase.from('terms').select('id').eq('company_id', companyId).eq('slug', slug).single();
      if (existing) {
        throw new Error('Um termo com este slug já existe.');
      }
    } else {
      const { data: existing } = await adminSupabase.from('blog_posts').select('id').eq('company_id', companyId).eq('slug', slug).single();
      if (existing) {
        throw new Error('Um post de blog com este slug já existe.');
      }
    }

    const context = summary ? `Contexto/Resumo a ser abordado: ${summary}\n` : '';
    
    // Injeta os Canais de Foco Semântico (Serviços Alvo) para o Sequestro Comercial
    const focusContext = (company.focus_slot_1 || company.focus_slot_2 || company.focus_slot_3)
      ? `\nREGRA DE SEQUESTRO COMERCIAL: Seu objetivo final de conversão é vender os seguintes serviços/produtos: 1. ${company.focus_slot_1 || ''} | 2. ${company.focus_slot_2 || ''} | 3. ${company.focus_slot_3 || ''}. O artigo deve criar uma ponte orgânica entre a teoria e a necessidade de contratar esses serviços.`
      : '';

    const fullContext = context + (company.blog_autopilot_context || '') + focusContext;

    if (type === 'term') {
      // Produzir Termo de Glossário
      const resContent = await generateContentWithAI(
        apiKey,
        trimmedTitle,
        fullContext,
        company.company_identity || '',
        company.language || 'pt-br',
        company.openai_model || 'gpt-4o-mini',
        company.target_region || '',
        company.tone_of_voice || 'formal',
        []
      );

      if (!resContent.success || !resContent.data) {
        throw new Error(resContent.error || 'Falha ao gerar o conteúdo do termo');
      }

      const initial = trimmedTitle.charAt(0).toUpperCase();
      const finalSlug = resContent.data.seo_slug || slug;

      const { error: insertError } = await adminSupabase
        .from('terms')
        .insert([
          {
            company_id: company.id,
            category_id: null, // Pode ser categorizado depois
            title: trimmedTitle,
            slug: finalSlug,
            letter: initial,
            short_description: resContent.data.short_description || summary,
            content: resContent.data.content,
            meta_title: meta_title || resContent.data.meta_title || trimmedTitle,
            meta_description: meta_description || resContent.data.meta_description || summary,
            faqs: resContent.data.faqs || [],
            status: 'published', // Publica automaticamente após o "Sparta"
            ...(scheduled_at ? { created_at: scheduled_at } : {})
          }
        ]);

      if (insertError) throw insertError;
      return NextResponse.json({ success: true, type: 'term', title: trimmedTitle });

    } else if (type === 'blog') {
      // Produzir Post de Blog
      const blogRes = await generateBlogWithAI(
        apiKey,
        trimmedTitle,
        fullContext,
        company.company_identity || '',
        company.language || 'pt-br',
        company.openai_model || 'gpt-4o-mini',
        company.target_region || '',
        company.tone_of_voice || 'formal'
      );

      if (!blogRes.success || !blogRes.data) {
        throw new Error(blogRes.error || 'Falha ao gerar o conteúdo do blog');
      }

      const { error: insertError } = await adminSupabase
        .from('blog_posts')
        .insert([
          {
            company_id: company.id,
            title: trimmedTitle,
            slug: slug,
            content: blogRes.data.content,
            image_url: blogRes.data.image_url || null,
            meta_title: meta_title || blogRes.data.meta_title || trimmedTitle,
            meta_description: meta_description || blogRes.data.meta_description || summary,
            status: 'published',
            ...(scheduled_at ? { created_at: scheduled_at } : {})
          }
        ]);

      if (insertError) throw insertError;
      return NextResponse.json({ success: true, type: 'blog', title: trimmedTitle });
    }

    throw new Error('Tipo de conteúdo inválido');

  } catch (error: any) {
    console.error('Sparta Produce Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
