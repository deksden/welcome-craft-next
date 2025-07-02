'use server';

import { z } from 'zod';
import { createLogger } from '@fab33/fab-logger';
import { redirect } from 'next/navigation.js';
import { headers, cookies } from 'next/headers.js';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn, signOut } from './auth';

const logger = createLogger('auth:actions');

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginFormSchema = authFormSchema.extend({
  world_id: z.string().optional(),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  console.log('🔥 LOGIN ACTION STARTED - Entry point reached');
  console.log('🔥 FormData entries:', Array.from(formData.entries()));
  
  try {
    console.log('🔥 About to parse formData with loginFormSchema');
    
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      world_id: formData.get('world_id') || undefined, // Convert null to undefined for Zod optional
    };
    
    console.log('🔥 Raw form data:', {
      email: rawData.email,
      hasPassword: !!rawData.password,
      passwordLength: rawData.password ? String(rawData.password).length : 0,
      world_id: rawData.world_id
    });
    
    console.log('🔥 Calling loginFormSchema.parse...');
    const validatedData = loginFormSchema.parse(rawData);

    console.log('🔐 AUTH ACTION: Calling signIn with:', {
      email: validatedData.email,
      hasPassword: !!validatedData.password
    });

    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    console.log('🔐 AUTH ACTION: signIn result:', {
      success: !result?.error,
      error: result?.error,
      url: result?.url,
      ok: result?.ok
    });

    if (result?.error) {
      logger.error('Sign in failed', { error: result.error });
      return { status: 'failed' };
    }

    // Handle world_id cookie management
    const isTestWorldsEnabled = process.env.APP_STAGE === 'LOCAL' || process.env.APP_STAGE === 'BETA';
    const cookieStore = await cookies();
    const domain = process.env.NODE_ENV === 'development' ? '.localhost' : undefined;
    
    console.log('🔐 LOGIN PROCESSING DETAILS:', {
      email: validatedData.email,
      world_id: validatedData.world_id || 'PRODUCTION',
      isTestWorldsEnabled,
      ENABLE_TEST_WORLDS_UI: process.env.ENABLE_TEST_WORLDS_UI,
      NODE_ENV: process.env.NODE_ENV
    });
    
    logger.info('Login processing', {
      email: validatedData.email,
      world_id: validatedData.world_id || 'PRODUCTION',
      isTestWorldsEnabled,
      ENABLE_TEST_WORLDS_UI: process.env.ENABLE_TEST_WORLDS_UI
    });
    
    if (validatedData.world_id && isTestWorldsEnabled) {
      // Setting world_id cookies for test environments
      cookieStore.set('world_id', validatedData.world_id, {
        httpOnly: false, // Allow client access for UI state
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        domain,
        path: '/',
      });
      
      // Also set fallback cookie without domain for direct localhost access
      cookieStore.set('world_id_fallback', validatedData.world_id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      
      console.log('🍪 COOKIES SET DETAILS:', {
        email: validatedData.email, 
        world_id: validatedData.world_id,
        domain: domain || 'current_domain',
        cookiesSet: ['world_id', 'world_id_fallback'],
        NODE_ENV: process.env.NODE_ENV,
        cookieOptions: {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/'
        }
      });
      
      logger.info('World ID cookies set successfully', { 
        email: validatedData.email, 
        world_id: validatedData.world_id,
        domain: domain || 'current_domain',
        cookiesSet: ['world_id', 'world_id_fallback'],
        NODE_ENV: process.env.NODE_ENV
      });
    } else {
      // PRODUCTION login or test worlds disabled - CLEAR any existing world cookies
      console.log('🍪 CLEARING WORLD COOKIES for PRODUCTION login:', {
        email: validatedData.email,
        reason: validatedData.world_id ? 'test_worlds_disabled' : 'production_login',
        isTestWorldsEnabled
      });
      
      // Clear world_id cookies with both domain configurations
      cookieStore.set('world_id', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        domain,
        path: '/',
      });
      
      cookieStore.set('world_id_fallback', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        path: '/',
      });
      
      // Also try to clear without domain for broader compatibility
      cookieStore.set('world_id', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      logger.info('World cookies cleared for production login', { 
        email: validatedData.email,
        reason: validatedData.world_id ? 'test_worlds_disabled' : 'production_login'
      });
      
      if (validatedData.world_id && !isTestWorldsEnabled) {
        logger.warn('World ID provided but test worlds UI disabled', {
          world_id: validatedData.world_id,
          ENABLE_TEST_WORLDS_UI: process.env.ENABLE_TEST_WORLDS_UI
        });
      }
    }

    logger.info('Sign in successful', { 
      email: validatedData.email,
      world_id: validatedData.world_id || 'none'
    });
    console.log('🔥 LOGIN SUCCESS - returning success status');
    return { status: 'success' };
  } catch (error) {
    console.log('🔥 LOGIN ERROR CAUGHT:', {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      isZodError: error instanceof z.ZodError,
      zodErrors: error instanceof z.ZodError ? error.errors : undefined
    });
    
    logger.error('Login action failed', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof z.ZodError) {
      console.log('🔥 RETURNING invalid_data due to Zod validation error');
      return { status: 'invalid_data' };
    }

    console.log('🔥 RETURNING failed due to other error');
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  console.log('🚀 REGISTER SERVER ACTION CALLED!')
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  console.log('📧 Email from formData:', email)
  console.log('🔐 Password from formData:', password ? '***' : 'EMPTY')
  
  logger.info('Registration attempt started', { email });
  
  try {
    const validatedData = authFormSchema.parse({
      email,
      password,
    });
    
    logger.info('Validation successful', { email: validatedData.email });

    const [user] = await getUser(validatedData.email);

    if (user) {
      logger.warn('User already exists', { email: validatedData.email });
      return { status: 'user_exists' } as RegisterActionState;
    }
    
    logger.info('Creating new user', { email: validatedData.email });
    await createUser(validatedData.email, validatedData.password);
    
    logger.info('User created successfully, attempting auto-login', { email: validatedData.email });
    
    // Автоматический логин после регистрации
    const loginResult = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (loginResult?.error) {
      logger.error('Auto-login after registration failed', { 
        email: validatedData.email, 
        error: loginResult.error 
      });
      // Пользователь создан, но автологин не удался
      return { status: 'success' };
    }

    logger.info('Registration and auto-login successful', { email: validatedData.email });
    
    // Для обычного использования (не тестовая среда) делаем redirect
    // Для E2E тестов возвращаем success status чтобы клиент мог обработать ответ
    const headersList = await headers();
    const testHeader = headersList.get('x-test-environment');
    const isTestEnvironment = testHeader === 'playwright' || 
                              process.env.NODE_ENV === 'test';
    
    logger.info('Checking test environment', { 
      isTestEnvironment, 
      testHeader,
      NODE_ENV: process.env.NODE_ENV 
    });
    
    if (!isTestEnvironment) {
      logger.info('Not test environment, redirecting');
      redirect('/');
    }
    
    logger.info('Test environment detected, returning success status');
    return { status: 'success' };
  } catch (error) {
    logger.error('Registration failed', { 
      email, 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof z.ZodError) {
      logger.error('Validation error', { email, errors: error.errors });
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

/**
 * @description Logout action with world cookies cleanup
 * @feature Clears world_id and world_id_fallback cookies on logout
 */
export const logout = async () => {
  try {
    console.log('🔥 LOGOUT ACTION STARTED - Cleaning up world cookies');
    
    const cookieStore = await cookies();
    const domain = process.env.NODE_ENV === 'development' ? '.localhost' : undefined;
    
    // Clear world_id cookies with multiple configurations for broader compatibility
    const cookiesToClear = ['world_id', 'world_id_fallback'];
    
    for (const cookieName of cookiesToClear) {
      // Clear with domain
      cookieStore.set(cookieName, '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        domain,
        path: '/',
      });
      
      // Clear without domain for broader compatibility
      cookieStore.set(cookieName, '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    }
    
    console.log('🍪 LOGOUT COOKIES CLEARED:', {
      cookiesCleared: cookiesToClear,
      domain: domain || 'current_domain',
      NODE_ENV: process.env.NODE_ENV
    });
    
    logger.info('World cookies cleared on logout', {
      cookiesCleared: cookiesToClear,
      domain: domain || 'current_domain'
    });
    
    // Perform the actual signOut
    await signOut({
      redirectTo: '/login',
    });
    
  } catch (error) {
    logger.error('Logout action failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Still attempt to sign out even if cookie clearing fails
    await signOut({
      redirectTo: '/login',
    });
  }
};
