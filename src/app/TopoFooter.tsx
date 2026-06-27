"use client";

import React, { useEffect, useState } from 'react';
import styles from './layout.module.css';

const ctas = [
  // Conquista Territorial
  "SPARTEAM: Conquistamos territórios digitais. Seu mercado já tem dono?",
  "Enquanto eles disputam cliques, a Sparteam ocupa posições.",
  "O topo não é um objetivo, é o nosso território. Avance com a Sparteam.",
  "SEO é para amadores. Nós fazemos ocupação de mercado. Bem-vindo à Sparteam.",
  "Seu concorrente piscou e nós já tomamos a primeira página. Sparteam no comando.",
  "Transforme sua empresa em um posto avançado de vendas orgânicas com a Sparteam.",
  "A guerra pelo Google se vence com estratégia, não com sorte. Chame a Sparteam.",
  "Mais que tráfego: monopólio. Conquiste sua região com a força do T-9000™.",
  "SPARTEAM: O batalhão de choque do seu crescimento orgânico.",
  "O Google é um mapa. A Sparteam sabe exatamente onde colocar sua bandeira.",
  "Não alugue espaço no Google. Compre o território inteiro com a Sparteam.",
  "Dominar a sua cidade é só o começo. Qual é o próximo território? Sparteam.",
  "Quando a Sparteam entra na guerra orgânica, a concorrência pede recuo.",
  "Nós não publicamos artigos. Nós enviamos infantaria. Sparteam no topo.",
  "Se o seu concorrente nos achar primeiro, sinto muito. Sparteam.",
  
  // Agressivas
  "Seu mercado está sendo engolido por nós. Você vai ficar assistindo?",
  "Chega de tráfego invisível. A Sparteam vai esmagar sua concorrência no Google.",
  "Perder cliques é perder dinheiro. Posicione seu exército agora.",
  "O topo não aceita covardes. Assuma a liderança absoluta com a Sparteam.",
  "Não tem desculpa para não aparecer. A Sparteam fuzila as objeções do algoritmo.",
  
  // Vendas / Conversão
  "Menos custo por clique, mais dinheiro no caixa. A Sparteam traz a infantaria de clientes.",
  "Seu funil de vendas está vazio? A Sparteam tem a munição que você precisa.",
  "Cada busca do seu cliente é dinheiro na mesa. A Sparteam faz a escolta até o seu caixa.",
  "Ataque orgânico que converte. Domine o faturamento da sua empresa hoje.",
  "Venda todos os dias, sem depender de Ads. A Sparteam constrói sua base segura.",
  
  // Corporativas
  "Estratégia militar, previsibilidade e resultados. A parceira do seu crescimento corporativo.",
  "Autoridade digital construída com excelência tática. Conheça a Sparteam.",
  "Posicionamento estratégico no maior campo de batalha do mundo. Sparteam entrega previsibilidade.",
  "O ativo digital mais seguro da sua marca é o território conquistado. Fortaleça-o com a Sparteam.",
  "Soluções enterprise de dominação para líderes de mercado. Sparteam consolidando seu negócio."
];

export default function TopoFooter() {
  const [ctaIndex, setCtaIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Escolhe um CTA inicial aleatório no client side
    const initialIndex = Math.floor(Math.random() * ctas.length);
    setCtaIndex(initialIndex);

    // Configura o intervalo para alternar as frases a cada 6 segundos
    const intervalId = setInterval(() => {
      // Pequeno efeito de opacidade para transição suave
      setOpacity(0);
      setTimeout(() => {
        setCtaIndex((prevIndex) => (prevIndex + 1) % ctas.length);
        setOpacity(1);
      }, 500); // 500ms para trocar enquanto está invisível
    }, 6000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <a 
      href="https://sparteam.com.br" 
      target="_blank" 
      rel="noopener noreferrer" 
      className={styles.poweredBy}
      style={{ 
        textDecoration: 'none', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--tenant-primary)',
        transition: 'opacity 0.5s ease-in-out',
        opacity: opacity,
        marginTop: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ 
          color: '#000000', // Logo sempre preto
          fontWeight: '900', 
          fontSize: '0.9rem',
          letterSpacing: '1px',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          SPARTEAM
        </span>
        <span style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {ctas[ctaIndex]}
        </span>
      </div>
      <span style={{ fontSize: '0.8rem', opacity: 0.8, textDecoration: 'underline', fontWeight: '500' }}>
        Conquiste seu território. Fale com a Sparteam. 🎯
      </span>
    </a>
  );
}
