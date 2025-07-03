/**
 * @file artifacts/kinds/address/client.tsx
 * @description Client-side editor for address artifacts
 * @version 1.0.0
 * @date 2025-07-02
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, ExternalLink } from 'lucide-react'
import { PenIcon, MessageIcon } from '@/components/icons'
import type { UseChatHelpers } from '@ai-sdk/react'

interface AddressData {
  streetAddress: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface AddressEditorProps {
  title: string
  content: string
  mode: 'edit' | 'view'
  onSaveContent: (content: string) => void
  isReadonly?: boolean
  isLoading?: boolean
}

function AddressEditor({
  title,
  content,
  mode,
  onSaveContent,
  isReadonly = false,
  isLoading = false
}: AddressEditorProps) {
  const [addressData, setAddressData] = useState<AddressData>({
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })

  // Parse content on mount
  useEffect(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content)
        setAddressData({
          streetAddress: parsed.streetAddress || '',
          city: parsed.city || '',
          state: parsed.state || '',
          zipCode: parsed.zipCode || '',
          country: parsed.country || ''
        })
      } catch (error) {
        console.warn('Failed to parse address content:', error)
      }
    }
  }, [content])

  const handleAutoSave = useCallback(() => {
    const jsonContent = JSON.stringify(addressData)
    onSaveContent(jsonContent)
  }, [addressData, onSaveContent])

  const handleFieldChange = (field: keyof AddressData, value: string) => {
    setAddressData(prev => ({ ...prev, [field]: value }))
    // Trigger auto-save when field changes
    handleAutoSave()
  }

  const getGoogleMapsUrl = () => {
    const parts = [
      addressData.streetAddress,
      addressData.city,
      addressData.state,
      addressData.zipCode,
      addressData.country
    ].filter(Boolean)
    
    if (parts.length === 0) return null
    
    const query = encodeURIComponent(parts.join(', '))
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  const formatAddress = () => {
    const lines = []
    if (addressData.streetAddress) lines.push(addressData.streetAddress)
    
    const cityStateZip = [
      addressData.city,
      addressData.state,
      addressData.zipCode
    ].filter(Boolean).join(', ')
    
    if (cityStateZip) lines.push(cityStateZip)
    if (addressData.country) lines.push(addressData.country)
    
    return lines
  }

  if (mode === 'view') {
    const formattedLines = formatAddress()
    const mapsUrl = getGoogleMapsUrl()

    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            {formattedLines.map((line, index) => (
              <div key={`line-${index}-${line.slice(0, 10)}`} className="text-sm">
                {line}
              </div>
            ))}
          </div>
          
          {mapsUrl && (
            <div className="pt-2">
              <Button asChild size="sm" variant="outline">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Maps
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Address Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="streetAddress">Street Address *</Label>
          <Input
            id="streetAddress"
            value={addressData.streetAddress}
            onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
            placeholder="123 Main Street"
            disabled={isReadonly}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={addressData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="San Francisco"
              disabled={isReadonly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={addressData.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              placeholder="CA"
              disabled={isReadonly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              value={addressData.zipCode}
              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
              placeholder="94102"
              disabled={isReadonly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={addressData.country}
            onChange={(e) => handleFieldChange('country', e.target.value)}
            placeholder="United States"
            disabled={isReadonly}
          />
        </div>

        {(addressData.streetAddress || addressData.city) && (
          <div className="p-3 bg-muted rounded border-l-4 border-blue-500">
            <div className="text-sm font-medium">Preview:</div>
            <div className="space-y-1 mt-1">
              {formatAddress().map((line, index) => (
                <div key={`preview-${index}-${line.slice(0, 10)}`} className="text-sm text-muted-foreground">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-save enabled - no manual save button needed */}
      </CardContent>
    </Card>
  )
}

export const addressArtifact = {
  kind: 'address' as const,
  content: AddressEditor,
  actions: [], // No special actions for address artifacts yet
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Verify address',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Please verify this address is correct and complete, and format it according to local postal standards.'
        })
      }
    },
    {
      icon: <MessageIcon />,
      description: 'Add directions',
      onClick: ({ appendMessage }: { appendMessage: UseChatHelpers['append'] }) => {
        appendMessage({
          role: 'user',
          content: 'Create helpful directions and transportation information for getting to this address, including parking details.'
        })
      }
    }
  ]
}

// END OF: artifacts/kinds/address/client.tsx