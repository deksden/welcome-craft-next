
import { generateUUID } from '@/lib/utils'
import { expect, apiTest as test } from '../api-fixtures'
import { getMessageByErrorCode } from '@/lib/errors'

// МУЛЬТИДОМЕННАЯ АРХИТЕКТУРА + COOKIES:
// - Аутентификация: app.localhost:3000/login
// - API calls: localhost:3000/api/* (глобальные)  
// - Cookies передача между доменами исправлена в api-fixtures.ts
// - API возвращает 'unauthorized:artifact' (не 'unauthorized:api')

test.describe('/api/artifact', () => {
    test.describe('Basic API validation', () => {
        test('Ada cannot retrieve an artifact without specifying an id', async ({
          adaContext,
        }) => {
          const response = await adaContext.request.get('/api/artifact')
          expect(response.status()).toBe(400)

          const { code, message } = await response.json()
          expect(code).toEqual('bad_request:api')
          expect(message).toEqual(getMessageByErrorCode(code))
        })

        test('Ada cannot retrieve an artifact that does not exist', async ({
          adaContext,
        }) => {
          const artifactId = generateUUID()

          const response = await adaContext.request.get(
            `/api/artifact?id=${artifactId}`,
          )
          expect(response.status()).toBe(404)

          const { code, message } = await response.json()
          expect(code).toEqual('not_found:artifact')
          expect(message).toEqual(getMessageByErrorCode(code))
        })

        test('Ada cannot delete an artifact without specifying an id', async ({
          adaContext,
        }) => {
          const response = await adaContext.request.delete(`/api/artifact`)
          expect(response.status()).toBe(400)

          const { code, message } = await response.json()
          expect(code).toEqual('bad_request:api')
          expect(message).toEqual(getMessageByErrorCode(code))
        })
    })

    test.describe('CRUD operations', () => {
        test('Ada can create an artifact', async ({ adaContext }) => {
          const artifactId = generateUUID()

          const draftArtifact = {
            title: 'Ada\'s Artifact',
            kind: 'text',
            content: 'Created by Ada',
          }

          console.log('Creating artifact with Ada context, email:', adaContext.email)

          const response = await adaContext.request.post(
            `/api/artifact?id=${artifactId}`,
            {
              data: draftArtifact,
            },
          )
          
          // Debug: Log response details if not 200
          if (response.status() !== 200) {
            const responseBody = await response.text()
            console.log('Artifact creation failed:', response.status(), responseBody)
          }
          
          expect(response.status()).toBe(200)

          const createdArtifact = await response.json()
          expect(createdArtifact).toMatchObject(draftArtifact)
        })

        test('Ada can retrieve a created artifact', async ({ adaContext }) => {
          // Сначала создаем артефакт
          const artifactId = generateUUID()
          const draftArtifact = {
            title: 'Ada\'s Artifact for Retrieval',
            kind: 'text',
            content: 'Created by Ada for retrieval test',
          }

          const createResponse = await adaContext.request.post(
            `/api/artifact?id=${artifactId}`,
            { data: draftArtifact }
          )
          expect(createResponse.status()).toBe(200)
          const createdArtifact = await createResponse.json()

          // Теперь извлекаем его
          const response = await adaContext.request.get(
            `/api/artifact?id=${createdArtifact.id}`,
          )
          expect(response.status()).toBe(200)

          const retrievedArtifacts = await response.json()
          expect(retrievedArtifacts).toHaveLength(1)

          const [retrievedArtifact] = retrievedArtifacts
          expect(retrievedArtifact).toMatchObject(draftArtifact)
        })

        test('Ada can save a new version of the artifact', async ({ adaContext }) => {
          // Создаем первую версию
          const artifactId = generateUUID()
          const firstVersion = {
            title: 'Ada\'s Artifact',
            kind: 'text',
            content: 'Original version',
          }

          const firstResponse = await adaContext.request.post(
            `/api/artifact?id=${artifactId}`,
            { data: firstVersion }
          )
          expect(firstResponse.status()).toBe(200)
          const firstArtifact = await firstResponse.json()

          // Создаем вторую версию
          const secondVersion = {
            title: 'Ada\'s Artifact',
            kind: 'text',
            content: 'Updated by Ada',
          }

          const secondResponse = await adaContext.request.post(
            `/api/artifact?id=${firstArtifact.id}`,
            { data: secondVersion }
          )
          expect(secondResponse.status()).toBe(200)
          const secondArtifact = await secondResponse.json()
          expect(secondArtifact).toMatchObject(secondVersion)
        })

        test('Ada can retrieve all versions of her artifacts', async ({ adaContext }) => {
          // Создаем первую версию
          const artifactId = generateUUID()
          const firstVersion = {
            title: 'Ada\'s Versioned Artifact',
            kind: 'text',
            content: 'Version 1',
          }

          const firstResponse = await adaContext.request.post(
            `/api/artifact?id=${artifactId}`,
            { data: firstVersion }
          )
          expect(firstResponse.status()).toBe(200)
          const firstArtifact = await firstResponse.json()

          // Создаем вторую версию
          const secondVersion = {
            title: 'Ada\'s Versioned Artifact',
            kind: 'text',
            content: 'Version 2',
          }

          const secondResponse = await adaContext.request.post(
            `/api/artifact?id=${firstArtifact.id}`,
            { data: secondVersion }
          )
          expect(secondResponse.status()).toBe(200)

          // Получаем все версии
          const response = await adaContext.request.get(
            `/api/artifact?id=${firstArtifact.id}`,
          )
          expect(response.status()).toBe(200)

          const retrievedArtifacts = await response.json()
          expect(retrievedArtifacts).toHaveLength(2)
        })

        test('Ada cannot delete an artifact without specifying a timestamp', async ({ adaContext }) => {
          // Создаем артефакт
          const artifactId = generateUUID()
          const draftArtifact = {
            title: 'Ada\'s Artifact for Delete',
            kind: 'text',
            content: 'To be deleted',
          }

          const createResponse = await adaContext.request.post(
            `/api/artifact?id=${artifactId}`,
            { data: draftArtifact }
          )
          expect(createResponse.status()).toBe(200)
          const firstArtifact = await createResponse.json()

          // Попытка удалить без timestamp
          const response = await adaContext.request.delete(
            `/api/artifact?id=${firstArtifact.id}`,
          )
          expect(response.status()).toBe(400)

          const { code, message } = await response.json()
          expect(code).toEqual('bad_request:api')
          expect(message).toEqual(getMessageByErrorCode(code))
        })
    })

    test.describe('Access control', () => {
        test('Babbage cannot update Ada\'s artifact', async ({ adaContext, babbageContext }) => {
          // Ada создает артефакт
          const artifactId = generateUUID()
          const draftArtifact = {
            title: 'Ada\'s Private Artifact',
            kind: 'text',
            content: 'Created by Ada',
          }

          const createResponse = await adaContext.request.post(
            `/api/artifact?id=${artifactId}`,
            { data: draftArtifact }
          )
          expect(createResponse.status()).toBe(200)
          const adaArtifact = await createResponse.json()

          // Babbage пытается обновить артефакт Ada
          const babbageUpdate = {
            title: 'Babbage\'s Artifact',
            kind: 'text',
            content: 'Updated by Babbage',
          }

          const response = await babbageContext.request.post(
            `/api/artifact?id=${adaArtifact.id}`,
            { data: babbageUpdate }
          )
          expect(response.status()).toBe(403)

          const { code, message } = await response.json()
          expect(code).toEqual('forbidden:artifact')
          expect(message).toEqual(getMessageByErrorCode(code))
        })
    })

    test.describe('UC-10: Schema-Driven Artifact Types', () => {
        
        test('Должен создавать и извлекать Person артефакт', async ({ adaContext }) => {
          const artifactId = generateUUID()
          const personData = {
            fullName: 'John Doe Smith',
            position: 'Senior Software Engineer',
            email: 'john.smith@company.com',
            department: 'Engineering',
            phone: '+1-555-0123',
            bio: 'Experienced full-stack developer with 5+ years'
          }

          // Создаем Person артефакт
          const createResponse = await adaContext.request.post(`/api/artifact?id=${artifactId}`, {
            data: {
              title: 'Employee Profile: John Smith',
              kind: 'person',
              content: JSON.stringify(personData)
            }
          })
          expect(createResponse.status()).toBe(200)

          // Извлекаем и верифицируем
          const getResponse = await adaContext.request.get(`/api/artifact?id=${artifactId}`)
          expect(getResponse.status()).toBe(200)

          const artifacts = await getResponse.json()
          expect(artifacts).toHaveLength(1)
          
          const artifact = artifacts[0]
          expect(artifact.kind).toBe('person')
          
          const retrievedPersonData = JSON.parse(artifact.content)
          expect(retrievedPersonData.fullName).toBe(personData.fullName)
          expect(retrievedPersonData.position).toBe(personData.position)
          expect(retrievedPersonData.department).toBe(personData.department)
          expect(retrievedPersonData.email).toBe(personData.email)
        })

        test('Должен создавать и извлекать Address артефакт', async ({ adaContext }) => {
          const artifactId = generateUUID()
          const addressData = {
            streetAddress: '1600 Amphitheatre Parkway',
            city: 'Mountain View',
            state: 'California',
            country: 'United States',
            postalCode: '94043',
            type: 'office'
          }

          const createResponse = await adaContext.request.post(`/api/artifact?id=${artifactId}`, {
            data: {
              title: 'Google HQ Address',
              kind: 'address',
              content: JSON.stringify(addressData)
            }
          })
          expect(createResponse.status()).toBe(200)

          const getResponse = await adaContext.request.get(`/api/artifact?id=${artifactId}`)
          const artifacts = await getResponse.json()
          
          const retrievedAddress = JSON.parse(artifacts[0].content)
          expect(retrievedAddress.streetAddress).toBe(addressData.streetAddress)
          expect(retrievedAddress.city).toBe(addressData.city)
          expect(retrievedAddress.country).toBe(addressData.country)
        })

        test('Должен создавать и извлекать FAQ-Item артефакт', async ({ adaContext }) => {
          const artifactId = generateUUID()
          const faqData = {
            question: 'How do I reset my password?',
            answer: 'Click on the "Forgot Password" link on the login page and follow instructions.',
            category: 'authentication',
            tags: ['password', 'reset', 'login', 'help']
          }

          const createResponse = await adaContext.request.post(`/api/artifact?id=${artifactId}`, {
            data: {
              title: 'FAQ: Password Reset',
              kind: 'faq-item',
              content: JSON.stringify(faqData)
            }
          })
          expect(createResponse.status()).toBe(200)

          const getResponse = await adaContext.request.get(`/api/artifact?id=${artifactId}`)
          const artifacts = await getResponse.json()
          
          const retrievedFaq = JSON.parse(artifacts[0].content)
          expect(retrievedFaq.question).toBe(faqData.question)
          expect(retrievedFaq.answer).toBe(faqData.answer)
          expect(retrievedFaq.category).toBe(faqData.category)
          expect(retrievedFaq.tags).toEqual(faqData.tags)
        })

        test('Должен создавать и извлекать Link артефакт', async ({ adaContext }) => {
          const artifactId = generateUUID()
          const linkData = {
            url: 'https://company.wiki.com/onboarding',
            title: 'New Employee Onboarding Wiki',
            description: 'Complete guide for new hires including policies, procedures, and resources.',
            category: 'documentation',
            isInternal: true
          }

          const createResponse = await adaContext.request.post(`/api/artifact?id=${artifactId}`, {
            data: {
              title: 'Onboarding Wiki Link',
              kind: 'link',
              content: JSON.stringify(linkData)
            }
          })
          expect(createResponse.status()).toBe(200)

          const getResponse = await adaContext.request.get(`/api/artifact?id=${artifactId}`)
          const artifacts = await getResponse.json()
          
          const retrievedLink = JSON.parse(artifacts[0].content)
          expect(retrievedLink.url).toBe(linkData.url)
          expect(retrievedLink.title).toBe(linkData.title)
          expect(retrievedLink.isInternal).toBe(linkData.isInternal)
        })

        test('Должен корректно обрабатывать все 11 типов артефактов', async ({ adaContext }) => {
          const allTypes: Array<{ kind: string, testData: any }> = [
            { kind: 'text', testData: 'Sample text content' },
            { kind: 'code', testData: 'console.log("Hello World")' },
            { kind: 'image', testData: 'https://example.com/image.jpg' },
            { kind: 'sheet', testData: 'Name,Age\nJohn,30' },
            { kind: 'site', testData: JSON.stringify({ theme: 'default', blocks: [] }) },
            { kind: 'person', testData: JSON.stringify({ fullName: 'Test Person' }) },
            { kind: 'address', testData: JSON.stringify({ streetAddress: 'Test Street', city: 'Test City', country: 'Test Country' }) },
            { kind: 'faq-item', testData: JSON.stringify({ question: 'Test?', answer: 'Answer' }) },
            { kind: 'link', testData: JSON.stringify({ url: 'https://test.com', title: 'Test' }) },
            { kind: 'set-definition', testData: JSON.stringify({ definition: { allowedKinds: ['text', 'image'] }, validationRules: {}, defaultSorting: 'createdAt' }) }
          ]

          const createdArtifacts = []
          let setDefinitionId = null

          // Создаем по одному артефакту каждого типа (кроме set)
          for (const { kind, testData } of allTypes) {
            const artifactId = generateUUID()
            
            const createResponse = await adaContext.request.post(`/api/artifact?id=${artifactId}`, {
              data: {
                title: `Test ${kind} artifact`,
                kind: kind,
                content: testData
              }
            })
            
            expect(createResponse.status()).toBe(200)
            createdArtifacts.push({ id: artifactId, kind, expectedContent: testData })
            
            // Сохраняем ID set-definition для использования в set артефакте
            if (kind === 'set-definition') {
              setDefinitionId = artifactId
            }
          }

          // Теперь создаем set артефакт с реальным setDefinitionId
          if (setDefinitionId) {
            const setArtifactId = generateUUID()
            const setTestData = JSON.stringify({ setDefinitionId, items: [] })
            
            const createSetResponse = await adaContext.request.post(`/api/artifact?id=${setArtifactId}`, {
              data: {
                title: 'Test set artifact',
                kind: 'set',
                content: setTestData
              }
            })
            
            expect(createSetResponse.status()).toBe(200)
            createdArtifacts.push({ id: setArtifactId, kind: 'set', expectedContent: setTestData })
          }

          // Проверяем что все артефакты успешно созданы
          expect(createdArtifacts).toHaveLength(11)
          expect(createdArtifacts.map(a => a.kind)).toEqual([
            'text', 'code', 'image', 'sheet', 'site', 
            'person', 'address', 'faq-item', 'link', 'set-definition', 'set'
          ])
        })
    })
})