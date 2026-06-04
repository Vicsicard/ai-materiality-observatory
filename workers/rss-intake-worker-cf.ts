/**
 * AMO V3 RSS Intake Worker (Cloudflare Worker)
 * 
 * Purpose: Fetch RSS feeds, parse articles, deduplicate, store candidates
 * Schedule: Every 60 minutes via Cron Trigger
 * 
 * Flow: RSS Sources → Feed Fetch → Parse → Deduplicate → Store
 */

interface RSSSource {
  id: number;
  name: string;
  feed_url: string;
  source_type: string;
  is_active: number;
  last_polled_at: string | null;
}

interface RSSArticle {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  author?: string;
  categories?: string[];
}

interface IngestionStats {
  source_id: number;
  source_name: string;
  articles_found: number;
  articles_inserted: number;
  duplicates_skipped: number;
  processing_time_ms: number;
  error_message?: string;
}

export class RSSIntakeWorkerCF {
  private env: any; // Cloudflare Worker environment
  private readonly MAX_NEW_ARTICLES_PER_FEED = 10;
  private readonly DUPLICATE_STREAK_LIMIT = 3;
  
  constructor(env: any) {
    this.env = env;
  }
  
  async run(): Promise<IngestionStats[]> {
    console.log('🔄 RSS Intake Worker - Starting run');
    const startTime = Date.now();
    
    // Get active RSS sources
    const sources = await this.getActiveRSSSources();
    console.log(`📡 Found ${sources.length} active RSS sources`);
    
    const results: IngestionStats[] = [];
    
    for (const source of sources) {
      const stats = await this.processRSSSource(source);
      results.push(stats);
      
      // Update last polled time
      await this.updateSourcePolledTime(source.id);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ RSS Intake Worker completed in ${totalTime}ms`);
    
    // Log summary
    this.logIngestionSummary(results, totalTime);
    
    return results;
  }
  
  private async getActiveRSSSources(): Promise<RSSSource[]> {
    const stmt = this.env.AMO_DB.prepare(`
      SELECT id, name, feed_url, source_type, is_active, last_polled_at 
      FROM rss_sources 
      WHERE is_active = 1
    `);
    
    const result = await stmt.all() as { results: RSSSource[] };
    return result.results || [];
  }
  
  private async processRSSSource(source: RSSSource): Promise<IngestionStats> {
    const startTime = Date.now();
    const stats: IngestionStats = {
      source_id: source.id,
      source_name: source.name,
      articles_found: 0,
      articles_inserted: 0,
      duplicates_skipped: 0,
      processing_time_ms: 0
    };
    
    try {
      console.log(`📡 Processing: ${source.name} (${source.feed_url})`);
      
      // Fetch RSS feed
      const response = await fetch(source.feed_url, {
        headers: {
          'User-Agent': 'AMO-RSS-Intake/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rssText = await response.text();
      const feed = this.parseRSSFeed(rssText);
      
      // Process first 10 articles (no timestamp filtering)
      const items = feed.items || [];
      stats.articles_found = items.length;
      console.log(`📰 Found ${stats.articles_found} articles in ${source.name}`);
      
      let itemsChecked = 0;
      let newArticlesInserted = 0;
      let duplicatesSkipped = 0;
      let duplicateStreak = 0;
      let duplicateStreakTriggered = false;
      
      for (const item of items) {
        // Stop if we've hit our limit
        if (newArticlesInserted >= this.MAX_NEW_ARTICLES_PER_FEED) {
          console.log(`⏹️ Hit max articles limit (${this.MAX_NEW_ARTICLES_PER_FEED}) for ${source.name}`);
          break;
        }
        
        itemsChecked++;
        
        try {
          // Check if article is valid first
          if (!item.title || !item.link) {
            console.log(`🔍 Skipping invalid article: missing title or URL`);
            continue;
          }
          
          // Check for duplicate URL specifically
          const isDuplicate = await this.isDuplicateURL(item.link);
          console.log(`🔍 Processing article: ${item.title.substring(0, 50)}...`);
          console.log(`🔍 URL: ${item.link}`);
          console.log(`🔍 Is duplicate: ${isDuplicate}`);
          console.log(`🔍 Duplicate streak before: ${duplicateStreak}`);
          
          if (isDuplicate) {
            duplicatesSkipped++;
            duplicateStreak++;
            console.log(`🔍 Duplicate streak after: ${duplicateStreak}`);
            
            // Stop if we hit duplicate streak limit
            if (duplicateStreak >= this.DUPLICATE_STREAK_LIMIT) {
              console.log(`⏹️ Hit duplicate streak limit (${this.DUPLICATE_STREAK_LIMIT}) for ${source.name}`);
              duplicateStreakTriggered = true;
              break;
            }
          } else {
            // Insert RSS article
            console.log(`🔍 Attempting insert...`);
            const rssArticleId = await this.insertRSSArticle(item, source);
            console.log(`🔍 Insert succeeded, ID: ${rssArticleId}`);
            
            // Create candidate article
            console.log(`🔍 Creating candidate...`);
            await this.createCandidateArticle(rssArticleId, item, source);
            console.log(`🔍 Candidate created`);
            
            stats.articles_inserted++;
            newArticlesInserted++;
            duplicateStreak = 0; // Reset duplicate streak
            console.log(`🔍 Article processed successfully`);
            console.log(`🔍 Duplicate streak reset to: ${duplicateStreak}`);
            console.log(`🔍 New articles inserted now: ${newArticlesInserted}`);
          }
        } catch (error) {
          console.error(`❌ Error processing article from ${source.name}:`, error);
        }
      }
      
      // Enhanced logging
      console.log(`📊 ${source.name} Results:`);
      console.log(`   Items returned: ${stats.articles_found}`);
      console.log(`   Items checked: ${itemsChecked}`);
      console.log(`   Articles inserted: ${stats.articles_inserted}`);
      console.log(`   Duplicates skipped: ${duplicatesSkipped}`);
      console.log(`   Duplicate streak triggered: ${duplicateStreakTriggered}`);
      
    } catch (error) {
      console.error(`💥 Error processing RSS source ${source.name}:`, error);
      stats.error_message = error instanceof Error ? error.message : 'Unknown error';
    }
    
    stats.processing_time_ms = Date.now() - startTime;
    
    // Log ingestion stats
    await this.logIngestionStats(stats);
    
    console.log(`✅ ${source.name}: ${stats.articles_inserted} inserted, ${stats.duplicates_skipped} duplicates`);
    
    return stats;
  }
  
  private parseRSSFeed(rssText: string): any {
    // Simple RSS parsing - in production, use a proper RSS parser
    const items: RSSArticle[] = [];
    
    // Extract items from RSS XML
    const itemMatches = rssText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches) {
      const title = this.extractXMLTag(itemXml, 'title');
      const link = this.extractXMLTag(itemXml, 'link');
      const pubDate = this.extractXMLTag(itemXml, 'pubDate');
      const content = this.extractXMLTag(itemXml, 'content:encoded') || this.extractXMLTag(itemXml, 'description');
      const author = this.extractXMLTag(itemXml, 'author');
      
      if (title && link) {
        items.push({
          title: title.trim(),
          link: link.trim(),
          pubDate: pubDate?.trim(),
          content: content?.trim(),
          author: author?.trim()
        });
      }
    }
    
    return { items };
  }
  
  private extractXMLTag(xml: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? this.unescapeXML(match[1]) : undefined;
  }
  
  private unescapeXML(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
  
  private sortItemsByDate(items: RSSArticle[]): RSSArticle[] {
    return items.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }
  
  private isArticleNewerThanLastPoll(item: RSSArticle, lastPolledAt: string | null): boolean {
    if (!lastPolledAt) {
      return true; // First run - process all articles
    }
    
    if (!item.pubDate) {
      return true; // No date - assume it's new
    }
    
    const articleDate = new Date(item.pubDate).getTime();
    const lastPollDate = new Date(lastPolledAt).getTime();
    
    return articleDate > lastPollDate;
  }
  
  private async processArticle(item: RSSArticle, source: RSSSource): Promise<boolean> {
    // Validate required fields
    if (!item.title || !item.link) {
      return false;
    }
    
    // Check for duplicate URL
    if (await this.isDuplicateURL(item.link)) {
      return false;
    }
    
    // Insert RSS article
    const rssArticleId = await this.insertRSSArticle(item, source);
    
    // Create candidate article
    await this.createCandidateArticle(rssArticleId, item, source);
    
    return true;
  }
  
  private async isDuplicateURL(url: string): Promise<boolean> {
    const stmt = this.env.AMO_DB.prepare('SELECT id FROM rss_articles WHERE url = ? LIMIT 1');
    const result = await stmt.bind(url).first();
    
    console.log("================================");
    console.log("URL:", url);
    console.log("Raw D1 Result:", result);
    console.log("Type:", typeof result);
    console.log("Boolean(result):", Boolean(result));
    console.log("result !== undefined:", result !== undefined);
    console.log("result === null:", result === null);
    console.log("result === undefined:", result === undefined);
    console.log("result.id:", result?.id);
    console.log("================================");
    
    // Fix: Check for actual row existence, not just truthiness
    // D1 returns null when no row exists, not undefined
    const isDuplicate = result !== null && result !== undefined;
    
    console.log(`🔍 Checking duplicate for URL: ${url}`);
    console.log(`🔍 Duplicate result: ${isDuplicate ? 'DUPLICATE' : 'NEW'}`);
    console.log("Final isDuplicate value:", isDuplicate);
    
    return isDuplicate;
  }
  
  private async insertRSSArticle(item: RSSArticle, source: RSSSource): Promise<number> {
    const stmt = this.env.AMO_DB.prepare(`
      INSERT INTO rss_articles (
        source_id, title, url, summary, published_at, 
        raw_content, author, categories
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      source.id,
      item.title,
      item.link,
      item.contentSnippet || '',
      item.pubDate || new Date().toISOString(),
      item.content || '',
      item.author || '',
      JSON.stringify(item.categories || [])
    ).run();
    
    return result.meta.last_row_id;
  }
  
  private async createCandidateArticle(rssArticleId: number, item: RSSArticle, source: RSSSource): Promise<void> {
    const stmt = this.env.AMO_DB.prepare(`
      INSERT INTO candidate_articles (
        rss_article_id, title, url, source_name
      ) VALUES (?, ?, ?, ?)
    `);
    
    await stmt.bind(
      rssArticleId,
      item.title,
      item.link,
      source.name
    ).run();
  }
  
  private async updateSourcePolledTime(sourceId: number): Promise<void> {
    const stmt = this.env.AMO_DB.prepare('UPDATE rss_sources SET last_polled_at = ? WHERE id = ?');
    await stmt.bind(new Date().toISOString(), sourceId).run();
  }
  
  private async logIngestionStats(stats: IngestionStats): Promise<void> {
    const stmt = this.env.AMO_DB.prepare(`
      INSERT INTO rss_ingestion_logs (
        source_id, articles_found, articles_inserted, 
        duplicates_skipped, processing_time_ms, error_message
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      stats.source_id,
      stats.articles_found,
      stats.articles_inserted,
      stats.duplicates_skipped,
      stats.processing_time_ms,
      stats.error_message || null
    ).run();
  }
  
  private logIngestionSummary(results: IngestionStats[], totalTime: number): void {
    const totalFound = results.reduce((sum, r) => sum + r.articles_found, 0);
    const totalInserted = results.reduce((sum, r) => sum + r.articles_inserted, 0);
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates_skipped, 0);
    const errors = results.filter(r => r.error_message).length;
    
    console.log('\n📊 RSS INGESTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Sources processed: ${results.length}`);
    console.log(`Articles found: ${totalFound}`);
    console.log(`Articles inserted: ${totalInserted}`);
    console.log(`Duplicates skipped: ${totalDuplicates}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total processing time: ${totalTime}ms`);
    console.log('='.repeat(50));
    
    // Log detailed results
    for (const result of results) {
      console.log(`${result.source_name}: ${result.articles_inserted} inserted, ${result.duplicates_skipped} duplicates${result.error_message ? ' (ERROR)' : ''}`);
    }
  }
  
  // Utility methods for monitoring
  async getIngestionStats(hours: number = 24): Promise<any> {
    const stmt = this.env.AMO_DB.prepare(`
      SELECT 
        rs.name,
        COUNT(ra.id) as articles_found,
        COUNT(CASE WHEN ra.created_at > datetime('now', '-${hours} hours') THEN 1 END) as recent_articles
      FROM rss_sources rs
      LEFT JOIN rss_articles ra ON rs.id = ra.source_id
      WHERE rs.is_active = 1
      GROUP BY rs.id, rs.name
      ORDER BY recent_articles DESC
    `);
    
    return await stmt.all();
  }
  
  async getCandidateQueueStats(): Promise<any> {
    const stmt = this.env.AMO_DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(relevance_score) as avg_score
      FROM candidate_articles
      GROUP BY status
      ORDER BY count DESC
    `);
    
    return await stmt.all();
  }
  
  private async updateSourcePolledTime(sourceId: number): Promise<void> {
    const stmt = this.env.AMO_DB.prepare(`
      UPDATE rss_sources 
      SET last_polled_at = datetime('now')
      WHERE id = ?
    `);
    await stmt.bind(sourceId).run();
  }
}

// Cloudflare Worker handler
export default {
  async scheduled(event: any, env: any, ctx: any) {
    console.log('🔄 RSS Intake Worker - Scheduled trigger');
    
    const worker = new RSSIntakeWorkerCF(env);
    
    try {
      await worker.run();
      console.log('✅ RSS intake worker completed successfully');
    } catch (error) {
      console.error('💥 RSS intake worker failed:', error);
      throw error;
    }
  },
  
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Manual trigger for testing
    if (request.url.includes('/manual-run')) {
      console.log('🔄 RSS Intake Worker - Manual trigger');
      
      const worker = new RSSIntakeWorkerCF(env);
      
      try {
        const results = await worker.run();
        console.log('✅ RSS intake worker completed successfully');
        
        return new Response(JSON.stringify({
          success: true,
          results: results,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('💥 RSS intake worker failed:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('RSS Intake Worker - Use /manual-run to trigger', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
