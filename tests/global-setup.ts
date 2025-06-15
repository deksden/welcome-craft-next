/**
 * @file tests/global-setup.ts  
 * @description Глобальная настройка для E2E тестов - создание пользователей и auth states
 * @author Claude Code
 * @created 15.06.2025
 */

import { chromium, type FullConfig } from '@playwright/test';
import { TEST_USERS, setupUserAuth, type TestUserRole } from './e2e-fixtures';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test users...');
  
  // Создаем директорию для auth states
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const baseURL = process.env.PLAYWRIGHT_PORT 
    ? `http://app.localhost:${process.env.PLAYWRIGHT_PORT}`
    : 'http://app.localhost:3000';

  // Настраиваем каждого тестового пользователя
  for (const [role, userData] of Object.entries(TEST_USERS)) {
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await setupUserAuth(role as TestUserRole, page, baseURL);
      
      await context.close();
    } catch (error) {
      console.error(`❌ Failed to setup ${role}:`, error);
      throw error;
    }
  }

  await browser.close();
  console.log('✅ E2E test users setup complete');
}

export default globalSetup;