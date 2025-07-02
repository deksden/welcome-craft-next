/**
 * @file artifacts/kinds/link/client.tsx
 * @description Client-side editor for link artifacts
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
import { ExternalLink, Link as LinkIcon, Globe } from 'lucide-react'
import { PenIcon, MessageIcon } from '@/components/icons'
import type { UseChatHelpers } from '@ai-sdk/react'

interface LinkData {
  title: string
  url: string
  summary: string
  iconUrl: string
}

interface LinkEditorProps {
  title: string
  content: string
  mode: 'edit' | 'view'
  onSaveContent: (content: string) => void
  isReadonly?: boolean
  isLoading?: boolean
}

function LinkEditor({
  title,
  content,
  mode,
  onSaveContent,
  isReadonly = false,
  isLoading = false
}: LinkEditorProps) {
  const [linkData, setLinkData] = useState<LinkData>({
    title: '',
    url: '',
    summary: '',
    iconUrl: ''
  })

  // Parse content on mount
  useEffect(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content)
        setLinkData({
          title: parsed.title || '',
          url: parsed.url || '',
          summary: parsed.summary || '',
          iconUrl: parsed.iconUrl || ''
        })
      } catch (error) {
        console.warn('Failed to parse link content:', error)
      }
    }
  }, [content])

  const handleAutoSave = useCallback(() => {
    const jsonContent = JSON.stringify(linkData)
    onSaveContent(jsonContent)
  }, [linkData, onSaveContent])

  const handleFieldChange = (field: keyof LinkData, value: string) => {
    setLinkData(prev => ({ ...prev, [field]: value }))
    // Trigger auto-save when field changes
    handleAutoSave()
  }

  if (mode === 'view') {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            {linkData.title || title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {linkData.iconUrl ? (
              <img src={linkData.iconUrl} alt="" className="w-4 h-4" />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground" />
            )}
            <a 
              href={linkData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium break-all"
            >
              {linkData.url}
            </a>
          </div>
          {linkData.summary && (
            <div className="text-muted-foreground">{linkData.summary}</div>
          )}
          <div className="pt-2">
            <Button asChild size="sm">
              <a href={linkData.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Link
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Link Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={linkData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Employee Portal"
            disabled={isReadonly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL *</Label>
          <Input
            id="url"
            type="url"
            value={linkData.url}
            onChange={(e) => handleFieldChange('url', e.target.value)}
            placeholder="https://company.com/portal"
            disabled={isReadonly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="iconUrl">Icon URL (optional)</Label>
          <Input
            id="iconUrl"
            type="url"
            value={linkData.iconUrl}
            onChange={(e) => handleFieldChange('iconUrl', e.target.value)}
            placeholder="https://company.com/favicon.ico"
            disabled={isReadonly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Description</Label>
          <Textarea
            id="summary"
            value={linkData.summary}
            onChange={(e) => handleFieldChange('summary', e.target.value)}
            placeholder="Brief description of what this link provides..."
            disabled={isReadonly}
            rows={3}
          />
        </div>

        {linkData.url && (
          <div className="p-3 bg-muted rounded border-l-4 border-blue-500">
            <div className="text-sm font-medium">Preview:</div>
            <div className="flex items-center gap-2 mt-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a 
                href={linkData.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {linkData.url}
              </a>
            </div>
            {linkData.summary && (
              <div className="text-sm text-muted-foreground mt-1">{linkData.summary}</div>
            )}
          </div>
        )}

        {/* Auto-save enabled - no manual save button needed */}
      </CardContent>
    </Card>
  )
}

export const linkArtifact = {
  kind: 'link' as const,
  content: LinkEditor,
  actions: [], // No special actions for link artifacts yet
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Improve description',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Please improve the description of this link to be more informative and helpful for new employees.'
        })
      }
    },
    {
      icon: <MessageIcon />,
      description: 'Create user guide',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Create a brief user guide or tutorial for how to use this resource effectively.'
        })
      }
    }
  ]
}

// END OF: artifacts/kinds/link/client.tsx