/**
 * @file app/app/(auth)/auth.ts
 * @description Конфигурация NextAuth.js для аутентификации пользователей.
 * @version 1.1.0
 * @date 2025-06-11
 * @updated Удалена гостевая сессия, теперь требуется регистрация.
 */

/** HISTORY:
 * v1.1.0 (2025-06-11): Удален провайдер гостевой аутентификации.
 * v1.0.0 (2025-05-25): Начальная версия.
 */

import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

const providers = [
  // Main credentials provider for regular users
  Credentials({
    id: 'credentials',
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize({ email, password }: any) {
      const users = await getUser(email);

      if (users.length === 0) {
        await compare(password, DUMMY_PASSWORD);
        return null;
      }

      const [user] = users;

      if (!user.password) {
        await compare(password, DUMMY_PASSWORD);
        return null;
      }

      // TODO: Temporary fix for plain text passwords during development
      // Remove this when password hashing is implemented
      const passwordsMatch = password === user.password || await compare(password, user.password);

      if (!passwordsMatch) return null;

      return { ...user, type: 'regular' };
    },
  }),
]

// Add test provider only in development (official Auth.js approach)
if (process.env.NODE_ENV === 'development') {
  providers.push(
    Credentials({
      id: 'test-credentials',
      name: 'Test Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Simple test authentication - password must be 'test-password'
        if (credentials?.password === 'test-password') {
          return {
            id: 'test-user-id',
            email: credentials.email as string,
            name: credentials.email as string,
            type: 'regular'
          };
        }
        return null;
      },
    })
  );
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Для новых пользователей при логине
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }
      
      // Для тестовых токенов, созданных через /api/test/auth-signin
      // Они уже содержат все нужные поля
      if (trigger === 'signIn' && token.sub === 'test-user-id') {
        // Тестовый токен уже содержит правильную структуру
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || token.sub || '';
        session.user.type = (token.type as UserType) || 'regular';
        
        // Для тестовых сессий
        if (token.sub === 'test-user-id') {
          session.user.email = token.email as string;
          session.user.name = token.name as string;
        }
      }

      return session;
    },
  },
});

// END OF: app/app/(auth)/auth.ts
