/**
 * @file artifacts/kinds/faq-item/client.tsx
 * @description Client-side editor for FAQ item artifacts
 * @version 1.0.0
 * @date 2025-07-02
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Plus, X } from 'lucide-react'
import { PenIcon, MessageIcon } from '@/components/icons'
import type { UseChatHelpers } from '@ai-sdk/react'

interface FaqItemData {
  question: string
  answer: string
  tags: string[]
}

interface FaqItemEditorProps {
  title: string
  content: string
  mode: 'edit' | 'view'
  onSaveContent: (content: string) => void
  isReadonly?: boolean
  isLoading?: boolean
}

function FaqItemEditor({
  title,
  content,
  mode,
  onSaveContent,
  isReadonly = false,
  isLoading = false
}: FaqItemEditorProps) {
  const [faqData, setFaqData] = useState<FaqItemData>({
    question: '',
    answer: '',
    tags: []
  })
  const [newTag, setNewTag] = useState('')

  // Parse content on mount
  useEffect(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content)
        setFaqData({
          question: parsed.question || '',
          answer: parsed.answer || '',
          tags: Array.isArray(parsed.tags) ? parsed.tags : []
        })
      } catch (error) {
        console.warn('Failed to parse FAQ content:', error)
      }
    }
  }, [content])

  const handleAutoSave = useCallback(() => {
    const jsonContent = JSON.stringify(faqData)
    onSaveContent(jsonContent)
  }, [faqData, onSaveContent])

  const handleFieldChange = (field: 'question' | 'answer', value: string) => {
    setFaqData(prev => ({ ...prev, [field]: value }))
    // Trigger auto-save when field changes
    handleAutoSave()
  }

  const addTag = () => {
    if (newTag.trim() && !faqData.tags.includes(newTag.trim())) {
      setFaqData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
      // Trigger auto-save when tag is added
      handleAutoSave()
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFaqData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
    // Trigger auto-save when tag is removed
    handleAutoSave()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  if (mode === 'view') {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            FAQ Item
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Question:</div>
              <div className="font-medium">{faqData.question}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Answer:</div>
              <div className="text-muted-foreground whitespace-pre-wrap">{faqData.answer}</div>
            </div>

            {faqData.tags.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {faqData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          FAQ Item Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">Question *</Label>
          <Input
            id="question"
            value={faqData.question}
            onChange={(e) => handleFieldChange('question', e.target.value)}
            placeholder="What is the company dress code?"
            disabled={isReadonly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">Answer *</Label>
          <Textarea
            id="answer"
            value={faqData.answer}
            onChange={(e) => handleFieldChange('answer', e.target.value)}
            placeholder="Our company follows a business casual dress code..."
            disabled={isReadonly}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {faqData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
                {!isReadonly && (
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          
          {!isReadonly && (
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag (e.g., 'onboarding', 'hr', 'benefits')"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {(faqData.question || faqData.answer) && (
          <div className="p-3 bg-muted rounded border-l-4 border-blue-500">
            <div className="text-sm font-medium">Preview:</div>
            <div className="space-y-2 mt-2">
              {faqData.question && (
                <div>
                  <div className="text-xs text-muted-foreground">Q:</div>
                  <div className="text-sm font-medium">{faqData.question}</div>
                </div>
              )}
              {faqData.answer && (
                <div>
                  <div className="text-xs text-muted-foreground">A:</div>
                  <div className="text-sm text-muted-foreground">{faqData.answer}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-save enabled - no manual save button needed */}
      </CardContent>
    </Card>
  )
}

export const faqItemArtifact = {
  kind: 'faq-item' as const,
  content: FaqItemEditor,
  actions: [], // No special actions for FAQ item artifacts yet
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Improve answer',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Please improve the answer to be more comprehensive and helpful, add examples if relevant.'
        })
      }
    },
    {
      icon: <MessageIcon />,
      description: 'Generate related FAQs',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Generate 3-5 related FAQ items that would complement this question and help with employee onboarding.'
        })
      }
    }
  ]
}

// END OF: artifacts/kinds/faq-item/client.tsx