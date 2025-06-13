'use server';

import { z } from 'zod';
import { createLogger } from '@fab33/fab-logger';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';

const logger = createLogger('auth:actions');

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

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
    
    logger.info('User created successfully', { email: validatedData.email });
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
