/**
 * @file tests/helpers/worlds.config.ts
 * @description Конфигурация тестовых "миров" - изолированных наборов данных для E2E тестирования
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Начальная реализация трехуровневой системы тестирования
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация worlds config для Phase 1
 */

export type WorldId = 
  | 'CLEAN_USER_WORKSPACE' 
  | 'SITE_READY_FOR_PUBLICATION'
  | 'CONTENT_LIBRARY_BASE'
  | 'DEMO_PREPARATION'
  | 'ENTERPRISE_ONBOARDING'

/**
 * @description Определение тестового "мира" - изолированного набора данных
 */
export interface WorldDefinition {
  /** Уникальный идентификатор мира */
  id: WorldId
  /** Человекочитаемое название */
  name: string
  /** Описание назначения и содержимого мира */
  description: string
  /** Пользователи, которые будут созданы в этом мире */
  users: WorldUser[]
  /** Артефакты, которые будут предсозданы */
  artifacts: WorldArtifact[]
  /** Чаты, которые будут предсозданы */
  chats: WorldChat[]
  /** Зависимости от других миров (если есть) */
  dependencies?: WorldId[]
  /** Дополнительные настройки */
  settings: WorldSettings
}

/**
 * @description Пользователь в тестовом мире
 */
export interface WorldUser {
  /** Уникальный ID пользователя в тестах (user-001, user-ada, etc.) */
  testId: string
  /** Имя пользователя для UI */
  name: string
  /** Email для аутентификации */
  email: string
  /** Роль в тестовых сценариях */
  role: 'hr-manager' | 'admin' | 'viewer'
}

/**
 * @description Артефакт в тестовом мире
 */
export interface WorldArtifact {
  /** Уникальный ID артефакта в тестах */
  testId: string
  /** Заголовок артефакта */
  title: string
  /** Тип артефакта */
  kind: 'text' | 'code' | 'sheet' | 'image' | 'site'
  /** ID владельца (ссылка на WorldUser.testId) */
  ownerId: string
  /** Путь к файлу с контентом (относительно tests/fixtures/worlds/) */
  contentPath?: string
  /** Статус публикации */
  isPublished?: boolean
  /** Дата истечения публикации (для TTL тестов) */
  publishedUntil?: string
  /** Теги для поиска и категоризации */
  tags?: string[]
}

/**
 * @description Чат в тестовом мире
 */
export interface WorldChat {
  /** Уникальный ID чата в тестах */
  testId: string
  /** Заголовок чата */
  title: string
  /** ID владельца (ссылка на WorldUser.testId) */
  ownerId: string
  /** Статус публикации */
  isPublished?: boolean
  /** Дата истечения публикации */
  publishedUntil?: string
  /** Путь к файлу с историей сообщений */
  messagesPath?: string
}

/**
 * @description Настройки тестового мира
 */
export interface WorldSettings {
  /** Автоматически очищать мир после тестов */
  autoCleanup: boolean
  /** Создавать базовые site blocks (если нужны для мира) */
  includeSiteBlocks: boolean
  /** TTL для временных данных в минутах */
  ttlMinutes?: number
  /** Дополнительные feature flags */
  features?: {
    enableAIFixtures?: boolean
    enablePublication?: boolean
    enableClipboard?: boolean
  }
}

/**
 * @description Конфигурация всех доступных тестовых миров
 */
export const WORLDS: Record<WorldId, WorldDefinition> = {
  /**
   * Чистое пространство пользователя для тестирования создания контента с нуля
   */
  CLEAN_USER_WORKSPACE: {
    id: 'CLEAN_USER_WORKSPACE',
    name: 'Чистое рабочее пространство',
    description: 'Аутентифицированный пользователь с пустым чатом и базовыми артефактами для AI-генерации',
    users: [
      {
        testId: 'user-sarah',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        role: 'hr-manager'
      }
    ],
    artifacts: [
      {
        testId: 'artifact-base-contacts',
        title: 'Базовые контакты HR',
        kind: 'sheet',
        ownerId: 'user-sarah',
        contentPath: 'hr-contacts.csv',
        tags: ['hr', 'contacts', 'template']
      },
      {
        testId: 'artifact-base-links',
        title: 'Полезные ссылки',
        kind: 'text',
        ownerId: 'user-sarah',
        contentPath: 'useful-links.md',
        tags: ['links', 'onboarding', 'template']
      }
    ],
    chats: [],
    settings: {
      autoCleanup: true,
      includeSiteBlocks: true,
      features: {
        enableAIFixtures: true,
        enablePublication: false,
        enableClipboard: true
      }
    }
  },

  /**
   * Готовый сайт для тестирования функций публикации
   */
  SITE_READY_FOR_PUBLICATION: {
    id: 'SITE_READY_FOR_PUBLICATION',
    name: 'Сайт готов к публикации',
    description: 'Полностью подготовленный site артефакт для тестирования publication workflow',
    users: [
      {
        testId: 'user-ada',
        name: 'Ada Thompson',
        email: 'ada@example.com',
        role: 'hr-manager'
      }
    ],
    artifacts: [
      {
        testId: 'site-developer-onboarding',
        title: 'Onboarding для разработчика',
        kind: 'site',
        ownerId: 'user-ada',
        contentPath: 'developer-site-complete.json',
        isPublished: false,
        tags: ['site', 'developer', 'onboarding', 'ready']
      },
      {
        testId: 'artifact-welcome-text',
        title: 'Welcome от CEO',
        kind: 'text',
        ownerId: 'user-ada',
        contentPath: 'ceo-welcome.md',
        tags: ['welcome', 'ceo', 'text']
      },
      {
        testId: 'artifact-dev-contacts',
        title: 'Контакты команды разработки',
        kind: 'sheet',
        ownerId: 'user-ada',
        contentPath: 'dev-team-contacts.csv',
        tags: ['contacts', 'development', 'team']
      }
    ],
    chats: [],
    settings: {
      autoCleanup: true,
      includeSiteBlocks: true,
      ttlMinutes: 60,
      features: {
        enablePublication: true,
        enableClipboard: false
      }
    }
  },

  /**
   * Библиотека контента для тестирования переиспользования артефактов
   */
  CONTENT_LIBRARY_BASE: {
    id: 'CONTENT_LIBRARY_BASE',
    name: 'Библиотека контента',
    description: 'Множество готовых артефактов для тестирования clipboard workflow и переиспользования',
    users: [
      {
        testId: 'user-maria',
        name: 'Maria Garcia',
        email: 'maria@example.com',
        role: 'hr-manager'
      }
    ],
    artifacts: [
      {
        testId: 'artifact-ceo-welcome',
        title: 'Welcome от CEO',
        kind: 'text',
        ownerId: 'user-maria',
        contentPath: 'ceo-welcome-reusable.md',
        tags: ['welcome', 'ceo', 'reusable', 'template']
      },
      {
        testId: 'artifact-hr-contacts',
        title: 'Контакты HR',
        kind: 'sheet',
        ownerId: 'user-maria',
        contentPath: 'hr-contacts-standard.csv',
        tags: ['hr', 'contacts', 'standard']
      },
      {
        testId: 'artifact-useful-links',
        title: 'Полезные ссылки',
        kind: 'text',
        ownerId: 'user-maria',
        contentPath: 'useful-links-comprehensive.md',
        tags: ['links', 'resources', 'comprehensive']
      },
      {
        testId: 'site-empty-template',
        title: 'Пустой шаблон сайта',
        kind: 'site',
        ownerId: 'user-maria',
        contentPath: 'empty-site-template.json',
        tags: ['site', 'template', 'empty']
      }
    ],
    chats: [],
    settings: {
      autoCleanup: true,
      includeSiteBlocks: true,
      features: {
        enableClipboard: true,
        enableAIFixtures: true
      }
    }
  },

  /**
   * Подготовленная демонстрация для тестирования публикации чатов
   */
  DEMO_PREPARATION: {
    id: 'DEMO_PREPARATION',
    name: 'Демонстрационная среда',
    description: 'Завершенный чат с процессом создания сайта для демонстрации коллегам',
    users: [
      {
        testId: 'user-david',
        name: 'David Chen',
        email: 'david@example.com',
        role: 'hr-manager'
      }
    ],
    artifacts: [
      {
        testId: 'site-demo-complete',
        title: 'Демо-сайт онбординга',
        kind: 'site',
        ownerId: 'user-david',
        contentPath: 'demo/complete-demo-site.json',
        tags: ['demo', 'complete', 'showcase']
      },
      {
        testId: 'artifact-demo-welcome-message',
        title: 'Приветствие для нового сотрудника',
        kind: 'text',
        ownerId: 'user-david',
        contentPath: 'demo/demo-welcome-message.md',
        tags: ['welcome', 'demo', 'onboarding']
      },
      {
        testId: 'artifact-demo-contacts',
        title: 'Контакты команды',
        kind: 'sheet',
        ownerId: 'user-david',
        contentPath: 'demo/demo-contacts.csv',
        tags: ['contacts', 'demo', 'team']
      },
      {
        testId: 'artifact-demo-useful-links',
        title: 'Полезные ссылки для нового сотрудника',
        kind: 'text',
        ownerId: 'user-david',
        contentPath: 'demo/demo-useful-links.md',
        tags: ['links', 'demo', 'resources']
      }
    ],
    chats: [
      {
        testId: 'chat-demo-workflow',
        title: 'Создание сайта через AI',
        ownerId: 'user-david',
        isPublished: false,
        messagesPath: 'demo/ai-site-creation-chat.json'
      }
    ],
    settings: {
      autoCleanup: true,
      includeSiteBlocks: true,
      ttlMinutes: 180, // 3 часа для демо
      features: {
        enablePublication: true
      }
    }
  },

  /**
   * Корпоративная среда для тестирования комплексных сценариев
   */
  ENTERPRISE_ONBOARDING: {
    id: 'ENTERPRISE_ONBOARDING',
    name: 'Корпоративный онбординг',
    description: 'Enterprise-level среда с шаблонами ролей и возможностью multi-artifact создания',
    users: [
      {
        testId: 'user-elena',
        name: 'Elena Rodriguez',
        email: 'elena@example.com',
        role: 'admin'
      }
    ],
    artifacts: [
      {
        testId: 'template-tech-lead',
        title: 'Шаблон для Technical Lead',
        kind: 'text',
        ownerId: 'user-elena',
        contentPath: 'tech-lead-template.md',
        tags: ['template', 'tech-lead', 'enterprise']
      },
      {
        testId: 'contacts-dev-team',
        title: 'Команда разработки',
        kind: 'sheet',
        ownerId: 'user-elena',
        contentPath: 'dev-team-contacts.csv',
        tags: ['contacts', 'development', 'enterprise']
      },
      {
        testId: 'docs-tech-stack',
        title: 'Технологический стек',
        kind: 'text',
        ownerId: 'user-elena',
        contentPath: 'tech-stack-docs.md',
        tags: ['documentation', 'tech-stack', 'enterprise']
      }
    ],
    chats: [],
    settings: {
      autoCleanup: true,
      includeSiteBlocks: true,
      features: {
        enableAIFixtures: true,
        enablePublication: true,
        enableClipboard: true
      }
    }
  }
}

/**
 * @description Получить определение мира по ID
 */
export function getWorldDefinition(worldId: WorldId): WorldDefinition {
  const world = WORLDS[worldId]
  if (!world) {
    throw new Error(`World not found: ${worldId}`)
  }
  return world
}

/**
 * @description Получить все миры, зависящие от указанного
 */
export function getWorldDependencies(worldId: WorldId): WorldDefinition[] {
  const world = getWorldDefinition(worldId)
  
  if (!world.dependencies || world.dependencies.length === 0) {
    return []
  }
  
  return world.dependencies.map(depId => getWorldDefinition(depId))
}

/**
 * @description Валидация мира перед использованием в тестах
 */
export function validateWorld(worldId: WorldId): boolean {
  const world = getWorldDefinition(worldId)
  
  // Проверяем базовые требования
  if (!world.users || world.users.length === 0) {
    throw new Error(`World ${worldId} must have at least one user`)
  }
  
  // Проверяем уникальность testId пользователей
  const userIds = world.users.map(u => u.testId)
  if (new Set(userIds).size !== userIds.length) {
    throw new Error(`World ${worldId} has duplicate user testIds`)
  }
  
  // Проверяем ссылки владельцев артефактов
  for (const artifact of world.artifacts) {
    if (!userIds.includes(artifact.ownerId)) {
      throw new Error(`Artifact ${artifact.testId} owner ${artifact.ownerId} not found in world users`)
    }
  }
  
  return true
}

// END OF: tests/helpers/worlds.config.ts
