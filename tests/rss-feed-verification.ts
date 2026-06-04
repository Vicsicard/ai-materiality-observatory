/**
 * RSS Feed Verification Script
 * 
 * Tests all active RSS feeds for:
 * - URL reachability
 * - Valid RSS/Atom format
 * - Recent content
 * - Item count
 */

interface FeedVerificationResult {
  source: string;
  feedUrl: string;
  httpStatus: number;
  validRss: boolean;
  lastArticleDate: string | null;
  itemCount: number;
  error?: string;
  responseTime: number;
}

export class RSSFeedVerifier {
  async verifyAllFeeds(): Promise<FeedVerificationResult[]> {
    console.log('🔍 Starting RSS Feed Verification...');
    
    // AMO Core 10 feeds
    const coreFeeds = [
      { name: 'AI Feed', url: 'https://artificialintelligence-news.com/feed/' },
      { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
      { name: 'Anthropic Blog', url: 'https://www.anthropic.com/news/rss' },
      { name: 'Microsoft AI', url: 'https://blogs.microsoft.com/ai/feed/' },
      { name: 'AWS AI Blog', url: 'https://aws.amazon.com/blogs/ai/feed/' },
      { name: 'NVIDIA Blog', url: 'https://blogs.nvidia.com/feed/' },
      { name: 'SEC AI News', url: 'https://www.sec.gov/news/pressreleases/rss.xml' },
      { name: 'NIST AI', url: 'https://www.nist.gov/news-events/news/rss.xml' },
      { name: 'EU AI Act Updates', url: 'https://ec.europa.eu/info/news/rss_en' },
      { name: 'MIT Technology Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/' }
    ];

    const results: FeedVerificationResult[] = [];

    for (const feed of coreFeeds) {
      console.log(`Testing: ${feed.name}`);
      const result = await this.verifyFeed(feed.name, feed.url);
      results.push(result);
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  private async verifyFeed(sourceName: string, feedUrl: string): Promise<FeedVerificationResult> {
    const startTime = Date.now();
    
    try {
      // Make HTTP request
      const response = await fetch(feedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'AMO-RSS-Verifier/1.0',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      const httpStatus = response.status;

      if (!response.ok) {
        return {
          source: sourceName,
          feedUrl,
          httpStatus,
          validRss: false,
          lastArticleDate: null,
          itemCount: 0,
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }

      // Get content
      const content = await response.text();
      
      // Parse RSS/Atom
      const parseResult = this.parseRSSContent(content);
      
      return {
        source: sourceName,
        feedUrl,
        httpStatus,
        validRss: parseResult.isValid,
        lastArticleDate: parseResult.lastArticleDate,
        itemCount: parseResult.itemCount,
        error: parseResult.error,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        source: sourceName,
        feedUrl,
        httpStatus: 0,
        validRss: false,
        lastArticleDate: null,
        itemCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };
    }
  }

  private parseRSSContent(content: string): {
    isValid: boolean;
    lastArticleDate: string | null;
    itemCount: number;
    error?: string;
  } {
    try {
      // Simple RSS/Atom parsing
      const isRSS = content.includes('<rss') || content.includes('<rss:');
      const isAtom = content.includes('<feed') || content.includes('<feed:');
      
      if (!isRSS && !isAtom) {
        return {
          isValid: false,
          lastArticleDate: null,
          itemCount: 0,
          error: 'Not valid RSS or Atom format'
        };
      }

      // Extract items/entries
      let itemCount = 0;
      let lastArticleDate: string | null = null;

      if (isRSS) {
        const itemMatches = content.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
        itemCount = itemMatches.length;
        
        // Find most recent date
        for (const item of itemMatches) {
          const pubDate = this.extractDate(item, ['pubDate', 'dc:date']);
          if (pubDate && (!lastArticleDate || new Date(pubDate) > new Date(lastArticleDate))) {
            lastArticleDate = pubDate;
          }
        }
      } else if (isAtom) {
        const entryMatches = content.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
        itemCount = entryMatches.length;
        
        // Find most recent date
        for (const entry of entryMatches) {
          const published = this.extractDate(entry, ['published', 'updated']);
          if (published && (!lastArticleDate || new Date(published) > new Date(lastArticleDate))) {
            lastArticleDate = published;
          }
        }
      }

      return {
        isValid: true,
        lastArticleDate,
        itemCount
      };

    } catch (error) {
      return {
        isValid: false,
        lastArticleDate: null,
        itemCount: 0,
        error: error instanceof Error ? error.message : 'Parse error'
      };
    }
  }

  private extractDate(content: string, tagNames: string[]): string | null {
    for (const tagName of tagNames) {
      const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
      const match = content.match(regex);
      if (match) {
        const dateStr = match[1].trim();
        // Clean up date string
        const cleanDate = dateStr.replace(/<[^>]*>/g, '').trim();
        return cleanDate;
      }
    }
    return null;
  }

  generateReport(results: FeedVerificationResult[]): string {
    const workingFeeds = results.filter(r => r.validRss).length;
    const totalFeeds = results.length;
    const successRate = (workingFeeds / totalFeeds * 100).toFixed(1);

    let report = `# RSS Feed Verification Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Total Feeds:** ${totalFeeds}\n`;
    report += `**Working Feeds:** ${workingFeeds}\n`;
    report += `**Success Rate:** ${successRate}%\n\n`;

    report += `## Feed Verification Results\n\n`;
    report += `| Source | Feed URL | HTTP Status | Valid RSS | Last Article Date | Item Count | Response Time |\n`;
    report += `| ------ | -------- | ----------- | --------- | ----------------- | ---------- | -------------- |\n`;

    for (const result of results) {
      const status = result.httpStatus === 0 ? 'TIMEOUT' : result.httpStatus.toString();
      const valid = result.validRss ? '✅' : '❌';
      const lastDate = result.lastArticleDate ? new Date(result.lastArticleDate).toLocaleDateString() : 'N/A';
      const responseTime = `${result.responseTime}ms`;

      report += `| ${result.source} | ${result.feedUrl} | ${status} | ${valid} | ${lastDate} | ${result.itemCount} | ${responseTime} |\n`;
    }

    // Add failed feeds section
    const failedFeeds = results.filter(r => !r.validRss);
    if (failedFeeds.length > 0) {
      report += `\n## Failed Feeds\n\n`;
      for (const feed of failedFeeds) {
        report += `### ${feed.source}\n`;
        report += `- **URL:** ${feed.feedUrl}\n`;
        report += `- **HTTP Status:** ${feed.httpStatus === 0 ? 'TIMEOUT' : feed.httpStatus}\n`;
        report += `- **Error:** ${feed.error || 'Unknown error'}\n\n`;
      }
    }

    // Add recommendations
    report += `## Recommendations\n\n`;
    
    if (workingFeeds === totalFeeds) {
      report += `✅ **All feeds are working correctly**\n\n`;
    } else if (workingFeeds >= totalFeeds * 0.8) {
      report += `⚠️ **Most feeds are working** - investigate failed feeds\n\n`;
    } else {
      report += `❌ **Significant feed issues** - review feed URLs and alternatives\n\n`;
    }

    const oldFeeds = results.filter(r => r.validRss && r.lastArticleDate && 
      (Date.now() - new Date(r.lastArticleDate).getTime()) > 7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (oldFeeds.length > 0) {
      report += `### Feeds with Old Content\n`;
      for (const feed of oldFeeds) {
        const daysOld = Math.floor((Date.now() - new Date(feed.lastArticleDate!).getTime()) / (24 * 60 * 60 * 1000));
        report += `- **${feed.source}:** ${daysOld} days old (${feed.lastArticleDate})\n`;
      }
      report += `\n`;
    }

    return report;
  }
}

// Run verification if executed directly
if (import.meta.main) {
  const verifier = new RSSFeedVerifier();
  
  verifier.verifyAllFeeds()
    .then(results => {
      const report = verifier.generateReport(results);
      console.log(report);
      
      // Save report to file
      const fs = require('fs');
      fs.writeFileSync('rss-feed-verification-report.md', report);
      console.log('\n📄 Report saved to: rss-feed-verification-report.md');
    })
    .catch(error => {
      console.error('💥 Feed verification failed:', error);
      process.exit(1);
    });
}
