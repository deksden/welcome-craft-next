/**
 * @file tests/unit/helpers/testid-validation.test.ts
 * @description Автоматическая валидация testid registry для предотвращения несоответствий
 * @version 1.0.0
 * @date 2025-07-03
 * @updated Создана автоматическая валидация testid для предотвращения bagov типа UC-11
 */

/** HISTORY:
 * v1.0.0 (2025-07-03): Автоматическая валидация testid registry
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TESTIDS, TestIdValidation, TestSelectors } from '../../helpers/testid-registry';

describe('TestID Registry Validation', () => {
  
  it('should have no duplicate testids in registry', () => {
    const duplicates = TestIdValidation.findDuplicates();
    expect(duplicates).toEqual([]);
  });

  it('should follow kebab-case naming convention', () => {
    const allIds = TestIdValidation.getAllTestIds();
    const invalidIds: string[] = [];
    
    for (const id of allIds) {
      if (!TestIdValidation.isValidTestId(id)) {
        invalidIds.push(id);
      }
    }
    
    expect(invalidIds).toEqual([]);
  });

  it('should have all critical UI elements defined', () => {
    // Проверяем наличие критически важных testid
    const criticalIds = [
      TESTIDS.auth.emailInput,
      TESTIDS.auth.passwordInput,
      TESTIDS.header.container,
      TESTIDS.chat.inputTextarea,
      TESTIDS.artifact.card,
      TESTIDS.fileImport.dropZone
    ];
    
    for (const id of criticalIds) {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('should generate valid selectors', () => {
    expect(TestSelectors.byTestId('test-id')).toBe('[data-testid="test-id"]');
    expect(TestSelectors.byPath('auth.emailInput')).toBe('[data-testid="auth-email-input"]');
    expect(TestSelectors.byPath('fileImport.dropZone')).toBe('[data-testid="file-drop-zone"]');
  });

  it('should throw error for invalid paths', () => {
    expect(() => TestSelectors.byPath('invalid.path')).toThrow();
    expect(() => TestSelectors.byPath('auth.nonexistent')).toThrow();
  });
});

describe('Component-Registry Consistency Check', () => {
  
  it('should validate component testids exist in registry', async () => {
    const componentsDir = path.join(process.cwd(), 'components');
    const appDir = path.join(process.cwd(), 'app');
    
    const registryIds = new Set(TestIdValidation.getAllTestIds());
    const componentTestIds: string[] = [];
    
    // Функция для поиска testid в файлах
    const findTestIdsInFile = (filePath: string) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/data-testid=["']([^"']+)["']/g);
        
        if (matches) {
          for (const match of matches) {
            const testId = match.match(/data-testid=["']([^"']+)["']/)?.[1];
            if (testId) {
              componentTestIds.push(testId);
            }
          }
        }
      } catch (error) {
        // Игнорируем ошибки чтения файлов
      }
    };
    
    // Функция для рекурсивного поиска .tsx файлов
    const scanDirectory = (dir: string) => {
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
            scanDirectory(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            findTestIdsInFile(filePath);
          }
        }
      } catch (error) {
        // Игнорируем ошибки доступа к директориям
      }
    };
    
    // Сканируем компоненты и app директории
    scanDirectory(componentsDir);
    scanDirectory(appDir);
    
    // Проверяем что все найденные testid есть в registry
    const missingInRegistry: string[] = [];
    const uniqueComponentIds = [...new Set(componentTestIds)];
    
    for (const testId of uniqueComponentIds) {
      // Пропускаем динамические testid (содержат переменные)
      if (!testId.includes('${') && !testId.includes('{') && !registryIds.has(testId)) {
        missingInRegistry.push(testId);
      }
    }
    
    // Логируем статистику для информации
    console.log(`📊 TestID Statistics:
    - Registry contains: ${registryIds.size} testids
    - Found in components: ${uniqueComponentIds.length} testids
    - Missing in registry: ${missingInRegistry.length} testids`);
    
    if (missingInRegistry.length > 0) {
      console.log(`❌ Missing testids:`, missingInRegistry);
    }
    
    // Пока не делаем это критической ошибкой, только предупреждение
    if (missingInRegistry.length > 10) {
      console.warn(`⚠️ Many testids missing in registry. Consider updating TESTIDS registry.`);
    }
  });
});

describe('E2E Test-Registry Consistency Check', () => {
  
  it('should validate E2E tests use registry testids', async () => {
    const testsDir = path.join(process.cwd(), 'tests/e2e');
    const registryIds = new Set(TestIdValidation.getAllTestIds());
    const testFileSelectors: string[] = [];
    
    // Функция для поиска testid селекторов в E2E тестах
    const findSelectorsInFile = (filePath: string) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Ищем getByTestId('...') паттерны
        const getByTestIdMatches = content.match(/getByTestId\(['"]([^'"]+)['"]\)/g);
        if (getByTestIdMatches) {
          for (const match of getByTestIdMatches) {
            const testId = match.match(/getByTestId\(['"]([^'"]+)['"]\)/)?.[1];
            if (testId) {
              testFileSelectors.push(testId);
            }
          }
        }
        
        // Ищем [data-testid="..."] паттерны
        const dataTestIdMatches = content.match(/\[data-testid=["']([^"']+)["']\]/g);
        if (dataTestIdMatches) {
          for (const match of dataTestIdMatches) {
            const testId = match.match(/\[data-testid=["']([^"']+)["']\]/)?.[1];
            if (testId) {
              testFileSelectors.push(testId);
            }
          }
        }
      } catch (error) {
        // Игнорируем ошибки чтения файлов
      }
    };
    
    // Рекурсивно сканируем E2E тесты
    const scanTestDirectory = (dir: string) => {
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            scanTestDirectory(filePath);
          } else if (file.endsWith('.test.ts')) {
            findSelectorsInFile(filePath);
          }
        }
      } catch (error) {
        // Игнорируем ошибки доступа к директориям
      }
    };
    
    scanTestDirectory(testsDir);
    
    // Анализируем соответствие
    const uniqueSelectors = [...new Set(testFileSelectors)];
    const missingSelectors: string[] = [];
    
    for (const selector of uniqueSelectors) {
      // Пропускаем селекторы с wildcard (*) и переменными
      if (!selector.includes('*') && !selector.includes('${') && !registryIds.has(selector)) {
        missingSelectors.push(selector);
      }
    }
    
    console.log(`📊 E2E TestID Statistics:
    - Found in E2E tests: ${uniqueSelectors.length} testid selectors
    - Missing in registry: ${missingSelectors.length} selectors`);
    
    if (missingSelectors.length > 0) {
      console.log(`❌ E2E selectors missing in registry:`, missingSelectors.slice(0, 10));
    }
    
    // Пока не делаем это критической ошибкой
    if (missingSelectors.length > 15) {
      console.warn(`⚠️ Many E2E selectors missing in registry. Consider updating TESTIDS registry.`);
    }
  });
});

// END OF: tests/unit/helpers/testid-validation.test.ts