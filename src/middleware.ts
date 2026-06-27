import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // LÓGICA DE PROTEÇÃO DO PAINEL ADMIN (BASIC AUTH)
  if (url.pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Usuário padrão é 'admin'
      if (user === 'admin' && pwd === process.env.ADMIN_PASSWORD) {
        return NextResponse.next();
      }
    }

    // Se a senha estiver incorreta ou não fornecida, exibe o popup nativo
    return new NextResponse('Acesso negado. Senha incorreta.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Painel Administrativo Restrito"',
      },
    });
  }

  // Se tentar acessar a raiz ou rotas não-admin no painel, redireciona para o /admin
  if (url.pathname === '/') {
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
