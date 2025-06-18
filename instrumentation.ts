import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: 'ai-chatbot' });
  
  // World testing system logging
  const isTestWorldsUIEnabled = process.env.ENABLE_TEST_WORLDS_UI === 'true';
  const isPublicTestWorldsUIEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI === 'true';
  const aiFixturesMode = process.env.AI_FIXTURES_MODE || 'off';
  
  if (isTestWorldsUIEnabled || isPublicTestWorldsUIEnabled) {
    console.log('🌍==================================================');
    console.log('🌍 WelcomeCraft Three-Level Testing System ENABLED');
    console.log('🌍==================================================');
    console.log(`🌍 Server-side world support: ${isTestWorldsUIEnabled ? 'ON' : 'OFF'}`);
    console.log(`🌍 Client-side world UI: ${isPublicTestWorldsUIEnabled ? 'ON' : 'OFF'}`);
    console.log(`🌍 AI Fixtures mode: ${aiFixturesMode}`);
    console.log('🌍 World isolation through world_id cookies enabled');
    console.log('🌍 Available worlds: CLEAN_USER_WORKSPACE, SITE_READY_FOR_PUBLICATION, CONTENT_LIBRARY_BASE, DEMO_PREPARATION, ENTERPRISE_ONBOARDING');
    console.log('🌍==================================================');
  } else {
    console.log('🌍 WelcomeCraft running in PRODUCTION mode (worlds disabled)');
  }
}
