/**
 * @file tests/helpers/artifact-payload-factory.ts
 * @description Фабрика для создания тестовых payloads для UC-10 артефактов
 * @version 1.0.0
 * @date 2025-06-21
 */

import type { ArtifactKind } from '@/lib/types'

interface BasePayloadOptions {
  title?: string
}

interface ContentPayloadOptions<T> extends BasePayloadOptions {
  content: T
}

export function createTextPayload(options: ContentPayloadOptions<string>) {
  return {
    kind: 'text' as const,
    title: options.title || 'Test Text Artifact',
    content: options.content
  }
}

export function createPersonPayload(options: ContentPayloadOptions<{
  fullName?: string
  position?: string
  department?: string
  email?: string
  phone?: string
  bio?: string
}>) {
  const defaultPerson = {
    fullName: 'John Doe',
    position: 'Software Engineer',
    department: 'Engineering',
    email: 'john.doe@example.com'
  }

  return {
    kind: 'person' as const,
    title: options.title || `Employee: ${options.content.fullName || defaultPerson.fullName}`,
    content: JSON.stringify({ ...defaultPerson, ...options.content })
  }
}

export function createAddressPayload(options: ContentPayloadOptions<{
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  type?: 'office' | 'home' | 'shipping'
}>) {
  const defaultAddress = {
    street: '123 Default Street',
    city: 'Default City',
    country: 'Default Country',
    type: 'office' as const
  }

  return {
    kind: 'address' as const,
    title: options.title || 'Test Address',
    content: JSON.stringify({ ...defaultAddress, ...options.content })
  }
}

export function createFaqItemPayload(options: ContentPayloadOptions<{
  question?: string
  answer?: string
  category?: string
  tags?: string[]
}>) {
  const defaultFaq = {
    question: 'Sample question?',
    answer: 'Sample answer.',
    category: 'general',
    tags: ['sample']
  }

  return {
    kind: 'faq-item' as const,
    title: options.title || 'FAQ Item',
    content: JSON.stringify({ ...defaultFaq, ...options.content })
  }
}

export function createLinkPayload(options: ContentPayloadOptions<{
  url?: string
  title?: string
  description?: string
  category?: string
  isInternal?: boolean
}>) {
  const defaultLink = {
    url: 'https://example.com',
    title: 'Example Link',
    description: 'Sample link description',
    category: 'general',
    isInternal: false
  }

  return {
    kind: 'link' as const,
    title: options.title || 'Test Link',
    content: JSON.stringify({ ...defaultLink, ...options.content })
  }
}

export function createSetDefinitionPayload(options: ContentPayloadOptions<{
  name?: string
  description?: string
  schema?: object
  defaultValues?: object
}>) {
  const defaultSetDef = {
    name: 'Sample Set',
    description: 'Sample set description',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'string' }
      }
    },
    defaultValues: {}
  }

  return {
    kind: 'set-definition' as const,
    title: options.title || 'Test Set Definition',
    content: JSON.stringify({ ...defaultSetDef, ...options.content })
  }
}

export function createSetPayload(options: ContentPayloadOptions<{
  setDefinitionId?: string
  items?: object[]
}>) {
  const defaultSet = {
    setDefinitionId: 'default-set-def',
    items: [
      { name: 'Item 1', value: 'Value 1' },
      { name: 'Item 2', value: 'Value 2' }
    ]
  }

  return {
    kind: 'set' as const,
    title: options.title || 'Test Set',
    content: JSON.stringify({ ...defaultSet, ...options.content })
  }
}

// Универсальная фабрика для всех типов
export function createArtifactPayload(kind: ArtifactKind, content: any, title?: string) {
  const basePayload = {
    kind,
    title: title || `Test ${kind} artifact`,
    content: typeof content === 'string' ? content : JSON.stringify(content)
  }

  return basePayload
}

// Генератор тестовых данных для массового создания
export function generateTestArtifacts(count: number, kind: ArtifactKind) {
  const artifacts = []
  
  for (let i = 0; i < count; i++) {
    let content: any
    
    switch (kind) {
      case 'person':
        content = {
          fullName: `Test Person ${i + 1}`,
          position: `Position ${i + 1}`,
          department: 'Test Department'
        }
        break
      case 'address':
        content = {
          street: `${i + 1} Test Street`,
          city: `Test City ${i + 1}`,
          country: 'Test Country'
        }
        break
      case 'faq-item':
        content = {
          question: `Test question ${i + 1}?`,
          answer: `Test answer ${i + 1}`,
          category: 'test'
        }
        break
      case 'link':
        content = {
          url: `https://test${i + 1}.com`,
          title: `Test Link ${i + 1}`,
          description: `Test description ${i + 1}`
        }
        break
      default:
        content = `Test ${kind} content ${i + 1}`
    }
    
    artifacts.push(createArtifactPayload(kind, content, `Test ${kind} ${i + 1}`))
  }
  
  return artifacts
}

// Фабрики для специфических сценариев тестирования
export const testScenarios = {
  // Сценарий для HR онбординга
  hrOnboarding: () => ({
    person: createPersonPayload({
      content: {
        fullName: 'Jane Smith',
        position: 'Senior HR Manager',
        department: 'Human Resources',
        email: 'jane.smith@company.com',
        phone: '+1-555-0199'
      }
    }),
    address: createAddressPayload({
      content: {
        street: '100 Corporate Blvd',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94105',
        type: 'office'
      }
    }),
    faqItem: createFaqItemPayload({
      content: {
        question: 'How do I set up my benefits?',
        answer: 'Visit the HR portal and complete the benefits enrollment form within 30 days.',
        category: 'benefits',
        tags: ['benefits', 'enrollment', 'HR']
      }
    }),
    link: createLinkPayload({
      content: {
        url: 'https://company.com/hr-portal',
        title: 'HR Self-Service Portal',
        description: 'Access your benefits, payroll, and employee information',
        category: 'hr',
        isInternal: true
      }
    })
  }),

  // Сценарий для IT онбординга
  itOnboarding: () => ({
    person: createPersonPayload({
      content: {
        fullName: 'Alex Chen',
        position: 'DevOps Engineer',
        department: 'Information Technology',
        email: 'alex.chen@company.com'
      }
    }),
    link: createLinkPayload({
      content: {
        url: 'https://github.com/company/onboarding',
        title: 'Technical Onboarding Repository',
        description: 'Setup guides, coding standards, and development environment',
        category: 'development',
        isInternal: true
      }
    }),
    faqItem: createFaqItemPayload({
      content: {
        question: 'How do I get access to our development tools?',
        answer: 'Submit a ticket to IT with your manager approval for tool access.',
        category: 'access',
        tags: ['tools', 'access', 'IT']
      }
    })
  })
}