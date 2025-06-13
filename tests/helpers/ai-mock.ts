/**
 * AI Mock Helper для E2E тестов WelcomeCraft
 * Предоставляет надежные моки для AI-ответов в контексте создания онбординг-сайтов
 */

export interface MockAIResponse {
  content: string;
  hasArtifact?: boolean;
  artifactType?: 'text' | 'code' | 'site';
  artifactContent?: string;
}

// Responses storage
const responses: Map<string, MockAIResponse> = new Map([
  // Основные AI-first сценарии
  ['привет! расскажи мне о себе', {
    content: 'Я ИИ-ассистент WelcomeCraft, помогаю HR-специалистам создавать онбординг-сайты для новых сотрудников. Могу создавать артефакты, генерировать сайты и работать с контентом.'
  }],
  
  ['создай новый чат', {
    content: 'Новый чат создан! Готов помочь с созданием онбординг-материалов.'
  }],

  // Работа с артефактами
  ['создай текстовый артефакт с приветствием для нового сотрудника', {
    content: 'Создал текстовый артефакт с приветственным сообщением',
    hasArtifact: true,
    artifactType: 'text',
    artifactContent: 'Добро пожаловать в нашу команду! Мы рады видеть вас в качестве нового сотрудника.'
  }],

  ['создай кодовый артефакт', {
    content: 'Создал код артефакт',
    hasArtifact: true,
    artifactType: 'code',
    artifactContent: 'function welcome() { return "Добро пожаловать!"; }'
  }],

  ['создай кодовый артефакт с компонентом react', {
    content: 'Создал React компонент артефакт',
    hasArtifact: true,
    artifactType: 'code',
    artifactContent: 'export function WelcomeComponent() { return <div>Добро пожаловать!</div>; }'
  }],

  ['создай список контактов для онбординга', {
    content: 'Создал артефакт со списком ключевых контактов',
    hasArtifact: true,
    artifactType: 'text',
    artifactContent: '• HR-менеджер: hr@company.com\n• IT-поддержка: it@company.com\n• Наставник: mentor@company.com'
  }],

  // Генерация сайтов
  ['сгенерируй сайт для нового разработчика', {
    content: 'Создал онбординг-сайт для разработчика',
    hasArtifact: true,
    artifactType: 'site',
    artifactContent: '{"blocks": [{"type": "hero", "title": "Добро пожаловать в команду разработки"}]}'
  }],

  ['создай онбординг-сайт для разработчика', {
    content: 'Сгенерировал онбординг-сайт с основными блоками',
    hasArtifact: true,
    artifactType: 'site',
    artifactContent: '{"blocks": [{"type": "hero"}, {"type": "key-contacts"}]}'
  }],

  // Обновления и модификации
  ['добавь еще контакты HR', {
    content: 'Обновил артефакт, добавив дополнительные HR контакты'
  }],

  ['добавь в артефакт ссылку на портал', {
    content: 'Добавил ссылку на корпоративный портал в артефакт'
  }],

  // Анализ файлов
  ['проанализируй этот файл для создания онбординга', {
    content: 'Проанализировал файл и могу использовать его для создания персонализированного онбординг-контента'
  }],

  // Общие вспомогательные фразы
  ['помоги создать онбординг', {
    content: 'Готов помочь создать онбординг-материалы! Какой тип контента вам нужен?'
  }],

  ['помоги с созданием контента', {
    content: 'Помогу создать качественный контент для онбординга новых сотрудников'
  }],

  ['создай артефакт', {
    content: 'Создал новый артефакт',
    hasArtifact: true,
    artifactType: 'text'
  }],

  // Создание сложных артефактов для тестирования остановки
  ['создай сложный артефакт с большим содержанием', {
    content: 'Начинаю создание объемного артефакта...'
  }]
]);

export function getAIResponse(message: string): MockAIResponse {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Поиск точного совпадения
  const exactMatch = responses.get(normalizedMessage);
  if (exactMatch) {
    return exactMatch;
  }

  // Поиск по ключевым словам для fallback
  if (normalizedMessage.includes('артефакт') && normalizedMessage.includes('текст')) {
    return {
      content: 'Создал текстовый артефакт',
      hasArtifact: true,
      artifactType: 'text'
    };
  }

  if (normalizedMessage.includes('артефакт') && normalizedMessage.includes('код')) {
    return {
      content: 'Создал кодовый артефакт',
      hasArtifact: true,
      artifactType: 'code'
    };
  }

  if (normalizedMessage.includes('сайт') || normalizedMessage.includes('онбординг')) {
    return {
      content: 'Создал онбординг-сайт',
      hasArtifact: true,
      artifactType: 'site'
    };
  }

  // Дефолтный ответ
  return {
    content: 'Готов помочь с созданием онбординг-материалов для WelcomeCraft!'
  };
}

export function addCustomResponse(message: string, response: MockAIResponse): void {
  responses.set(message.toLowerCase().trim(), response);
}

export function clearCustomResponses(): void {
  // Сохраняем только базовые ответы
  const baseResponses = new Map(responses);
  responses.clear();
  baseResponses.forEach((value, key) => {
    responses.set(key, value);
  });
}

// Legacy compatibility
export const AIMockHelper = {
  getResponse: getAIResponse,
  addCustomResponse,
  clearCustomResponses
};