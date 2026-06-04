# RSS Processing Loop Audit

**Generated:** 2026-06-03T22:45:00.000Z

## 🔍 DUPLICATE STREAK LOGIC BUG ANALYSIS

### **ROOT CAUSE IDENTIFIED**

The duplicate streak logic bug was caused by incorrect control flow in the processing loop.

### **1. ORIGINAL BUGGY CODE**

```typescript
const inserted = await this.processArticle(item, source);
if (inserted) {
  stats.articles_inserted++;
  newArticlesFound++;
  duplicateStreak = 0; // Reset duplicate streak
} else {
  stats.duplicates_skipped++;
  duplicateStreak++; // ← BUG: This increments for ANY failure!
  
  // Stop if we hit duplicate streak limit
  if (duplicateStreak >= this.DUPLICATE_STREAK_LIMIT) {
    console.log(`⏹️ Hit duplicate streak limit (${this.DUPLICATE_STREAK_LIMIT}) for ${source.name}`);
    duplicateStreakTriggered = true;
    break;
  }
}
```

### **2. THE PROBLEM**

The `processArticle` method returns `false` for multiple reasons:

```typescript
private async processArticle(item: RSSArticle, source: RSSSource): Promise<boolean> {
  // Validate required fields
  if (!item.title || !item.link) {
    return false; // ← Returns false for invalid articles
  }
  
  // Check for duplicate URL
  if (await this.isDuplicateURL(item.link)) {
    return false; // ← Returns false for duplicates
  }
  
  // Insert RSS article
  const rssArticleId = await this.insertRSSArticle(item, source);
  
  // Create candidate article
  await this.createCandidateArticle(rssArticleId, item, source);
  
  return true;
}
```

**The bug:** The main processing loop treated **any** `processArticle` failure as a duplicate, including:
- Missing title or URL (validation failures)
- Database insertion failures
- Candidate creation failures

But the duplicate streak should only increment for **actual duplicates**.

### **3. EXPECTED CONTROL FLOW**

```typescript
if (isDuplicate) {
  stats.duplicates_skipped++;
  duplicateStreak++;
  
  // Stop if we hit duplicate streak limit
  if (duplicateStreak >= this.DUPLICATE_STREAK_LIMIT) {
    console.log(`⏹️ Hit duplicate streak limit (${this.DUPLICATE_STREAK_LIMIT}) for ${source.name}`);
    duplicateStreakTriggered = true;
    break;
  }
} else {
  // Insert RSS article
  const rssArticleId = await this.insertRSSArticle(item, source);
  
  // Create candidate article
  await this.createCandidateArticle(rssArticleId, item, source);
  
  stats.articles_inserted++;
  newArticlesFound++;
  duplicateStreak = 0; // Reset duplicate streak
}
```

### **4. FIX IMPLEMENTED**

Separated duplicate detection from article processing:

```typescript
// Check if article is valid first
if (!item.title || !item.link) {
  console.log(`🔍 Skipping invalid article: missing title or URL`);
  continue;
}

// Check for duplicate URL specifically
const isDuplicate = await this.isDuplicateURL(item.link);

if (isDuplicate) {
  stats.duplicates_skipped++;
  duplicateStreak++;
  // ... duplicate streak logic
} else {
  // Insert RSS article
  const rssArticleId = await this.insertRSSArticle(item, source);
  
  // Create candidate article
  await this.createCandidateArticle(rssArticleId, item, source);
  
  stats.articles_inserted++;
  newArticlesFound++;
  duplicateStreak = 0; // Reset duplicate streak
}
```

### **5. DIAGNOSTIC LOGGING ADDED**

For every article processed, the worker now logs:

```typescript
console.log(`🔍 Processing article: ${item.title.substring(0, 50)}...`);
console.log(`🔍 URL: ${item.link}`);
console.log(`🔍 Is duplicate: ${isDuplicate}`);
console.log(`🔍 Duplicate streak before: ${duplicateStreak}`);
console.log(`🔍 New articles found before: ${newArticlesFound}`);
console.log(`🔍 Attempting insert...`);
console.log(`🔍 Insert succeeded, ID: ${rssArticleId}`);
console.log(`🔍 Creating candidate...`);
console.log(`🔍 Candidate created`);
console.log(`🔍 Article processed successfully`);
console.log(`🔍 Duplicate streak reset to: ${duplicateStreak}`);
console.log(`🔍 New articles found now: ${newArticlesFound}`);
```

### **6. VERIFICATION REQUIRED**

After fix deployment, the worker should show:

```text
🔍 Is duplicate: false
🔍 Attempting insert...
🔍 Insert succeeded, ID: 123
🔍 Creating candidate...
🔍 Candidate created
🔍 Article processed successfully
```

And database should show:

```text
rss_articles > 0
candidate_articles > 0
```

### **7. SUCCESS CRITERIA**

✅ **Fixed Logic:** Duplicate streak only increments for actual duplicates  
✅ **Enhanced Logging:** Complete visibility into processing decisions  
✅ **Separated Concerns:** Validation, duplicate detection, and insertion are separate  
✅ **Proper Control Flow:** NEW articles reset duplicate streak, DUPLICATES increment it  

## **CONCLUSION**

**Bug Identified:** The processing loop incorrectly treated all article failures as duplicates  
**Fix Applied:** Separated duplicate detection from article processing  
**Expected Result:** NEW articles should now be processed successfully without triggering duplicate streak limits  

**Status:** 🟡 **FIXED** - Ready for validation testing
