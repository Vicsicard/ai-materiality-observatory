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
    // Remove unwanted elements first
    let cleaned = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>.*?<\/noscript>/gi, '')
      .replace(/<svg[^>]*>.*?<\/svg>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<nav[^>]*>.*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>.*?<\/footer>/gi, '')
      .replace(/<header[^>]*>.*?<\/header>/gi, '');

    // Try article-specific selectors in order of preference
    const articleSelectors = [
      'article',
      'main article',
      '[data-testid*="article"]',
      '[class*="article"]',
      '[class*="story"]',
      '[class*="content"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content'
    ];
    
    for (const selector of articleSelectors) {
      const regex = new RegExp(`<${selector}[^>]*>(.*?)<\/${selector}>`, 'gis');
      const matches = Array.from(cleaned.matchAll(regex));
      
      if (matches.length > 0) {
        // Extract paragraph text from the matched content
        let extractedText = '';
        for (const match of matches) {
          const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
          const paragraphs = Array.from(match[1].matchAll(paragraphRegex));
          
          if (paragraphs.length > 0) {
            for (const paragraph of paragraphs) {
              extractedText += paragraph[1] + ' ';
            }
          } else {
            // If no paragraphs, extract all text from the matched content
            extractedText += match[1] + ' ';
          }
        }
        
        const cleanText = this.stripHtml(extractedText).trim();
        if (this.isCleanContent(cleanText)) {
          return cleanText;
        }
      }
    }
    
    // If no clean extraction found, fail gracefully
    throw new Error('Article extraction failed: clean article text could not be extracted');
  }
  
  private isCleanContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Reject if content contains JavaScript/HTML indicators
    const prohibitedPatterns = [
      'window.',
      'function ',
      'var ',
      'const ',
      'document.',
      '<script',
      'OptanonWrapper',
      'googletag',
      'dataLayer',
      'console.',
      'return ',
      'if (',
      'for (',
      'while (',
      '{',
      '}'
    ];
    
    for (const pattern of prohibitedPatterns) {
      if (lowerContent.includes(pattern)) {
        return false;
      }
    }
    
    // Must have reasonable length
    if (content.length < 800) {
      return false;
    }
    
    // Must have reasonable text-to-code ratio (mostly text)
    const textCharacters = content.replace(/[^\w\s.,!?;:]/g, '').length;
    const totalCharacters = content.length;
    const textRatio = textCharacters / totalCharacters;
    
    if (textRatio < 0.7) {
      return false;
    }
    
    return true;
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
