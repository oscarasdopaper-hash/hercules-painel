import React from 'react';

export default async function RegionalStorePage({ params }: { params: Promise<{ regiao: string; loja: string }> }) {
  const { regiao, loja } = await params;
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Loja Regional</h1>
      <p>Região: {regiao}</p>
      <p>Loja: {loja}</p>
      <p>Aqui você pode construir a Landing Page focada em SEO regional para o cliente.</p>
    </div>
  );
}
