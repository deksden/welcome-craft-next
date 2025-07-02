/**
 * @file artifacts/kinds/person/client.tsx
 * @description Client-side editor for person artifacts
 * @version 1.0.0
 * @date 2025-07-02
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, MapPin, Building } from 'lucide-react'
import { PenIcon, MessageIcon } from '@/components/icons'
import type { UseChatHelpers } from '@ai-sdk/react'

interface PersonData {
  fullName: string
  position: string
  department: string
  email: string
  phone: string
  location: string
  quote: string
}

interface PersonEditorProps {
  title: string
  content: string
  mode: 'edit' | 'view'
  onSaveContent: (content: string) => void
  isReadonly?: boolean
  isLoading?: boolean
}

function PersonEditor({
  title,
  content,
  mode,
  onSaveContent,
  isReadonly = false,
  isLoading = false
}: PersonEditorProps) {
  const [personData, setPersonData] = useState<PersonData>({
    fullName: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    location: '',
    quote: ''
  })

  // Parse content on mount
  useEffect(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content)
        setPersonData({
          fullName: parsed.fullName || '',
          position: parsed.position || '',
          department: parsed.department || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          location: parsed.location || '',
          quote: parsed.quote || ''
        })
      } catch (error) {
        console.warn('Failed to parse person content:', error)
      }
    }
  }, [content])

  const handleAutoSave = useCallback(() => {
    const jsonContent = JSON.stringify(personData)
    onSaveContent(jsonContent)
  }, [personData, onSaveContent])

  const handleFieldChange = (field: keyof PersonData, value: string) => {
    setPersonData(prev => ({ ...prev, [field]: value }))
    // Trigger auto-save when field changes
    handleAutoSave()
  }

  if (mode === 'view') {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {personData.fullName || title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {personData.position && (
            <div className="text-lg text-muted-foreground">{personData.position}</div>
          )}
          {personData.department && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4" />
              {personData.department}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {personData.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${personData.email}`} className="text-blue-600 hover:underline">
                  {personData.email}
                </a>
              </div>
            )}
            {personData.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <a href={`tel:${personData.phone}`} className="text-blue-600 hover:underline">
                  {personData.phone}
                </a>
              </div>
            )}
            {personData.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                {personData.location}
              </div>
            )}
          </div>
          {personData.quote && (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mt-4">
              "{personData.quote}"
            </blockquote>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Person Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={personData.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              placeholder="John Doe"
              disabled={isReadonly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={personData.position}
              onChange={(e) => handleFieldChange('position', e.target.value)}
              placeholder="Software Engineer"
              disabled={isReadonly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={personData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="john@company.com"
              disabled={isReadonly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={personData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              placeholder="+1-555-0123"
              disabled={isReadonly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={personData.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              placeholder="Engineering"
              disabled={isReadonly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={personData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="San Francisco, CA"
              disabled={isReadonly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quote">Quote</Label>
          <Textarea
            id="quote"
            value={personData.quote}
            onChange={(e) => handleFieldChange('quote', e.target.value)}
            placeholder="A motivational quote or personal message..."
            disabled={isReadonly}
            rows={3}
          />
        </div>

        {/* Auto-save enabled - no manual save button needed */}
      </CardContent>
    </Card>
  )
}

export const personArtifact = {
  kind: 'person' as const,
  content: PersonEditor,
  actions: [], // No special actions for person artifacts yet
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Add contact details',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Please add missing contact details and ensure all information is complete and professional.'
        })
      }
    },
    {
      icon: <MessageIcon />,
      description: 'Create introduction',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Create a professional introduction text for this person that can be used in team announcements or onboarding materials.'
        })
      }
    }
  ]
}

// END OF: artifacts/kinds/person/client.tsx