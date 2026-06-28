import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { companyId, title, type } = await request.json();

    if (!companyId || !title) {
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

    const prompt = `Você é o estrategista de conteúdo da empresa "${company.name}".
O usuário acabou de definir um novo título para um artigo do tipo "${type}":
TÍTULO: "${title}"

Escreva um resumo estratégico de no máximo 3 linhas explicando o que será abordado neste artigo, focando na dor do cliente e nos benefícios do serviço.
REGRA CRÍTICA: O 'meta_title' DEVE ter entre 40 e 60 caracteres e é ABSOLUTAMENTE OBRIGATÓRIO que contenha a Região Alvo e o Serviço/Produto. O título deve ser ORGÂNICO, persuasivo e natural (ex: "Películas de Privacidade: Conforto Absoluto em Alphaville"), não faça apenas "Serviço em Local - Empresa". NUNCA coloque o nome da empresa no meta_title.
REGRA CRÍTICA: A 'meta_description' DEVE ter entre 130 e 155 caracteres e é ABSOLUTAMENTE OBRIGATÓRIO que contenha a Região Alvo e o Serviço/Produto.
RETORNE APENAS UM JSON VÁLIDO no formato:
{ "summary": "...", "meta_title": "...", "meta_description": "..." }`;

    let rawJson = '';

    if (apiKey.trim().startsWith('AIza') || apiKey.trim().startsWith('AQ.') || (company.openai_model && company.openai_model.includes('gemini'))) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: "Retorne ESTRITAMENTE um objeto JSON válido. Nada mais.",
        generationConfig: {
          temperature: 0.7,
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
            { role: 'system', content: "Retorne ESTRITAMENTE um objeto JSON válido." },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error.message || 'Erro na API da OpenAI');
      }
      rawJson = resData.choices?.[0]?.message?.content || '';
    }

    const cleanJson = rawJson.trim().replace(/^```json/, '').replace(/```$/, '');
    const data = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, summary: data.summary, meta_title: data.meta_title, meta_description: data.meta_description });

  } catch (error: any) {
    console.error('Sparta Re-Summary Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
