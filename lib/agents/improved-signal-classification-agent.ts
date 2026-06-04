export interface SignalClassificationOutput {
  signal_type: string;
  signal_reason: string;
  confidence_score: number;
  all_scores: { [key: string]: number };
  classification_details: string[];
}

export class ImprovedSignalClassificationAgent {
  private readonly signalTypes = ['Governance', 'Infrastructure', 'Dependency', 'Resource', 'Sustainability', 'Reporting'];
  
  async process(articleText: string, headline: string, summary: string): Promise<SignalClassificationOutput> {
    const text = (articleText + ' ' + headline + ' ' + summary).toLowerCase();
    
    // Enhanced classification keywords with context weighting
    const classificationKeywords = {
      'Governance': {
        keywords: ['board', 'oversight', 'policy', 'regulation', 'compliance', 'ethics', 'management'],
        weight: 1.0,
        context: ['governance', 'board', 'policy', 'regulation']
      },
      'Infrastructure': {
        keywords: ['deployment', 'infrastructure', 'systems', 'integration', 'platform', 'architecture'],
        weight: 1.0,
        context: ['infrastructure', 'deployment', 'systems', 'platform']
      },
      'Dependency': {
        keywords: ['reliance', 'dependency', 'vendor', 'supplier', 'third-party', 'outsourcing'],
        weight: 1.0,
        context: ['dependency', 'vendor', 'supplier', 'third-party']
      },
      'Resource': {
        keywords: ['investment', 'funding', 'budget', 'talent', 'hiring', 'training', 'skills', 'cost', 'price', 'pricing'],
        weight: 1.0,
        context: ['resource', 'budget', 'investment', 'cost', 'pricing', 'talent']
      },
      'Sustainability': {
        keywords: ['environmental', 'energy', 'carbon', 'sustainable', 'green', 'emissions', 'climate'],
        weight: 1.0,
        context: ['environmental', 'energy', 'carbon', 'sustainable', 'green', 'emissions']
      },
      'Reporting': {
        keywords: ['disclosure', 'reporting', 'transparency', 'metrics', 'measurement', 'accountability'],
        weight: 1.0,
        context: ['reporting', 'disclosure', 'transparency', 'metrics', 'measurement']
      }
    };
    
    // Score each signal type with context awareness
    const scores: { [key: string]: number } = {};
    const details: { [key: string]: string[] } = {};
    
    for (const [signalType, config] of Object.entries(classificationKeywords)) {
      let score = 0;
      const foundDetails: string[] = [];
      
      // Count keyword matches
      for (const keyword of config.keywords) {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        if (matches > 0) {
          score += matches * config.weight;
          foundDetails.push(`Keyword "${keyword}" found ${matches} times`);
        }
      }
      
      // Bonus for context matches
      for (const context of config.context) {
        if (text.includes(context)) {
          score += 0.5;
          foundDetails.push(`Context "${context}" found`);
        }
      }
      
      scores[signalType] = score;
      details[signalType] = foundDetails;
    }
    
    // Find the signal type with the highest score
    let bestSignalType = 'Governance'; // default
    let highestScore = 0;
    
    for (const signalType of this.signalTypes) {
      if (scores[signalType] > highestScore) {
        highestScore = scores[signalType];
        bestSignalType = signalType;
      }
    }
    
    // Calculate confidence score
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidenceScore = totalScore > 0 ? highestScore / totalScore : 0;
    
    // Determine if classification is confident enough
    const minConfidenceThreshold = 0.4; // 40% minimum confidence
    const minAbsoluteScore = 1.5; // Minimum absolute score
    
    if (confidenceScore < minConfidenceThreshold || highestScore < minAbsoluteScore) {
      return {
        signal_type: 'Needs Review',
        signal_reason: `Low confidence classification. Highest score: ${bestSignalType} with ${highestScore} points (${(confidenceScore * 100).toFixed(1)}% confidence). Consider manual review or "Mixed Signal" classification.`,
        confidence_score: confidenceScore,
        all_scores: scores,
        classification_details: details[bestSignalType] || []
      };
    }
    
    // Special handling for ambiguous "efficiency" keyword
    if (bestSignalType === 'Sustainability' && details['Sustainability']?.some(detail => detail.includes('efficiency'))) {
      // Check if this might be cost/resource efficiency instead
      const resourceScore = scores['Resource'] || 0;
      const infrastructureScore = scores['Infrastructure'] || 0;
      
      if (resourceScore > infrastructureScore && resourceScore >= 1) {
        bestSignalType = 'Resource';
        highestScore = resourceScore;
      } else if (infrastructureScore >= 1) {
        bestSignalType = 'Infrastructure';
        highestScore = infrastructureScore;
      }
    }
    
    const signal_reason = `Classified as ${bestSignalType} based on keyword analysis with score ${highestScore.toFixed(1)} (${(confidenceScore * 100).toFixed(1)}% confidence). Evidence: ${(details[bestSignalType] || []).join('; ')}`;
    
    return {
      signal_type: bestSignalType,
      signal_reason,
      confidence_score: confidenceScore,
      all_scores: scores,
      classification_details: details[bestSignalType] || []
    };
  }
}
