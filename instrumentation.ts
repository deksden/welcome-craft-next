import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: 'ai-chatbot' });
  
  // World testing system logging
  const appStage = process.env.APP_STAGE || 'PROD';
  const isTestWorldsUIEnabled = appStage === 'LOCAL' || appStage === 'BETA';
  const aiFixturesMode = process.env.AI_FIXTURES_MODE || 'off';
  
  if (isTestWorldsUIEnabled) {
    console.log('🌍==================================================');
    console.log('🌍 WelcomeCraft Three-Level Testing System ENABLED');
    console.log('🌍==================================================');
    console.log(`🌍 APP_STAGE: ${appStage}`);
    console.log(`🌍 World testing support: ${isTestWorldsUIEnabled ? 'ON' : 'OFF'}`);
    console.log(`🌍 AI Fixtures mode: ${aiFixturesMode}`);
    console.log('🌍 World isolation through world_id cookies enabled');
    console.log('🌍 Available worlds: CLEAN_USER_WORKSPACE, SITE_READY_FOR_PUBLICATION, CONTENT_LIBRARY_BASE, DEMO_PREPARATION, ENTERPRISE_ONBOARDING');
    console.log('🌍==================================================');
  } else {
    console.log('🌍 WelcomeCraft running in PRODUCTION mode (worlds disabled)');
  }
}
