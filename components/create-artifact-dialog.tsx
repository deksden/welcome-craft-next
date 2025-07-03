/**
 * @file components/create-artifact-dialog.tsx
 * @description Унифицированный диалог для создания артефактов - через AI чат или визуальный редактор
 * @version 1.0.0
 * @date 2025-07-02
 * @updated UNIFIED ARTIFACT CREATION: Создан диалог с выбором между AI чатом и прямым созданием для всех 11 типов артефактов
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): UNIFIED ARTIFACT CREATION - Создан диалог с опциями: "Создать в чате с AI" + 11 типов артефактов. Поддержка редиректа в чат с предзаполненным текстом и прямого создания в визуальном редакторе.
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useArtifact } from '@/hooks/use-artifact'
import type { ArtifactKind } from '@/lib/types'
import {
  MessageCircleIcon,
  BoxIcon,
  FileTextIcon,
  ImageIcon,
  GlobeIcon,
  UserIcon,
  LinkIcon,
  CodeIcon,
  FileIcon,
  InfoIcon,
  MenuIcon,
  GPSIcon,
} from '@/components/icons'

interface ArtifactTypeOption {
  kind: ArtifactKind
  title: string
  description: string
  icon: React.ReactNode
}

const ARTIFACT_TYPES: ArtifactTypeOption[] = [
  {
    kind: 'text',
    title: 'Текст',
    description: 'Текстовое содержимое, документы, заметки',
    icon: <FileTextIcon className="size-5" />
  },
  {
    kind: 'code',
    title: 'Код',
    description: 'Исходный код, скрипты, конфигурации',
    icon: <CodeIcon className="size-5" />
  },
  {
    kind: 'image',
    title: 'Изображение',
    description: 'Фотографии, картинки, диаграммы',
    icon: <ImageIcon className="size-5" />
  },
  {
    kind: 'sheet',
    title: 'Таблица',
    description: 'Табличные данные, списки, CSV импорт',
    icon: <MenuIcon className="size-5" />
  },
  {
    kind: 'site',
    title: 'Сайт',
    description: 'Веб-страница, лендинг, онбординг',
    icon: <GlobeIcon className="size-5" />
  },
  {
    kind: 'person',
    title: 'Персона',
    description: 'Контакт сотрудника, профиль, карточка',
    icon: <UserIcon className="size-5" />
  },
  {
    kind: 'address',
    title: 'Адрес',
    description: 'Местоположение, офис, филиал',
    icon: <GPSIcon className="size-5" />
  },
  {
    kind: 'faq-item',
    title: 'FAQ элемент',
    description: 'Вопрос-ответ, справочная информация',
    icon: <InfoIcon className="size-5" />
  },
  {
    kind: 'link',
    title: 'Ссылка',
    description: 'Веб-ресурс, документ, полезная ссылка',
    icon: <LinkIcon className="size-5" />
  },
  {
    kind: 'set-definition',
    title: 'Определение набора',
    description: 'Шаблон для коллекции элементов',
    icon: <FileIcon className="size-5" />
  },
  {
    kind: 'set',
    title: 'Набор',
    description: 'Коллекция связанных элементов',
    icon: <BoxIcon className="size-5" />
  },
]

interface CreateArtifactDialogProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Унифицированный диалог для создания артефактов
 * 
 * Предоставляет два пути создания:
 * 1. "Создать в чате с AI" - редирект в чат с предзаполненным текстом
 * 2. Прямое создание через визуальный редактор для конкретного типа
 * 
 * @param isOpen - состояние открытия диалога
 * @param onClose - callback для закрытия диалога
 */
export function CreateArtifactDialog({ isOpen, onClose }: CreateArtifactDialogProps) {
  const router = useRouter()
  const { setArtifact } = useArtifact()

  /**
   * Обработчик создания артефакта через AI чат
   */
  const handleCreateWithAI = () => {
    console.log('🤖 CreateArtifactDialog: Redirecting to AI chat with prefilled text')
    onClose()
    
    // Редирект на новый чат
    router.push('/')
    
    // Предзаполнение поля ввода (будет реализовано в chat-input компоненте)
    // Отправляем custom event для предзаполнения
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('prefill-chat-input', {
        detail: { text: 'Я хочу создать артефакт ' }
      }))
    }, 100)
  }

  /**
   * Обработчик прямого создания артефакта
   */
  const handleCreateDirect = (kind: ArtifactKind) => {
    console.log(`📝 CreateArtifactDialog: Creating new ${kind} artifact directly`)
    onClose()
    
    // Создаем новый артефакт в визуальном редакторе
    setArtifact({
      artifactId: '', // Пустой ID для нового артефакта
      title: '', // Пустой заголовок
      kind,
      content: '', // Пустой контент - будет шаблон по умолчанию
      isVisible: true,
      status: 'idle',
      displayMode: 'split',
      saveStatus: 'idle',
      boundingBox: { top: 0, left: 0, width: 0, height: 0 },
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BoxIcon className="size-5" />
            Создать новый артефакт
          </DialogTitle>
          <DialogDescription>
            Выберите способ создания артефакта: через AI-ассистента или прямо в визуальном редакторе.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Специальная опция: Создать в чате с AI */}
          <div className="pb-4 border-b">
            <Button
              onClick={handleCreateWithAI}
              variant="outline"
              className="w-full h-auto p-4 justify-start text-left bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <MessageCircleIcon className="size-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-blue-900">Создать в чате с AI</div>
                  <div className="text-sm text-blue-700 mt-1">
                    AI поможет создать любой тип артефакта через естественный диалог
                  </div>
                </div>
              </div>
            </Button>
          </div>

          {/* Сетка типов артефактов */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Или создайте конкретный тип артефакта:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {ARTIFACT_TYPES.map((type) => (
                <Button
                  key={type.kind}
                  onClick={() => handleCreateDirect(type.kind)}
                  variant="outline"
                  className="h-auto p-3 justify-start text-left hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-muted">
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{type.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// END OF: components/create-artifact-dialog.tsx