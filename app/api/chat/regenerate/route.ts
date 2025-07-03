/**
 * @file app/api/chat/regenerate/route.ts
 * @description API endpoint for targeted message regeneration with full AI tools support.
 * @version 2.4.0
 * @date 2025-07-02
 * @updated BUG-086 FIX: Enhanced tool extraction debugging and added fallback to result.steps when top-level toolCalls/toolResults are empty.
 */

import { generateText, type CoreMessage, type Message } from 'ai'
import { auth } from '@/app/app/(auth)/auth'
import { getTestSession } from '@/lib/test-auth'
import { systemPrompt, type ArtifactContext } from '@/lib/ai/prompts'
import { myEnhancedProvider } from '@/lib/ai/providers.enhanced'
import { saveMessages, ensureUserExists } from '@/lib/db/queries'
import { getWorldContextFromRequest, addWorldId } from '@/lib/db/world-context'
import { generateUUID } from '@/lib/utils'
import { ChatSDKError } from '@/lib/errors'
import { db } from '@/lib/db'
import { message } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { artifactCreate } from '@/artifacts/tools/artifactCreate'
import { artifactUpdate } from '@/artifacts/tools/artifactUpdate'
import { artifactEnhance } from '@/artifacts/tools/artifactEnhance'
import { getWeather } from '@/lib/ai/tools/get-weather'
import { artifactContent } from '@/artifacts/tools/artifactContent'
import { artifactDelete } from '@/artifacts/tools/artifactDelete'
import { artifactRestore } from '@/artifacts/tools/artifactRestore'
import { triggerArtifactListRefresh } from '@/lib/elegant-refresh-utils'

export async function POST(request: Request) {
  try {
    // Authentication
    let session = await auth()
    let isTestSession = false
    if (!session?.user) {
      session = await getTestSession()
      isTestSession = true
    }
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Ensure test users exist in database
    if (isTestSession && session.user.email) {
      await ensureUserExists(session.user.id, session.user.email, session.user.type as 'user' | 'admin')
    }

    // Parse request body
    const { messages, chatId, replaceMessageId, selectedChatModel = 'main-model' } = await request.json()
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid messages array' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Chat ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get world context
    const worldContext = await getWorldContextFromRequest(request)

    // Convert messages to CoreMessage format and ensure proper typing
    const coreMessages: CoreMessage[] = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }))

    // Prepare artifact context (similar to main chat API)
    const artifactContext: ArtifactContext | undefined = undefined // Could be enhanced to extract from messages

    // Prepare request hints (similar to main chat API)
    const requestHints = {
      longitude: undefined,
      latitude: undefined,
      city: undefined,
      country: undefined
    }

    // Generate new response with full tools configuration
    console.log('🔧 REGENERATE DEBUG: Starting generateText with tools:', {
      modelSelected: selectedChatModel,
      messageCount: coreMessages.length,
      lastMessageRole: coreMessages[coreMessages.length - 1]?.role,
      lastMessageContent: `${coreMessages[coreMessages.length - 1]?.content?.slice(0, 100)}...`,
      hasArtifactContext: !!artifactContext,
      toolsAvailable: ['getWeather', 'artifactContent', 'artifactCreate', 'artifactUpdate', 'artifactEnhance', 'artifactDelete', 'artifactRestore']
    })

    const result = await generateText({
      model: myEnhancedProvider.languageModel(selectedChatModel),
      system: systemPrompt({ selectedChatModel, requestHints, artifactContext }),
      messages: coreMessages,
      maxSteps: 6,
      tools: {
        getWeather,
        artifactContent,
        artifactCreate: artifactCreate({ session, worldContext }), // 🔧 BUG-086 FIX: Pass world context to artifact tools
        artifactUpdate: artifactUpdate({ session, worldContext }),
        artifactEnhance: artifactEnhance({ session, worldContext }),
        artifactDelete: artifactDelete({ session, worldContext }),
        artifactRestore: artifactRestore({ session, worldContext }),
      },
    })

    // Extract tool calls and tool results from generateText result
    const toolInvocations: Array<any> = []
    
    console.log('🔧 REGENERATE DEBUG: Checking result structure:', {
      hasTopLevelToolCalls: !!result.toolCalls,
      hasTopLevelToolResults: !!result.toolResults,
      hasSteps: !!result.steps,
      topLevelToolCallsLength: result.toolCalls?.length || 0,
      topLevelToolResultsLength: result.toolResults?.length || 0,
      stepsLength: result.steps?.length || 0
    })
    
    // Try top-level toolCalls and toolResults first
    if (result.toolCalls && result.toolResults && result.toolCalls.length > 0) {
      console.log('🔧 REGENERATE: Using top-level toolCalls/toolResults')
      for (let i = 0; i < result.toolCalls.length; i++) {
        const toolCall = result.toolCalls[i]
        const toolResult = result.toolResults[i]
        
        if (toolCall && toolResult) {
          toolInvocations.push({
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            args: toolCall.args,
            state: 'result' as const,
            result: toolResult.result
          })
          console.log('🔧 REGENERATE: Found tool invocation (top-level):', {
            toolName: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            hasResult: !!toolResult.result
          })
        }
      }
    } else if (result.steps && result.steps.length > 0) {
      console.log('🔧 REGENERATE: Using steps structure')
      // Extract from steps
      for (const step of result.steps) {
        console.log('🔧 REGENERATE: Processing step:', {
          hasToolCalls: !!step.toolCalls,
          hasToolResults: !!step.toolResults,
          toolCallsLength: step.toolCalls?.length || 0,
          toolResultsLength: step.toolResults?.length || 0
        })
        
        if (step.toolCalls && step.toolResults) {
          for (let i = 0; i < step.toolCalls.length; i++) {
            const toolCall = step.toolCalls[i]
            const toolResult = step.toolResults[i]
            
            if (toolCall && toolResult) {
              toolInvocations.push({
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: toolCall.args,
                state: 'result' as const,
                result: toolResult.result
              })
              console.log('🔧 REGENERATE: Found tool invocation (from steps):', {
                toolName: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                hasResult: !!toolResult.result
              })
            }
          }
        }
      }
    }

    console.log('🔧 REGENERATE: Text generation completed', {
      finishReason: result.finishReason,
      usage: result.usage,
      chatId,
      replaceMessageId: replaceMessageId || 'NEW_MESSAGE',
      textLength: result.text.length,
      toolCallsCount: result.toolCalls?.length || 0,
      toolResultsCount: result.toolResults?.length || 0,
      toolInvocationsCount: toolInvocations.length
    })
    
    // Create assistant message from generateText result
    const assistantMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: result.text,
      parts: [
        // Add text part
        { type: 'text', text: result.text },
        // Add tool invocations
        ...toolInvocations.map((toolInvocation, index) => ({
          type: 'tool-invocation' as const,
          toolInvocation
        }))
      ]
    }

    console.log('🔧 REGENERATE: Assistant message created', {
      role: assistantMessage.role,
      partsCount: assistantMessage.parts?.length || 0,
      contentLength: assistantMessage.content?.length || 0,
      toolInvocationsCount: toolInvocations.length
    })

    // Check for artifact operations from tool invocations
    let hasArtifactOperations = false
    const artifactOperations: Array<{ operation: 'create' | 'update' | 'delete'; artifactId?: string }> = []

    console.log('🔧 REGENERATE: Analyzing tool invocations for artifact operations', {
      toolInvocationsCount: toolInvocations.length,
      toolNames: toolInvocations.map(ti => ti.toolName)
    })

    for (const toolInvocation of toolInvocations) {
      const { toolName, result: toolResult } = toolInvocation
      
      console.log('🔧 REGENERATE: Processing tool invocation:', { toolName, hasResult: !!toolResult })
      
      if (toolName === 'artifactCreate' || toolName === 'artifactUpdate' || toolName === 'artifactDelete' || toolName === 'artifactRestore') {
        hasArtifactOperations = true
        
        const operation = toolName === 'artifactCreate' ? 'create' :
                        toolName === 'artifactUpdate' ? 'update' :
                        toolName === 'artifactDelete' ? 'delete' : 'update' // artifactRestore = update
        
        const artifactId = toolResult?.artifactId || toolResult?.id
        artifactOperations.push({ operation, artifactId })
        
        console.log('🎉 REGENERATE: ARTIFACT OPERATION DETECTED!', { toolName, artifactId, operation, result: toolResult })
      }
    }

    console.log('🔧 REGENERATE: Final analysis result:', {
      hasArtifactOperations,
      operationsCount: artifactOperations.length,
      operations: artifactOperations
    })

    if (replaceMessageId) {
      // Update existing message in database
      await db.update(message)
        .set({
          parts: assistantMessage.parts,
          role: 'assistant',
        })
        .where(eq(message.id, replaceMessageId))
    } else {
      // Save as new message to database
      const messageToSave = {
        ...addWorldId({
          id: generateUUID(),
          chatId,
          role: assistantMessage.role,
          parts: assistantMessage.parts,
          attachments: assistantMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        }, worldContext)
      }
      await saveMessages({ 
        messages: [messageToSave]
      })
    }

    // Trigger artifact list refresh if there were operations
    if (hasArtifactOperations) {
      console.log('Regenerate: Triggering artifact list refresh after operations')
      
      for (const { operation, artifactId } of artifactOperations) {
        try {
          await triggerArtifactListRefresh({
            source: 'chat-regeneration',
            artifactId,
            operation,
            showNotification: false
          })
        } catch (error) {
          console.error('Regenerate: Failed to trigger artifact list refresh', { error, operation, artifactId })
        }
      }
    }

    // Return the regenerated assistant message as JSON
    return new Response(JSON.stringify(assistantMessage), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Regeneration API error:', error)
    
    if (error instanceof ChatSDKError) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// END OF: app/api/chat/regenerate/route.ts