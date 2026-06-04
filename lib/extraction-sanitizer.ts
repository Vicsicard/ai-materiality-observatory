/**
 * Extraction Sanitization Layer
 * Removes pollution from extracted content before pipeline processing
 */

export class ExtractionSanitizer {
  static sanitize(content: string): string {
    if (!content) return content;

    let sanitized = content;

    // Remove JSON-LD structured data blocks
    sanitized = sanitized.replace(/<script[^>]*type=["']application\/ld\json["'][^>]*>.*?<\/script>/gi, '');
    
    // Remove JSON-LD content that may have been extracted as text
    sanitized = sanitized.replace(/\{[^}]*"@context"[^}]*"https:\/\/schema\.org"[^}]*\}/gi, '');
    sanitized = sanitized.replace(/\{[^}]*"@graph"[^}]*\}/gi, '');
    sanitized = sanitized.replace(/"@context"[^}]*"schema\.org"[^}]*}/gi, '');
    sanitized = sanitized.replace(/"@graph"[^}]*}/gi, '');

    // Remove OpenGraph artifacts
    sanitized = sanitized.replace(/og:title|og:description|og:image|og:url|og:type|og:site_name/gi, '');
    sanitized = sanitized.replace(/property=["']og:[^"']*["']/gi, '');
    sanitized = sanitized.replace(/content=["'][^"']*og:[^"']*["']/gi, '');

    // Remove common metadata patterns
    sanitized = sanitized.replace(/<meta[^>]*name=["'](?:description|keywords|author|robots)[^>]*>/gi, '');
    sanitized = sanitized.replace(/<meta[^>]*property=["'](?:og:|twitter:|article:)[^>]*>/gi, '');

    // Remove navigation and UI fragments
    sanitized = sanitized.replace(/<nav[^>]*>.*?<\/nav>/gi, '');
    sanitized = sanitized.replace(/<header[^>]*>.*?<\/header>/gi, '');
    sanitized = sanitized.replace(/<footer[^>]*>.*?<\/footer>/gi, '');
    sanitized = sanitized.replace(/<aside[^>]*>.*?<\/aside>/gi, '');

    // Remove common navigation text patterns
    const navigationPatterns = [
      /related posts?/gi,
      /breadcrumb/gi,
      /navigation/gi,
      /menu/gi,
      /subscribe/gi,
      /newsletter/gi,
      /sign up/gi,
      /log in/gi,
      /search/gi,
      /contact/gi,
      /privacy policy/gi,
      /terms of service/gi,
      /cookie policy/gi
    ];

    navigationPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Remove script and style remnants
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/function\s+\w+\s*\(/gi, '');

    // Remove cookie policy and GDPR content
    sanitized = sanitized.replace(/cookie\s*(banner|policy|notice|consent)/gi, '');
    sanitized = sanitized.replace(/gdpr|ccpa|privacy\s*(policy|notice)/gi, '');
    sanitized = sanitized.replace(/accept\s*cookies/gi, '');
    sanitized = sanitized.replace(/cookie\s*settings/gi, '');

    // Remove analytics and tracking references
    sanitized = sanitized.replace(/google\s*analytics/gi, '');
    sanitized = sanitized.replace(/cloudflare\s*beacon/gi, '');
    sanitized = sanitized.replace(/tracking\s*pixel/gi, '');
    sanitized = sanitized.replace(/vidyard/gi, '');

    // Clean up whitespace and line breaks
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.replace(/\n\s*\n/g, '\n');
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Check if content is likely polluted
   */
  static isPolluted(content: string): boolean {
    const pollutionIndicators = [
      /<script/i,
      /javascript:/i,
      /function\s+\w+\s*\(/i,
      /@context/i,
      /@graph/i,
      /og:/i,
      /cookie/i,
      /privacy/i,
      /analytics/i,
      /tracking/i,
      /beacon/i
    ];

    return pollutionIndicators.some(pattern => pattern.test(content));
  }

  /**
   * Get pollution report for debugging
   */
  static getPollutionReport(content: string): { polluted: boolean; issues: string[] } {
    const issues: string[] = [];

    if (/<script/i.test(content)) issues.push('Script tags detected');
    if (/javascript:/i.test(content)) issues.push('JavaScript code detected');
    if (/@context/i.test(content)) issues.push('JSON-LD structured data detected');
    if (/@graph/i.test(content)) issues.push('Schema.org graph data detected');
    if (/og:/i.test(content)) issues.push('OpenGraph metadata detected');
    if (/cookie/i.test(content)) issues.push('Cookie policy content detected');
    if (/privacy/i.test(content)) issues.push('Privacy policy content detected');
    if (/analytics/i.test(content)) issues.push('Analytics tracking detected');
    if (/tracking/i.test(content)) issues.push('Tracking scripts detected');
    if (/beacon/i.test(content)) issues.push('Beacon scripts detected');

    return {
      polluted: issues.length > 0,
      issues
    };
  }
}
