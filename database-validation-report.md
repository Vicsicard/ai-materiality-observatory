# Database Validation Report

**Generated:** 2026-06-03T22:13:41.817Z

## Table Row Counts

| Table | Row Count |
| ---- | --------- |
| rss_sources | 0 |
| rss_articles | 0 |
| candidate_articles | 0 |
| rss_ingestion_logs | 0 |
| screening_logs | 0 |

## Data Assessment

❌ **Database appears to be empty**

No data found in any AMO V3 tables.

Likely causes:
1. Database not initialized
2. RSS worker not running
3. Schema not created

## Database Errors

- ❌ Could not parse count for rss_sources
- ❌ Could not parse count for rss_articles
- ❌ Could not parse count for candidate_articles
- ❌ Could not parse count for rss_ingestion_logs
- ❌ Could not parse count for screening_logs

## Recommendations

1. **Initialize Database:** `npm run db:init`
2. **Seed RSS Sources:** `npm run db:seed`
3. **Deploy Worker:** `npm run worker:deploy`
