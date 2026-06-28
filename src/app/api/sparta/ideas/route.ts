import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Aumentamos o timeout caso a requisição demore
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { companyId, limit } = await request.json();

    if (!companyId || !limit) {
      return NextResponse.json({ success: false, error: 'Faltam parâmetros' }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();
    
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

    // Calcular proporção: 75% termos, 25% blog
    const termsCount = Math.ceil(limit * 0.75);
    const blogsCount = limit - termsCount;

    // Buscar títulos existentes para evitar duplicação
    const { data: existingTerms } = await adminSupabase.from('terms').select('title').eq('company_id', companyId);
    const { data: existingBlogs } = await adminSupabase.from('blog_posts').select('title').eq('company_id', companyId);
    
    const existingTitles = [...(existingTerms || []), ...(existingBlogs || [])]
      .map(t => t.title.toLowerCase().trim())
      .join(', ');

    const slots = [company.focus_slot_1, company.focus_slot_2, company.focus_slot_3].filter(Boolean).join(', ');
    
    const prompt = `Você é um Estrategista Chefe B2B (Comandante de Esparta).
A empresa "${company.name}" (Região alvo: ${company.target_region || 'Nacional'}) precisa de um Plano de Batalha de Conteúdo.
Focos de negócio: ${slots}
Identidade da Empresa: ${company.company_identity || 'Profissional'}

SUA TAREFA:
Gere exatamente ${termsCount} títulos inéditos para o GLOSSÁRIO (termos técnicos/conceitos) e ${blogsCount} títulos inéditos para o BLOG (posts focados em dores, benefícios e região alvo).
Além do título, forneça um 'summary' (resumo) de no máximo 3 linhas explicando o ângulo do artigo, um 'meta_title' (título focado em SEO, máx 60 caracteres) e uma 'meta_description' (descrição focada em clique, máx 160 caracteres).

Evite estes títulos já existentes: ${existingTitles || 'Nenhum'}.

RETORNE APENAS UM JSON VÁLIDO no seguinte formato exato (array de objetos):
[
  { "type": "term", "title": "...", "summary": "...", "meta_title": "...", "meta_description": "..." },
  { "type": "blog", "title": "...", "summary": "...", "meta_title": "...", "meta_description": "..." }
]`;

    let rawJson = '';

    if (apiKey.trim().startsWith('AIza') || apiKey.trim().startsWith('AQ.') || (company.openai_model && company.openai_model.includes('gemini'))) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: "Retorne ESTRITAMENTE um array JSON válido, sem crases de markdown (```json), sem explicações extras.",
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json"
        }
      });
      const response = await geminiModel.generateContent(prompt);
      rawJson = response.response.text();
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: "Retorne ESTRITAMENTE um array JSON válido, sem crases." },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8
        })
      });
      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error.message || 'Erro na API da OpenAI');
      }
      rawJson = resData.choices?.[0]?.message?.content || '';
    }

    const cleanJson = rawJson.trim().replace(/^```json/, '').replace(/```$/, '');
    const ideas = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: ideas });

  } catch (error: any) {
    console.error('Sparta Ideas Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
