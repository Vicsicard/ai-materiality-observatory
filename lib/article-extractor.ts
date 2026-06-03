export interface ExtractedArticle {
  title: string;
  content: string;
  author?: string;
  publishedDate?: string;
  siteName?: string;
}

export class ArticleExtractor {
  async extractFromUrl(url: string): Promise<ExtractedArticle> {
    try {
      // For now, implement a simple fetch-based extraction
      // In production, would use Fundus or similar library
      const response = await fetch(url);
      const html = await response.text();
      
      // Simple HTML parsing to extract content
      const title = this.extractTitle(html);
      const content = this.extractContent(html);
      const author = this.extractAuthor(html);
      const publishedDate = this.extractPublishedDate(html);
      const siteName = this.extractSiteName(html, url);
      
      return {
        title,
        content,
        author,
        publishedDate,
        siteName
      };
    } catch (error) {
      throw new Error(`Failed to extract article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // Try h1 tags
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].trim();
    }
    
    return 'Untitled Article';
  }
  
  private extractContent(html: string): string {
    // Remove script and style tags
    let cleaned = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>.*?<\/style>/gi, '');
    
    // Extract text from common content tags
    const contentTags = ['article', 'main', '.content', '.post-content', '.entry-content'];
    
    for (const tag of contentTags) {
      const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gi');
      const match = cleaned.match(regex);
      if (match) {
        return this.stripHtml(match[1]).trim();
      }
    }
    
    // Fallback to body content
    const bodyMatch = cleaned.match(/<body[^>]*>(.*?)<\/body>/i);
    if (bodyMatch) {
      return this.stripHtml(bodyMatch[1]).trim();
    }
    
    return this.stripHtml(cleaned).trim();
  }
  
  private extractAuthor(html: string): string | undefined {
    const authorPatterns = [
      /author[^>]*content[^>]*["']([^"']+)["']/i,
      /by[^>]*:?\s*([^\n<]+)/i,
      /<[^>]*author[^>]*>([^<]+)<\/[^>]*>/i
    ];
    
    for (const pattern of authorPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  private extractPublishedDate(html: string): string | undefined {
    const datePatterns = [
      /published[^>]*content[^>]*["']([^"']+)["']/i,
      /date[^>]*content[^>]*["']([^"']+)["']/i,
      /datetime[^>]*["']([^"']+)["']/i
    ];
    
    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  private extractSiteName(html: string, url: string): string {
    // Try to extract site name from meta tags
    const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (siteNameMatch) {
      return siteNameMatch[1].trim();
    }
    
    // Fallback to domain
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Unknown Source';
    }
  }
  
  private stripHtml(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
}
