#!/bin/bash
#
# setup.sh
# @description Phoenix Project: Автоматизированная настройка локального окружения с правильным разделением БД
# @version 2.1.0
# @date 2025-06-30
# @updated Обновлены команды: local:db:* и test:db:* для консистентности

# Останавливаем выполнение при любой ошибке
set -e

echo "🚀 WelcomeCraft Phoenix Project: Настройка локального окружения..."
echo "================================================================"
echo "📋 Будет настроено:"
echo "   • Локальная БД для разработки (порт 5434)"
echo "   • Эфемерная БД для тестов (управляется автоматически)"
echo "   • Все необходимые переменные окружения"
echo "================================================================"

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

# 4. Настройка Phoenix Project переменных окружения
echo -e "\n4. Настройка Phoenix Project переменных окружения..."

# Создаем .env.local для LOCAL разработки
if [ ! -f .env.local ]; then
    echo "   📋 Создание .env.local для LOCAL окружения..."
    
    # Копируем из примера
    cp .env.local.example .env.local
    
    echo "   ✅ Файл .env.local создан из .env.local.example."
    echo "   ⚠️  ВАЖНО: Заполните AUTH_SECRET, GOOGLE_GENERATIVE_AI_API_KEY и BLOB_READ_WRITE_TOKEN!"
else
    echo "   ℹ️  Файл .env.local уже существует."
fi

# Создаем .env.test для эфемерной БД тестов
if [ ! -f .env.test ]; then
    echo "   📋 Создание .env.test для эфемерной БД тестов..."
    cat > .env.test << 'EOF'
# Phoenix Project: Эфемерная БД для тестов (управляется автоматически)
POSTGRES_URL="postgresql://testuser:testpassword@localhost:5433/testdb"
EOF
    echo "   ✅ Файл .env.test создан для эфемерной БД тестов."
else
    echo "   ℹ️  Файл .env.test уже существует."
fi

echo -e "\n================================================================"
echo "🎉 Phoenix Project: Настройка окружения успешно завершена!"
echo "================================================================"
echo ""
echo "📋 Что было настроено:"
echo "   ✅ Зависимости проекта установлены"
echo "   ✅ Playwright браузеры установлены"
echo "   ✅ .env.local создан для LOCAL окружения"
echo "   ✅ .env.test создан для эфемерной БД тестов"
echo ""
echo "🚀 Следующие шаги:"
echo "   1. Заполните API ключи в .env.local"
echo "   2. Запустите: pnpm phoenix:dev (автоматически поднимет БД + dev сервер)"
echo "   3. Или поэтапно:"
echo "      • pnpm local:db:up     (поднять локальную БД)"
echo "      • pnpm db:migrate      (применить миграции)"
echo "      • pnpm dev             (запустить dev сервер)"
echo ""
echo "🧪 Для тестирования:"
echo "   • pnpm test              (автоматически управляет эфемерной БД)"
echo ""
echo "📊 Мониторинг Phoenix:"
echo "   • pnpm phoenix:status    (статус всех контейнеров)"
echo "   • pnpm phoenix:health    (health check системы)"
echo "================================================================"