import { 
  Draft2PostInput, 
  SourcePreservationOutput, 
  SignalClassificationOutput, 
  ObservatoryTitleOutput, 
  MaterialityInterpretationOutput, 
  EditorialValidationOutput,
  EnhancedArticle
} from '../db/enhanced-database';

// Agent 1: Source Preservation Agent
export class SourcePreservationAgent {
  async process(input: Draft2PostInput): Promise<SourcePreservationOutput> {
    const { event, draftArticle } = input;
    
    // Extract and preserve original source information
    const sourceTitle = event.headline || draftArticle.title;
    const sourcePublication = event.source_name || 'Unknown Publication';
    
    // Generate summary from draft content
    const sourceSummary = this.generateSummary(draftArticle.content);
    
    // Extract keywords from content
    const sourceKeywords = this.extractKeywords(draftArticle.content);
    
    return {
      source_title: sourceTitle,
      source_publication: sourcePublication,
      source_summary: sourceSummary,
      source_keywords: sourceKeywords
    };
  }
  
  private generateSummary(content: string): string {
    // Simple extractive summarization - take first few sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
  }
  
  private extractKeywords(content: string): string {
    // Simple keyword extraction - look for AI-related terms
    const aiKeywords = [
      'AI', 'artificial intelligence', 'machine learning', 'deep learning',
      'neural networks', 'LLM', 'large language models', 'GPT', 'ChatGPT',
      'Claude', 'Anthropic', 'OpenAI', 'Google', 'Microsoft', 'NVIDIA',
      'data center', 'compute', 'infrastructure', 'governance', 'regulation',
      'sustainability', 'energy', 'emissions', 'reporting', 'disclosure'
    ];
    
    const foundKeywords = aiKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return foundKeywords.slice(0, 8).join(', ');
  }
}

// Agent 2: Signal Classification Agent
export class SignalClassificationAgent {
  private readonly categories = [
    'Governance',
    'Resource Consumption', 
    'Operational Dependency',
    'Infrastructure',
    'Reporting & Disclosure',
    'Sustainability'
  ];
  
  async process(input: Draft2PostInput): Promise<SignalClassificationOutput> {
    const { draftArticle } = input;
    
    // Analyze content to determine primary category
    const categoryScores = this.categories.map(category => ({
      category,
      score: this.calculateCategoryScore(draftArticle.content, category)
    }));
    
    // Sort by score and select highest
    categoryScores.sort((a, b) => b.score - a.score);
    const selected = categoryScores[0];
    
    return {
      signal_category: selected.category,
      classification_reason: this.generateReasoning(selected.category, draftArticle.content),
      classification_confidence: Math.min(selected.score, 100)
    };
  }
  
  private calculateCategoryScore(content: string, category: string): number {
    const lowerContent = content.toLowerCase();
    let score = 0;
    
    switch (category) {
      case 'Governance':
        if (lowerContent.includes('govern')) score += 20;
        if (lowerContent.includes('regulat')) score += 20;
        if (lowerContent.includes('compliance')) score += 15;
        if (lowerContent.includes('board')) score += 15;
        if (lowerContent.includes('investor')) score += 15;
        if (lowerContent.includes('policy')) score += 10;
        break;
        
      case 'Resource Consumption':
        if (lowerContent.includes('cost')) score += 20;
        if (lowerContent.includes('spend')) score += 20;
        if (lowerContent.includes('budget')) score += 15;
        if (lowerContent.includes('token')) score += 15;
        if (lowerContent.includes('usage')) score += 10;
        if (lowerContent.includes('consumption')) score += 10;
        break;
        
      case 'Operational Dependency':
        if (lowerContent.includes('depend')) score += 20;
        if (lowerContent.includes('relianc')) score += 20;
        if (lowerContent.includes('workflow')) score += 15;
        if (lowerContent.includes('integration')) score += 15;
        if (lowerContent.includes('lock-in')) score += 10;
        if (lowerContent.includes('vendor')) score += 10;
        break;
        
      case 'Infrastructure':
        if (lowerContent.includes('infrastruct')) score += 20;
        if (lowerContent.includes('data center')) score += 20;
        if (lowerContent.includes('compute')) score += 15;
        if (lowerContent.includes('cloud')) score += 15;
        if (lowerContent.includes('server')) score += 10;
        if (lowerContent.includes('hardware')) score += 10;
        break;
        
      case 'Reporting & Disclosure':
        if (lowerContent.includes('report')) score += 20;
        if (lowerContent.includes('disclosur')) score += 20;
        if (lowerContent.includes('transparen')) score += 15;
        if (lowerContent.includes('sec')) score += 15;
        if (lowerContent.includes('filing')) score += 10;
        if (lowerContent.includes('documentation')) score += 10;
        break;
        
      case 'Sustainability':
        if (lowerContent.includes('sustain')) score += 20;
        if (lowerContent.includes('energy')) score += 20;
        if (lowerContent.includes('emission')) score += 15;
        if (lowerContent.includes('carbon')) score += 15;
        if (lowerContent.includes('environment')) score += 10;
        if (lowerContent.includes('water')) score += 10;
        break;
    }
    
    return Math.min(score, 100);
  }
  
  private generateReasoning(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    switch (category) {
      case 'Governance':
        if (lowerContent.includes('investor') && lowerContent.includes('ipo')) {
          return "This signal centers on investor expectations, IPO requirements, and governance oversight. The dominant concern is emerging governance expectations rather than resource consumption or infrastructure.";
        }
        return "This signal centers on governance requirements, regulatory expectations, and oversight mechanisms. The dominant concern is governance and compliance rather than resource or operational issues.";
        
      case 'Resource Consumption':
        if (lowerContent.includes('token') && lowerContent.includes('spend')) {
          return "This signal centers on token consumption, AI spending, and budget pressure. The dominant concern is visibility into AI resource consumption rather than governance, reporting, or infrastructure.";
        }
        return "This signal centers on resource usage, cost accumulation, and budget impact. The dominant concern is resource visibility and cost management rather than governance or infrastructure.";
        
      case 'Operational Dependency':
        return "This signal centers on tool reliance, workflow integration, and vendor lock-in. The dominant concern is operational dependency and business continuity rather than resource or governance issues.";
        
      case 'Infrastructure':
        return "This signal centers on compute capacity, data center expansion, and hardware investment. The dominant concern is infrastructure dependency and capacity planning rather than resource or governance.";
        
      case 'Reporting & Disclosure':
        return "This signal centers on disclosure requirements, investor reporting, and transparency expectations. The dominant concern is reporting and disclosure obligations rather than resource or operational issues.";
        
      case 'Sustainability':
        return "This signal centers on energy consumption, emissions impact, and environmental considerations. The dominant concern is sustainability and environmental impact rather than governance or resource issues.";
        
      default:
        return `Classification based on content analysis for ${category} signals in the article.`;
    }
  }
}

// Agent 3: Observatory Title Agent
export class ObservatoryTitleAgent {
  async process(input: Draft2PostInput, sourceOutput: SourcePreservationOutput, classificationOutput: SignalClassificationOutput): Promise<ObservatoryTitleOutput> {
    const { draftArticle } = input;
    
    // Generate Observatory title that preserves source context
    const observatoryTitle = this.generateObservatoryTitle(
      sourceOutput.source_title,
      classificationOutput.signal_category,
      draftArticle.content
    );
    
    // Generate slug
    const observatorySlug = this.generateSlug(observatoryTitle);
    
    // Generate SEO metadata
    const metaTitle = this.generateMetaTitle(observatoryTitle);
    const metaDescription = this.generateMetaDescription(draftArticle.content);
    
    return {
      observatory_title: observatoryTitle,
      observatory_slug: observatorySlug,
      meta_title: metaTitle,
      meta_description: metaDescription
    };
  }
  
  private generateObservatoryTitle(sourceTitle: string, category: string, content: string): string {
    // Remove hype and marketing language
    const cleanedTitle = sourceTitle
      .replace(/revolutionary|game-changing|groundbreaking|breakthrough|unprecedented/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Select title pattern based on content analysis
    const pattern = this.selectTitlePattern(content, category);
    
    switch (pattern) {
      case 'A':
        return this.generateTitlePatternA(cleanedTitle, category, content);
      case 'B':
        return this.generateTitlePatternB(cleanedTitle, category, content);
      case 'C':
        return this.generateTitlePatternC(cleanedTitle, category, content);
      case 'D':
        return this.generateTitlePatternD(cleanedTitle, category, content);
      case 'E':
        return this.generateTitlePatternE(cleanedTitle, category, content);
      default:
        return this.generateTitlePatternA(cleanedTitle, category, content);
    }
  }
  
  private selectTitlePattern(content: string, category: string): string {
    const lowerContent = content.toLowerCase();
    
    // Pattern selection logic based on content characteristics
    if (lowerContent.includes('question') || lowerContent.includes('uncertain')) {
      return 'E'; // Questions pattern
    }
    
    if (lowerContent.includes('indicator') || lowerContent.includes('sign')) {
      return 'D'; // Indicator pattern
    }
    
    if (lowerContent.includes('why') || lowerContent.includes('because')) {
      return 'C'; // Why pattern
    }
    
    if (lowerContent.includes('mean') || lowerContent.includes('impact')) {
      return 'B'; // What may indicate pattern
    }
    
    // Category-based pattern selection
    const categoryPatterns = {
      'Governance': ['A', 'C', 'E'],
      'Resource Consumption': ['A', 'B', 'D'],
      'Operational Dependency': ['B', 'D', 'E'],
      'Infrastructure': ['A', 'B', 'D'],
      'Reporting & Disclosure': ['C', 'E'],
      'Sustainability': ['A', 'D']
    };
    
    const availablePatterns = categoryPatterns[category as keyof typeof categoryPatterns] || ['A'];
    return availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
  }
  
  private generateTitlePatternA(sourceTitle: string, category: string, content: string): string {
    // Pattern A: Source Event: A Signal of ...
    const interpretations = {
      'Governance': this.generateGovernanceInterpretation(sourceTitle, content),
      'Resource Consumption': this.generateResourceInterpretation(sourceTitle, content),
      'Operational Dependency': this.generateDependencyInterpretation(sourceTitle, content),
      'Infrastructure': this.generateInfrastructureInterpretation(sourceTitle, content),
      'Reporting & Disclosure': this.generateReportingInterpretation(sourceTitle, content),
      'Sustainability': this.generateSustainabilityInterpretation(sourceTitle, content)
    };
    
    const interpretation = interpretations[category as keyof typeof interpretations] || 'A Signal of Emerging AI Significance';
    return `${sourceTitle}: A Signal of ${interpretation}`;
  }
  
  private generateTitlePatternB(sourceTitle: string, category: string, content: string): string {
    // Pattern B: Source Event: What ... May Indicate
    const lowerContent = content.toLowerCase();
    
    let whatMayIndicate = '';
    if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        whatMayIndicate = 'What Growing Token Costs May Indicate For Organizations';
      } else if (lowerContent.includes('budget')) {
        whatMayIndicate = 'What Budget Pressure May Indicate About AI Visibility';
      } else {
        whatMayIndicate = 'What Resource Consumption May Indicate For Operations';
      }
    } else if (category === 'Governance') {
      if (lowerContent.includes('ipo') || lowerContent.includes('filing')) {
        whatMayIndicate = 'What IPO Activity May Indicate About Governance Expectations';
      } else {
        whatMayIndicate = 'What Governance Signals May Indicate For Oversight';
      }
    } else if (category === 'Infrastructure') {
      if (lowerContent.includes('data center')) {
        whatMayIndicate = 'What Data Center Expansion May Indicate About Dependencies';
      } else {
        whatMayIndicate = 'What Infrastructure Growth May Indicate For Operations';
      }
    } else {
      whatMayIndicate = 'What This Signal May Indicate For Organizations';
    }
    
    return `${sourceTitle}: ${whatMayIndicate}`;
  }
  
  private generateTitlePatternC(sourceTitle: string, category: string, content: string): string {
    // Pattern C: Source Event: Why ... May Be Emerging
    const lowerContent = content.toLowerCase();
    
    let whyMayBeEmerging = '';
    if (category === 'Governance') {
      if (lowerContent.includes('ipo') || lowerContent.includes('filing')) {
        whyMayBeEmerging = 'Why Governance Expectations May Be Emerging Faster Than Visibility';
      } else {
        whyMayBeEmerging = 'Why Oversight Requirements May Be Emerging In AI Operations';
      }
    } else if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        whyMayBeEmerging = 'Why Resource Visibility Challenges May Be Emerging In AI Management';
      } else {
        whyMayBeEmerging = 'Why Cost Management Issues May Be Emerging In AI Operations';
      }
    } else {
      whyMayBeEmerging = 'Why This Pattern May Be Emerging In Organizational AI Use';
    }
    
    return `${sourceTitle}: ${whyMayBeEmerging}`;
  }
  
  private generateTitlePatternD(sourceTitle: string, category: string, content: string): string {
    // Pattern D: Source Event: An Indicator Of ...
    const lowerContent = content.toLowerCase();
    
    let indicatorOf = '';
    if (category === 'Infrastructure') {
      if (lowerContent.includes('data center') || lowerContent.includes('facility')) {
        indicatorOf = 'An Indicator Of Rising AI Infrastructure Demand';
      } else if (lowerContent.includes('compute')) {
        indicatorOf = 'An Indicator Of Growing Compute Dependency';
      } else {
        indicatorOf = 'An Indicator Of Expanding AI Infrastructure Requirements';
      }
    } else if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        indicatorOf = 'An Indicator Of Growing AI Resource Consumption';
      } else {
        indicatorOf = 'An Indicator Of Emerging Resource Management Challenges';
      }
    } else if (category === 'Governance') {
      indicatorOf = 'An Indicator Of Expanding Governance Expectations';
    } else {
      indicatorOf = 'An Indicator Of Emerging AI Operational Significance';
    }
    
    return `${sourceTitle}: ${indicatorOf}`;
  }
  
  private generateTitlePatternE(sourceTitle: string, category: string, content: string): string {
    // Pattern E: Source Event: Questions For Organizations
    const lowerContent = content.toLowerCase();
    
    let questionsFor = '';
    if (category === 'Reporting & Disclosure') {
      if (lowerContent.includes('sec') || lowerContent.includes('regulatory')) {
        questionsFor = 'Questions Organizations May Soon Need To Answer About AI Reporting';
      } else {
        questionsFor = 'Questions For Organizations Regarding AI Disclosure Requirements';
      }
    } else if (category === 'Governance') {
      questionsFor = 'Questions For Organizations About AI Governance Readiness';
    } else if (category === 'Resource Consumption') {
      questionsFor = 'Questions For Organizations About AI Resource Visibility';
    } else {
      questionsFor = 'Questions Organizations May Need To Consider About This Signal';
    }
    
    return `${sourceTitle}: ${questionsFor}`;
  }
  
  private generateGovernanceInterpretation(title: string, content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('ipo') || lowerContent.includes('filing')) {
      return 'A Signal of Growing AI Governance Expectations';
    }
    if (lowerContent.includes('board') || lowerContent.includes('investor')) {
      return 'A Signal of Expanding AI Oversight Requirements';
    }
    return 'A Signal of Emerging AI Governance Pressure';
  }
  
  private generateResourceInterpretation(title: string, content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('token') && lowerContent.includes('spend')) {
      return 'A Signal of Emerging AI Resource Visibility Pressure';
    }
    if (lowerContent.includes('budget') || lowerContent.includes('cost')) {
      return 'A Signal of Growing AI Resource Cost Concerns';
    }
    if (lowerContent.includes('usage') || lowerContent.includes('consumption')) {
      return 'A Signal of Increasing AI Resource Consumption';
    }
    return 'A Signal of Emerging AI Resource Management Challenges';
  }
  
  private generateDependencyInterpretation(title: string, content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('vendor') || lowerContent.includes('provider')) {
      return 'What Vendor Lock-in May Mean For Operations';
    }
    if (lowerContent.includes('workflow') || lowerContent.includes('integration')) {
      return 'What Workflow Integration May Mean For Dependencies';
    }
    return 'What Growing AI Reliance May Mean For Organizations';
  }
  
  private generateInfrastructureInterpretation(title: string, content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('data center') || lowerContent.includes('facility')) {
      return 'A Signal of Growing AI Infrastructure Demand';
    }
    if (lowerContent.includes('compute') || lowerContent.includes('capacity')) {
      return 'What Compute Expansion May Mean For Dependencies';
    }
    return 'A Signal of Expanding AI Infrastructure Requirements';
  }
  
  private generateReportingInterpretation(title: string, content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('sec') || lowerContent.includes('regulatory')) {
      return 'A Signal of Growing AI Reporting Requirements';
    }
    if (lowerContent.includes('disclosure') || lowerContent.includes('transparency')) {
      return 'A Signal of Increasing AI Disclosure Expectations';
    }
    return 'A Signal of Emerging AI Reporting Pressure';
  }
  
  private generateSustainabilityInterpretation(title: string, content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('energy') || lowerContent.includes('power')) {
      return 'A Signal of Growing AI Energy Consumption Concerns';
    }
    if (lowerContent.includes('emissions') || lowerContent.includes('carbon')) {
      return 'A Signal of Increasing AI Environmental Impact';
    }
    return 'A Signal of Emerging AI Sustainability Challenges';
  }
  
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  private generateMetaTitle(title: string): string {
    return `${title} | AI Materiality Observatory`;
  }
  
  private generateMetaDescription(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ').substring(0, 160) + '...';
  }
}

// Agent 4: Materiality Interpretation Agent
export class MaterialityInterpretationAgent {
  async process(input: Draft2PostInput, classificationOutput: SignalClassificationOutput): Promise<MaterialityInterpretationOutput> {
    const { draftArticle } = input;
    
    // Generate organizational relevance interpretation
    const whatThisMayIndicate = this.generateWhatThisMayIndicate(
      classificationOutput.signal_category,
      draftArticle.content
    );
    
    const potentialRelevance = this.generatePotentialRelevance(classificationOutput.signal_category, draftArticle.content);
    
    const assessmentAreas = this.generateRelatedAssessmentAreas(classificationOutput.signal_category);
    
    return {
      what_this_may_indicate: whatThisMayIndicate,
      potential_organizational_relevance: potentialRelevance,
      related_assessment_areas: assessmentAreas
    };
  }
  
  private generateWhatThisMayIndicate(category: string, content: string): string {
    // Select interpretation style based on content and category
    const style = this.selectInterpretationStyle(content, category);
    
    switch (style) {
      case 'A': // Visibility Lens
        return this.generateVisibilityInterpretation(category, content);
      case 'B': // Dependency Lens
        return this.generateDependencyInterpretation(category, content);
      case 'C': // Governance Lens
        return this.generateGovernanceInterpretation(category, content);
      case 'D': // Reporting Lens
        return this.generateReportingInterpretation(category, content);
      case 'E': // Resource Lens
        return this.generateResourceInterpretation(category, content);
      case 'F': // Infrastructure Lens
        return this.generateInfrastructureInterpretation(category, content);
      default:
        return this.generateVisibilityInterpretation(category, content);
    }
  }
  
  private selectInterpretationStyle(content: string, category: string): string {
    const lowerContent = content.toLowerCase();
    
    // Style selection logic
    if (lowerContent.includes('visibility') || lowerContent.includes('track') || lowerContent.includes('monitor')) {
      return 'A'; // Visibility Lens
    }
    
    if (lowerContent.includes('depend') || lowerContent.includes('rely') || lowerContent.includes('vendor')) {
      return 'B'; // Dependency Lens
    }
    
    if (lowerContent.includes('govern') || lowerContent.includes('board') || lowerContent.includes('oversight')) {
      return 'C'; // Governance Lens
    }
    
    if (lowerContent.includes('report') || lowerContent.includes('disclos') || lowerContent.includes('transparen')) {
      return 'D'; // Reporting Lens
    }
    
    if (lowerContent.includes('infrastruct') || lowerContent.includes('compute') || lowerContent.includes('data center')) {
      return 'F'; // Infrastructure Lens
    }
    
    // Category-based style selection
    const categoryStyles = {
      'Governance': ['C', 'D', 'A'],
      'Resource Consumption': ['A', 'E', 'B'],
      'Operational Dependency': ['B', 'A', 'F'],
      'Infrastructure': ['F', 'B', 'A'],
      'Reporting & Disclosure': ['D', 'C', 'A'],
      'Sustainability': ['E', 'A', 'D']
    };
    
    const availableStyles = categoryStyles[category as keyof typeof categoryStyles] || ['A'];
    return availableStyles[Math.floor(Math.random() * availableStyles.length)];
  }
  
  private generateVisibilityInterpretation(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        return 'AI costs may be accumulating faster than visibility systems can track.';
      }
      if (lowerContent.includes('budget') && lowerContent.includes('break')) {
        return 'Resource consumption patterns may be exceeding planned visibility frameworks.';
      }
      return 'AI resource usage may be creating visibility gaps that affect organizational oversight.';
    }
    
    if (category === 'Governance') {
      return 'Governance expectations may be expanding faster than current visibility frameworks can accommodate.';
    }
    
    return 'This signal may indicate emerging visibility challenges in AI operations.';
  }
  
  private generateDependencyInterpretation(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Operational Dependency') {
      if (lowerContent.includes('vendor') && lowerContent.includes('lock')) {
        return 'Reliance on external AI infrastructure may be increasing faster than internal oversight mechanisms.';
      }
      if (lowerContent.includes('workflow') && lowerContent.includes('integration')) {
        return 'AI workflow dependencies may be becoming operationally significant faster than risk management can adapt.';
      }
      return 'AI system dependencies may be creating operational lock-in risks that affect business continuity.';
    }
    
    if (category === 'Infrastructure') {
      return 'Infrastructure expansion may indicate increasing dependence on external compute ecosystems.';
    }
    
    return 'This signal may indicate growing dependency on external AI systems.';
  }
  
  private generateGovernanceInterpretation(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Governance') {
      if (lowerContent.includes('ipo') || lowerContent.includes('filing')) {
        return 'Governance expectations appear to be expanding beyond traditional AI experimentation frameworks.';
      }
      if (lowerContent.includes('board') && lowerContent.includes('ai')) {
        return 'Board-level oversight requirements may be developing faster than current governance maturity.';
      }
      return 'AI governance expectations may be emerging faster than organizational readiness.';
    }
    
    return 'This signal may indicate expanding governance requirements for AI operations.';
  }
  
  private generateReportingInterpretation(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Reporting & Disclosure') {
      if (lowerContent.includes('sec') || lowerContent.includes('regulatory')) {
        return 'Stakeholders may increasingly expect evidence regarding how AI is being used and managed.';
      }
      if (lowerContent.includes('investor') && lowerContent.includes('ai')) {
        return 'Investor expectations for AI disclosure may be developing faster than reporting maturity.';
      }
      return 'Reporting expectations may be expanding beyond current transparency capabilities.';
    }
    
    return 'This signal may indicate emerging reporting requirements for AI operations.';
  }
  
  private generateResourceInterpretation(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        return 'Resource consumption may be becoming operationally significant before organizations have visibility into usage patterns.';
      }
      if (lowerContent.includes('budget') && lowerContent.includes('break')) {
        return 'Resource demands may be exceeding planned budgets faster than cost management systems can track.';
      }
      return 'AI resource consumption patterns may indicate emerging cost management challenges.';
    }
    
    if (category === 'Sustainability') {
      return 'Resource intensity may be creating sustainability impacts that exceed current environmental management frameworks.';
    }
    
    return 'This signal may indicate emerging resource management challenges.';
  }
  
  private generateInfrastructureInterpretation(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Infrastructure') {
      if (lowerContent.includes('data center') && lowerContent.includes('expansion')) {
        return 'Infrastructure expansion may indicate increasing dependence on external compute providers.';
      }
      if (lowerContent.includes('compute') && lowerContent.includes('capacity')) {
        return 'Compute capacity demands may be creating infrastructure dependencies that affect operations.';
      }
      return 'Infrastructure requirements may be expanding faster than current capacity planning.';
    }
    
    return 'This signal may indicate emerging infrastructure dependency challenges.';
  }
  
  private generatePotentialRelevance(category: string, content: string): string {
    // Select format based on content characteristics
    const format = this.selectRelevanceFormat(content, category);
    
    switch (format) {
      case 'A': // Bullets
        return this.generateBulletRelevance(category);
      case 'B': // Narrative paragraph
        return this.generateNarrativeRelevance(category, content);
      case 'C': // Operational questions
        return this.generateQuestionRelevance(category, content);
      case 'D': // Risk indicators
        return this.generateRiskIndicatorRelevance(category, content);
      default:
        return this.generateBulletRelevance(category);
    }
  }
  
  private selectRelevanceFormat(content: string, category: string): string {
    const lowerContent = content.toLowerCase();
    
    // Format selection logic
    if (lowerContent.includes('question') || lowerContent.includes('uncertain')) {
      return 'C'; // Questions format
    }
    
    if (lowerContent.includes('risk') || lowerContent.includes('indicator')) {
      return 'D'; // Risk indicators format
    }
    
    if (lowerContent.includes('narrative') || lowerContent.includes('story')) {
      return 'B'; // Narrative format
    }
    
    // Category-based format selection
    const categoryFormats = {
      'Governance': ['A', 'C', 'D'],
      'Resource Consumption': ['A', 'C', 'B'],
      'Operational Dependency': ['D', 'C', 'A'],
      'Infrastructure': ['D', 'A', 'B'],
      'Reporting & Disclosure': ['C', 'D', 'A'],
      'Sustainability': ['A', 'D', 'B']
    };
    
    const availableFormats = categoryFormats[category as keyof typeof categoryFormats] || ['A'];
    return availableFormats[Math.floor(Math.random() * availableFormats.length)];
  }
  
  private generateBulletRelevance(category: string): string {
    const relevanceAreas = {
      'Governance': '• Governance Readiness\n• Board Visibility\n• Reporting Exposure\n• Oversight Requirements',
      'Resource Consumption': '• AI Resource Intelligence\n• Budget Visibility\n• Cost Control\n• Resource Planning',
      'Operational Dependency': '• Vendor Lock-in\n• Workflow Integration\n• Operational Flexibility\n• Business Continuity',
      'Infrastructure': '• Infrastructure Dependency\n• Capacity Planning\n• Compute Risk\n• External Dependencies',
      'Reporting & Disclosure': '• Reporting Readiness\n• Regulatory Compliance\n• Investor Relations\n• Disclosure Requirements',
      'Sustainability': '• Environmental Impact\n• Energy Management\n• Carbon Footprint\n• Sustainability Reporting'
    };
    
    return relevanceAreas[category as keyof typeof relevanceAreas] || '• Organizational Impact\n• Risk Assessment\n• Strategic Planning';
  }
  
  private generateNarrativeRelevance(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        return 'Organizations should focus on AI resource intelligence and budget visibility to understand token consumption patterns and prevent cost overruns.';
      }
      return 'Organizations need to enhance resource planning and cost control mechanisms to address emerging AI consumption challenges.';
    }
    
    if (category === 'Governance') {
      return 'Organizations should prioritize governance readiness and board visibility to address expanding oversight requirements and stakeholder expectations.';
    }
    
    return 'Organizations should develop operational strategies to address the implications of this emerging signal.';
  }
  
  private generateQuestionRelevance(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        return 'How visible are current AI token costs?\nWhere are token consumption patterns being measured?\nWhat governance visibility exists today?';
      }
      return 'What resource visibility frameworks exist?\nHow are AI costs being tracked?\nWhere are consumption gaps emerging?';
    }
    
    if (category === 'Governance') {
      return 'What governance frameworks are in place?\nHow is AI oversight being structured?\nWhere are governance gaps emerging?';
    }
    
    return 'What operational frameworks need updating?\nHow is organizational readiness being assessed?\nWhere are capability gaps emerging?';
  }
  
  private generateRiskIndicatorRelevance(category: string, content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (category === 'Resource Consumption') {
      if (lowerContent.includes('token') && lowerContent.includes('spend')) {
        return 'Potential indicator:\nLimited AI cost visibility.\n\nPotential indicator:\nGrowing external dependency.\n\nPotential indicator:\nBudget pressure exceeding planning.';
      }
      return 'Potential indicator:\nResource management gaps.\n\nPotential indicator:\nCost control challenges.';
    }
    
    if (category === 'Governance') {
      return 'Potential indicator:\nGovernance readiness gaps.\n\nPotential indicator:\nOversight requirement expansion.';
    }
    
    return 'Potential indicator:\nOperational dependency risks.\n\nPotential indicator:\nStrategic planning gaps.';
  }
  
  private generateRelatedAssessmentAreas(category: string): string {
    const assessmentAreas = {
      'Governance': 'AI Governance Readiness, Board Oversight, Reporting Exposure',
      'Resource Consumption': 'AI Resource Visibility, Budget Planning, Cost Management',
      'Operational Dependency': 'Operational Dependency, Vendor Management, Business Continuity',
      'Infrastructure': 'Infrastructure Dependency, Capacity Planning, Technical Risk',
      'Reporting & Disclosure': 'AI Reporting Readiness, Regulatory Compliance, Investor Relations',
      'Sustainability': 'AI Sustainability Impact, Energy Management, Environmental Reporting'
    };
    
    return assessmentAreas[category as keyof typeof assessmentAreas] || 'Risk Assessment, Strategic Planning';
  }
}

// Agent 5: Editorial Validation Agent
export class EditorialValidationAgent {
  async process(input: Draft2PostInput, outputs: {
    source: SourcePreservationOutput;
    classification: SignalClassificationOutput;
    title: ObservatoryTitleOutput;
    interpretation: MaterialityInterpretationOutput;
  }): Promise<EditorialValidationOutput> {
    
    // Perform editorial validation checks
    const validationChecks = [
      this.validateTitlePreservation(outputs.source, outputs.title),
      this.validateClassification(outputs.classification),
      this.validateObservatoryPurpose(outputs.title, outputs.interpretation),
      this.validateSignalToRelevanceConnection(outputs.interpretation),
      this.validateAbsenceOfHype(outputs.title),
      this.validateAbsenceOfMarketing(outputs.title),
      this.validateVisitorUnderstanding(outputs.title, outputs.interpretation),
      this.validateOperationalRelevance(outputs.interpretation),
      this.validateAssessmentConnection(outputs.interpretation),
      this.validateEvidenceVsBlog(outputs.title, outputs.interpretation),
      this.validateDiversityRequirements(outputs.title, outputs.interpretation),
      this.validateTitlePatternVariation(outputs.title),
      this.validateInterpretationStructure(outputs.interpretation),
      this.validateAssessmentLanguage(outputs.interpretation),
      this.validateObservationUniqueness(outputs.title, outputs.interpretation)
    ];
    
    const failedChecks = validationChecks.filter(check => !check.passed);
    
    if (failedChecks.length === 0) {
      return {
        editorial_status: 'ready_for_review',
        editorial_notes: 'All editorial validation checks passed.'
      };
    } else {
      return {
        editorial_status: 'needs_revision',
        editorial_notes: failedChecks.map(check => check.reason).join('; ')
      };
    }
  }
  
  private validateTitlePreservation(source: SourcePreservationOutput, title: ObservatoryTitleOutput): { passed: boolean; reason?: string } {
    if (!title.observatory_title.includes(source.source_title.substring(0, 20))) {
      return {
        passed: false,
        reason: 'Title does not adequately preserve source signal context'
      };
    }
    return { passed: true };
  }
  
  private validateClassification(classification: SignalClassificationOutput): { passed: boolean; reason?: string } {
    if (classification.classification_confidence < 30) {
      return {
        passed: false,
        reason: 'Classification confidence too low'
      };
    }
    return { passed: true };
  }
  
  private validateObservatoryPurpose(title: ObservatoryTitleOutput, interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    if (!interpretation.what_this_may_indicate.includes('organizational') && 
        !interpretation.what_this_may_indicate.includes('operation')) {
      return {
        passed: false,
        reason: 'Article does not align with Observatory purpose of connecting signals to organizational relevance'
      };
    }
    return { passed: true };
  }
  
  private validateSignalToRelevanceConnection(interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    if (!interpretation.potential_organizational_relevance || 
        interpretation.potential_organizational_relevance.length < 20) {
      return {
        passed: false,
        reason: 'Missing clear signal-to-organizational-relevance connection'
      };
    }
    return { passed: true };
  }
  
  private validateAbsenceOfHype(title: ObservatoryTitleOutput): { passed: boolean; reason?: string } {
    const hypeWords = ['revolutionary', 'game-changing', 'groundbreaking', 'breakthrough', 'unprecedented'];
    const combinedText = (title.observatory_title + ' ' + title.meta_description).toLowerCase();
    
    for (const hypeWord of hypeWords) {
      if (combinedText.includes(hypeWord)) {
        return {
          passed: false,
          reason: `Contains hype language: ${hypeWord}`
        };
      }
    }
    return { passed: true };
  }
  
  private validateAbsenceOfMarketing(title: ObservatoryTitleOutput): { passed: boolean; reason?: string } {
    const marketingWords = ['transform', 'innovate', 'disrupt', 'revolutionize', 'paradigm shift'];
    const combinedText = (title.observatory_title + ' ' + title.meta_description).toLowerCase();
    
    for (const marketingWord of marketingWords) {
      if (combinedText.includes(marketingWord)) {
        return {
          passed: false,
          reason: `Contains marketing language: ${marketingWord}`
        };
      }
    }
    return { passed: true };
  }
  
  private validateVisitorUnderstanding(title: ObservatoryTitleOutput, interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check if title and interpretation clearly explain why signal matters
    const titleExplainsSignificance = title.observatory_title.includes('Signal') || 
                                     title.observatory_title.includes('What') ||
                                     title.observatory_title.includes('May');
    
    const interpretationExplainsImpact = interpretation.what_this_may_indicate.includes('may') &&
                                       interpretation.what_this_may_indicate.length > 50;
    
    if (!titleExplainsSignificance) {
      return {
        passed: false,
        reason: 'Title does not clearly explain signal significance'
      };
    }
    
    if (!interpretationExplainsImpact) {
      return {
        passed: false,
        reason: 'Interpretation does not clearly explain impact'
      };
    }
    
    return { passed: true };
  }
  
  private validateOperationalRelevance(interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check if interpretation focuses on operational relevance
    const operationalKeywords = ['operational', 'visibility', 'dependency', 'governance', 'reporting', 'resources', 'sustainability'];
    const interpretationText = (interpretation.what_this_may_indicate + ' ' + interpretation.potential_organizational_relevance).toLowerCase();
    
    const hasOperationalFocus = operationalKeywords.some(keyword => interpretationText.includes(keyword));
    
    // Check for non-operational consulting language
    const consultingKeywords = ['strategic', 'competitive', 'advantage', 'opportunity', 'innovation', 'growth'];
    const hasConsultingLanguage = consultingKeywords.some(keyword => interpretationText.includes(keyword));
    
    if (!hasOperationalFocus) {
      return {
        passed: false,
        reason: 'Interpretation lacks operational relevance focus'
      };
    }
    
    if (hasConsultingLanguage) {
      return {
        passed: false,
        reason: 'Interpretation contains consulting language'
      };
    }
    
    return { passed: true };
  }
  
  private validateAssessmentConnection(interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check if related assessment areas are specific and relevant
    const assessmentAreas = interpretation.related_assessment_areas.toLowerCase();
    
    // Reject vague assessment labels
    const vagueLabels = ['risk assessment', 'strategic planning', 'business impact'];
    const hasVagueLabels = vagueLabels.some(label => assessmentAreas.includes(label));
    
    // Look for specific assessment dimensions
    const specificDimensions = ['governance', 'visibility', 'dependency', 'reporting', 'resources', 'sustainability'];
    const hasSpecificDimensions = specificDimensions.some(dim => assessmentAreas.includes(dim));
    
    if (hasVagueLabels) {
      return {
        passed: false,
        reason: 'Assessment areas contain vague labels'
      };
    }
    
    if (!hasSpecificDimensions) {
      return {
        passed: false,
        reason: 'Assessment areas lack specific dimensions'
      };
    }
    
    return { passed: true };
  }
  
  private validateEvidenceVsBlog(title: ObservatoryTitleOutput, interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check if content reads like evidence rather than blog post
    const combinedText = (title.observatory_title + ' ' + interpretation.what_this_may_indicate).toLowerCase();
    
    // Blog post indicators
    const blogIndicators = ['how to', 'why you should', 'best practices', 'tips for', 'guide to'];
    const hasBlogIndicators = blogIndicators.some(indicator => combinedText.includes(indicator));
    
    // Evidence indicators
    const evidenceIndicators = ['signal', 'indicate', 'may', 'potential', 'emerging'];
    const hasEvidenceIndicators = evidenceIndicators.some(indicator => combinedText.includes(indicator));
    
    if (hasBlogIndicators) {
      return {
        passed: false,
        reason: 'Content reads like blog post rather than evidence'
      };
    }
    
    if (!hasEvidenceIndicators) {
      return {
        passed: false,
        reason: 'Content lacks evidence-based language'
      };
    }
    
    return { passed: true };
  }
  
  private validateDiversityRequirements(title: ObservatoryTitleOutput, interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check for diversity in structure and phrasing
    const interpretationText = interpretation.what_this_may_indicate.toLowerCase();
    
    // Check for repetitive patterns
    const repetitivePatterns = ['organizations may', 'ai may be', 'this may indicate'];
    const hasRepetitivePatterns = repetitivePatterns.some(pattern => interpretationText.includes(pattern));
    
    if (hasRepetitivePatterns) {
      return {
        passed: false,
        reason: 'Interpretation contains repetitive phrasing patterns'
      };
    }
    
    return { passed: true };
  }
  
  private validateTitlePatternVariation(title: ObservatoryTitleOutput): { passed: boolean; reason?: string } {
    // Check if title uses varied patterns rather than always the same structure
    const titleText = title.observatory_title;
    
    // Count pattern occurrences
    const patternCounts = {
      'A Signal of': (titleText.match(/A Signal of/g) || []).length,
      'What': (titleText.match(/What/g) || []).length,
      'Why': (titleText.match(/Why/g) || []).length,
      'An Indicator Of': (titleText.match(/An Indicator Of/g) || []).length,
      'Questions': (titleText.match(/Questions/g) || []).length
    };
    
    // If too many of the same pattern, it may indicate overuse
    const dominantPatternCount = Math.max(...Object.values(patternCounts));
    if (dominantPatternCount > 3) {
      return {
        passed: false,
        reason: 'Title pattern may be overused'
      };
    }
    
    return { passed: true };
  }
  
  private validateInterpretationStructure(interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check for structural variety in interpretation
    const interpretationText = interpretation.what_this_may_indicate;
    
    // Check sentence structure variety
    const sentenceStarts = [
      interpretationText.startsWith('AI '),
      interpretationText.startsWith('Governance '),
      interpretationText.startsWith('Infrastructure '),
      interpretationText.startsWith('Resource '),
      interpretationText.startsWith('Organizations '),
      interpretationText.startsWith('Stakeholders '),
      interpretationText.startsWith('Investor '),
      interpretationText.startsWith('Board ')
    ];
    
    const hasVariedStarts = sentenceStarts.filter(start => start).length > 0;
    
    // Check for paragraph vs bullet structure variety
    const relevanceText = interpretation.potential_organizational_relevance;
    const isBulletFormat = relevanceText.includes('•') || relevanceText.includes('\n•');
    const isQuestionFormat = relevanceText.includes('?');
    const isNarrativeFormat = !isBulletFormat && !isQuestionFormat && relevanceText.length > 100;
    
    const hasFormatVariety = isBulletFormat || isQuestionFormat || isNarrativeFormat;
    
    if (!hasVariedStarts && !hasFormatVariety) {
      return {
        passed: false,
        reason: 'Interpretation structure lacks variety'
      };
    }
    
    return { passed: true };
  }
  
  private validateAssessmentLanguage(interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check for repetitive assessment language
    const assessmentText = interpretation.related_assessment_areas.toLowerCase();
    
    // Look for vague or overused assessment labels
    const vagueLabels = ['risk assessment', 'strategic planning', 'business impact', 'organizational impact'];
    const hasVagueLabels = vagueLabels.some(label => assessmentText.includes(label));
    
    if (hasVagueLabels) {
      return {
        passed: false,
        reason: 'Assessment areas contain vague or overused labels'
      };
    }
    
    return { passed: true };
  }
  
  private validateObservationUniqueness(title: ObservatoryTitleOutput, interpretation: MaterialityInterpretationOutput): { passed: boolean; reason?: string } {
    // Check if this observation would feel unique compared to typical patterns
    const combinedText = (title.observatory_title + ' ' + interpretation.what_this_may_indicate).toLowerCase();
    
    // Check for template-like language
    const templateIndicators = [
      'this signal may indicate emerging ai',
      'this signal may indicate operational significance',
      'organizations may want to consider',
      'organizations should consider'
    ];
    
    const hasTemplateLanguage = templateIndicators.some(indicator => combinedText.includes(indicator));
    
    if (hasTemplateLanguage) {
      return {
        passed: false,
        reason: 'Observation reads like template rather than unique analysis'
      };
    }
    
    return { passed: true };
  }
}

// Main Draft2Post Pipeline
export class Draft2PostPipeline {
  private sourceAgent = new SourcePreservationAgent();
  private classificationAgent = new SignalClassificationAgent();
  private titleAgent = new ObservatoryTitleAgent();
  private interpretationAgent = new MaterialityInterpretationAgent();
  private validationAgent = new EditorialValidationAgent();
  private qualityControlAgent: { processObservation: (current: any, env: any) => Promise<any> } | null = null; // Will be initialized dynamically
  
  async process(input: Draft2PostInput): Promise<Partial<EnhancedArticle>> {
    console.log('DRAFT2POST PIPELINE: START');
    
    try {
      // Agent 1: Source Preservation
      console.log('DRAFT2POST: Source Preservation - START');
      const sourceOutput = await this.sourceAgent.process(input);
      console.log('DRAFT2POST: Source Preservation - SUCCESS');
      
      // Agent 2: Signal Classification
      console.log('DRAFT2POST: Signal Classification - START');
      const classificationOutput = await this.classificationAgent.process(input);
      console.log('DRAFT2POST: Signal Classification - SUCCESS');
      
      // Agent 3: Observatory Title
      console.log('DRAFT2POST: Observatory Title - START');
      const titleOutput = await this.titleAgent.process(input, sourceOutput, classificationOutput);
      console.log('DRAFT2POST: Observatory Title - SUCCESS');
      
      // Agent 4: Materiality Interpretation
      console.log('DRAFT2POST: Materiality Interpretation - START');
      const interpretationOutput = await this.interpretationAgent.process(input, classificationOutput);
      console.log('DRAFT2POST: Materiality Interpretation - SUCCESS');
      
      // Agent 5: Editorial Validation
      console.log('DRAFT2POST: Editorial Validation - START');
      const validationOutput = await this.validationAgent.process(input, {
        source: sourceOutput,
        classification: classificationOutput,
        title: titleOutput,
        interpretation: interpretationOutput
      });
      console.log('DRAFT2POST: Editorial Validation - SUCCESS');
      
      // Combine all outputs
      const enhancements: Partial<EnhancedArticle> = {
        // Source preservation
        source_title: sourceOutput.source_title,
        source_publication: sourceOutput.source_publication,
        source_summary: sourceOutput.source_summary,
        source_keywords: sourceOutput.source_keywords,
        
        // Signal classification
        signal_category: classificationOutput.signal_category,
        classification_reason: classificationOutput.classification_reason,
        classification_confidence: classificationOutput.classification_confidence,
        
        // Observatory presentation
        observatory_title: titleOutput.observatory_title,
        observatory_slug: titleOutput.observatory_slug,
        meta_title: titleOutput.meta_title,
        meta_description: titleOutput.meta_description,
        
        // Materiality interpretation
        what_this_may_indicate: interpretationOutput.what_this_may_indicate,
        potential_organizational_relevance: interpretationOutput.potential_organizational_relevance,
        related_assessment_areas: interpretationOutput.related_assessment_areas,
        
        // Editorial workflow
        editorial_status: validationOutput.editorial_status,
        editorial_notes: validationOutput.editorial_notes
      };
      
      console.log('DRAFT2POST PIPELINE: SUCCESS');
      return enhancements;
      
    } catch (error) {
      console.error('DRAFT2POST PIPELINE: ERROR', error);
      throw error;
    }
  }
}
