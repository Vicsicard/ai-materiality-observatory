export interface EditorialValidationOutput {
  approved: boolean;
  reasons?: string[];
  editorial_flags?: Array<{
    term: string;
    section: string;
  }>;
}

export class EditorialValidationAgent {
  // Hard failures - still cause rejection
  private readonly rejectedPatterns = [
    'revolutionary',
    'game changing',
    'game-changing',
    'guaranteed',
    'you should',
    'must implement',
    'must have',
    'transformative',
    'disruptive',
    'breakthrough',
    'paradigm shift',
    'unprecedented',
    'groundbreaking'
  ];
  
  // Editorial warnings - do NOT cause rejection
  private readonly editorialWarningPatterns = [
    'essential',
    'critical',
    'need to',
    'must',
    'required',
    'recommended',
    'best practice'
  ];
  
  private readonly placeholderTitles = [
    'Event detected',
    'Signal detected',
    'Observation detected',
    'Article detected'
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
    const editorial_flags: Array<{ term: string; section: string }> = [];
    
    // Extract title from article (first line after # )
    const titleMatch = article.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Check for placeholder titles (HARD FAILURE)
    for (const placeholder of this.placeholderTitles) {
      if (title.toLowerCase() === placeholder.toLowerCase()) {
        reasons.push(`Contains placeholder title: "${title}"`);
      }
    }
    
    // Extract only the observatory's original analysis sections
    // Skip quoted source content and agent-generated implications
    const observatorySections = this.extractObservatoryAnalysis(article);
    const analysisLower = observatorySections.toLowerCase();
    
    // Debug logging for validation target
    console.log('=== Validation Target Debug ===');
    console.log('Validation sections length:', observatorySections.length);
    console.log('First 500 chars of validation target:', observatorySections.substring(0, 500));
    console.log('Article title:', title);
    console.log('Contains "essential":', analysisLower.includes('essential'));
    console.log('Contains "unprecedented":', analysisLower.includes('unprecedented'));
    
    // Check for hard failure hype language only in observatory analysis
    for (const pattern of this.rejectedPatterns) {
      if (analysisLower.includes(pattern)) {
        reasons.push(`Contains hype language: "${pattern}"`);
      }
    }
    
    // Check for consulting recommendations only in observatory analysis
    for (const pattern of this.consultingPatterns) {
      if (analysisLower.includes(pattern)) {
        reasons.push(`Contains consulting recommendations: "${pattern}"`);
      }
    }
    
    // Check for editorial warning patterns (DO NOT CAUSE REJECTION)
    for (const pattern of this.editorialWarningPatterns) {
      if (analysisLower.includes(pattern)) {
        // Find which section contains the pattern
        const section = this.findSectionContainingPattern(article, pattern);
        editorial_flags.push({
          term: pattern,
          section: section
        });
      }
    }
    
    // Check for speculation indicators only in observatory analysis
    const speculationPatterns = ['might', 'could', 'perhaps', 'possibly', 'potentially'];
    const speculationCount = speculationPatterns.filter(pattern => 
      analysisLower.split(pattern).length > 2
    ).length;
    
    if (speculationCount > 3) {
      reasons.push('Contains excessive speculation');
    }
    
    // Check for unsupported claims only in observatory analysis
    const unsupportedPatterns = ['clearly', 'obviously', 'undoubtedly', 'certainly'];
    for (const pattern of unsupportedPatterns) {
      if (analysisLower.includes(pattern)) {
        reasons.push(`Contains unsupported claims: "${pattern}"`);
      }
    }
    
    const approved = reasons.length === 0;
    
    return {
      approved,
      reasons: approved ? undefined : reasons,
      editorial_flags: editorial_flags.length > 0 ? editorial_flags : undefined
    };
  }
  
  private extractObservatoryAnalysis(article: string): string {
    // Extract only the observatory's original analysis sections
    // Skip quoted source content and agent-generated implications
    const lines = article.split('\n');
    const analysisSections: string[] = [];
    let currentSection = '';
    let inAnalysisSection = false;
    
    // Sections to validate (observatory's original analysis)
    const analysisHeaders = [
      '# Executive Observation',
      '# Why This Matters', 
      '# The Larger Signal',
      '# Looking Beyond The Headline',
      '# Could This Apply To Your Organization?'
    ];
    
    // Sections to skip (quoted content, agent outputs)
    const skipHeaders = [
      '# Source Event',
      '# What Happened',
      '# Questions Worth Considering',
      '# Assessment CTA'
    ];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if we're entering an analysis section
      if (analysisHeaders.some(header => trimmedLine.startsWith(header))) {
        inAnalysisSection = true;
        currentSection = '';
        continue;
      }
      
      // Check if we're entering a skip section
      if (skipHeaders.some(header => trimmedLine.startsWith(header))) {
        if (currentSection.trim()) {
          analysisSections.push(currentSection.trim());
        }
        inAnalysisSection = false;
        currentSection = '';
        continue;
      }
      
      // Check if we're entering a new section (any header starting with #)
      if (trimmedLine.startsWith('#') && inAnalysisSection) {
        if (currentSection.trim()) {
          analysisSections.push(currentSection.trim());
        }
        currentSection = '';
        continue;
      }
      
      // Collect content if we're in an analysis section
      if (inAnalysisSection && trimmedLine) {
        currentSection += trimmedLine + ' ';
      }
    }
    
    // Add the last section if it exists
    if (currentSection.trim()) {
      analysisSections.push(currentSection.trim());
    }
    
    return analysisSections.join(' ');
  }
  
  private findSectionContainingPattern(article: string, pattern: string): string {
    const lines = article.split('\n');
    let currentSection = 'Unknown';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this is a section header
      if (trimmedLine.startsWith('#')) {
        currentSection = trimmedLine.replace(/^#+\s*/, '');
      }
      
      // Check if this line contains the pattern
      if (trimmedLine.toLowerCase().includes(pattern.toLowerCase())) {
        return currentSection;
      }
    }
    
    return currentSection;
  }
}
