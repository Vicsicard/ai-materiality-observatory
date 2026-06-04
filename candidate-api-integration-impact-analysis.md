# CANDIDATE API INTEGRATION - PRE-IMPLEMENTATION IMPACT ANALYSIS

**Generated:** 2026-06-03T23:10:00.000Z

==================================================
PHASE 1 - API ANALYSIS
======================

## Current Mock API Structure

### File: `app/api/admin/candidates/route.ts`

### Mock Data Schema
```typescript
interface MockCandidate {
  id: number;
  title: string;
  url: string;
  source_name: string;
  status: 'new' | 'screened' | 'approved' | 'rejected' | 'processed';
  relevance_score: number;
  screener_reason?: string;
  recommended_dimensions?: string[];
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  summary?: string;
  published_at?: string;
  rss_source_name?: string;
}
```

### Expected Response Schema
```typescript
{
  success: true,
  data: {
    candidates: Candidate[],
    counts: {
      new: number;
      screened: number;
      approved: number;
      rejected: number;
      processed: number;
    },
    pagination: {
      limit: number;
      offset: number;
      total: number;
    }
  }
}
```

### UI Consumers
- **File:** `app/admin/candidates/page.tsx`
- **Interface:** `Candidate` (matches mock schema exactly)
- **API Calls:** 
  - `GET /api/admin/candidates?status=all&limit=50&offset=0`
  - `POST /api/admin/candidates?id=X&action=screen`
  - `POST /api/admin/candidates?id=X&action=approve`
  - `POST /api/admin/candidates?id=X&action=reject`
  - `POST /api/admin/candidates?id=X&action=process`

### Filtering & Pagination Requirements
- **Status Filter:** `status` parameter (all, new, screened, approved, rejected, processed)
- **Pagination:** `limit` and `offset` parameters
- **Sorting:** `ORDER BY ca.created_at DESC` (newest first)
- **Search:** Frontend has `searchTerm` state but API doesn't implement search yet

### Frontend Assumptions
- Expects exactly the mock schema structure
- Requires `rss_source_name` field (from JOIN with rss_sources)
- Expects `summary` and `published_at` from rss_articles JOIN
- Relies on status counts for UI tabs
- Uses candidate ID for all actions

## 🚨 Critical Finding
**SQL Query Already Exists:** The API already contains a proper SQL query that matches the frontend expectations perfectly, but it's commented out and returns mock data instead.

==================================================
PHASE 2 - DATABASE MAPPING
==========================

## candidate_articles Table Structure

### Complete Column Mapping
```sql
CREATE TABLE candidate_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,           -- ✅ Used
  rss_article_id INTEGER,                          -- ✅ Used (JOIN to rss_articles)
  title TEXT NOT NULL,                            -- ✅ Used
  url TEXT NOT NULL,                             -- ✅ Used
  source_name TEXT,                               -- ✅ Used
  status TEXT DEFAULT 'new',                      -- ✅ Used
  relevance_score INTEGER DEFAULT 0,               -- ✅ Used
  screener_reason TEXT,                           -- ✅ Used
  recommended_dimensions TEXT,                    -- ✅ Used (JSON array)
  approved_by TEXT,                               -- ❌ Not in API
  approved_at TEXT,                               -- ✅ Used
  rejected_by TEXT,                               -- ❌ Not in API
  rejected_at TEXT,                               -- ✅ Used
  processed_at TEXT,                              -- ❌ Not in API
  observation_id TEXT,                            -- ❌ Not in API
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,      -- ✅ Used
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,      -- ❌ Not in API
  FOREIGN KEY (rss_article_id) REFERENCES rss_articles(id)
);
```

### Database → API Response Mapping
```sql
SELECT 
  ca.id,                           -- ✅ id
  ca.title,                        -- ✅ title
  ca.url,                          -- ✅ url
  ca.source_name,                  -- ✅ source_name
  ca.status,                       -- ✅ status
  ca.relevance_score,              -- ✅ relevance_score
  ca.screener_reason,              -- ✅ screener_reason
  ca.recommended_dimensions,       -- ✅ recommended_dimensions (JSON)
  ca.approved_at,                  -- ✅ approved_at
  ca.rejected_at,                  -- ✅ rejected_at
  ca.created_at,                   -- ✅ created_at
  ra.summary,                      -- ✅ summary (from JOIN)
  ra.published_at,                 -- ✅ published_at (from JOIN)
  rs.name as rss_source_name       -- ✅ rss_source_name (from JOIN)
FROM candidate_articles ca
LEFT JOIN rss_articles ra ON ca.rss_article_id = ra.id
LEFT JOIN rss_sources rs ON ra.source_id = rs.id
```

### Missing Fields Analysis
**Database has extra fields not used by API:**
- `approved_by`, `rejected_by` - User tracking
- `processed_at`, `observation_id` - AMO V2 integration tracking
- `updated_at` - Modification tracking

**API has all required fields from database.**

## 🎯 Mapping Result
**Perfect Match:** The existing SQL query provides exactly what the frontend expects. No schema changes needed.

==================================================
PHASE 3 - SCREENING TRIGGER ANALYSIS
====================================

## Current Screening Trigger Mechanism

### Screening System Components
- **Screener Class:** `AMOCandidateScreener` in `lib/screening/amo-candidate-screener.ts`
- **Screening Methods:** AI-based and rule-based screening
- **Approval Threshold:** 80+ score required

### Current Trigger Status
**❌ NO AUTOMATIC TRIGGER EXISTS**

### Screening Entry Points Found
1. **Manual API Call:** `POST /api/admin/candidates?id=X&action=screen`
2. **Manual UI Action:** User clicks "Screen" button in admin dashboard

### Intended Screening Flow (Based on Code Analysis)
```
Candidate (status="new")
    ↓
Manual "Screen" Action
    ↓
AMOCandidateScreener.screenCandidate()
    ↓
candidate_articles.status = "screened"
    ↓
Manual "Approve/Reject" Action
    ↓
candidate_articles.status = "approved"/"rejected"
    ↓
Manual "Process" Action
    ↓
MaterialitySignalPipeline.process()
    ↓
candidate_articles.status = "processed"
```

### Missing Automatic Triggers
- ❌ No cron job for automatic screening
- ❌ No queue-based processing
- ❌ No webhook triggers
- ❌ No event-driven screening

## 🎯 Screening Trigger Conclusion
**Manual Only:** Current system requires manual intervention for each step. No automatic screening mechanism exists.

==================================================
PHASE 4 - EXISTING 70 CANDIDATES
================================

## Current Status of Existing Records

### Database Query Results
```sql
SELECT status, COUNT(*) as count FROM candidate_articles GROUP BY status;
```

**Result:**
```
┌────────┬───────┐
│ status │ count │
├────────┼───────┤
│ new    │ 70    │
└────────┴───────┘
```

### Existing 70 Candidates Analysis
- **Status:** All 70 candidates have status="new"
- **Created:** 2026-06-03 22:54:18 (all created in same batch)
- **Screening Data:** All have `relevance_score = 0`, `screener_reason = null`
- **Approval Data:** All have `approved_at = null`, `rejected_at = null`
- **Content:** All have valid titles, URLs, source names from RSS feeds

### Impact After API Integration
**✅ Automatic Visibility:** The 70 candidates will immediately appear in the admin dashboard once the API is fixed.

**✅ Processable:** All 70 candidates can be manually screened, approved, and processed.

**✅ No Migration Needed:** Candidates are already in correct format and status.

**🎯 Ready for Processing:** The existing 70 candidates are perfectly positioned for the intended workflow.

==================================================
PHASE 5 - DUPLICATE PROCESSING PROTECTION
=========================================

## Current Status Transition Logic

### Status Flow Definition
```
new → screened → approved/rejected → processed
```

### Current Protection Mechanisms
**❌ NO DUPLICATE PROCESSING PROTECTION EXISTS**

### Missing Protection Analysis
1. **No Status Locks:** No mechanism prevents multiple screening runs
2. **No Processing Flags:** No field to track "currently processing"
3. **No Idempotency:** API calls can be repeated safely
4. **No Queue Management:** No queue system to prevent race conditions

### Potential Duplicate Scenarios
1. **Double Screening:** User clicks "Screen" twice
2. **Double Approval:** User clicks "Approve" twice
3. **Concurrent Processing:** Multiple users screening same candidate
4. **API Replay:** Automated systems calling same endpoint repeatedly

### Recommended Protection Gaps
- Add `processing_at` timestamp field
- Add status transition validation
- Add idempotency checks
- Add concurrent processing locks

## 🚨 Critical Gap
**No Protection:** The system has no safeguards against duplicate processing operations.

==================================================
PHASE 6 - MATERIALITY PIPELINE CONNECTION
=========================================

## Complete Pipeline Trace

### Entry Point Analysis
**File:** `app/api/admin/candidates/route.ts`
**Function:** `handleProcessCandidate(candidate)`
**Trigger:** `POST /api/admin/candidates?id=X&action=process`

### Pipeline Input Requirements
```typescript
const pipelineInput = {
  articleTitle: candidate.title,           // ✅ Available
  sourceDomain: new URL(candidate.url).hostname, // ✅ Available
  articleContent: candidate.content || candidate.summary || '', // ❌ Missing content
  sourceUrl: candidate.url,                // ✅ Available
  sourceName: candidate.source_name       // ✅ Available
};
```

### MaterialitySignalPipeline Execution
```typescript
const pipeline = new MaterialitySignalPipeline();
const result = await pipeline.process(pipelineInput);
```

### Pipeline Output Processing
```typescript
if (result.approved) {
  // ❌ COMMENT: "In production, update candidate status to 'processed' and create observation"
  // ❌ ACTUAL: Only console logging, no database operations
}
```

### DatabaseService Integration Gap
**Missing:** The `handleProcessCandidate` function exists but doesn't call DatabaseService to create events/signals/articles.

### Complete Intended Flow
```
candidate_articles (status="approved")
    ↓
handleProcessCandidate()
    ↓
MaterialitySignalPipeline.process()
    ↓
DatabaseService.createEvent()
    ↓
DatabaseService.createSignal()
    ↓
DatabaseService.createArticle()
    ↓
candidate_articles.status = "processed"
```

## 🎯 Pipeline Connection Status
**Partially Implemented:** Pipeline exists and is callable, but database integration is missing.

==================================================
IMPLEMENTATION PLAN
===================

## Phase 1: API Database Integration (Priority 1)

### Files to Modify
1. `app/api/admin/candidates/route.ts`

### Changes Required
1. **Enable SQL Query:** Uncomment and execute existing SQL query
2. **Add D1 Binding:** Get database connection from request context
3. **Replace Mock Data:** Use real database results
4. **Add Error Handling:** Handle database connection failures

### Expected Impact
- ✅ 70 candidates immediately visible in dashboard
- ✅ Real-time data instead of mock data
- ✅ All CRUD operations work with real data

## Phase 2: Database Operations Integration (Priority 2)

### Files to Modify
1. `app/api/admin/candidates/route.ts` (handlers)

### Changes Required
1. **handleScreenCandidate():** Update database with screening results
2. **handleApproveCandidate():** Update candidate status and timestamps
3. **handleRejectCandidate():** Update candidate status and timestamps
4. **handleProcessCandidate():** Connect to DatabaseService

### Expected Impact
- ✅ Screening results persist to database
- ✅ Status transitions properly tracked
- ✅ AMO V2 pipeline integration functional

## Phase 3: MaterialitySignalPipeline Integration (Priority 3)

### Files to Modify
1. `app/api/admin/candidates/route.ts` (handleProcessCandidate)

### Changes Required
1. **Add DatabaseService:** Import and instantiate DatabaseService
2. **Create Event:** Call db.createEvent() for approved candidates
3. **Create Signal:** Call db.createSignal() with pipeline results
4. **Create Article:** Call db.createArticle() with generated content
5. **Update Candidate:** Mark candidate as "processed"

### Expected Impact
- ✅ Complete end-to-end pipeline functional
- ✅ Events/signals/articles created from RSS candidates
- ✅ Full RSS → AMO V2 workflow operational

## Phase 4: Protection Mechanisms (Priority 4)

### Database Schema Changes
```sql
ALTER TABLE candidate_articles ADD COLUMN processing_at TEXT;
ALTER TABLE candidate_articles ADD COLUMN processed_by TEXT;
```

### API Changes
1. **Status Validation:** Prevent invalid status transitions
2. **Processing Lock:** Set processing_at timestamp during operations
3. **Idempotency:** Check current status before processing

### Expected Impact
- ✅ No duplicate processing
- ✅ Concurrent operation safety
- ✅ Audit trail for all operations

==================================================
RISK ANALYSIS
=============

## Low Risk Changes
- ✅ API database integration (SQL query already exists)
- ✅ Frontend compatibility (schema matches perfectly)
- ✅ Existing 70 candidates (no migration needed)

## Medium Risk Changes
- ⚠️ Database operations (need proper error handling)
- ⚠️ MaterialitySignalPipeline integration (need content field)
- ⚠️ Status transition logic (need validation)

## High Risk Changes
- 🚨 Concurrent processing (no existing protection)
- 🚨 Content availability (candidates missing full article content)
- 🚨 Feature flag dependencies (USE_MATERIALITY_SIGNAL_PIPELINE)

==================================================
SUCCESS CRITERIA
===============

## Phase 1 Success
- [ ] Dashboard shows 70 real candidates instead of mock data
- [ ] All status filters work correctly
- [ ] Pagination works properly
- [ ] Candidate details display correctly

## Phase 2 Success
- [ ] Screening operation updates database
- [ ] Approval/rejection operations update database
- [ ] Status transitions work correctly
- [ ] Timestamp tracking functional

## Phase 3 Success
- [ ] Process operation creates events/signals/articles
- [ ] MaterialitySignalPipeline executes successfully
- [ ] Candidates marked as "processed"
- [ ] End-to-end pipeline complete

## Phase 4 Success
- [ ] No duplicate processing possible
- [ ] Concurrent operations safe
- [ ] Audit trail complete
- [ ] Error handling robust

==================================================
FINAL RECOMMENDATION
===================

## 🎯 IMPLEMENT IMMEDIATELY

**Phase 1: API Database Integration**
- Risk: LOW
- Impact: HIGH
- Effort: LOW
- Reason: SQL query already exists, just needs to be enabled

## 🎯 IMPLEMENT NEXT

**Phase 2: Database Operations Integration**
- Risk: MEDIUM
- Impact: HIGH  
- Effort: MEDIUM
- Reason: Required for any functional pipeline

## 🎯 IMPLEMENT LAST

**Phase 3 & 4: Pipeline Integration & Protection**
- Risk: HIGH
- Impact: HIGH
- Effort: HIGH
- Reason: Complex integration with multiple dependencies

## 📊 OVERALL ASSESSMENT

**Ready for Implementation:** ✅ YES
**Architecture Sound:** ✅ YES
**Data Ready:** ✅ YES
**Frontend Compatible:** ✅ YES
**Low Initial Risk:** ✅ YES

**Recommendation:** Proceed with Phase 1 immediately, as it's low risk and provides immediate value with the existing 70 candidates.
