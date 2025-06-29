import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  trustHost: true, // Important for Playwright testing in production mode
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
        // In development and local testing, allow cookies to work across subdomains (app.localhost and localhost)
        domain: (process.env.NODE_ENV === 'development' || process.env.PLAYWRIGHT_PORT) ? '.localhost' : undefined,
        secure: process.env.NODE_ENV === 'production' && !process.env.PLAYWRIGHT_PORT,
      },
    },
    csrfToken: {
      name: 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: (process.env.NODE_ENV === 'development' || process.env.PLAYWRIGHT_PORT) ? '.localhost' : undefined,
        secure: process.env.NODE_ENV === 'production' && !process.env.PLAYWRIGHT_PORT,
      },
    },
  },
  callbacks: {},
} satisfies NextAuthConfig;
