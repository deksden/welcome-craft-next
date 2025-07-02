# 🌱 WelcomeCraft Seed Data Library

**Версия:** 1.0.0  
**Дата:** 2025-07-02  
**Система:** Phoenix Seed Data Management

---

## 📂 Структура директорий

### `library/` - Централизованная библиотека стандартных seeds
- **ENTERPRISE_ONBOARDING** - Демонстрация корпоративного онбординга (10 артефактов)
- *(будущие seeds...)*

### `generated/` - Автоматически созданные seeds
- **test-seed** - Временный seed для разработки
- *(timestamp-based seeds при создании миров...)*

### `backups/` - Backup dumps из environments
- *(будущие backups...)*

---

## 🚀 Использование

### Импорт стандартного seed
```bash
# Импорт Enterprise Onboarding
pnpm phoenix:seed:import seeds/library/ENTERPRISE_ONBOARDING

# Batch импорт всех library seeds
pnpm phoenix:seed:batch-import seeds/library/
```

### Создание нового мира с seed
```bash
# Создать мир с автоматическим seed файлом
pnpm phoenix:worlds:create --with-seed --name "NEW_WORLD"
# Создаст: seeds/generated/NEW_WORLD_20250702_HHMMSS/
```

### Экспорт мира в seed
```bash
# Экспорт мира в library
pnpm phoenix:seed:export WORLD_ID --output library/CUSTOM_SEED

# Обновить существующий seed
pnpm phoenix:seed:export WORLD_ID --update
```

---

## 📋 Доступные seeds

| Seed Name | Type | Artifacts | Users | Purpose |
|-----------|------|-----------|-------|---------|
| ENTERPRISE_ONBOARDING | library | 10 | 2 | Демонстрация полного онбординга |
| test-seed | generated | 0 | 0 | Временный разработческий seed |

---

## 📚 Документация

Полная документация системы управления seed данными:
`.memory-bank/guides/seed-data-management.md`

---

> **Phoenix Seed Data Management System v1.0.0**  
> Generated: 2025-07-02  
> Status: ✅ Структура создана, готов к batch импорту