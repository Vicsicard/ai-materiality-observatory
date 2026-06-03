# Draft2Post Deployment Guide

## Overview
This document outlines the deployment process for the Draft2Post enhancement pipeline that transforms draft observations into Observatory-ready evidence records.

## Files Created

### 1. Database Migration
- `migrations/002_draft2post_enhancement.sql`
- Adds 17 new fields to articles table
- Creates indexes for performance

### 2. Enhanced Database Layer
- `lib/db/enhanced-database.ts`
- Extends DatabaseService with Phase 2 functionality
- Handles new status workflow and enhanced data

### 3. Draft2Post Agent Pipeline
- `lib/pipeline/draft2post-agents.ts`
- 5 specialized agents for Phase 2 processing
- Source preservation, classification, title generation, interpretation, validation

### 4. Integration Layer
- `lib/pipeline/draft2post-integration.ts`
- Triggers Draft2Post processing
- Handles publishing and archiving
- Manages workflow status transitions

### 5. Updated Worker
- `src/index.ts` (modified)
- Auto-triggers Draft2Post on draft creation
- New admin API endpoints
- Enhanced observations API

## Database Migration

### Required Changes
```sql
-- Run this migration on your D1 database
-- File: migrations/002_draft2post_enhancement.sql

ALTER TABLE articles ADD COLUMN source_title TEXT;
ALTER TABLE articles ADD COLUMN source_publication TEXT;
ALTER TABLE articles ADD COLUMN source_summary TEXT;
ALTER TABLE articles ADD COLUMN source_keywords TEXT;
ALTER TABLE articles ADD COLUMN signal_category TEXT;
ALTER TABLE articles ADD COLUMN classification_reason TEXT;
ALTER TABLE articles ADD COLUMN classification_confidence INTEGER;
ALTER TABLE articles ADD COLUMN observatory_title TEXT;
ALTER TABLE articles ADD COLUMN observatory_slug TEXT;
ALTER TABLE articles ADD COLUMN meta_title TEXT;
ALTER TABLE articles ADD COLUMN meta_description TEXT;
ALTER TABLE articles ADD COLUMN what_this_may_indicate TEXT;
ALTER TABLE articles ADD COLUMN potential_organizational_relevance TEXT;
ALTER TABLE articles ADD COLUMN related_assessment_areas TEXT;
ALTER TABLE articles ADD COLUMN editorial_status TEXT;
ALTER TABLE articles ADD COLUMN editorial_notes TEXT;
ALTER TABLE articles ADD COLUMN published_at TEXT;

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_signal_category ON articles(signal_category);
```

## New Workflow Status

### Status Transitions
1. **draft** → Phase 1 completed
2. **processing** → Draft2Post agents running
3. **ready_for_review** → All Draft2Post agents completed
4. **published** → Admin approved
5. **archived** → Removed from public display

### Automatic Trigger
- Whenever a new draft article is created (status='draft')
- Draft2Post automatically processes the article
- No manual intervention required

## New API Endpoints

### Admin Workflow
- `GET /api/admin/articles?status={status}` - Get articles by status
- `POST /api/admin/publish` - Publish article (requires articleId)
- `POST /api/admin/archive` - Archive article (requires articleId)

### Enhanced Public API
- `GET /api/observations` - Now returns enhanced Draft2Post data
- Includes observatory_title, signal_category, what_this_may_indicate, potential_organizational_relevance

## Agent Pipeline Details

### Agent 1: Source Preservation Agent
- Protects original source context
- Extracts source_title, source_publication, source_summary, source_keywords
- Ensures signal integrity

### Agent 2: Signal Classification Agent
- Assigns primary Observatory category
- 6 allowed categories: Governance, Resource Consumption, Operational Dependency, Infrastructure, Reporting & Disclosure, Sustainability
- Provides classification confidence score

### Agent 3: Observatory Title Agent
- Creates public-facing Observatory title
- Generates observatory_slug, meta_title, meta_description
- Removes hype and marketing language

### Agent 4: Materiality Interpretation Agent
- Transforms news into organizational relevance
- Generates what_this_may_indicate, potential_organizational_relevance, related_assessment_areas
- Connects signal to organizational considerations

### Agent 5: Editorial Validation Agent
- Final quality gate
- Validates title preservation, classification, Observatory purpose
- Checks for absence of hype and marketing language
- Returns ready_for_review or needs_revision

## Dashboard Integration Required

### New Workflow Display
The admin dashboard should display:
- Draft articles (status='draft')
- Processing articles (status='processing') 
- Ready for Review articles (status='ready_for_review')
- Published articles (status='published')
- Archived articles (status='archived')

### Ready for Review Interface
When article reaches ready_for_review, display:
- Source information
- Signal category
- Observatory title
- Summary
- What This May Indicate
- Publish button
- Archive button

## Deployment Steps

### 1. Database Migration
```bash
# Apply migration to D1 database
wrangler d1 execute ai-materiality-observatory --file=migrations/002_draft2post_enhancement.sql
```

### 2. Deploy Worker
```bash
# Deploy updated worker with Draft2Post integration
npm run deploy
```

### 3. Verify Deployment
```bash
# Test new endpoints
curl https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles?status=ready_for_review
curl https://ai-materiality-observatory.vic-76c.workers.dev/api/observations
```

### 4. Test Workflow
1. Submit a new article via POST /api/process-article
2. Verify status changes: draft → processing → ready_for_review
3. Test publishing via POST /api/admin/publish
4. Verify article appears in enhanced observations API

## Success Criteria

1. ✅ Draft2Post pipeline created
2. ✅ Five agents implemented
3. ✅ Original draft preserved
4. ✅ New Observatory fields stored
5. ✅ Status transitions implemented
6. ✅ Ready-for-review workflow exists
7. ✅ Publish becomes simple approval action
8. ✅ Observatory pages become data-driven
9. ✅ New observations automatically appear after publishing
10. ✅ Architecture supports future category pages

## Backward Compatibility

- Existing articles continue to work
- Original API structure maintained
- Enhanced data is additive, not destructive
- Fallback values provided for missing enhanced fields

## Migration Requirements

- **Database**: Apply SQL migration
- **Worker**: Deploy updated code
- **Dashboard**: Update to show new workflow (future task)
- **No breaking changes** to existing public APIs
