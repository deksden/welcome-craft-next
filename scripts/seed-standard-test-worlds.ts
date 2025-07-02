/**
 * @file scripts/seed-standard-test-worlds.ts
 * @description Seeds the standard test worlds needed for Phoenix Quick Login Panel
 * @version 1.0.0
 * @date 2025-07-01
 * @updated Initial implementation for standard test worlds seeding
 */

/** HISTORY:
 * v1.0.0 (2025-07-01): Initial implementation for standard test worlds seeding
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { worldMeta } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Create database connection for Node.js scripts
const client = postgres(process.env.POSTGRES_URL || 'postgresql://localuser:localpassword@localhost:5434/welcomecraft_local', {
  idle_timeout: 20,
  max_lifetime: 60 * 5,
})
const db = drizzle(client)

interface StandardWorld {
  id: string
  name: string
  description: string
  users: any[]
  artifacts: any[]
  chats: any[]
  settings: {
    autoCleanup: boolean
    cleanupAfterHours: number
  }
  dependencies: string[]
  environment: 'LOCAL' | 'BETA' | 'PROD'
  category: string
  tags: string[]
  isActive: boolean
  isTemplate: boolean
  autoCleanup: boolean
  cleanupAfterHours: number
  version: string
  isolationLevel: 'FULL' | 'PARTIAL' | 'NONE'
}

/**
 * Standard test worlds configuration for Phoenix Quick Login Panel
 * These worlds provide consistent testing environments for different scenarios
 */
const STANDARD_TEST_WORLDS: StandardWorld[] = [
  {
    id: 'CLEAN_USER_WORKSPACE',
    name: 'Clean User Workspace',
    description: 'Fresh workspace with minimal setup for testing basic user workflows',
    users: [
      {
        email: 'clean-user@test.com',
        name: 'Clean Test User',
        type: 'user'
      }
    ],
    artifacts: [],
    chats: [],
    settings: {
      autoCleanup: true,
      cleanupAfterHours: 24
    },
    dependencies: [],
    environment: 'LOCAL',
    category: 'GENERAL',
    tags: ['clean', 'minimal', 'user-testing'],
    isActive: true,
    isTemplate: true,
    autoCleanup: true,
    cleanupAfterHours: 24,
    version: '1.0.0',
    isolationLevel: 'FULL'
  },
  {
    id: 'SITE_READY_FOR_PUBLICATION',
    name: 'Site Ready for Publication',
    description: 'Pre-configured environment with sites ready for publication testing',
    users: [
      {
        email: 'publisher@test.com',
        name: 'Publisher User',
        type: 'user'
      }
    ],
    artifacts: [
      {
        kind: 'site',
        title: 'Welcome Site - Ready to Publish',
        content: {
          theme: 'professional',
          blocks: [
            {
              type: 'hero',
              slots: {
                heading: 'welcome-heading',
                subtitle: 'welcome-subtitle',
                image: 'company-logo'
              }
            },
            {
              type: 'contacts',
              slots: {
                contacts: 'hr-contacts'
              }
            }
          ]
        }
      },
      {
        kind: 'text',
        title: 'Welcome Heading',
        content: 'Welcome to Your New Journey!'
      },
      {
        kind: 'text',
        title: 'Welcome Subtitle',
        content: 'We are excited to have you join our team and look forward to working together.'
      },
      {
        kind: 'person',
        title: 'HR Contact',
        content: {
          fullName: 'Sarah Johnson',
          position: 'HR Manager',
          email: 'sarah.johnson@company.com',
          phone: '+1 (555) 123-4567',
          department: 'Human Resources'
        }
      }
    ],
    chats: [
      {
        title: 'Publication Testing Chat',
        messages: []
      }
    ],
    settings: {
      autoCleanup: true,
      cleanupAfterHours: 48
    },
    dependencies: [],
    environment: 'LOCAL',
    category: 'PUBLICATION',
    tags: ['publication', 'site-testing', 'ready'],
    isActive: true,
    isTemplate: false,
    autoCleanup: true,
    cleanupAfterHours: 48,
    version: '1.0.0',
    isolationLevel: 'FULL'
  },
  {
    id: 'CONTENT_LIBRARY_BASE',
    name: 'Content Library Base',
    description: 'Rich content library with various artifact types for testing content management',
    users: [
      {
        email: 'content-manager@test.com',
        name: 'Content Manager',
        type: 'user'
      }
    ],
    artifacts: [
      {
        kind: 'text',
        title: 'Company Introduction',
        content: 'Welcome to our innovative company where technology meets creativity.'
      },
      {
        kind: 'text',
        title: 'Mission Statement',
        content: 'Our mission is to deliver exceptional solutions that transform businesses and empower individuals.'
      },
      {
        kind: 'person',
        title: 'CEO Contact',
        content: {
          fullName: 'John Smith',
          position: 'Chief Executive Officer',
          email: 'john.smith@company.com',
          department: 'Executive'
        }
      },
      {
        kind: 'person',
        title: 'CTO Contact',
        content: {
          fullName: 'Emily Davis',
          position: 'Chief Technology Officer',
          email: 'emily.davis@company.com',
          department: 'Technology'
        }
      },
      {
        kind: 'address',
        title: 'Main Office',
        content: {
          streetAddress: '123 Tech Street',
          city: 'Innovation City',
          state: 'CA',
          postalCode: '12345',
          country: 'United States'
        }
      },
      {
        kind: 'link',
        title: 'Company Handbook',
        content: {
          url: 'https://handbook.company.com',
          title: 'Employee Handbook',
          description: 'Complete guide to company policies and procedures',
          category: 'Documentation'
        }
      },
      {
        kind: 'faq-item',
        title: 'Working Hours FAQ',
        content: {
          question: 'What are the standard working hours?',
          answer: 'Our standard working hours are 9:00 AM to 6:00 PM, Monday through Friday, with flexible arrangements available.',
          category: 'General'
        }
      }
    ],
    chats: [],
    settings: {
      autoCleanup: false,
      cleanupAfterHours: 0
    },
    dependencies: [],
    environment: 'LOCAL',
    category: 'CONTENT',
    tags: ['content-library', 'artifacts', 'comprehensive'],
    isActive: true,
    isTemplate: true,
    autoCleanup: false,
    cleanupAfterHours: 0,
    version: '1.0.0',
    isolationLevel: 'FULL'
  },
  {
    id: 'DEMO_PREPARATION',
    name: 'Demo Preparation',
    description: 'Polished demo environment for presentations and product demonstrations',
    users: [
      {
        email: 'demo@welcomecraft.com',
        name: 'Demo Presenter',
        type: 'admin'
      }
    ],
    artifacts: [
      {
        kind: 'site',
        title: 'Demo Onboarding Site',
        content: {
          theme: 'modern',
          blocks: [
            {
              type: 'hero',
              slots: {
                heading: 'demo-welcome',
                image: 'demo-hero-image'
              }
            },
            {
              type: 'team-info',
              slots: {
                team: 'demo-team'
              }
            },
            {
              type: 'useful-links',
              slots: {
                links: 'demo-resources'
              }
            }
          ]
        }
      },
      {
        kind: 'text',
        title: 'Demo Welcome Message',
        content: 'Welcome to WelcomeCraft - where onboarding becomes an experience!'
      },
      {
        kind: 'image',
        title: 'Demo Hero Image',
        content: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop'
      },
      {
        kind: 'person',
        title: 'Demo Team Lead',
        content: {
          fullName: 'Alex Chen',
          position: 'Team Lead',
          email: 'alex.chen@company.com',
          department: 'Product Development',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        }
      },
      {
        kind: 'link',
        title: 'Getting Started Guide',
        content: {
          url: 'https://docs.company.com/getting-started',
          title: 'Getting Started Guide',
          description: 'Everything you need to know for your first week',
          category: 'Onboarding'
        }
      }
    ],
    chats: [
      {
        title: 'Demo Conversation',
        messages: []
      }
    ],
    settings: {
      autoCleanup: false,
      cleanupAfterHours: 0
    },
    dependencies: [],
    environment: 'LOCAL',
    category: 'DEMO',
    tags: ['demo', 'presentation', 'polished', 'showcase'],
    isActive: true,
    isTemplate: true,
    autoCleanup: false,
    cleanupAfterHours: 0,
    version: '1.0.0',
    isolationLevel: 'FULL'
  },
  {
    id: 'ENTERPRISE_ONBOARDING',
    name: 'Enterprise Onboarding',
    description: 'Enterprise-grade onboarding environment with comprehensive content and workflows',
    users: [
      {
        email: 'hr-admin@enterprise.com',
        name: 'HR Administrator',
        type: 'admin'
      },
      {
        email: 'new-hire@enterprise.com',
        name: 'New Employee',
        type: 'user'
      },
      {
        email: 'alice.developer@enterprise.com',
        name: 'Alice Johnson',
        type: 'user'
      },
      {
        email: 'bob.designer@enterprise.com',
        name: 'Bob Smith',
        type: 'user'
      },
      {
        email: 'carol.manager@enterprise.com',
        name: 'Carol Wilson',
        type: 'user'
      }
    ],
    artifacts: [
      {
        kind: 'site',
        title: 'Enterprise Onboarding Portal',
        content: {
          theme: 'enterprise',
          blocks: [
            {
              type: 'hero',
              slots: {
                heading: 'enterprise-welcome',
                subtitle: 'enterprise-subtitle'
              }
            },
            {
              type: 'key-contacts',
              slots: {
                contacts: 'enterprise-contacts'
              }
            },
            {
              type: 'getting-started',
              slots: {
                checklist: 'onboarding-checklist'
              }
            },
            {
              type: 'faq',
              slots: {
                faqs: 'enterprise-faqs'
              }
            },
            {
              type: 'address',
              slots: {
                offices: 'enterprise-offices'
              }
            }
          ]
        }
      },
      {
        kind: 'text',
        title: 'Enterprise Welcome',
        content: 'Welcome to Enterprise Corp - Building the Future Together'
      },
      {
        kind: 'text',
        title: 'Enterprise Subtitle',
        content: 'As a new member of our team, you are now part of an organization committed to innovation, excellence, and growth.'
      },
      {
        kind: 'person',
        title: 'VP of People',
        content: {
          fullName: 'Maria Rodriguez',
          position: 'VP of People Operations',
          email: 'maria.rodriguez@enterprise.com',
          phone: '+1 (555) 987-6543',
          department: 'People Operations'
        }
      },
      {
        kind: 'person',
        title: 'IT Support Lead',
        content: {
          fullName: 'David Kim',
          position: 'IT Support Lead',
          email: 'david.kim@enterprise.com',
          phone: '+1 (555) 456-7890',
          department: 'Information Technology'
        }
      },
      {
        kind: 'address',
        title: 'Headquarters',
        content: {
          streetAddress: '500 Enterprise Boulevard',
          city: 'Business District',
          state: 'NY',
          postalCode: '10001',
          country: 'United States'
        }
      },
      {
        kind: 'faq-item',
        title: 'Benefits Enrollment',
        content: {
          question: 'When can I enroll in benefits?',
          answer: 'You can enroll in benefits within your first 30 days of employment. HR will schedule a benefits orientation session during your first week.',
          category: 'Benefits'
        }
      },
      {
        kind: 'faq-item',
        title: 'Parking Information',
        content: {
          question: 'Is parking available at the office?',
          answer: 'Yes, we provide free parking for all employees. Your parking pass will be available at the security desk on your first day.',
          category: 'Facilities'
        }
      },
      {
        kind: 'link',
        title: 'Employee Portal',
        content: {
          url: 'https://portal.enterprise.com',
          title: 'Employee Self-Service Portal',
          description: 'Access your benefits, payroll, and HR information',
          category: 'Essential Tools'
        }
      },
      {
        kind: 'link',
        title: 'Learning Management System',
        content: {
          url: 'https://learn.enterprise.com',
          title: 'Enterprise Learning Hub',
          description: 'Complete your required training and explore professional development opportunities',
          category: 'Training'
        }
      }
    ],
    chats: [
      {
        title: 'Enterprise Onboarding Chat',
        messages: []
      }
    ],
    settings: {
      autoCleanup: true,
      cleanupAfterHours: 168 // 1 week
    },
    dependencies: [],
    environment: 'LOCAL',
    category: 'ENTERPRISE',
    tags: ['enterprise', 'onboarding', 'comprehensive', 'corporate'],
    isActive: true,
    isTemplate: true,
    autoCleanup: true,
    cleanupAfterHours: 168,
    version: '1.0.0',
    isolationLevel: 'FULL'
  }
]

/**
 * Seeds the standard test worlds into the database
 * 
 * @param options Configuration options for seeding
 * @returns Promise that resolves when seeding is complete
 */
export async function seedStandardTestWorlds(options: {
  skipExisting?: boolean
  verbose?: boolean
  dryRun?: boolean
} = {}): Promise<void> {
  const { skipExisting = true, verbose = true, dryRun = false } = options

  console.log('🔥 PHOENIX: Seeding standard test worlds...')

  if (dryRun) {
    console.log('🧪 DRY RUN: Would seed the following worlds:')
    for (const world of STANDARD_TEST_WORLDS) {
      console.log(`   🌍 ${world.id}: ${world.name}`)
    }
    return
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const worldData of STANDARD_TEST_WORLDS) {
    try {
      // Check if world already exists
      const existing = await db
        .select()
        .from(worldMeta)
        .where(eq(worldMeta.id, worldData.id))

      if (existing.length > 0 && skipExisting) {
        if (verbose) {
          console.log(`   ⚠️  World ${worldData.id} already exists, skipping`)
        }
        skipped++
        continue
      }

      // Prepare world record for database
      const worldRecord = {
        ...worldData,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        lastUsedAt: null,
        createdBy: null // Will be set if there's an authenticated user
      }

      if (existing.length > 0) {
        // Update existing world
        await db
          .update(worldMeta)
          .set({
            ...worldRecord,
            createdAt: existing[0].createdAt // Preserve original creation date
          })
          .where(eq(worldMeta.id, worldData.id))
        
        updated++
        if (verbose) {
          console.log(`   🔄 Updated world: ${worldData.name}`)
        }
      } else {
        // Insert new world
        await db
          .insert(worldMeta)
          .values(worldRecord)
        
        created++
        if (verbose) {
          console.log(`   ✅ Created world: ${worldData.name}`)
        }
      }

    } catch (error) {
      console.error(`   ❌ Error seeding world ${worldData.id}:`, error)
    }
  }

  console.log(`✅ Standard test worlds seeded: ${created} created, ${updated} updated, ${skipped} skipped`)
}

/**
 * Lists all standard test worlds currently in the database
 */
export async function listStandardTestWorlds(): Promise<void> {
  console.log('🔍 PHOENIX: Listing standard test worlds...')

  try {
    const worldIds = STANDARD_TEST_WORLDS.map(w => w.id)
    const worlds = await db
      .select()
      .from(worldMeta)
      .where(eq(worldMeta.environment, 'LOCAL'))

    const standardWorlds = worlds.filter(w => worldIds.includes(w.id))

    console.log(`\n📋 Found ${standardWorlds.length} standard test worlds:`)
    console.log('─'.repeat(80))

    for (const world of standardWorlds) {
      const status = world.isActive ? '🟢 Active' : '🔴 Inactive'
      const template = world.isTemplate ? '📋 Template' : '🔧 Instance'
      
      console.log(`${status} ${template} ${world.id}`)
      console.log(`   Name: ${world.name}`)
      console.log(`   Description: ${world.description}`)
      console.log(`   Usage Count: ${world.usageCount}`)
      console.log(`   Last Used: ${world.lastUsedAt ? world.lastUsedAt.toISOString() : 'Never'}`)
      console.log()
    }

    // Check for missing worlds
    const existingIds = standardWorlds.map(w => w.id)
    const missingIds = worldIds.filter(id => !existingIds.includes(id))
    
    if (missingIds.length > 0) {
      console.log('⚠️  Missing standard worlds:')
      for (const missingId of missingIds) {
        console.log(`   🔴 ${missingId}`)
      }
      console.log('\nRun: pnpm phoenix:seed:standard-worlds to create missing worlds')
    }

  } catch (error) {
    console.error('❌ Error listing standard test worlds:', error)
  }
}

/**
 * Validates that all standard test worlds are properly configured
 */
export async function validateStandardTestWorlds(): Promise<boolean> {
  console.log('🔍 PHOENIX: Validating standard test worlds...')

  try {
    const worldIds = STANDARD_TEST_WORLDS.map(w => w.id)
    const worlds = await db
      .select()
      .from(worldMeta)
      .where(eq(worldMeta.environment, 'LOCAL'))

    const standardWorlds = worlds.filter(w => worldIds.includes(w.id))

    let isValid = true

    // Check if all standard worlds exist
    if (standardWorlds.length !== STANDARD_TEST_WORLDS.length) {
      console.log(`❌ Expected ${STANDARD_TEST_WORLDS.length} standard worlds, found ${standardWorlds.length}`)
      isValid = false
    }

    // Check if all worlds are active
    const inactiveWorlds = standardWorlds.filter(w => !w.isActive)
    if (inactiveWorlds.length > 0) {
      console.log(`❌ Found ${inactiveWorlds.length} inactive standard worlds`)
      isValid = false
    }

    // Check essential worlds
    const essentialWorlds = ['CLEAN_USER_WORKSPACE', 'SITE_READY_FOR_PUBLICATION', 'CONTENT_LIBRARY_BASE']
    const missingEssential = essentialWorlds.filter(id => !standardWorlds.some(w => w.id === id))
    if (missingEssential.length > 0) {
      console.log(`❌ Missing essential worlds: ${missingEssential.join(', ')}`)
      isValid = false
    }

    if (isValid) {
      console.log('✅ All standard test worlds are properly configured')
    } else {
      console.log('❌ Standard test worlds validation failed')
    }

    return isValid

  } catch (error) {
    console.error('❌ Error validating standard test worlds:', error)
    return false
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'seed'

  switch (command) {
    case 'seed':
      seedStandardTestWorlds({ skipExisting: false, verbose: true })
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'list':
      listStandardTestWorlds()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'validate':
      validateStandardTestWorlds()
        .then((isValid) => process.exit(isValid ? 0 : 1))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'dry-run':
      seedStandardTestWorlds({ dryRun: true, verbose: true })
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    default:
      console.log('🔥 PHOENIX: Standard Test Worlds Seeder')
      console.log('')
      console.log('Usage:')
      console.log('  seed         - Seed all standard test worlds')
      console.log('  list         - List existing standard test worlds')
      console.log('  validate     - Validate standard test worlds configuration')
      console.log('  dry-run      - Show what would be seeded without making changes')
      console.log('')
      console.log('Standard Test Worlds:')
      console.log('  • CLEAN_USER_WORKSPACE')
      console.log('  • SITE_READY_FOR_PUBLICATION')
      console.log('  • CONTENT_LIBRARY_BASE')
      console.log('  • DEMO_PREPARATION')
      console.log('  • ENTERPRISE_ONBOARDING')
      console.log('')
      console.log('Examples:')
      console.log('  pnpm phoenix:seed:standard-worlds')
      console.log('  pnpm phoenix:seed:standard-worlds list')
      console.log('  pnpm phoenix:seed:standard-worlds validate')
      process.exit(0)
  }
}

// END OF: scripts/seed-standard-test-worlds.ts