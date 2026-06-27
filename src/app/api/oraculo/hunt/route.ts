import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json({ error: 'Palavra-chave é obrigatória.' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    // Se as chaves não estiverem configuradas, retornamos dados MOCKADOS para testes da interface
    if (!login || !password) {
      console.log('DATAFORSEO não configurado. Retornando dados mockados para o Oráculo.');
      
      // Simulando delay da API
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockDomains = [
        { domain: `guiado${keyword.replace(/\s+/g, '')}.com.br`, status: 'Disponível', da: 24, backlinks: 1350 },
        { domain: `portal${keyword.replace(/\s+/g, '')}.com.br`, status: 'Disponível', da: 18, backlinks: 840 },
        { domain: `${keyword.replace(/\s+/g, '')}brasil.net`, status: 'Disponível', da: 15, backlinks: 320 },
        { domain: `tudobre${keyword.replace(/\s+/g, '')}.com`, status: 'Expirado', da: 31, backlinks: 5100 },
        { domain: `dicasde${keyword.replace(/\s+/g, '')}.com.br`, status: 'Leilão', da: 12, backlinks: 150 },
      ];

      return NextResponse.json({ domains: mockDomains });
    }

    // Integração Real com a API do DataForSEO
    // Endpoint utilizado: Dataforseo Labs - Ranked Domains by Keyword
    // OBS: Em um ambiente de produção real, a lógica envolveria buscar domínios ranqueados e cruzar com uma API de WHOIS para checar disponibilidade.
    const post_array = [];
    post_array.push({
      "keyword": keyword,
      "location_code": 2076, // Brasil
      "language_code": "pt",
      "limit": 10
    });

    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_domains_by_keyword/live', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(login + ':' + password).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(post_array)
    });

    if (!response.ok) {
      throw new Error('Falha ao comunicar com a API do DataForSEO.');
    }

    const result = await response.json();
    
    // Processar e mapear a resposta real do DataForSEO
    const domains = [];
    if (result.tasks && result.tasks[0].result && result.tasks[0].result[0].items) {
      const items = result.tasks[0].result[0].items;
      for (const item of items) {
        domains.push({
          domain: item.domain,
          status: 'Verificar Disponibilidade', // DataForSEO retorna quem rankeia, não o WHOIS diretamente
          da: item.metrics?.organic?.domain_rank || 0,
          backlinks: item.metrics?.organic?.count || 0
        });
      }
    }

    return NextResponse.json({ domains });

  } catch (error: any) {
    console.error('Oraculo Hunt Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
