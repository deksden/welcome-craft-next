import type { UserType } from '@/app/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users with an account
   */
  user: {
    maxMessagesPerDay: 500,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },
  /*
   * For admin users
   */
  admin: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  }
};
