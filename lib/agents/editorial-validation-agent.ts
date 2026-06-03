export interface EditorialValidationOutput {
  approved: boolean;
  reasons?: string[];
}

export class EditorialValidationAgent {
  private readonly rejectedPatterns = [
    'revolutionary',
    'game changing',
    'game-changing',
    'guaranteed',
    'you should',
    'must implement',
    'must have',
    'essential',
    'critical',
    'transformative',
    'disruptive',
    'breakthrough',
    'paradigm shift',
    'unprecedented',
    'groundbreaking'
  ];
  
  private readonly consultingPatterns = [
    'we recommend',
    'consider implementing',
    'you should',
    'must',
    'need to',
    'advice',
    'recommendation',
    'best practice',
    'strategy',
    'action plan'
  ];
  
  async validateArticle(article: string): Promise<EditorialValidationOutput> {
    const reasons: string[] = [];
    const articleLower = article.toLowerCase();
    
    // Check for hype language
    for (const pattern of this.rejectedPatterns) {
      if (articleLower.includes(pattern)) {
        reasons.push(`Contains hype language: "${pattern}"`);
      }
    }
    
    // Check for consulting recommendations
    for (const pattern of this.consultingPatterns) {
      if (articleLower.includes(pattern)) {
        reasons.push(`Contains consulting recommendations: "${pattern}"`);
      }
    }
    
    // Check for speculation indicators
    const speculationPatterns = ['might', 'could', 'perhaps', 'possibly', 'potentially'];
    const speculationCount = speculationPatterns.filter(pattern => 
      articleLower.split(pattern).length > 2
    ).length;
    
    if (speculationCount > 3) {
      reasons.push('Contains excessive speculation');
    }
    
    // Check for unsupported claims
    const unsupportedPatterns = ['clearly', 'obviously', 'undoubtedly', 'certainly'];
    for (const pattern of unsupportedPatterns) {
      if (articleLower.includes(pattern)) {
        reasons.push(`Contains unsupported claims: "${pattern}"`);
      }
    }
    
    const approved = reasons.length === 0;
    
    return {
      approved,
      reasons: approved ? undefined : reasons
    };
  }
}
