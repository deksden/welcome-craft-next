/**
 * @file lib/utils/prompts.ts
 * @description Простая утилита для интерактивного ввода в CLI
 * @version 1.0.0
 * @date 2025-06-30
 */

import { createInterface } from 'node:readline'

interface PromptChoice {
  title: string
  value: string | number | boolean
}

interface PromptOptions {
  type: 'text' | 'confirm' | 'select' | 'number'
  name: string
  message: string
  initial?: any
  choices?: PromptChoice[]
  validate?: (value: any) => boolean | string
  min?: number
  max?: number
}

/**
 * Простая реализация промптов для CLI
 */
export async function prompts(questions: PromptOptions | PromptOptions[]): Promise<Record<string, any>> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const results: Record<string, any> = {}
  const questionList = Array.isArray(questions) ? questions : [questions]

  try {
    for (const question of questionList) {
      let answer: any

      switch (question.type) {
        case 'text':
          answer = await askText(rl, question.message, question.initial)
          if (question.validate) {
            const validation = question.validate(answer)
            if (validation !== true) {
              console.log(`❌ ${validation}`)
              continue // Повторяем вопрос
            }
          }
          break

        case 'confirm':
          answer = await askConfirm(rl, question.message, question.initial)
          break

        case 'select':
          answer = await askSelect(rl, question.message, question.choices || [], question.initial)
          break

        case 'number':
          answer = await askNumber(rl, question.message, question.initial, question.min, question.max)
          break

        default:
          throw new Error(`Unknown prompt type: ${question.type}`)
      }

      results[question.name] = answer
    }
  } finally {
    rl.close()
  }

  return results
}

function askText(rl: any, message: string, initial?: string): Promise<string> {
  return new Promise((resolve) => {
    const prompt = initial ? `${message} (${initial}): ` : `${message}: `
    rl.question(prompt, (answer: string) => {
      resolve(answer.trim() || initial || '')
    })
  })
}

function askConfirm(rl: any, message: string, initial = false): Promise<boolean> {
  return new Promise((resolve) => {
    const defaultValue = initial ? 'Y/n' : 'y/N'
    rl.question(`${message} (${defaultValue}): `, (answer: string) => {
      const input = answer.trim().toLowerCase()
      if (input === '') {
        resolve(initial)
      } else {
        resolve(input === 'y' || input === 'yes')
      }
    })
  })
}

function askSelect(rl: any, message: string, choices: PromptChoice[], initial = 0): Promise<any> {
  return new Promise((resolve) => {
    console.log(`${message}`)
    choices.forEach((choice, index) => {
      const marker = index === initial ? '►' : ' '
      console.log(`${marker} ${index + 1}. ${choice.title}`)
    })
    
    rl.question(`Select (1-${choices.length}): `, (answer: string) => {
      const index = Number.parseInt(answer.trim()) - 1
      if (index >= 0 && index < choices.length) {
        resolve(choices[index].value)
      } else {
        resolve(choices[initial].value)
      }
    })
  })
}

function askNumber(rl: any, message: string, initial?: number, min?: number, max?: number): Promise<number> {
  return new Promise((resolve) => {
    const prompt = initial ? `${message} (${initial}): ` : `${message}: `
    rl.question(prompt, (answer: string) => {
      const value = Number.parseInt(answer.trim()) || initial || 0
      if (min !== undefined && value < min) {
        resolve(min)
      } else if (max !== undefined && value > max) {
        resolve(max)
      } else {
        resolve(value)
      }
    })
  })
}

// END OF: lib/utils/prompts.ts