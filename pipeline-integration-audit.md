# PIPELINE INTEGRATION AUDIT - ARCHITECTURE ANALYSIS

**Generated:** 2026-06-03T23:05:00.000Z

========================================
INTENDED ARCHITECTURE DIAGRAM
========================================

## 🎯 AUTHENTIC AMO V3 END-TO-END PIPELINE

```
RSS Feed
    ↓
RSS Worker (rss-intake-worker-cf.ts)
    ↓
rss_articles (Raw Ingestion)
    ↓
candidate_articles (Screening Queue)
    ↓
Manual/Auto Screening (amo-candidate-screener.ts)
    ↓
MaterialitySignalPipeline (V2 Processing)
    ↓
DatabaseService → events → signals → articles
    ↓
Dashboard Visibility
```

## 📊 ARCHITECTURAL COMPONENTS

### 1. RSS Intake Layer (V3)
- **rss_sources:** RSS feed configuration
- **rss_articles:** Raw article storage
- **candidate_articles:** Screening queue
- **rss_ingestion_logs:** Processing logs

### 2. Screening Layer (V3)
- **AMOCandidateScreener:** AI-powered relevance scoring
- **screening_logs:** Screening audit trail
- **Status Flow:** new → screened → approved/rejected → processed

### 3. AMO V2 Pipeline Layer
- **MaterialitySignalPipeline:** CrewAI agent processing
- **DatabaseService:** D1 database operations
- **Events Table:** Raw events storage
- **Signals Table:** Materiality signals
- **Articles Table:** Final published observations

### 4. Frontend Layer
- **Admin Dashboard:** Candidate management
- **Observatory Pages:** Published content
- **API Endpoints:** RESTful operations

========================================
CURRENT ARCHITECTURE DIAGRAM
========================================

## 🔄 ACTUAL CURRENT STATE

```
RSS Feed ✅
    ↓
RSS Worker ✅
    ↓
rss_articles ✅ (70 articles)
    ↓
candidate_articles ✅ (70 candidates, status="new")
    ↓
❌ API GAP (Mock Data)
    ↓
❌ No Screening Triggered
    ↓
❌ No AMO V2 Processing
    ↓
❌ No Database Updates
    ↓
❌ Dashboard Shows Mock Data
```

## 📊 CURRENT COMPONENT STATUS

### ✅ WORKING
- RSS ingestion (70 articles)
- Duplicate detection
- Candidate creation
- MaterialitySignalPipeline (exists, feature flagged)
- DatabaseService (AMO V2 layer)
- Manual process-article API (works with manual input)

### ❌ BROKEN
- Candidate API (uses mock data, not database)
- Automatic screening trigger
- Database updates for screening/approval
- End-to-end pipeline automation
- Dashboard real-time updates

========================================
TABLE RELATIONSHIPS & DATA FLOW
========================================

## 🗂️ DATABASE SCHEMA RELATIONSHIPS

### RSS V3 Tables
```
rss_sources
    ↓ (1:N)
rss_articles
    ↓ (1:1)
candidate_articles
    ↓ (1:1)
[MISSING] → events
    ↓ (1:N)
signals
    ↓ (1:1)
articles
```

### AMO V2 Tables
```
events
    ↓ (1:N)
signals
    ↓ (1:1)
articles
```

## 📋 DATA OWNERSHIP

### Source of Truth by Stage

1. **RSS Articles:** `rss_articles` (raw ingestion)
2. **Candidate Queue:** `candidate_articles` (screening system)
3. **Final Content:** `articles` (published observations)
4. **Processing Trail:** `events` → `signals` → `articles`

## 🔄 INTENDED PROCESSING FLOW

### Stage 1: Ingestion (Automated)
```
RSS Worker → rss_articles → candidate_articles
Status: "new"
```

### Stage 2: Screening (Manual/Automated)
```
Candidate API → AMOCandidateScreener → candidate_articles
Status: "new" → "screened" → "approved"/"rejected"
```

### Stage 3: Processing (Manual/Automated)
```
Candidate API → MaterialitySignalPipeline → DatabaseService
Status: "approved" → "processed"
Creates: events → signals → articles
```

### Stage 4: Publication (Manual)
```
DatabaseService → articles table
Status: "processed" → "published"
```

========================================
MISSING INTEGRATIONS
========================================

## 🚨 CRITICAL GAPS IDENTIFIED

### Gap #1: Candidate API Database Integration
**File:** `app/api/admin/candidates/route.ts`
**Issue:** Uses hardcoded mock data instead of `candidate_articles` table
**Impact:** 70 real candidates invisible to screening system

### Gap #2: Automatic Screening Trigger
**Issue:** No automatic screening of "new" candidates
**Impact:** Manual intervention required for each candidate
**Current:** 70 candidates stuck at status="new"

### Gap #3: Database Update Operations
**Issue:** Screening/approval operations only log to console
**Impact:** No status updates in `candidate_articles` table
**Missing:** Real D1 database operations in API handlers

### Gap #4: AMO V2 Pipeline Connection
**Issue:** `handleProcessCandidate()` exists but not connected to database
**Impact:** No events/signals/articles created from RSS candidates
**Missing:** DatabaseService integration for approved candidates

### Gap #5: Feature Flag Configuration
**Issue:** `USE_MATERIALITY_SIGNAL_PIPELINE` environment variable
**Impact:** AMO V2 pipeline disabled by default
**Current:** Pipeline generates fallback responses

========================================
CODE REFERENCES ANALYSIS
========================================

## 📁 Table References Found

### candidate_articles References
- `app/api/admin/candidates/route.ts` (mock data only)
- `lib/screening/amo-candidate-screener.ts` (screening logic)
- `workers/rss-intake-worker-cf.ts` (creation logic)

### rss_articles References  
- `workers/rss-intake-worker-cf.ts` (insertion logic)
- `lib/db/rss-schema.sql` (schema definition)

### AMO V2 Table References
- `lib/db/database.ts` (DatabaseService interface)
- `lib/pipeline/materiality-signal-pipeline.ts` (processing logic)
- `app/api/process-article/route.ts` (manual pipeline)

## 🔍 Processing Logic Analysis

### MaterialitySignalPipeline
```typescript
// Feature flag controlled
private readonly USE_MATERIALITY_SIGNAL_PIPELINE = process.env.USE_MATERIALITY_SIGNAL_PIPELINE === 'true';

// Input expects article content
interface MaterialitySignalPipelineInput {
  articleTitle: string;
  sourceDomain: string;
  articleContent: string;
  // ...
}

// Output generates V2 content
interface MaterialitySignalPipelineOutput {
  approved: boolean;
  article?: string;
  signal_type?: string;
  headline?: string;
  // ...
}
```

### DatabaseService Operations
```typescript
// Creates V2 tables
await db.createEvent({...});
await db.createSignal({event_id: event.id, ...});
await db.createArticle({event_id: event.id, ...});
```

## 🔧 API Handler Analysis

### Current Mock Implementation
```typescript
// GET /api/admin/candidates
const mockCandidates = [...]; // ❌ Hardcoded data

// POST /api/admin/candidates/:id/process
const candidate = {
  id: parseInt(id),
  title: 'Test Article', // ❌ Mock data
  // ...
};
```

### Intended Implementation
```typescript
// Should be:
const candidates = await db.getCandidates(status);
const candidate = await db.getCandidateById(id);
```

========================================
RECOMMENDED INTEGRATION ORDER
========================================

## 🎯 PRIORITY 1: Fix Candidate API Database Integration

### Files to Modify
1. `app/api/admin/candidates/route.ts`
2. Add D1 database binding
3. Replace mock data with real `candidate_articles` queries
4. Implement real database updates

### Expected Result
- 70 RSS candidates visible in admin dashboard
- Real-time status updates
- Database consistency restored

## 🎯 PRIORITY 2: Implement Screening Workflow

### Integration Points
1. **Automatic Trigger:** New candidates → screening
2. **Manual Trigger:** Admin screening endpoint
3. **Status Updates:** Screening results stored in database

### Expected Flow
```
candidate_articles (status="new")
    ↓
AMOCandidateScreener.screenCandidate()
    ↓
candidate_articles (status="screened" + relevance_score)
    ↓
Manual approval/rejection
    ↓
candidate_articles (status="approved"/"rejected")
```

## 🎯 PRIORITY 3: Connect AMO V2 Pipeline

### Integration Points
1. **Process Trigger:** Approved candidates → AMO V2 pipeline
2. **Database Operations:** Create events → signals → articles
3. **Status Updates:** Mark candidates as "processed"

### Expected Flow
```
candidate_articles (status="approved")
    ↓
MaterialitySignalPipeline.process()
    ↓
DatabaseService.createEvent()
    ↓
DatabaseService.createSignal()
    ↓
DatabaseService.createArticle()
    ↓
candidate_articles (status="processed")
```

## 🎯 PRIORITY 4: Feature Flag Configuration

### Environment Variables Needed
```bash
USE_MATERIALITY_SIGNAL_PIPELINE=true
```

### Expected Result
- AMO V2 pipeline enabled by default
- Feature flag controlled testing capability
- Gradual rollout possible

========================================
ARCHITECTURE RECOMMENDATION
========================================

## 🏗️ RECOMMENDED ARCHITECTURE

### Keep Current Design
✅ **Separate RSS V3 and AMO V2 systems**
✅ **Candidate screening queue as intermediary**
✅ **MaterialitySignalPipeline as processing engine**
✅ **DatabaseService as data layer**

### Integration Strategy
✅ **Connect candidate_articles to DatabaseService**
✅ **Implement real database operations in API**
✅ **Enable automatic screening workflow**
✅ **Maintain feature flag control**

### Data Flow Recommendation
```
RSS → rss_articles → candidate_articles → [Screening] → MaterialitySignalPipeline → DatabaseService → events → signals → articles
```

## 🎯 SUCCESS CRITERIA

After integration:
- ✅ 70 RSS candidates visible and processable
- ✅ Automatic screening workflow operational
- ✅ Approved candidates create events/signals/articles
- ✅ End-to-end pipeline from RSS to publication
- ✅ Dashboard shows real-time data
- ✅ All database operations functional

## 📊 FINAL ASSESSMENT

**Current Status:** 🟡 **PARTIALLY OPERATIONAL**
- ✅ RSS ingestion working perfectly
- ✅ Architecture design is sound
- ❌ Implementation gaps in API layer
- ❌ Missing database connections

**Root Cause:** API layer uses mock data instead of real database operations

**Recommended Action:** Implement database integration in candidate API to connect the working RSS system to the intended AMO V2 pipeline.

**Architecture Decision:** The current three-tier design (RSS → Candidates → AMO V2) is correct and should be implemented as designed.
