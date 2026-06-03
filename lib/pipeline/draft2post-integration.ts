import { Draft2PostPipeline } from './draft2post-agents';
import { EnhancedDatabaseService, Draft2PostInput, EnhancedArticle } from '../db/enhanced-database';
import { DatabaseService } from '../db/database';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export class Draft2PostIntegration {
  private pipeline = new Draft2PostPipeline();
  
  async triggerDraft2PostProcessing(articleId: number, env: Env): Promise<void> {
    console.log(`DRAFT2POST TRIGGER: Processing article ${articleId}`);
    
    try {
      // Initialize database services
      const db = new DatabaseService(env.DB);
      const enhancedDb = new EnhancedDatabaseService(env.DB);
      
      // Get article and event data
      const draftArticle = await db.getArticleById(articleId);
      if (!draftArticle) {
        throw new Error(`Article ${articleId} not found`);
      }
      
      // Only process draft articles
      if (draftArticle.status !== 'draft') {
        console.log(`DRAFT2POST: Article ${articleId} status is ${draftArticle.status}, skipping`);
        return;
      }
      
      const event = await db.getEventById(draftArticle.event_id);
      if (!event) {
        throw new Error(`Event ${draftArticle.event_id} not found`);
      }
      
      // Update status to processing
      await enhancedDb.updateArticleStatus(articleId, 'processing');
      console.log(`DRAFT2POST: Article ${articleId} status updated to processing`);
      
      // Prepare input for pipeline
      const input: Draft2PostInput = {
        articleId,
        event,
        draftArticle
      };
      
      // Run Draft2Post pipeline
      const enhancements = await this.pipeline.process(input);
      
      // Update article with enhancements
      await enhancedDb.updateArticleWithEnhancements(articleId, enhancements);
      
      // Update final status based on editorial validation
      const finalStatus = enhancements.editorial_status === 'ready_for_review' 
        ? 'ready_for_review' 
        : 'needs_revision';
      
      await enhancedDb.updateArticleStatus(articleId, finalStatus);
      
      console.log(`DRAFT2POST: Article ${articleId} processing completed with status: ${finalStatus}`);
      
    } catch (error) {
      console.error(`DRAFT2POST: Error processing article ${articleId}:`, error);
      
      // Try to update status to indicate failure
      try {
        const enhancedDb = new EnhancedDatabaseService(env.DB);
        await enhancedDb.updateArticleWithEnhancements(articleId, {
          editorial_status: 'needs_revision',
          editorial_notes: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        await enhancedDb.updateArticleStatus(articleId, 'needs_revision');
      } catch (updateError) {
        console.error(`DRAFT2POST: Failed to update error status for article ${articleId}:`, updateError);
      }
      
      throw error;
    }
  }
  
  async publishArticle(articleId: number, env: Env): Promise<void> {
    console.log(`DRAFT2POST: Publishing article ${articleId}`);
    
    const enhancedDb = new EnhancedDatabaseService(env.DB);
    
    // Get article to ensure it's ready for review
    const article = await enhancedDb.getEnhancedArticleById(articleId);
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }
    
    if (article.status !== 'ready_for_review') {
      throw new Error(`Article ${articleId} status is ${article.status}, cannot publish`);
    }
    
    // Publish the article
    await enhancedDb.publishArticle(articleId);
    
    console.log(`DRAFT2POST: Article ${articleId} published successfully`);
  }
  
  async archiveArticle(articleId: number, env: Env): Promise<void> {
    console.log(`DRAFT2POST: Archiving article ${articleId}`);
    
    const enhancedDb = new EnhancedDatabaseService(env.DB);
    await enhancedDb.archiveArticle(articleId);
    
    console.log(`DRAFT2POST: Article ${articleId} archived successfully`);
  }
  
  async getArticlesByStatus(status: string, env: Env): Promise<EnhancedArticle[]> {
    const enhancedDb = new EnhancedDatabaseService(env.DB);
    return await enhancedDb.getArticlesByStatus(status);
  }
  
  async getArticlesReadyForReview(env: Env): Promise<EnhancedArticle[]> {
    const enhancedDb = new EnhancedDatabaseService(env.DB);
    return await enhancedDb.getArticlesReadyForReview();
  }
}
