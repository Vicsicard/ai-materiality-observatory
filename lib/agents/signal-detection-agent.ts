export interface SignalDetectionOutput {
  headline: string;
  summary: string;
}

export class SignalDetectionAgent {
  async process(articleText: string): Promise<SignalDetectionOutput> {
    // Extract core event information
    const lines = articleText.split('\n').filter(line => line.trim().length > 0);
    
    // Find headline (usually first paragraph or in title tags)
    let headline = '';
    for (const line of lines.slice(0, 5)) {
      if (line.length > 20 && line.length < 200) {
        headline = line.trim();
        break;
      }
    }
    
    // Create factual summary from first few paragraphs
    const summaryLines = lines.slice(0, 3).join(' ').substring(0, 500);
    
    return {
      headline: headline || 'Event detected',
      summary: summaryLines
    };
  }
}
