import { D1Database } from '@cloudflare/workers-types';

export interface Event {
  id: number;
  source_name: string;
  source_url: string;
  headline: string;
  published_date?: string;
  article_text?: string;
  created_at: string;
}

export interface Signal {
  id: number;
  event_id: number;
  signal_type: string;
  signal_reason?: string;
  created_at: string;
}

export interface Article {
  id: number;
  event_id: number;
  title: string;
  slug: string;
  content: string;
  status: string;
  created_at: string;
}

export interface Observation {
  id: number;
  title: string;
  slug: string;
  signal_type: string;
  created_at: string;
}

export interface IDatabaseService {
  createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event>;
  getEventById(id: number): Promise<Event | null>;
  getEventByUrl(url: string): Promise<Event | null>;
  createSignal(signal: Omit<Signal, 'id' | 'created_at'>): Promise<Signal>;
  getSignalById(id: number): Promise<Signal | null>;
  createArticle(article: Omit<Article, 'id' | 'created_at'>): Promise<Article>;
  getArticleById(id: number): Promise<Article | null>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  getObservations(limit?: number): Promise<Observation[]>;
  getObservationWithContent(slug: string): Promise<(Article & { signal_type: string }) | null>;
}

export class DatabaseService implements IDatabaseService {
  constructor(private db: D1Database) {}

  // Event operations
  async createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    const stmt = this.db.prepare(`
      INSERT INTO events (source_name, source_url, headline, published_date, article_text)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      event.source_name,
      event.source_url,
      event.headline,
      event.published_date || null,
      event.article_text || null
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create event');
    }
    
    const createdEvent = await this.getEventById(result.meta.last_row_id!);
    if (!createdEvent) {
      throw new Error('Failed to retrieve created event');
    }
    
    return createdEvent;
  }

  async getEventById(id: number): Promise<Event | null> {
    const stmt = this.db.prepare(`
      SELECT id, source_name, source_url, headline, published_date, article_text, created_at
      FROM events WHERE id = ?
    `);
    
    const result = await stmt.bind(id).first<Event>();
    return result || null;
  }

  async getEventByUrl(url: string): Promise<Event | null> {
    const stmt = this.db.prepare(`
      SELECT id, source_name, source_url, headline, published_date, article_text, created_at
      FROM events WHERE source_url = ?
    `);
    
    const result = await stmt.bind(url).first<Event>();
    return result || null;
  }

  // Signal operations
  async createSignal(signal: Omit<Signal, 'id' | 'created_at'>): Promise<Signal> {
    const stmt = this.db.prepare(`
      INSERT INTO signals (event_id, signal_type, signal_reason)
      VALUES (?, ?, ?)
    `);
    
    const result = await stmt.bind(
      signal.event_id,
      signal.signal_type,
      signal.signal_reason || null
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create signal');
    }
    
    const createdSignal = await this.getSignalById(result.meta.last_row_id!);
    if (!createdSignal) {
      throw new Error('Failed to retrieve created signal');
    }
    
    return createdSignal;
  }

  async getSignalById(id: number): Promise<Signal | null> {
    const stmt = this.db.prepare(`
      SELECT id, event_id, signal_type, signal_reason, created_at
      FROM signals WHERE id = ?
    `);
    
    const result = await stmt.bind(id).first<Signal>();
    return result || null;
  }

  // Article operations
  async createArticle(article: Omit<Article, 'id' | 'created_at'>): Promise<Article> {
    const stmt = this.db.prepare(`
      INSERT INTO articles (event_id, title, slug, content, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      article.event_id,
      article.title,
      article.slug,
      article.content,
      article.status
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create article');
    }
    
    const createdArticle = await this.getArticleById(result.meta.last_row_id!);
    if (!createdArticle) {
      throw new Error('Failed to retrieve created article');
    }
    
    return createdArticle;
  }

  async getArticleById(id: number): Promise<Article | null> {
    const stmt = this.db.prepare(`
      SELECT id, event_id, title, slug, content, status, created_at
      FROM articles WHERE id = ?
    `);
    
    const result = await stmt.bind(id).first<Article>();
    return result || null;
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const stmt = this.db.prepare(`
      SELECT id, event_id, title, slug, content, status, created_at
      FROM articles WHERE slug = ?
    `);
    
    const result = await stmt.bind(slug).first<Article>();
    return result || null;
  }

  // Observation operations (for homepage)
  async getObservations(limit: number = 10): Promise<Observation[]> {
    const stmt = this.db.prepare(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.created_at,
        s.signal_type
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      WHERE a.status = 'published'
      ORDER BY a.created_at DESC
      LIMIT ?
    `);
    
    const results = await stmt.bind(limit).all<Observation>();
    return results.results;
  }

  // Full observation with article content
  async getObservationWithContent(slug: string): Promise<(Article & { signal_type: string }) | null> {
    const stmt = this.db.prepare(`
      SELECT 
        a.id,
        a.event_id,
        a.title,
        a.slug,
        a.content,
        a.status,
        a.created_at,
        s.signal_type
      FROM articles a
      JOIN signals s ON a.event_id = s.event_id
      WHERE a.slug = ? AND a.status = 'published'
    `);
    
    const result = await stmt.bind(slug).first<Article & { signal_type: string }>();
    return result || null;
  }
}
