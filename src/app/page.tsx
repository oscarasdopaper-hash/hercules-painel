import React from 'react';
import { Metadata } from 'next';
import { getCompanyByDomain, getCategories, getTerms } from '@/lib/data';
import GlossaryExplorer from './GlossaryExplorer';

interface Props {
  params: Promise<{ domain: string }>;
}

export const revalidate = 60; // ISR cache

// Geração de metadados dinâmicos para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params;
  const company = await getCompanyByDomain(domain);

  if (!company) {
    return {
      title: 'Glossário SEO',
      description: 'Plataforma de Glossários Multi-tenant',
    };
  }

  return {
    title: company.seo_title || `Glossário de Termos - ${company.name}`,
    description: company.seo_description || `Dicionário completo de termos técnicos e conceitos da empresa ${company.name}.`,
    openGraph: {
      title: company.seo_title || `Glossário de Termos - ${company.name}`,
      description: company.seo_description || `Dicionário completo de termos técnicos e conceitos da empresa ${company.name}.`,
      type: 'website',
      url: `https://${domain}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: company.seo_title || `Glossário de Termos - ${company.name}`,
      description: company.seo_description || `Dicionário completo de termos técnicos e conceitos da empresa ${company.name}.`,
    },
    alternates: {
      canonical: `https://${domain}`,
    },
    verification: {
      google: company.google_site_verification || undefined,
    }
  };
}

export default async function GlossaryHomePage({ params }: Props) {
  const { domain } = await params;
  const company = await getCompanyByDomain(domain);

  if (!company) {
    // Caso a empresa não exista, o layout tratará a exibição do erro amigável.
    return null;
  }

  // Busca dados em paralelo para maior performance
  const [categories, terms] = await Promise.all([
    getCategories(company.id),
    getTerms({ companyId: company.id }),
  ]);

  const schemaOrgJSONLD = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: company.seo_title || `Glossário de Termos - ${company.name}`,
    url: `https://${domain}`,
    description: company.seo_description || `Dicionário completo de termos técnicos e conceitos da empresa ${company.name}.`,
    publisher: {
      '@type': 'Organization',
      name: company.name,
      logo: company.logo_url || `https://${domain}/icon.png`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSONLD) }}
      />
      <GlossaryExplorer 
        company={company} 
        categories={categories} 
        initialTerms={terms} 
      />
    </>
  );
}
