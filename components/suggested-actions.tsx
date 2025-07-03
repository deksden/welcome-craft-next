/**
 * @file components/suggested-actions.tsx
 * @description Панель запуска онбординга с предлагаемыми действиями для HR-специалистов.
 * @version 2.0.0
 * @date 2025-07-02
 * @updated Полный рефакторинг: переход от технических подсказок к HR-ориентированным действиям с Card UI.
 */
'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { GlobeIcon, FileTextIcon, UserIcon, UploadIcon } from '@/components/icons';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

const onboardingActions = [
  {
    icon: <GlobeIcon className="size-6 text-blue-500" />,
    title: 'Создать онбординг-сайт',
    description: 'Сгенерировать полноценный сайт для новой роли',
    action: 'Создай онбординг-сайт для нового Backend-разработчика, включая приветствие, контакты и технические ресурсы.',
  },
  {
    icon: <FileTextIcon className="size-6 text-green-500" />,
    title: 'Написать приветствие от CEO',
    description: 'Создать персонализированное письмо для новичка',
    action: 'Напиши приветственное письмо от CEO для нового сотрудника.',
  },
  {
    icon: <UserIcon className="size-6 text-purple-500" />,
    title: 'Составить список контактов',
    description: 'Сформировать таблицу с ключевыми контактами',
    action: 'Создай таблицу с контактами HR-отдела и IT-поддержки.',
  },
  {
    icon: <UploadIcon className="size-6 text-orange-500" />,
    title: 'Импортировать документ',
    description: 'Загрузить существующий .docx или .csv файл',
    action: 'Я хочу загрузить и импортировать документ.',
  },
];

function PureSuggestedActions({
  chatId,
  append,
}: SuggestedActionsProps) {
  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-4 w-full"
    >
      {onboardingActions.map((suggestedAction, index) => (
        <motion.div
          key={suggestedAction.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1 * index }}
        >
          <Card
            role="button"
            tabIndex={0}
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);
              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                append({ role: 'user', content: suggestedAction.action });
              }
            }}
            className="p-4 h-full cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0">{suggestedAction.icon}</div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold">{suggestedAction.title}</CardTitle>
                <CardDescription className="text-sm mt-1">{suggestedAction.description}</CardDescription>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => prevProps.chatId === nextProps.chatId,
);
// END OF: components/suggested-actions.tsx
