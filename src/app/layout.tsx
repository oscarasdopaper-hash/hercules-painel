import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Painel HERCULES',
  description: 'Sistema administrativo do HERCULES',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
