# Plano de Implementação: Dominância SEO, Identidade da Marca e Caçador Atômico

A raiz do problema de alucinação do T-9000 (ex: escrever sobre "ferramentas de marketing digitais" em vez de "ferramentas mecânicas") é a falta de uma âncora de identidade. O robô precisa saber *exatamente* quem ele está encarnando.

Este plano detalha a implementação do campo "Identidade da Marca" e das melhorias estruturais (SEO/AEO) que discutimos para blindar o sistema contra concorrência e algoritmos LLM.

## User Review Required
> [!IMPORTANT]
> **Aprovação do Plano**: Por favor, leia os passos abaixo. Como vamos alterar banco de dados, prompts de inteligência artificial e interfaces públicas, precisamos ter certeza de que o fluxo do *Caçador Atômico* atende às suas expectativas iniciais antes de codificar.

## Proposed Changes

### 1. Novo Campo de Identidade (A Âncora do T-9000)
Vamos criar a "diretriz prime" da inteligência artificial: o campo "Quem Eu Sou" (`company_identity`).

#### [MODIFY] `schema.sql` e Novo `migration.sql`
- Adicionar a coluna `company_identity TEXT` na tabela `companies`.

#### [MODIFY] `src/app/admin/actions.ts`
- Atualizar a função `saveCompany` para persistir o novo campo.
- Atualizar os prompts base (`generateContentWithAI` e `generateBlogWithAI`) para **sempre** carregar o texto: `Você é o redator da empresa: [company.name]. Quem somos: [company_identity]. Nunca fuja deste contexto de negócio.`

#### [MODIFY] `src/app/admin/page.tsx`
- Adicionar o campo de texto grande (textarea) "Identidade da Empresa (Quem Somos)" logo acima dos Objetivos de Negócio no formulário da agência.

---

### 2. Schema Markup (AEO e Featured Snippets)
Para garantir que o Google e as LLMs confiem cegamente no seu site, vamos injetar os metadados invisíveis (JSON-LD) nas páginas.

#### [MODIFY] `src/app/[domain]/blog/[slug]/page.tsx`
- Injetar o schema `Article` e `BreadcrumbList`, sinalizando ao Google que o texto é um artigo oficial, listando a empresa como Autora/Editora.

#### [MODIFY] `src/app/[domain]/letra/[letter]/[termSlug]/page.tsx` (Se aplicável, ou onde os termos abrem)
- Injetar o schema `DefinedTerm` e `FAQPage` para garantir que o glossário participe da caixinha "As Pessoas Também Perguntam" do Google.

---

### 3. Sumário Automático (Table of Contents - TOC)
Artigos densos precisam de navegação interna. O Google ama isso.

#### [MODIFY] `src/app/[domain]/blog/[slug]/page.tsx`
- Criar um script/função que leia o `post.content` antes de renderizar, extraia todos os `<h2>` e `<h3>`, insira `id`'s neles, e gere uma lista lateral flutuante ou um bloco no topo chamado "Neste Artigo".

---

### 4. O Caçador Atômico v1 (Scraping de Concorrentes)
Para a fase 1 do Caçador, não precisamos de algo absurdamente pesado, mas precisamos do conceito de "Roubo Ético de Pauta".

#### [NEW] `src/app/api/cron/hunter/route.ts`
- Um novo gatilho Cron exclusivo para o Caçador Atômico.
- **Fluxo**:
  1. Ele lê a lista de `competitor_urls` de cada empresa.
  2. Ele usa uma biblioteca leve (como o `cheerio`) para abrir a URL (ex: o blog do concorrente ou sitemap).
  3. Ele raspa as Tags `<h2>` ou títulos principais que o concorrente está falando.
  4. Ele joga essa lista para a OpenAI e pede: *"Cruze essas pautas com a nossa Identidade (`company_identity`). Quais tópicos o concorrente está falando que nós ainda não temos no banco de dados? Gere 3 títulos melhores e maiores sobre os Gaps."*
  5. Salva essas ideias no banco de dados ou diretamente na fila de geração do T-9000.

#### [MODIFY] `src/app/admin/page.tsx`
- Uma área visual na aba do Dashboard ou Cliente indicando: "Caçador Atômico encontrou X Pautas em [Concorrente]".

## Open Questions
> [!NOTE]
> 1. Sobre o **Caçador Atômico**: Para essa primeira versão, você prefere que ele *apenas extraia títulos da URL alvo e crie os posts automaticamente* (Autopilot agressivo), ou você prefere que ele crie uma aba de "Sugestões Capturadas" no Painel Admin para você **aprovar com um botão** antes de mandar o T-9000 gerar?
> 2. O campo de **Identidade da Empresa** ("Quem somos") é suficiente para travar o robô ou quer adicionar algum campo de "Público-Alvo" (ex: "B2B, Compradores de Usina, etc")?

## Verification Plan
1. Atualizar banco de dados e UI Administrativa.
2. Criar uma empresa de teste, preencher a "Identidade" ("Loja de roupas infantis") com foco ("Ferramentas") para testar se ele anula a alucinação (ele deve focar em ferramentas para roupas infantis, provando que obedeceu à identidade).
3. Testar a geração de Sumário (TOC) num artigo já existente.
4. Testar a extração de uma URL no Caçador Atômico e validar a resposta da OpenAI.
