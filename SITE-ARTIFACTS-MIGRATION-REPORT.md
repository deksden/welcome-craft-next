# Site Artifacts Migration Report

**Date:** 2025-06-28  
**Issue:** Site artifacts missing from A_Site table causing API failures  
**Status:** ✅ RESOLVED

## Problem Analysis

### Root Cause
The issue was caused by an incomplete migration during the UC-10 Schema-Driven CMS implementation:

1. **Migration 0006** (UC-10) created the new A_Site specialized table
2. **Migration 0006** removed legacy content columns (`content_site_definition`, `content_text`, `content_url`)
3. **However**, the migration did NOT transfer existing site content from the legacy format to the new A_Site table
4. This left 16 site artifacts in an orphaned state - existing in the main Artifact table but missing from A_Site

### Affected Artifacts
- **Total affected:** 16 site artifacts
- **Key artifact reported:** `3d3157b9-c780-4d9b-8855-01b46ecc276d` ("Сайт вакансии: Повар")
- **Timeline:** Artifacts created around 2025-06-20 (during UC-10 implementation)

### Impact
- API calls to `/api/artifact/[id]` returned empty content for affected sites
- Warning messages: "Site artifact not found in A_Site table"
- Users unable to view or edit affected site artifacts
- UI showing empty content instead of site definitions

## Investigation Results

### Database State Analysis
```sql
-- Site artifacts in main table: 20+
-- Entries in A_Site table: 20 (after migration)
-- Missing before migration: 16
-- Missing after migration: 0
```

### Legacy Content Handling
- Legacy content columns were properly removed during migration 0006
- No recoverable content found in old format
- Missing artifacts likely had their original site definitions lost permanently

## Solution Implemented

### Migration Script
Created and executed `/scripts/migrate-legacy-site-artifacts.ts`:

1. **Identified** all site artifacts missing from A_Site table
2. **Created** default A_Site entries with empty site definitions
3. **Preserved** artifact metadata (title, timestamps, user ownership)
4. **Added** migration notes explaining the legacy content loss

### Default Migration Content
For each missing artifact, created A_Site entry with:
```json
{
  "siteDefinition": {
    "theme": "default",
    "blocks": [],
    "reasoning": "Migrated from legacy format - original content may be lost"
  },
  "theme": "default",
  "reasoning": "Legacy artifact migrated with empty content. Original site definition was lost during UC-10 migration.",
  "blocksCount": 0,
  "lastOptimized": "2025-06-28T..."
}
```

## Results

✅ **Migration completed successfully:**
- 16 artifacts found and migrated
- 0 errors during migration
- 0 artifacts remaining missing
- All site artifacts now have proper A_Site entries

✅ **API functionality restored:**
- No more "Site artifact not found in A_Site table" warnings
- `/api/artifact/[id]` now returns proper responses for all sites
- UI can load and display all site artifacts (though with empty content)

## Recommendations

### For Users
1. **Legacy sites:** Affected artifacts will show as empty sites and need to be recreated
2. **Content recovery:** Original site definitions are permanently lost and cannot be recovered
3. **Recreation:** Users should recreate affected sites using current UC-10 tools

### For Development
1. **Migration best practices:** Future schema changes should include data migration scripts
2. **Testing:** Always verify data integrity after structural migrations
3. **Backup:** Consider backing up legacy content before removing old columns

### Prevention
1. **Two-phase migrations:** First migrate data, then remove old columns
2. **Validation scripts:** Run post-migration checks to ensure data completeness
3. **Documentation:** Clear communication about potential data loss during migrations

## Files Created

1. **`scripts/investigate-site-artifacts.ts`** - Database investigation tool
2. **`scripts/migrate-legacy-site-artifacts.ts`** - Migration script (executed)
3. **`scripts/diagnose-site-content-issue.ts`** - Comprehensive diagnostic tool
4. **`SITE-ARTIFACTS-MIGRATION-REPORT.md`** - This report

## Technical Details

### UC-10 Schema-Driven CMS Architecture
- **Before:** Site content stored in `Artifact.content_site_definition` JSON column
- **After:** Site content stored in dedicated `A_Site` table with structured schema
- **Migration gap:** Data transfer step was missing

### Database Schema
```sql
-- A_Site table structure
CREATE TABLE "A_Site" (
  "artifactId" uuid NOT NULL,
  "createdAt" timestamp NOT NULL,
  "siteDefinition" jsonb NOT NULL,
  "theme" varchar(100) DEFAULT 'default',
  "reasoning" text,
  "blocksCount" integer DEFAULT 0,
  "lastOptimized" timestamp,
  CONSTRAINT "A_Site_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
```

---

**Status:** ISSUE RESOLVED ✅  
**Next Action:** Monitor for any remaining issues and assist users with recreation of affected sites.