export interface SignalClassificationOutput {
  signal_type: string;
  signal_reason: string;
}

export class SignalClassificationAgent {
  private readonly signalTypes = ['Governance', 'Infrastructure', 'Dependency', 'Resource', 'Sustainability', 'Reporting'];
  
  async process(articleText: string, headline: string, summary: string): Promise<SignalClassificationOutput> {
    const text = (articleText + ' ' + headline + ' ' + summary).toLowerCase();
    
    // Classification keywords for each signal type
    const classificationKeywords = {
      'Governance': ['board', 'oversight', 'policy', 'regulation', 'compliance', 'ethics', 'management'],
      'Infrastructure': ['deployment', 'infrastructure', 'systems', 'integration', 'platform', 'architecture'],
      'Dependency': ['reliance', 'dependency', 'vendor', 'supplier', 'third-party', 'outsourcing'],
      'Resource': ['investment', 'funding', 'budget', 'talent', 'hiring', 'training', 'skills'],
      'Sustainability': ['environmental', 'energy', 'carbon', 'sustainable', 'green', 'efficiency'],
      'Reporting': ['disclosure', 'reporting', 'transparency', 'metrics', 'measurement', 'accountability']
    };
    
    // Score each signal type
    const scores: { [key: string]: number } = {};
    
    for (const [signalType, keywords] of Object.entries(classificationKeywords)) {
      scores[signalType] = keywords.reduce((score, keyword) => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        return score + matches;
      }, 0);
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
    
    const signal_reason = `Classified as ${bestSignalType} based on keyword analysis with score ${highestScore}`;
    
    return {
      signal_type: bestSignalType,
      signal_reason
    };
  }
}
