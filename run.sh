#!/bin/bash

# Скрипт для рефакторинга структуры папок в Next.js проекте.
# Переносит страницы чата и заметок под общий layout в группе (main).

# Останавливаем выполнение при любой ошибке, чтобы избежать частичного рефакторинга
set -e

# --- Переменные ---
APP_DIR="app"
MAIN_LAYOUT_GROUP_DIR="$APP_DIR/(main)"
CHAT_SOURCE_DIR="$APP_DIR/(chat)"
NOTES_SOURCE_DIR="$APP_DIR/(notes)"

echo "🚀 Начинаем рефакторинг структуры файлов для создания общей группы макета..."

# 1. Создаем новую директорию для группы (main), если она не существует
if [ ! -d "$MAIN_LAYOUT_GROUP_DIR" ]; then
  mkdir -p "$MAIN_LAYOUT_GROUP_DIR"
  echo "✅ Создана директория: $MAIN_LAYOUT_GROUP_DIR"
else
  echo "☑️  Директория $MAIN_LAYOUT_GROUP_DIR уже существует, пропускаем создание."
fi

# 2. Перемещаем основной layout из (chat) в (main)
if [ -f "$CHAT_SOURCE_DIR/layout.tsx" ]; then
  mv "$CHAT_SOURCE_DIR/layout.tsx" "$MAIN_LAYOUT_GROUP_DIR/layout.tsx"
  echo "✅ Перемещен layout: $CHAT_SOURCE_DIR/layout.tsx -> $MAIN_LAYOUT_GROUP_DIR/layout.tsx"
else
  echo "⚠️ Файл $CHAT_SOURCE_DIR/layout.tsx не найден, пропускаем."
fi

# 3. Перемещаем страницы чата
# Перемещаем корневую страницу чата
if [ -f "$CHAT_SOURCE_DIR/page.tsx" ]; then
  mv "$CHAT_SOURCE_DIR/page.tsx" "$MAIN_LAYOUT_GROUP_DIR/page.tsx"
  echo "✅ Перемещена корневая страница чата: $CHAT_SOURCE_DIR/page.tsx -> $MAIN_LAYOUT_GROUP_DIR/page.tsx"
else
  echo "⚠️ Файл $CHAT_SOURCE_DIR/page.tsx не найден, пропускаем."
fi

# Перемещаем директорию с динамическими страницами чата
if [ -d "$CHAT_SOURCE_DIR/chat" ]; then
  mv "$CHAT_SOURCE_DIR/chat" "$MAIN_LAYOUT_GROUP_DIR/chat"
  echo "✅ Перемещена директория чатов: $CHAT_SOURCE_DIR/chat -> $MAIN_LAYOUT_GROUP_DIR/chat"
else
  echo "⚠️ Директория $CHAT_SOURCE_DIR/chat не найдена, пропускаем."
fi

# 4. Перемещаем страницы заметок
if [ -d "$NOTES_SOURCE_DIR/notes" ]; then
  mv "$NOTES_SOURCE_DIR/notes" "$MAIN_LAYOUT_GROUP_DIR/notes"
  echo "✅ Перемещена директория заметок: $NOTES_SOURCE_DIR/notes -> $MAIN_LAYOUT_GROUP_DIR/notes"
else
  echo "⚠️ Директория $NOTES_SOURCE_DIR/notes не найдена, пропускаем."
fi

# 5. Информация по очистке
echo " "
echo "ℹ️  Примечание по очистке:"
echo "Старые директории $CHAT_SOURCE_DIR и $NOTES_SOURCE_DIR не были удалены полностью, "
echo "так как они могут содержать важные API-маршруты. "
echo "Скрипт переместил только UI-компоненты (страницы и layout)."
echo "Вы можете вручную удалить оставшиеся пустые директории, если уверены, что они не нужны."
echo " "

echo "🎉 Рефакторинг успешно завершен!"
echo "Пожалуйста, проверьте изменения с помощью 'git status' и закоммитьте их."