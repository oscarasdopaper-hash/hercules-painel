"use client";

import { useEffect, useState } from 'react';
import styles from '../layout.module.css';

export default function ClientWhatsApp({
  whatsappNumber,
  phrases = [],
  avatarUrl
}: {
  whatsappNumber: string;
  phrases?: string[];
  avatarUrl?: string;
}) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!phrases || phrases.length === 0) return;

    let timeoutHide: NodeJS.Timeout;
    let timeoutShow: NodeJS.Timeout;

    const cycle = () => {
      // Fica 20 segundos na tela e depois some
      timeoutHide = setTimeout(() => {
        setIsVisible(false);
        
        // Fica 40 segundos sumido e depois aparece a próxima frase
        timeoutShow = setTimeout(() => {
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          setIsVisible(true);
          cycle(); // Repete o ciclo
        }, 40000);
      }, 20000);
    };

    cycle();

    return () => {
      clearTimeout(timeoutHide);
      clearTimeout(timeoutShow);
    };
  }, [phrases]);

  const currentPhrase = (phrases && phrases.length > 0) ? phrases[currentPhraseIndex] : '';
  const message = currentPhrase ? `Olá! Vi a mensagem no site: "${currentPhrase}" e gostaria de saber mais.` : 'Olá! Gostaria de mais informações.';
  const waLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <div className={styles.whatsappContainer}>
      {(phrases && phrases.length > 0 && isVisible) && (
        <div className={styles.whatsappPopup}>
          <span className={styles.whatsappPopupTitle}>🟢 Atendimento</span>
          <span className={styles.whatsappPopupText} key={currentPhraseIndex}>
            {phrases[currentPhraseIndex]}
          </span>
        </div>
      )}
      <a 
        href={waLink}
        className={styles.whatsappFloat}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on WhatsApp"
      >
        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25d366', borderRadius: '50%'}}>
          <svg viewBox="0 0 24 24" style={{width: '36px', height: '36px', fill: 'white'}}>
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 0 0 1.37 5.028L2 22l5.13-1.313a9.919 9.919 0 0 0 4.88 1.287h.005c5.502 0 9.99-4.474 9.991-9.986.002-2.67-1.035-5.18-2.916-7.063C17.217 3.044 14.708 2.001 12.012 2zm6.366 14.205c-.278.78-1.619 1.446-2.227 1.496-.58.049-1.21-.11-3.486-1.054-2.91-1.206-4.773-4.183-4.919-4.377-.145-.195-1.177-1.57-1.177-2.992 0-1.423.744-2.122 1.009-2.396.265-.274.58-.344.773-.344.193 0 .385.002.553.01.177.009.414-.067.65.503.242.583.826 2.017.899 2.164.072.146.12.316.023.511-.097.195-.145.316-.29.487-.145.17-.306.38-.436.51-.144.143-.294.3-.127.587.168.287.749 1.235 1.606 1.998.11.098.21.192.302.28 1.029.89 1.884 1.174 2.152 1.307.268.134.425.112.584-.073.158-.184.678-.79.859-1.059.182-.269.363-.227.614-.134.252.093 1.6.756 1.875.894.275.138.458.207.526.324.068.118.068.683-.21 1.463z" />
          </svg>
        </div>
      </a>
    </div>
  );
}
