
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

          const [createdArtifact] = await response.json()
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
          const [createdArtifact] = await createResponse.json()

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
          const [firstArtifact] = await firstResponse.json()

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
          const [secondArtifact] = await secondResponse.json()
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
          const [firstArtifact] = await firstResponse.json()

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
          const [firstArtifact] = await createResponse.json()

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
          const [adaArtifact] = await createResponse.json()

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
})