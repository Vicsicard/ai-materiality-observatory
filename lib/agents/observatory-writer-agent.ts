export interface ObservatoryWriterInput {
  headline: string;
  summary: string;
  signalType: string;
  signalReason: string;
  implications: string[];
  questions: string[];
  sourceName: string;
  sourceUrl: string;
}

export class ObservatoryWriterAgent {
  async generateArticle(input: ObservatoryWriterInput): Promise<string> {
    const { headline, summary, signalType, signalReason, implications, questions, sourceName, sourceUrl } = input;
    
    // Generate signal-focused title
    const title = this.generateTitle(headline, signalType);
    
    // Build article using standard template
    const article = `# ${title}

# Executive Observation

${this.generateExecutiveObservation(summary, signalType, implications)}

# Source Event

Source:

${sourceName}

Original Reporting:

[${sourceUrl}](${sourceUrl})

# What Happened

${summary}

# Why This Matters

${this.generateWhyThisMatters(signalType, signalReason)}

# The Larger Signal

${this.generateLargerSignal(signalType, signalReason)}

# What This Could Mean For Organizations

${implications.map(implication => `- ${implication}`).join('\n')}

# Questions Worth Considering

${questions.map(question => `- ${question}`).join('\n')}

# Looking Beyond The Headline

${this.generateLookingBeyondHeadline(signalType)}

# Could This Apply To Your Organization?

Organizations often understand AI exists. Many do not understand where it is used, how significant it has become, or whether dependencies are emerging. This event highlights the growing operational importance of AI in business environments, suggesting that organizations need greater visibility into their AI exposure and adoption patterns.

# Assessment CTA

## Assess Your Organization's AI Exposure

Understanding whether AI adoption has become operationally significant begins with visibility.

[Assess Your Organization's AI Exposure →](https://ai-resource-intelligence.pages.dev/)`;

    return article;
  }
  
  private generateTitle(headline: string, signalType: string): string {
    // Transform news headline into signal-focused title
    const signalKeywords = {
      'Governance': ['Oversight', 'Policy', 'Regulation', 'Compliance'],
      'Infrastructure': ['Deployment', 'Integration', 'Systems', 'Platform'],
      'Dependency': ['Reliance', 'Vendor', 'Supply Chain', 'Third-Party'],
      'Resource': ['Investment', 'Talent', 'Funding', 'Resources'],
      'Sustainability': ['Environmental', 'Energy', 'Impact', 'Efficiency'],
      'Reporting': ['Disclosure', 'Transparency', 'Metrics', 'Accountability']
    };
    
    const keywords = signalKeywords[signalType as keyof typeof signalKeywords] || signalKeywords.Governance;
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    // Extract key entities from headline
    const entities = this.extractEntities(headline);
    
    return `${entities.join(' ')} Signals Growing ${keyword} Around AI Operations`;
  }
  
  private generateExecutiveObservation(summary: string, signalType: string, implications: string[]): string {
    return `Recent developments indicate that AI is becoming increasingly operationally significant across organizations. The ${signalType.toLowerCase()} signal suggests that organizations need to consider how these trends may impact their own operations and strategic planning.

${implications.slice(0, 2).map(imp => imp.charAt(0).toUpperCase() + imp.slice(1)).join('. ')}. This pattern reflects the broader trend of AI moving from experimental to essential in business operations.`;
  }
  
  private generateWhyThisMatters(signalType: string, signalReason: string): string {
    return `This event matters because it illustrates the growing operational significance of AI in the ${signalType.toLowerCase()} domain. ${signalReason} Organizations should monitor these patterns as they may indicate emerging requirements or risks in their own operations.`;
  }
  
  private generateLargerSignal(signalType: string, signalReason: string): string {
    return `The larger signal here is the systematic integration of AI into core ${signalType.toLowerCase()} functions. This represents a shift from AI as a peripheral technology to AI as an operational necessity. Organizations that recognize and adapt to this signal will be better positioned to manage the associated risks and opportunities.`;
  }
  
  private generateLookingBeyondHeadline(signalType: string): string {
    return `Beyond the immediate news cycle, this event reflects a fundamental shift in how organizations approach AI in their ${signalType.toLowerCase()} operations. The pattern suggests that AI is no longer optional but becoming operationally embedded in ways that require systematic management and oversight.`;
  }
  
  private extractEntities(headline: string): string[] {
    // Simple entity extraction - in production would use NLP
    const words = headline.split(' ');
    const entities = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'been'].includes(word.toLowerCase())
    ).slice(0, 3);
    
    return entities.length > 0 ? entities : ['AI'];
  }
}
