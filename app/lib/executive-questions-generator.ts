// Executive Questions Generator for V3 Template
export interface ExecutiveQuestion {
  question: string;
  signal_type: string;
  category: 'visibility' | 'dependency' | 'governance' | 'readiness';
}

export class ExecutiveQuestionsGenerator {
  private static questionTemplates = {
    'AI Visibility': [
      'How many teams currently use AI-enabled tools across the organization?',
      'Which workflows depend on AI-assisted outputs for critical operations?',
      'Are AI-related costs being tracked and allocated to the appropriate departments?',
      'Is AI adoption visible across all business units or concentrated in specific areas?',
      'Do we have a comprehensive inventory of AI tools and services in use?',
      'How do we monitor AI usage patterns and adoption trends?',
      'What visibility gaps exist in our understanding of AI deployment?',
      'Are shadow AI activities occurring outside official channels?'
    ],
    'Operational Dependency': [
      'Which critical business processes depend on AI systems for daily operations?',
      'What would be the impact if key AI services became unavailable?',
      'Do we have contingency plans for AI service disruptions?',
      'How embedded are AI tools in our core workflows?',
      'What vendor lock-in risks exist with our current AI dependencies?',
      'Are we building operational flexibility around AI services?',
      'How do we measure the operational significance of AI dependencies?',
      'What escalation paths exist for AI service failures?'
    ],
    'Governance Pressure': [
      'Are governance processes keeping pace with AI adoption across the organization?',
      'Do we have clear policies for AI use, data handling, and decision-making?',
      'How are we preparing for potential AI regulations and compliance requirements?',
      'What governance structures exist to oversee AI deployment and usage?',
      'Are we documenting AI decisions and their business impacts?',
      'How do we ensure AI alignment with organizational values and ethics?',
      'What reporting mechanisms exist for AI incidents or concerns?',
      'Are board-level discussions addressing AI risks and opportunities?'
    ],
    'Resource Readiness': [
      'Are we adequately resourced for scaling AI adoption across the organization?',
      'What skills gaps exist in our workforce for effective AI utilization?',
      'How are we budgeting for AI infrastructure, tools, and training?',
      'Do we have the technical expertise to manage AI systems effectively?',
      'What investments are needed for AI governance and oversight?',
      'How do we measure ROI on AI investments and resource allocation?',
      'Are our current resources sufficient for our AI ambitions?',
      'What partnerships or external expertise do we need to consider?'
    ]
  };

  static generateQuestions(signalType: string, count: number = 6): string[] {
    const templates = this.questionTemplates[signalType as keyof typeof this.questionTemplates] || this.questionTemplates['AI Visibility'];
    
    // Shuffle and select questions
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  static generateAllSignalQuestions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    Object.keys(this.questionTemplates).forEach(signalType => {
      result[signalType] = this.generateQuestions(signalType, 6);
    });
    
    return result;
  }

  static getQuestionCategories(): Record<string, string[]> {
    return {
      visibility: [
        'How many teams currently use AI-enabled tools across the organization?',
        'Which workflows depend on AI-assisted outputs for critical operations?',
        'Are AI-related costs being tracked and allocated to the appropriate departments?',
        'Is AI adoption visible across all business units or concentrated in specific areas?'
      ],
      dependency: [
        'Which critical business processes depend on AI systems for daily operations?',
        'What would be the impact if key AI services became unavailable?',
        'Do we have contingency plans for AI service disruptions?',
        'How embedded are AI tools in our core workflows?'
      ],
      governance: [
        'Are governance processes keeping pace with AI adoption across the organization?',
        'Do we have clear policies for AI use, data handling, and decision-making?',
        'How are we preparing for potential AI regulations and compliance requirements?',
        'What governance structures exist to oversee AI deployment and usage?'
      ],
      readiness: [
        'Are we adequately resourced for scaling AI adoption across the organization?',
        'What skills gaps exist in our workforce for effective AI utilization?',
        'How are we budgeting for AI infrastructure, tools, and training?',
        'Do we have the technical expertise to manage AI systems effectively?'
      ]
    };
  }

  static generateContextualQuestions(
    signalType: string, 
    eventContext: string,
    organizationSize: 'small' | 'medium' | 'large' = 'medium'
  ): string[] {
    const baseQuestions = this.generateQuestions(signalType, 4);
    
    // Add contextual questions based on event
    const contextualQuestions: string[] = [];
    
    if (eventContext.toLowerCase().includes('framework') || eventContext.toLowerCase().includes('governance')) {
      contextualQuestions.push(
        'How does our current AI governance framework compare to emerging standards?',
        'What gaps exist between our policies and industry best practices?'
      );
    }
    
    if (eventContext.toLowerCase().includes('infrastructure') || eventContext.toLowerCase().includes('scaling')) {
      contextualQuestions.push(
        'Is our infrastructure prepared for the scale of AI adoption we anticipate?',
        'What technical debt might we be accumulating with rapid AI deployment?'
      );
    }
    
    if (eventContext.toLowerCase().includes('cost') || eventContext.toLowerCase().includes('budget')) {
      contextualQuestions.push(
        'Are we tracking the total cost of ownership for AI systems?',
        'How do we balance AI investment against operational ROI?'
      );
    }
    
    // Add organization-size specific questions
    if (organizationSize === 'large') {
      contextualQuestions.push(
        'How do we ensure consistent AI governance across multiple business units?',
        'What mechanisms exist for enterprise-wide AI coordination?'
      );
    } else if (organizationSize === 'small') {
      contextualQuestions.push(
        'How can we leverage AI to compete with larger organizations?',
        'What AI capabilities provide the greatest competitive advantage for our size?'
      );
    }
    
    return [...baseQuestions, ...contextualQuestions.slice(0, 2)];
  }
}
