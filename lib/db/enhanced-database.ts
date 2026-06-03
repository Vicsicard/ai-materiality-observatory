import { D1Database } from '@cloudflare/workers-types';
import { DatabaseService, Article, Event } from './database';

// Enhanced interfaces for Phase 2
export interface EnhancedArticle extends Article {
  // Source preservation fields
  source_title?: string;
  source_publication?: string;
  source_summary?: string;
  source_keywords?: string;
  
  // Signal classification fields
  signal_category?: string;
  classification_reason?: string;
  classification_confidence?: number;
  
  // Observatory presentation fields
  observatory_title?: string;
  observatory_slug?: string;
  meta_title?: string;
  meta_description?: string;
  
  // Materiality interpretation fields
  what_this_may_indicate?: string;
  potential_organizational_relevance?: string;
  related_assessment_areas?: string;
  
  // Editorial workflow fields
  editorial_status?: string;
  editorial_notes?: string;
  published_at?: string;
}

export interface Draft2PostInput {
  articleId: number;
  event: Event;
  draftArticle: Article;
}

export interface SourcePreservationOutput {
  source_title: string;
  source_publication: string;
  source_summary: string;
  source_keywords: string;
}

export interface SignalClassificationOutput {
  signal_category: string;
  classification_reason: string;
  classification_confidence: number;
}

export interface ObservatoryTitleOutput {
  observatory_title: string;
  observatory_slug: string;
  meta_title: string;
  meta_description: string;
}

export interface MaterialityInterpretationOutput {
  what_this_may_indicate: string;
  potential_organizational_relevance: string;
  related_assessment_areas: string;
}

export interface EditorialValidationOutput {
  editorial_status: string;
  editorial_notes: string;
}

export interface IEnhancedDatabaseService {
  // Enhanced article operations
  updateArticleWithEnhancements(articleId: number, enhancements: Partial<EnhancedArticle>): Promise<void>;
  getEnhancedArticleById(articleId: number): Promise<EnhancedArticle | null>;
  getEnhancedArticleBySlug(slug: string): Promise<EnhancedArticle | null>;
  getArticlesByStatus(status: string): Promise<EnhancedArticle[]>;
  getArticlesReadyForReview(): Promise<EnhancedArticle[]>;
  updateArticleStatus(articleId: number, status: string): Promise<void>;
  publishArticle(articleId: number): Promise<void>;
  archiveArticle(articleId: number): Promise<void>;
  
  // Observation operations with enhanced data
  getEnhancedObservations(limit?: number): Promise<EnhancedArticle[]>;
  getEnhancedObservationWithContent(slug: string): Promise<EnhancedArticle | null>;
}

export class EnhancedDatabaseService extends DatabaseService implements IEnhancedDatabaseService {
  constructor(db: D1Database) {
    super(db);
  }

  // Access to the protected db property from parent class
  private getDb(): D1Database {
    return (this as unknown as { db: D1Database }).db;
  }

  async updateArticleWithEnhancements(articleId: number, enhancements: Partial<EnhancedArticle>): Promise<void> {
    // Build dynamic update query based on provided fields
    const fields = Object.keys(enhancements).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => enhancements[field as keyof EnhancedArticle]);

    const stmt = this.getDb().prepare(`
      UPDATE articles 
      SET ${setClause}
      WHERE id = ?
    `);

    const result = await stmt.bind(...values, articleId).run();

    if (!result.success) {
      throw new Error('Failed to update article with enhancements');
    }
  }

  async getEnhancedArticleById(articleId: number): Promise<EnhancedArticle | null> {
    const stmt = this.getDb().prepare(`
      SELECT 
        a.id,
        a.event_id,
        a.title,
        a.slug,
        a.content,
        a.status,
        a.created_at,
        a.source_title,
        a.source_publication,
        a.source_summary,
        a.source_keywords,
        a.signal_category,
        a.classification_reason,
        a.classification_confidence,
        a.observatory_title,
        a.observatory_slug,
        a.meta_title,
        a.meta_description,
        a.what_this_may_indicate,
        a.potential_organizational_relevance,
        a.related_assessment_areas,
        a.editorial_status,
        a.editorial_notes,
        a.published_at,
        s.signal_type
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      WHERE a.id = ?
    `);
    
    const result = await stmt.bind(articleId).first<EnhancedArticle>();
    return result || null;
  }

  async getEnhancedArticleBySlug(slug: string): Promise<EnhancedArticle | null> {
    const stmt = this.getDb().prepare(`
      SELECT 
        a.id,
        a.event_id,
        a.title,
        a.slug,
        a.content,
        a.status,
        a.created_at,
        a.source_title,
        a.source_publication,
        a.source_summary,
        a.source_keywords,
        a.signal_category,
        a.classification_reason,
        a.classification_confidence,
        a.observatory_title,
        a.observatory_slug,
        a.meta_title,
        a.meta_description,
        a.what_this_may_indicate,
        a.potential_organizational_relevance,
        a.related_assessment_areas,
        a.editorial_status,
        a.editorial_notes,
        a.published_at,
        s.signal_type
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      WHERE a.slug = ?
    `);
    
    const result = await stmt.bind(slug).first<EnhancedArticle>();
    return result || null;
  }

  async getArticlesByStatus(status: string): Promise<EnhancedArticle[]> {
    const stmt = this.getDb().prepare(`
      SELECT 
        a.id,
        a.event_id,
        a.title,
        a.slug,
        a.content,
        a.status,
        a.created_at,
        a.source_title,
        a.source_publication,
        a.source_summary,
        a.source_keywords,
        a.signal_category,
        a.classification_reason,
        a.classification_confidence,
        a.observatory_title,
        a.observatory_slug,
        a.meta_title,
        a.meta_description,
        a.what_this_may_indicate,
        a.potential_organizational_relevance,
        a.related_assessment_areas,
        a.editorial_status,
        a.editorial_notes,
        a.published_at,
        s.signal_type,
        e.source_url
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      JOIN events e ON a.event_id = e.id
      WHERE a.status = ?
      ORDER BY a.created_at DESC
    `);
    
    const results = await stmt.bind(status).all<EnhancedArticle>();
    return results.results;
  }

  async getArticlesReadyForReview(): Promise<EnhancedArticle[]> {
    const stmt = this.getDb().prepare(`
      SELECT 
        a.id,
        a.event_id,
        a.title,
        a.slug,
        a.content,
        a.status,
        a.created_at,
        a.source_title,
        a.source_publication,
        a.source_summary,
        a.source_keywords,
        a.signal_category,
        a.classification_reason,
        a.classification_confidence,
        a.observatory_title,
        a.observatory_slug,
        a.meta_title,
        a.meta_description,
        a.what_this_may_indicate,
        a.potential_organizational_relevance,
        a.related_assessment_areas,
        a.editorial_status,
        a.editorial_notes,
        a.published_at,
        s.signal_type,
        e.source_url
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      JOIN events e ON a.event_id = e.id
      WHERE a.status = 'ready_for_review'
      ORDER BY a.created_at DESC
    `);
    
    const results = await stmt.all<EnhancedArticle>();
    return results.results;
  }

  async updateArticleStatus(articleId: number, status: string): Promise<void> {
    const updates: Record<string, string | Date> = { status };
    
    // Add published_at timestamp if publishing
    if (status === 'published') {
      updates.published_at = new Date().toISOString();
    }

    await this.updateArticleWithEnhancements(articleId, updates);
  }

  async publishArticle(articleId: number): Promise<void> {
    await this.updateArticleStatus(articleId, 'published');
  }

  async archiveArticle(articleId: number): Promise<void> {
    await this.updateArticleStatus(articleId, 'archived');
  }

  async getEnhancedObservations(limit: number = 10): Promise<EnhancedArticle[]> {
    const stmt = this.getDb().prepare(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.created_at,
        a.published_at,
        a.observatory_title,
        a.observatory_slug,
        a.what_this_may_indicate,
        a.potential_organizational_relevance,
        a.signal_category,
        s.signal_type
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT ?
    `);
    
    const results = await stmt.bind(limit).all<EnhancedArticle>();
    return results.results;
  }

  async getEnhancedObservationWithContent(slug: string): Promise<EnhancedArticle | null> {
    const stmt = this.getDb().prepare(`
      SELECT 
        a.id,
        a.event_id,
        a.title,
        a.slug,
        a.content,
        a.status,
        a.created_at,
        a.published_at,
        a.source_title,
        a.source_publication,
        a.source_summary,
        a.source_keywords,
        a.signal_category,
        a.classification_reason,
        a.classification_confidence,
        a.observatory_title,
        a.observatory_slug,
        a.meta_title,
        a.meta_description,
        a.what_this_may_indicate,
        a.potential_organizational_relevance,
        a.related_assessment_areas,
        a.editorial_status,
        a.editorial_notes,
        s.signal_type
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      WHERE a.slug = ? AND a.status = 'published'
    `);
    
    const result = await stmt.bind(slug).first<EnhancedArticle>();
    return result || null;
  }
}
