#!/bin/bash
# @file scripts/start-silent-server.sh
# @description Скрипт для запуска Next.js сервера с максимальным подавлением логов от webpack плагинов
# @version 1.0.0 
# @date 2025-06-29
# @purpose Устранение засорения консоли debug логами от next:jsconfig-paths-plugin в route тестах

export DEBUG=""
export WEBPACK_LOGGING=false
export NEXT_TELEMETRY_DISABLED=1
export DEBUG_COLORS=false
export NODE_OPTIONS="--no-deprecation"

# Выполняем команду с grep фильтрацией специфических debug логов
exec "$@" 2>&1 | grep -v "next:jsconfig-paths-plugin" | grep -v "skipping request as it is inside node_modules"