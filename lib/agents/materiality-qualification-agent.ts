export interface MaterialityQualificationOutput {
  qualified: boolean;
  reason: string;
}

export class MaterialityQualificationAgent {
  async process(articleText: string, headline: string, summary: string): Promise<MaterialityQualificationOutput> {
    // Keywords that indicate operational significance of AI
    const operationalKeywords = [
      'deployment', 'implementation', 'integration', 'production',
      'operations', 'workflow', 'business process', 'enterprise',
      'infrastructure', 'governance', 'compliance', 'risk',
      'investment', 'funding', 'acquisition', 'partnership',
      'regulation', 'policy', 'oversight', 'management'
    ];
    
    const text = (articleText + ' ' + headline + ' ' + summary).toLowerCase();
    
    // Check for operational significance indicators
    const hasOperationalKeywords = operationalKeywords.some(keyword => 
      text.includes(keyword)
    );
    
    // Check for AI-related terms
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'automation'];
    const hasAIKeywords = aiKeywords.some(keyword => 
      text.includes(keyword)
    );
    
    const qualified = hasOperationalKeywords && hasAIKeywords;
    const reason = qualified 
      ? 'Event demonstrates operational AI significance with business implications'
      : 'Event lacks clear operational AI significance';
    
    return {
      qualified,
      reason
    };
  }
}
