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

Organizations often understand AI exists. Many do not understand where it is used, how significant it has become, or whether dependencies are emerging. This event highlights the growing operational importance of AI in business environments, suggesting that organizations may benefit from greater visibility into their AI exposure and adoption patterns.

# Assessment CTA

## Assess Your Organization's AI Exposure

Understanding whether AI adoption has become operationally significant begins with visibility.

[Assess Your Organization's AI Exposure →](https://ai-resource-intelligence.pages.dev/)`;

    return article;
  }
  
  private generateTitle(headline: string, signalType: string): string {
    // Check if headline is a placeholder and generate meaningful title
    const placeholderTitles = ['Event detected', 'Signal detected', 'Observation detected', 'Article detected'];
    
    if (placeholderTitles.includes(headline.trim())) {
      // Generate meaningful title based on signal type when placeholder detected
      return this.generateMeaningfulTitle(signalType);
    }
    
    // Transform real news headline into signal-focused title
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
  
  private generateMeaningfulTitle(signalType: string): string {
    // Generate meaningful title based on signal type when no headline available
    const signalTitles = {
      'Governance': [
        'AI Governance Oversight Signals Emerging Policy Requirements',
        'Regulatory Attention Indicates Growing AI Compliance Needs',
        'Board-Level AI Oversight Becomes Increasingly Relevant'
      ],
      'Infrastructure': [
        'AI Infrastructure Deployment Signals System Integration Needs',
        'Platform Requirements Highlight Growing AI Systems Complexity',
        'Technical Integration Signals AI Infrastructure Expansion'
      ],
      'Dependency': [
        'AI Vendor Reliance Signals Growing Supply Chain Considerations',
        'Third-Party Dependencies Highlight AI Ecosystem Risks',
        'External AI Dependencies Signal Organizational Exposure'
      ],
      'Resource': [
        'AI Talent Competition Signals Growing Investment Requirements',
        'Resource Allocation Indicates AI Skill Acquisition Needs',
        'Funding Patterns Signal AI Resource Intensification'
      ],
      'Sustainability': [
        'AI Energy Consumption Signals Environmental Impact Considerations',
        'Efficiency Requirements Highlight AI Sustainability Challenges',
        'Resource Usage Indicates AI Environmental Footprint'
      ],
      'Reporting': [
        'AI Disclosure Requirements Signal Growing Transparency Needs',
        'Stakeholder Expectations Indicate AI Reporting Evolution',
        'Metrics Development Signals AI Accountability Demands'
      ]
    };
    
    const titles = signalTitles[signalType as keyof typeof signalTitles] || signalTitles.Governance;
    return titles[Math.floor(Math.random() * titles.length)];
  }
  
  private generateExecutiveObservation(summary: string, signalType: string, implications: string[]): string {
    // Filter implications to remove prohibited language
    const filteredImplications = implications.slice(0, 2).map(imp => 
      imp.replace(/\b(essential|critical|revolutionary|game-changing|unprecedented|breakthrough|transformative|disruptive)\b/gi, 'operationally significant')
         .replace(/\b(should|must|need to|have to|required)\b/gi, 'may want to')
         .replace(/\b(best practice|recommended|strategy|action plan)\b/gi, 'worth considering')
    );
    
    return `Recent developments indicate that AI is becoming increasingly operationally significant across organizations. The ${signalType.toLowerCase()} signal suggests that organizations may want to consider how these trends may impact their own operations and strategic planning.

${filteredImplications.map(imp => imp.charAt(0).toUpperCase() + imp.slice(1)).join('. ')}. This pattern reflects the broader trend of AI moving from experimental to operationally embedded in business operations.`;
  }
  
  private generateWhyThisMatters(signalType: string, signalReason: string): string {
    return `This event matters because it illustrates the growing operational significance of AI in the ${signalType.toLowerCase()} domain. ${signalReason} Organizations may want to monitor these patterns as they may indicate emerging requirements or risks in their own operations.`;
  }
  
  private generateLargerSignal(signalType: string, signalReason: string): string {
    return `The larger signal here is the systematic integration of AI into core ${signalType.toLowerCase()} functions. This represents a shift from AI as a peripheral technology to AI as an operationally significant factor. Organizations that recognize and adapt to this signal may be better positioned to manage the associated risks and opportunities.`;
  }
  
  private generateLookingBeyondHeadline(signalType: string): string {
    return `Beyond the immediate news cycle, this event reflects a fundamental shift in how organizations approach AI in their ${signalType.toLowerCase()} operations. The pattern suggests that AI is no longer optional but becoming operationally embedded in ways that may benefit from systematic management and oversight.`;
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
