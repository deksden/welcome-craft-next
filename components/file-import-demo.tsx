/**
 * @file components/file-import-demo.tsx
 * @description UC-10 SCHEMA-DRIVEN CMS - Demo компонент для тестирования системы импорта файлов.
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан demo компонент с drag & drop и интеграцией с importArtifactFromFile Server Action.
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Создан demo UI для тестирования file import system с поддержкой drag & drop и отображением результатов импорта.
 */

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { put } from '@vercel/blob'
import { importArtifactFromFile, getSupportedFileTypes, isFileSupported } from '@/app/app/(main)/artifacts/import-actions'
import { toast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// UC-10 TODO: Install shadcn alert component
// import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, FileText, FileSpreadsheet, File, CheckCircle, XCircle } from 'lucide-react'
import type { ArtifactMetadata } from '@/lib/types'

interface ImportResult {
  success: boolean
  artifact?: ArtifactMetadata
  error?: string
  filename: string
}

export function FileImportDemo() {
  const [isUploading, setIsUploading] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [supportedTypes, setSupportedTypes] = useState<any>(null)

  // Загружаем поддерживаемые типы при монтировании
  const loadSupportedTypes = useCallback(async () => {
    try {
      const types = await getSupportedFileTypes()
      setSupportedTypes(types)
    } catch (error) {
      console.error('Failed to load supported file types:', error)
    }
  }, [])

  // Вызываем загрузку при первом рендере
  if (!supportedTypes) {
    loadSupportedTypes()
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    const results: ImportResult[] = []

    for (const file of acceptedFiles) {
      try {
        // Проверяем поддержку файла
        const isSupported = await isFileSupported(file.name, file.type)
        if (!isSupported) {
          const errorMessage = 'Unsupported file type'
          results.push({
            success: false,
            error: errorMessage,
            filename: file.name
          })

          // Показываем уведомление об ошибке
          toast({
            type: 'error',
            description: `Неподдерживаемый тип файла: "${file.name}"`
          })
          continue
        }

        // Загружаем файл в Vercel Blob
        const { url } = await put(file.name, file, { access: 'public' })
        
        // Импортируем файл в артефакт
        const artifact = await importArtifactFromFile(url, {
          mimeType: file.type,
          customTitle: file.name.replace(/\.[^/.]+$/, '') // Убираем расширение
        })

        results.push({
          success: true,
          artifact,
          filename: file.name
        })

        // Показываем успешное уведомление
        toast({
          type: 'success',
          description: `Файл "${file.name}" успешно импортирован как ${artifact.artifactKind} артефакт`
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          success: false,
          error: errorMessage,
          filename: file.name
        })

        // Показываем уведомление об ошибке
        toast({
          type: 'error',
          description: `Ошибка импорта файла "${file.name}": ${errorMessage}`
        })
      }
    }

    setImportResults(prev => [...results, ...prev])
    setIsUploading(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  })

  const getFileIcon = (artifactKind?: string) => {
    switch (artifactKind) {
      case 'text':
        return <FileText className="size-4" />
      case 'sheet':
        return <FileSpreadsheet className="size-4" />
      default:
        return <File className="size-4" />
    }
  }

  const getKindBadgeColor = (artifactKind?: string) => {
    switch (artifactKind) {
      case 'text':
        return 'bg-blue-100 text-blue-800'
      case 'sheet':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            File Import System Demo
          </CardTitle>
          <CardDescription>
            Drag & drop files to test the UC-10 schema-driven file import system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            data-testid="file-drop-zone"
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} data-testid="file-input" />
            
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-blue-500" />
                <p className="text-gray-600">Importing files...</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-8 text-blue-500" />
                <p className="text-blue-600">Drop files here to import</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-8 text-gray-400" />
                <p className="text-gray-600">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports: .docx, .xlsx, .csv, .txt, .md
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supported File Types */}
      {supportedTypes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported File Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Documents → Text Artifacts</h4>
                <div className="space-y-1">
                  {supportedTypes.documents.map((type: any) => (
                    <div key={type.extension} className="text-sm text-gray-600">
                      .{type.extension} - {type.description}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Spreadsheets → Sheet Artifacts</h4>
                <div className="space-y-1">
                  {supportedTypes.spreadsheets.map((type: any) => (
                    <div key={type.extension} className="text-sm text-gray-600">
                      .{type.extension} - {type.description}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Text Files → Text Artifacts</h4>
                <div className="space-y-1">
                  {supportedTypes.text.map((type: any) => (
                    <div key={type.extension} className="text-sm text-gray-600">
                      .{type.extension} - {type.description}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Results</CardTitle>
            <CardDescription>
              Recent file imports ({importResults.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importResults.map((result, index) => (
                <div key={`${result.filename}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="size-5 text-green-500" />
                    ) : (
                      <XCircle className="size-5 text-red-500" />
                    )}
                    
                    <div className="flex items-center gap-2">
                      {getFileIcon(result.artifact?.artifactKind)}
                      <span className="font-medium">{result.filename}</span>
                    </div>
                    
                    {result.artifact && (
                      <Badge className={getKindBadgeColor(result.artifact.artifactKind)}>
                        {result.artifact.artifactKind}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-right">
                    {result.success ? (
                      <div className="text-sm">
                        <div className="text-green-600 font-medium">
                          {result.artifact?.artifactTitle}
                        </div>
                        <div className="text-gray-500">
                          ID: {result.artifact?.artifactId?.substring(0, 8)}...
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {importResults.length > 5 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setImportResults([])}
                className="mt-3"
              >
                Clear Results
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// END OF: components/file-import-demo.tsx