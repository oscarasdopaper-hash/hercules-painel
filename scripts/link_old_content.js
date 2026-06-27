require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const globalApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Faltando credenciais do Supabase no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Iniciando Robô de Categorização Retroativa...');

  // 1. Buscar todas as empresas ativas
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, name, openai_key, openai_model')
    .eq('status', 'active');

  if (compError || !companies) {
    console.error('Erro ao buscar empresas:', compError);
    return;
  }

  for (const company of companies) {
    console.log(`\n=================================`);
    console.log(`Empresa: ${company.name}`);
    console.log(`=================================`);

    const apiKey = company.openai_key || globalApiKey;
    if (!apiKey) {
      console.log('⚠️ Chave da OpenAI não configurada. Pulando empresa.');
      continue;
    }

    // 2. Buscar categorias dessa empresa
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('company_id', company.id);

    if (!categories || categories.length === 0) {
      console.log('⚠️ Nenhuma categoria criada para esta empresa. Pulando.');
      continue;
    }

    console.log(`Encontradas ${categories.length} categorias. Buscando termos órfãos...`);

    // 3. Buscar Termos sem categoria
    const { data: terms } = await supabase
      .from('terms')
      .select('id, title, short_description')
      .eq('company_id', company.id)
      .is('category_id', null);

    if (!terms || terms.length === 0) {
      console.log('✅ Nenhum termo órfão encontrado.');
      continue;
    }

    console.log(`🔍 Encontrados ${terms.length} termos para categorizar.`);

    let updatedCount = 0;

    // 4. Processar cada termo
    for (const term of terms) {
      try {
        const prompt = `Você é um robô de organização de conteúdo.
Temos as seguintes categorias disponíveis:
${JSON.stringify(categories, null, 2)}

Analise o seguinte termo de glossário:
Título: "${term.title}"
Resumo: "${term.short_description || ''}"

Tarefa: Retorne ESTRITAMENTE o "id" (em formato string JSON) da categoria que melhor se encaixa com este termo. 
Se NENHUMA fizer sentido, retorne null. Responda apenas com o JSON bruto:
{"category_id": "uuid-aqui"}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: company.openai_model || 'gpt-4o-mini',
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.2
          })
        });

        if (!response.ok) {
          console.error(`Erro da API da OpenAI para "${term.title}"`);
          await sleep(1000);
          continue;
        }

        const data = await response.json();
        const rawJson = data.choices[0]?.message?.content || '';
        const cleanJson = rawJson.trim().replace(/^```json/, '').replace(/```$/, '');
        
        const result = JSON.parse(cleanJson);
        const chosenCategoryId = result?.category_id;

        if (chosenCategoryId) {
          // Atualiza no banco
          const { error: updateError } = await supabase
            .from('terms')
            .update({ category_id: chosenCategoryId })
            .eq('id', term.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar "${term.title}":`, updateError.message);
          } else {
            const catName = categories.find(c => c.id === chosenCategoryId)?.name;
            console.log(`✅ [${term.title}] -> Vinculado a: ${catName}`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️ [${term.title}] -> Nenhuma categoria compatível.`);
        }

      } catch (err) {
        console.error(`Erro inesperado no termo "${term.title}":`, err.message);
      }

      // Evita limite de rate da OpenAI
      await sleep(1000);
    }

    console.log(`\n🎉 Processamento concluído para ${company.name}. ${updatedCount} termos atualizados.`);
  }

  console.log('\n✅ Script Finalizado com Sucesso.');
}

run();
