/**
 * @file tests/helpers/testid-registry.ts
 * @description Централизованный реестр data-testid селекторов для консистентности E2E тестов
 * @version 1.0.0
 * @date 2025-07-03
 * @updated Создан централизованный registry для предотвращения data-testid mismatch багов
 */

/** HISTORY:
 * v1.0.0 (2025-07-03): Создан централизованный testid registry с иерархической структурой
 */

/**
 * Централизованный реестр всех data-testid селекторов в WelcomeCraft
 * 
 * ПРАВИЛА ИМЕНОВАНИЯ:
 * - Используйте kebab-case: auth-email-input
 * - Иерархическая структура: category-component-element
 * - Уникальные ID для списков: artifact-card-{id}
 * - Действия в конце: button, input, form, container
 * 
 * КРИТИЧНО: Этот файл является ЕДИНСТВЕННЫМ источником правды для всех testid
 */
export const TESTIDS = {
  // 🔐 Аутентификация
  auth: {
    emailInput: 'auth-email-input',
    passwordInput: 'auth-password-input', 
    submitButton: 'auth-submit-button',
    registerLink: 'auth-register-link',
    loginLink: 'auth-login-link',
    logoutButton: 'auth-logout-button'
  },

  // 📄 Заголовок приложения
  header: {
    container: 'header',
    logo: 'header-logo',
    newChatButton: 'header-new-chat-button',
    shareButton: 'header-share-button',
    themeToggle: 'header-theme-toggle',
    userNav: 'header-user-nav',
    userEmail: 'user-email'
  },

  // 🔄 Боковая панель
  sidebar: {
    container: 'sidebar',
    toggleButton: 'sidebar-toggle-button',
    chatSection: 'sidebar-chat-section',
    chatItem: 'sidebar-chat-item',
    chatMenuButton: 'sidebar-chat-menu-button',
    chatRenameAction: 'sidebar-chat-rename-action',
    chatShareMenu: 'sidebar-chat-share-menu',
    chatDeleteAction: 'sidebar-chat-delete-action',
    artifactsButton: 'sidebar-artifacts-button',
    allArtifactsSubsection: 'sidebar-all-artifacts-subsection',
    viewAllArtifactsButton: 'sidebar-view-all-artifacts-button',
    adminSection: 'sidebar-admin-section',
    devToolsSection: 'sidebar-dev-tools-section'
  },

  // 💬 Чат
  chat: {
    inputContainer: 'chat-input-container',
    inputTextarea: 'chat-input-textarea',
    sendButton: 'chat-input-send-button',
    stopButton: 'chat-input-stop-button',
    attachButton: 'chat-input-attach-button',
    messagesContainer: 'chat-messages',
    messageReasoning: 'message-reasoning',
    messageReasoningToggle: 'message-reasoning-toggle'
  },

  // 🎨 Артефакты
  artifact: {
    card: 'artifact-card',
    skeleton: 'artifact-skeleton',
    inlineSkeleton: 'artifact-inline-skeleton',
    publicationButton: 'artifact-publication-button',
    saveStatusIcon: 'artifact-save-status-icon',
    prevVersionButton: 'artifact-actions-prev-version-button',
    editor: 'artifact-editor',
    content: 'artifact-content'
  },

  // 📁 Импорт файлов
  fileImport: {
    dropZone: 'file-drop-zone',
    fileInput: 'file-input',
    form: 'file-import-form',
    uploadToast: 'file-upload-toast',
    resultsList: 'file-import-results'
  },

  // 🌍 World Management
  world: {
    indicator: 'world-indicator',
    indicatorName: 'world-indicator-name',
    selector: 'world-selector',
    loginPanel: 'world-login-panel'
  },

  // 🎛️ UI Components
  ui: {
    modelSelector: 'model-selector',
    modelSelectorItem: 'model-selector-item',
    inputAttachmentPreview: 'input-attachment-preview',
    inputAttachmentLoader: 'input-attachment-loader',
    loadingSpinner: 'loading-spinner',
    errorBoundary: 'error-boundary'
  },

  // 🔧 Phoenix Admin
  phoenix: {
    dashboard: 'phoenix-dashboard',
    adminHeading: 'phoenix-admin-heading',
    userManagement: 'phoenix-user-management',
    seedExport: 'phoenix-seed-export',
    seedImport: 'phoenix-seed-import',
    metrics: 'phoenix-metrics',
    healthStatus: 'phoenix-health-status'
  }
} as const;

/**
 * Helper функции для динамических testid
 */
export const TestIdHelpers = {
  /**
   * Генерирует testid для элемента списка с ID
   */
  listItem: (category: string, id: string) => `${category}-item-${id}`,
  
  /**
   * Генерирует testid для кнопки действия
   */
  actionButton: (category: string, action: string) => `${category}-${action}-button`,
  
  /**
   * Генерирует testid для формы
   */
  form: (category: string) => `${category}-form`,
  
  /**
   * Генерирует testid с суффиксом
   */
  withSuffix: (base: string, suffix: string) => `${base}-${suffix}`
};

/**
 * Type-safe селектор helper для Playwright
 */
export const TestSelectors = {
  /**
   * Возвращает селектор по testid
   */
  byTestId: (testId: string) => `[data-testid="${testId}"]`,
  
  /**
   * Возвращает селектор для вложенных testid из TESTIDS
   */
  byPath: (path: string) => {
    const keys = path.split('.');
    let current: any = TESTIDS;
    
    for (const key of keys) {
      current = current[key];
      if (!current) {
        throw new Error(`TestID path '${path}' not found in registry`);
      }
    }
    
    return `[data-testid="${current}"]`;
  }
};

/**
 * Валидационные утилиты
 */
export const TestIdValidation = {
  /**
   * Проверяет что testid следует naming convention
   */
  isValidTestId: (testId: string): boolean => {
    // kebab-case pattern: lowercase + hyphens
    const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
    return kebabCasePattern.test(testId);
  },
  
  /**
   * Извлекает все testid из объекта TESTIDS
   */
  getAllTestIds: (): string[] => {
    const extractIds = (obj: any): string[] => {
      const ids: string[] = [];
      
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
          ids.push(value);
        } else if (typeof value === 'object' && value !== null) {
          ids.push(...extractIds(value));
        }
      }
      
      return ids;
    };
    
    return extractIds(TESTIDS);
  },
  
  /**
   * Проверяет дублированные testid
   */
  findDuplicates: (): string[] => {
    const allIds = TestIdValidation.getAllTestIds();
    const duplicates: string[] = [];
    const seen = new Set<string>();
    
    for (const id of allIds) {
      if (seen.has(id)) {
        duplicates.push(id);
      } else {
        seen.add(id);
      }
    }
    
    return duplicates;
  }
};

// END OF: tests/helpers/testid-registry.ts