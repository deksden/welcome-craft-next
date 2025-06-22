/**
 * @file tests/global-setup.ts  
 * @description Глобальная настройка для E2E тестов - создание пользователей и auth states
 * @author Claude Code
 * @created 15.06.2025
 */

import type { FullConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup disabled - using Direct Cookie Header Pattern');
  
  // DISABLED: Old storage state approach replaced with Direct Cookie Header Pattern
  // Each test now creates its own authenticated context dynamically
  // No need for pre-setup of auth states
  
  console.log('✅ Global setup complete (no-op)');
}

export default globalSetup;