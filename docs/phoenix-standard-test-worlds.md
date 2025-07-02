# Phoenix Standard Test Worlds

This document describes the standard test worlds that are available for the Phoenix Quick Login Panel and testing infrastructure.

## Overview

The standard test worlds provide consistent, pre-configured environments for testing different scenarios in WelcomeCraft. These worlds are automatically seeded into the database and are available through the Phoenix Quick Login Panel.

## Available Standard Test Worlds

### 1. CLEAN_USER_WORKSPACE
- **Description**: Fresh workspace with minimal setup for testing basic user workflows
- **Use Case**: Testing basic user interactions, creating content from scratch
- **User**: `clean-user@test.com` (Clean Test User)
- **Artifacts**: None (clean slate)
- **Auto Cleanup**: 24 hours

### 2. SITE_READY_FOR_PUBLICATION  
- **Description**: Pre-configured environment with sites ready for publication testing
- **Use Case**: Testing site publication workflows, TTL functionality
- **User**: `publisher@test.com` (Publisher User)
- **Artifacts**: Ready-to-publish site with welcome content, HR contacts
- **Auto Cleanup**: 48 hours

### 3. CONTENT_LIBRARY_BASE
- **Description**: Rich content library with various artifact types for testing content management
- **Use Case**: Testing content management, artifact relationships, comprehensive UI
- **User**: `content-manager@test.com` (Content Manager)
- **Artifacts**: Company intro, mission statement, contacts, addresses, links, FAQs
- **Auto Cleanup**: Never (template)

### 4. DEMO_PREPARATION
- **Description**: Polished demo environment for presentations and product demonstrations
- **Use Case**: Product demos, presentations, showcasing features
- **User**: `demo@welcomecraft.com` (Demo Presenter)
- **Artifacts**: Modern demo site, hero images, team info, professional content
- **Auto Cleanup**: Never (template)

### 5. ENTERPRISE_ONBOARDING
- **Description**: Enterprise-grade onboarding environment with comprehensive content and workflows
- **Use Case**: Testing enterprise features, comprehensive onboarding flows
- **Users**: 
  - `hr-admin@enterprise.com` (HR Administrator, admin role)
  - `new-hire@enterprise.com` (New Employee, regular role)
- **Artifacts**: Enterprise portal, comprehensive contacts, FAQs, addresses, links
- **Auto Cleanup**: 7 days

## Usage

### Seeding the Worlds

```bash
# Seed all standard test worlds
pnpm phoenix:seed:standard-worlds

# List seeded worlds
pnpm phoenix:seed:standard-worlds:list

# Validate world configuration
pnpm phoenix:seed:standard-worlds:validate

# Preview what would be seeded (dry run)
pnpm phoenix:seed:standard-worlds:dry-run
```

### Quick Login Integration

The standard test worlds are automatically integrated into the Phoenix Quick Login Panel. When you open the admin interface (`http://app.localhost:3000`), you'll see these users available in the Quick Login dropdown:

- **Clean Workspace User** → `CLEAN_USER_WORKSPACE`
- **Site Publisher** → `SITE_READY_FOR_PUBLICATION`
- **Content Manager** → `CONTENT_LIBRARY_BASE`
- **Demo Presenter** → `DEMO_PREPARATION`
- **HR Administrator** → `ENTERPRISE_ONBOARDING`
- **New Employee** → `ENTERPRISE_ONBOARDING`

### Using in Tests

You can reference these worlds in your E2E tests:

```typescript
// Example E2E test using standard worlds
test('should create site in clean workspace', async ({ page }) => {
  await page.goto('http://app.localhost:3000')
  
  // Use Quick Login Panel to switch to clean workspace
  await page.selectOption('[data-testid="quick-login-user-select"]', 'demo-clean-workspace')
  await page.click('[data-testid="quick-login-submit"]')
  
  // Now you're in CLEAN_USER_WORKSPACE world
  // ... rest of your test
})
```

## World Data Structure

Each standard test world includes:

- **Users**: Pre-configured users with appropriate roles
- **Artifacts**: Relevant content for the testing scenario
- **Chats**: Optional chat history for complex scenarios
- **Settings**: Auto-cleanup and TTL configuration
- **Metadata**: Environment, category, tags for organization

## Maintenance

### Re-seeding Worlds

If you need to reset the standard test worlds to their initial state:

```bash
# This will update existing worlds with fresh data
pnpm phoenix:seed:standard-worlds
```

### Adding New Standard Worlds

To add a new standard test world:

1. Edit `scripts/seed-standard-test-worlds.ts`
2. Add your world definition to the `STANDARD_TEST_WORLDS` array
3. Update the `QuickLoginHelper` in `lib/phoenix/quick-login.ts` to include users for your new world
4. Run the seeding script to create the new world

### Validation

The system includes validation to ensure all standard test worlds are properly configured:

```bash
# Check if all worlds exist and are properly configured
pnpm phoenix:seed:standard-worlds:validate
```

## Integration with Phoenix System

The standard test worlds are part of the broader Phoenix Project ecosystem:

- **Phoenix World Manager**: Manage all test worlds (including standards)
- **Phoenix Quick Login Panel**: User interface for world switching
- **Phoenix Admin Dashboard**: Monitor world usage and status
- **Testing Infrastructure**: Isolated test environments

For more information about the Phoenix Project, see the main Phoenix documentation.