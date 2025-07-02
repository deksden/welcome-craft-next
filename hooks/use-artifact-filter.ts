/**
 * @file hooks/use-artifact-filter.ts
 * @description Hook для управления пользовательской настройкой фильтрации артефактов (коллаборативный режим)
 * @version 1.0.0
 * @date 2025-07-02
 * @updated Created collaborative artifacts filter hook with SWR state management
 */

'use client'

import { useState, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import { fetcher } from '@/lib/utils'

interface ArtifactFilterPreference {
  showOnlyMyArtifacts: boolean
  success: boolean
}

export function useArtifactFilter() {
  const [isUpdating, setIsUpdating] = useState(false)

  // Get current preference from API
  const { data, error, isLoading } = useSWR<ArtifactFilterPreference>(
    '/api/user/preferences/artifacts-filter',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  // Update preference on server
  const updatePreference = useCallback(async (showOnlyMyArtifacts: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/user/preferences/artifacts-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showOnlyMyArtifacts }),
      })

      if (!response.ok) {
        throw new Error('Failed to update filter preference')
      }

      // Update SWR cache
      await mutate('/api/user/preferences/artifacts-filter')
      
      // Also refresh artifacts lists that depend on this preference
      await mutate((key) => 
        typeof key === 'string' && (
          key.startsWith('/api/artifacts/recent') ||
          key.startsWith('/api/artifacts?')
        )
      )

      return true
    } catch (error) {
      console.error('Failed to update artifact filter preference:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Toggle between collaborative and personal mode
  const toggleFilter = useCallback(async () => {
    const currentValue = data?.showOnlyMyArtifacts ?? false
    return updatePreference(!currentValue)
  }, [data?.showOnlyMyArtifacts, updatePreference])

  return {
    // Current state
    showOnlyMyArtifacts: data?.showOnlyMyArtifacts ?? false,
    isLoading,
    isUpdating,
    error,
    
    // Actions
    updatePreference,
    toggleFilter,
  }
}

// END OF: hooks/use-artifact-filter.ts