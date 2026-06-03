export interface ExtractionCandidate {
  content: string;
  headline: string;
  author?: string;
  publishedDate?: string;
  siteName?: string;
  contentLength: number;
  textDensity: number;
  qualityScore: number;
  strategy: string;
  platformType?: string;
}

export interface ExtractionResult {
  candidate: ExtractionCandidate;
  rejected: boolean;
  rejectionReason?: string;
}

export class ExtractorV2 {
  async extractFromUrl(url: string): Promise<ExtractionResult> {
    console.log('EXTRACTOR V2: Starting multi-strategy extraction');
    
    try {
      // Fetch HTML
      const response = await fetch(url);
      const html = await response.text();
      
      // Detect platform type
      const platformType = this.detectPlatform(html);
      console.log(`EXTRACTOR V2: Detected platform: ${platformType}`);
      
      // Run all extraction strategies
      const candidates: ExtractionCandidate[] = [];
      
      // Strategy 1: Readability Extraction
      candidates.push(await this.strategy1_Readability(html, url, platformType));
      
      // Strategy 2: Article Selector Extraction  
      candidates.push(await this.strategy2_ArticleSelectors(html, url, platformType));
      
      // Strategy 3: Structured Data Extraction
      candidates.push(await this.strategy3_StructuredData(html, url, platformType));
      
      // Strategy 4: Open Graph Fallback
      candidates.push(await this.strategy4_OpenGraph(html, url, platformType));
      
      // Filter out invalid candidates
      const validCandidates = candidates.filter(c => c.contentLength > 0);
      console.log(`EXTRACTOR V2: Valid candidates: ${validCandidates.length}/4`);
      
      if (validCandidates.length === 0) {
        return {
          candidate: {} as ExtractionCandidate,
          rejected: true,
          rejectionReason: 'No extraction strategy succeeded'
        };
      }
      
      // Select best candidate
      const bestCandidate = this.selectBestCandidate(validCandidates);
      console.log(`EXTRACTOR V2: Winning strategy: ${bestCandidate.strategy} (Score: ${bestCandidate.qualityScore})`);
      
      // Final signal validation
      const signalValidation = this.validateSignalCapability(bestCandidate);
      if (!signalValidation.passed) {
        return {
          candidate: bestCandidate,
          rejected: true,
          rejectionReason: signalValidation.reason
        };
      }
      
      console.log(`EXTRACTOR V2: Extraction successful - Score: ${bestCandidate.qualityScore}`);
      return {
        candidate: bestCandidate,
        rejected: false
      };
      
    } catch (error) {
      console.error('EXTRACTOR V2: Critical error:', error);
      return {
        candidate: {} as ExtractionCandidate,
        rejected: true,
        rejectionReason: `Critical extraction error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  private detectPlatform(html: string): string {
    const lowerHtml = html.toLowerCase();
    
    if (lowerHtml.includes('next.js') || lowerHtml.includes('_next')) return 'Next.js';
    if (lowerHtml.includes('react') && lowerHtml.includes('react-dom')) return 'React';
    if (lowerHtml.includes('vue') || lowerHtml.includes('vuejs')) return 'Vue';
    if (lowerHtml.includes('astro')) return 'Astro';
    if (lowerHtml.includes('medium.com')) return 'Medium';
    if (lowerHtml.includes('substack.com')) return 'Substack';
    if (html.includes('ghost')) return 'Ghost';
    if (html.includes('wordpress')) return 'WordPress';
    if (html.includes('json-ld')) return 'Structured Data';
    
    return 'Unknown';
  }
  
  private async strategy1_Readability(html: string, url: string, platformType: string): Promise<ExtractionCandidate> {
    console.log('EXTRACTOR V2: Strategy 1 - Readability Extraction');
    
    try {
      // Simplified readability extraction
      const title = this.extractTitle(html);
      const author = this.extractAuthor(html);
      const publishedDate = this.extractPublishedDate(html);
      const siteName = this.extractSiteName(html, url);
      
      // Remove unwanted elements
      const cleaned = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<noscript[^>]*>.*?<\/noscript>/gi, '')
        .replace(/<svg[^>]*>.*?<\/svg>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<nav[^>]*>.*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>.*?<\/footer>/gi, '')
        .replace(/<header[^>]*>.*?<\/header>/gi, '');
      
      // Try article selectors
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
      
      let content = '';
      for (const selector of articleSelectors) {
        const regex = new RegExp(`<${selector}[^>]*>(.*?)<\/${selector}>`, 'gis');
        const matches = Array.from(cleaned.matchAll(regex));
        
        if (matches.length > 0) {
          for (const match of matches) {
            const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
            const paragraphs = Array.from(match[1].matchAll(paragraphRegex));
            
            if (paragraphs.length > 0) {
              for (const paragraph of paragraphs) {
                content += paragraph[1] + ' ';
              }
            } else {
              content += match[1] + ' ';
            }
          }
          break;
        }
      }
      
      const cleanContent = this.stripHtml(content).trim();
      
      return {
        content: cleanContent,
        headline: title,
        author,
        publishedDate,
        siteName,
        contentLength: cleanContent.length,
        textDensity: this.calculateTextDensity(cleanContent),
        qualityScore: 0, // Will be calculated later
        strategy: 'Readability',
        platformType
      };
      
    } catch {
      console.log('EXTRACTOR V2: Strategy 1 failed');
      return this.createEmptyCandidate('Readability');
    }
  }
  
  private async strategy2_ArticleSelectors(html: string, url: string, platformType: string): Promise<ExtractionCandidate> {
    console.log('EXTRACTOR V2: Strategy 2 - Article Selectors');
    
    try {
      const title = this.extractTitle(html);
      const author = this.extractAuthor(html);
      const publishedDate = this.extractPublishedDate(html);
      const siteName = this.extractSiteName(html, url);
      
      // More aggressive content extraction
      const contentSelectors = [
        'article',
        '[role="article"]',
        '.article-content',
        '.story-content',
        '.post-body',
        '.entry-content',
        '.content-body',
        'main',
        '.main-content',
        '#content',
        '.page-content'
      ];
      
      let bestContent = '';
      let maxLength = 0;
      
      for (const selector of contentSelectors) {
        const regex = new RegExp(`<${selector}[^>]*>(.*?)<\/${selector}>`, 'gis');
        const matches = Array.from(html.matchAll(regex));
        
        for (const match of matches) {
          const cleanMatch = this.stripHtml(match[1]).trim();
          if (cleanMatch.length > maxLength) {
            maxLength = cleanMatch.length;
            bestContent = cleanMatch;
          }
        }
      }
      
      return {
        content: bestContent,
        headline: title,
        author,
        publishedDate,
        siteName,
        contentLength: bestContent.length,
        textDensity: this.calculateTextDensity(bestContent),
        qualityScore: 0,
        strategy: 'Article Selectors',
        platformType
      };
      
    } catch {
      console.log('EXTRACTOR V2: Strategy 2 failed');
      return this.createEmptyCandidate('Article Selectors');
    }
  }
  
  private async strategy3_StructuredData(html: string, url: string, platformType: string): Promise<ExtractionCandidate> {
    console.log('EXTRACTOR V2: Strategy 3 - Structured Data');
    
    try {
      const title = this.extractTitle(html);
      const author = this.extractAuthor(html);
      const publishedDate = this.extractPublishedDate(html);
      const siteName = this.extractSiteName(html, url);
      
      // Extract JSON-LD structured data
      const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gi;
      const jsonLdMatches = Array.from(html.matchAll(jsonLdRegex));
      
      let bestContent = '';
      let bestHeadline = title;
      
      for (const match of jsonLdMatches) {
        try {
          const jsonData = JSON.parse(match[1]);
          
          // Handle different structured data types
          if (jsonData.articleBody) {
            bestContent = jsonData.articleBody;
          }
          if (jsonData.text) {
            bestContent = jsonData.text;
          }
          if (jsonData.headline) {
            bestHeadline = jsonData.headline;
          }
          if (jsonData.name) {
            bestHeadline = jsonData.name;
          }
        } catch {
          // Invalid JSON, continue
        }
      }
      
      return {
        content: bestContent,
        headline: bestHeadline,
        author,
        publishedDate,
        siteName,
        contentLength: bestContent.length,
        textDensity: this.calculateTextDensity(bestContent),
        qualityScore: 0,
        strategy: 'Structured Data',
        platformType
      };
      
    } catch {
      console.log('EXTRACTOR V2: Strategy 3 failed');
      return this.createEmptyCandidate('Structured Data');
    }
  }
  
  private async strategy4_OpenGraph(html: string, url: string, platformType: string): Promise<ExtractionCandidate> {
    console.log('EXTRACTOR V2: Strategy 4 - Open Graph');
    
    try {
      const title = this.extractMetaTag(html, 'og:title') || this.extractMetaTag(html, 'twitter:title');
      const description = this.extractMetaTag(html, 'og:description') || this.extractMetaTag(html, 'twitter:description');
      const author = this.extractMetaTag(html, 'article:author') || this.extractMetaTag(html, 'twitter:creator');
      const siteName = this.extractMetaTag(html, 'og:site_name') || this.extractSiteName(html, url);
      
      const content = description || '';
      
      return {
        content: content,
        headline: title || 'Untitled',
        author,
        publishedDate: undefined,
        siteName,
        contentLength: content.length,
        textDensity: this.calculateTextDensity(content),
        qualityScore: 0,
        strategy: 'Open Graph',
        platformType
      };
      
    } catch {
      console.log('EXTRACTOR V2: Strategy 4 failed');
      return this.createEmptyCandidate('Open Graph');
    }
  }
  
  private selectBestCandidate(candidates: ExtractionCandidate[]): ExtractionCandidate {
    // Calculate quality scores for all candidates
    const scoredCandidates = candidates.map(candidate => ({
      ...candidate,
      qualityScore: this.calculateQualityScore(candidate)
    }));
    
    // Sort by quality score
    scoredCandidates.sort((a, b) => b.qualityScore - a.qualityScore);
    
    return scoredCandidates[0];
  }
  
  private calculateQualityScore(candidate: ExtractionCandidate): number {
    let score = 0;
    
    // Headline Present (+15)
    if (candidate.headline && candidate.headline.length > 5) {
      score += 15;
    }
    
    // Content Length
    if (candidate.contentLength > 500) score += 15;
    if (candidate.contentLength > 1000) score += 20;
    
    // Text Density (+15)
    if (candidate.textDensity > 0.7) score += 15;
    
    // Paragraph Count (+10)
    const paragraphCount = (candidate.content.match(/\./g) || []).length;
    if (paragraphCount > 5) score += 10;
    
    // Low Script Density (+10)
    const scriptDensity = (candidate.content.toLowerCase().match(/function|var|const|let|document\./g) || []).length / candidate.content.length;
    if (scriptDensity < 0.05) score += 10;
    
    // Low Navigation Density (+10)
    const navDensity = (candidate.content.toLowerCase().match(/menu|nav|header|footer/g) || []).length / candidate.content.length;
    if (navDensity < 0.02) score += 10;
    
    // Low Boilerplate (+5)
    const boilerplateDensity = (candidate.content.toLowerCase().match(/subscribe|follow|share|cookie/g) || []).length / candidate.content.length;
    if (boilerplateDensity < 0.03) score += 5;
    
    return Math.min(100, score);
  }
  
  private validateSignalCapability(candidate: ExtractionCandidate): { passed: boolean; reason?: string } {
    // Check for minimum signal requirements
    if (!candidate.headline || candidate.headline.length < 5) {
      return { passed: false, reason: 'No suitable headline for signal extraction' };
    }
    
    // More lenient content requirements for testing
    if (candidate.contentLength < 100) {
      return { passed: false, reason: 'Insufficient content for signal analysis' };
    }
    
    // Check for meaningful content (not just boilerplate)
    const meaningfulWords = candidate.content.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    if (meaningfulWords.length < 15) {
      return { passed: false, reason: 'Insufficient meaningful content for signal extraction' };
    }
    
    return { passed: true };
  }
  
  private createEmptyCandidate(strategy: string): ExtractionCandidate {
    return {
      content: '',
      headline: '',
      contentLength: 0,
      textDensity: 0,
      qualityScore: 0,
      strategy,
      platformType: 'Unknown'
    };
  }
  
  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].trim();
    }
    
    return 'Untitled Article';
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
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Unknown Source';
    }
  }
  
  private extractMetaTag(html: string, tagName: string): string | undefined {
    const regex = new RegExp(`<meta[^>]*property=["']${tagName}["'][^>]*content=["']([^"']+)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : undefined;
  }
  
  private stripHtml(html: string): string {
    let text = html.replace(/<[^>]*>/g, ' ');
    
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
  
  private calculateTextDensity(text: string): number {
    if (text.length === 0) return 0;
    
    const textCharacters = text.replace(/[^\w\s.,!?;:]/g, '').length;
    return textCharacters / text.length;
  }
}
