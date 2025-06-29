#!/bin/bash
#
# setup.sh
# @description Скрипт для полной автоматизации настройки локального окружения.
# @version 1.0.0
# @date 2025-06-27

# Останавливаем выполнение при любой ошибке
set -e

echo "🚀 WelcomeCraft: Запуск настройки локального окружения..."
echo "--------------------------------------------------------"

# 1. Проверка зависимостей (Docker, pnpm)
echo "1. Проверка зависимостей..."

if ! command -v docker &> /dev/null
then
    echo "❌ Ошибка: Docker не найден. Пожалуйста, установите Docker и Docker Compose."
    exit 1
fi
echo "   ✅ Docker найден."

if ! command -v pnpm &> /dev/null
then
    echo "❌ Ошибка: pnpm не найден. Пожалуйста, установите его: npm install -g pnpm"
    exit 1
fi
echo "   ✅ pnpm найден."

# 2. Установка зависимостей проекта
echo -e "\n2. Установка зависимостей проекта..."
pnpm install
echo "   ✅ Зависимости установлены."

# 3. Установка браузеров для Playwright
echo -e "\n3. Установка браузеров для Playwright..."
pnpm exec playwright install --with-deps
echo "   ✅ Браузеры для Playwright установлены."

# 4. Создание .env файлов из примеров
echo -e "\n4. Создание конфигурационных файлов .env..."

# Создаем .env.local для разработки
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "   ✅ Файл .env.local создан. Пожалуйста, заполните его вашими ключами."
else
    echo "   ℹ️  Файл .env.local уже существует."
fi

# Создаем .env.test для тестов
if [ ! -f .env.test ]; then
    # Используем sed для создания .env.test с правильным URL для Docker
    sed 's/POSTGRES_URL=.*/POSTGRES_URL="postgresql:\/\/testuser:testpassword@localhost:5433\/testdb"/' .env.example > .env.test
    echo "   ✅ Файл .env.test создан с конфигурацией для Docker."
else
    echo "   ℹ️  Файл .env.test уже существует."
fi

echo -e "\n--------------------------------------------------------"
echo "🎉 Настройка окружения успешно завершена!"
echo "➡️  Теперь вы можете запустить проект командой: pnpm dev"
echo "➡️  Или запустить тесты командой: pnpm test"
echo "--------------------------------------------------------"