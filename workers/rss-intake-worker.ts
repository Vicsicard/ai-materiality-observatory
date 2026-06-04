/**
 * AMO V3 RSS Intake Worker
 * 
 * Purpose: Fetch RSS feeds, parse articles, deduplicate, store candidates
 * Schedule: Every 60 minutes
 * 
 * Flow: RSS Sources → Feed Fetch → Parse → Deduplicate → Store
 */

import { Parser } from 'rss-parser';
import { Database } from 'bun:sqlite';

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

export class RSSIntakeWorker {
  private parser: Parser;
  private db: Database;
  
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        feed: [],
        item: ['author', 'categories']
      }
    });
    
    this.db = new Database('amo.db');
    this.initializeSchema();
  }
  
  private initializeSchema(): void {
    const schema = require('../db/rss-schema.sql');
    this.db.exec(schema);
  }
  
  async run(): Promise<IngestionStats[]> {
    console.log('🔄 RSS Intake Worker - Starting run');
    const startTime = Date.now();
    
    // Get active RSS sources
    const sources = this.getActiveRSSSources();
    console.log(`📡 Found ${sources.length} active RSS sources`);
    
    const results: IngestionStats[] = [];
    
    for (const source of sources) {
      const stats = await this.processRSSSource(source);
      results.push(stats);
      
      // Update last polled time
      this.updateSourcePolledTime(source.id);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ RSS Intake Worker completed in ${totalTime}ms`);
    
    // Log summary
    this.logIngestionSummary(results, totalTime);
    
    return results;
  }
  
  private getActiveRSSSources(): RSSSource[] {
    const query = `
      SELECT id, name, feed_url, source_type, is_active, last_polled_at 
      FROM rss_sources 
      WHERE is_active = 1
    `;
    
    return this.db.query(query).all() as RSSSource[];
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
      const feed = await this.parser.parseURL(source.feed_url);
      stats.articles_found = feed.items?.length || 0;
      
      console.log(`📰 Found ${stats.articles_found} articles in ${source.name}`);
      
      // Process each article
      for (const item of feed.items || []) {
        try {
          const inserted = await this.processArticle(item, source);
          if (inserted) {
            stats.articles_inserted++;
          } else {
            stats.duplicates_skipped++;
          }
        } catch (error) {
          console.error(`❌ Error processing article from ${source.name}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`💥 Error processing RSS source ${source.name}:`, error);
      stats.error_message = error instanceof Error ? error.message : 'Unknown error';
    }
    
    stats.processing_time_ms = Date.now() - startTime;
    
    // Log ingestion stats
    this.logIngestionStats(stats);
    
    console.log(`✅ ${source.name}: ${stats.articles_inserted} inserted, ${stats.duplicates_skipped} duplicates`);
    
    return stats;
  }
  
  private async processArticle(item: RSSArticle, source: RSSSource): Promise<boolean> {
    // Validate required fields
    if (!item.title || !item.link) {
      return false;
    }
    
    // Check for duplicate URL
    if (this.isDuplicateURL(item.link)) {
      return false;
    }
    
    // Insert RSS article
    const rssArticleId = this.insertRSSArticle(item, source);
    
    // Create candidate article
    this.createCandidateArticle(rssArticleId, item, source);
    
    return true;
  }
  
  private isDuplicateURL(url: string): boolean {
    const query = 'SELECT id FROM rss_articles WHERE url = ? LIMIT 1';
    const result = this.db.query(query).get(url);
    return result !== undefined;
  }
  
  private insertRSSArticle(item: RSSArticle, source: RSSSource): number {
    const query = `
      INSERT INTO rss_articles (
        source_id, title, url, summary, published_at, 
        raw_content, author, categories
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = this.db.run(query, [
      source.id,
      item.title,
      item.link,
      item.contentSnippet || '',
      item.pubDate || new Date().toISOString(),
      item.content || '',
      item.author || '',
      JSON.stringify(item.categories || [])
    ]);
    
    return result.lastInsertRowid as number;
  }
  
  private createCandidateArticle(rssArticleId: number, item: RSSArticle, source: RSSSource): void {
    const query = `
      INSERT INTO candidate_articles (
        rss_article_id, title, url, source_name
      ) VALUES (?, ?, ?, ?)
    `;
    
    this.db.run(query, [
      rssArticleId,
      item.title,
      item.link,
      source.name
    ]);
  }
  
  private updateSourcePolledTime(sourceId: number): void {
    const query = 'UPDATE rss_sources SET last_polled_at = ? WHERE id = ?';
    this.db.run(query, [new Date().toISOString(), sourceId]);
  }
  
  private logIngestionStats(stats: IngestionStats): void {
    const query = `
      INSERT INTO rss_ingestion_logs (
        source_id, articles_found, articles_inserted, 
        duplicates_skipped, processing_time_ms, error_message
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.db.run(query, [
      stats.source_id,
      stats.articles_found,
      stats.articles_inserted,
      stats.duplicates_skipped,
      stats.processing_time_ms,
      stats.error_message || null
    ]);
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
  getIngestionStats(hours: number = 24): any {
    const query = `
      SELECT 
        rs.name,
        COUNT(ra.id) as articles_found,
        COUNT(CASE WHEN ra.created_at > datetime('now', '-${hours} hours') THEN 1 END) as recent_articles
      FROM rss_sources rs
      LEFT JOIN rss_articles ra ON rs.id = ra.source_id
      WHERE rs.is_active = 1
      GROUP BY rs.id, rs.name
      ORDER BY recent_articles DESC
    `;
    
    return this.db.query(query).all();
  }
  
  getCandidateQueueStats(): any {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(relevance_score) as avg_score
      FROM candidate_articles
      GROUP BY status
      ORDER BY count DESC
    `;
    
    return this.db.query(query).all();
  }
}

// Worker execution
if (import.meta.main) {
  const worker = new RSSIntakeWorker();
  
  worker.run()
    .then(() => {
      console.log('✅ RSS intake worker completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 RSS intake worker failed:', error);
      process.exit(1);
    });
}
