import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/', // Редирект на главную админки после регистрации
  },
  session: {
    strategy: 'jwt', // Force JWT sessions for testing
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // In development, allow cookies to work across subdomains (app.localhost and localhost)
        domain: process.env.NODE_ENV === 'development' ? '.localhost' : undefined,
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: process.env.NODE_ENV === 'development' ? '.localhost' : undefined,
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {},
} satisfies NextAuthConfig;
