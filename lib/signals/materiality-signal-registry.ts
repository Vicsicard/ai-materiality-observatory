export interface MaterialitySignal {
  id: string;
  label: string;
  definition: string;
  evidence_patterns: EvidencePattern[];
  qualifying_examples: string[];
  disqualifying_examples: string[];
  aidma_dimension_weights: Record<string, number>;
}

export interface EvidencePattern {
  pattern: string;
  weight: number;
  description: string;
  examples: string[];
}

export interface SignalType {
  OPERATIONAL_DEPENDENCY: 'operational_dependency';
  RESOURCE_READINESS: 'resource_readiness';
  VISIBILITY_GAP: 'visibility_gap';
  GOVERNANCE_PRESSURE: 'governance_pressure';
  REPORTING_PRESSURE: 'reporting_pressure';
  INFRASTRUCTURE_READINESS: 'infrastructure_readiness';
  SUSTAINABILITY_IMPACT: 'sustainability_impact';
}

export const MATERIALITY_SIGNALS: Record<keyof SignalType, MaterialitySignal> = {
  OPERATIONAL_DEPENDENCY: {
    id: 'operational_dependency',
    label: 'Operational Dependency',
    definition: 'Evidence that organizations increasingly rely on AI to perform operational work that affects business outcomes.',
    evidence_patterns: [
      {
        pattern: 'AI (replaces|handles|performs|manages|automates)',
        weight: 0.8,
        description: 'AI directly performing operational tasks',
        examples: [
          'AI replaces developers in coding tasks',
          'AI handles customer service interactions',
          'AI performs data analysis operations'
        ]
      },
      {
        pattern: '(core business|critical processes|operational tasks)',
        weight: 0.9,
        description: 'AI in business-critical functions',
        examples: [
          'AI in core business processes',
          'AI supporting critical operations',
          'AI automating operational workflows'
        ]
      },
      {
        pattern: '(enterprise adoption|business integration|workflow automation)',
        weight: 0.7,
        description: 'Organizational AI integration',
        examples: [
          'Enterprise AI adoption trends',
          'Business process AI integration',
          'Workflow automation implementation'
        ]
      },
      {
        pattern: '(copilot|assistant|agent) (adoption|usage|integration)',
        weight: 0.8,
        description: 'AI assistant tools in operations',
        examples: [
          'GitHub Copilot adoption in development',
          'AI assistant integration in workflows',
          'Enterprise copilot deployment'
        ]
      }
    ],
    qualifying_examples: [
      'AI coding agents now handle 40% of development tasks',
      'Customer service AI resolves 80% of inquiries without human intervention',
      'Enterprise workflow automation reduces manual processing by 60%',
      'AI decision support systems now guide operational decisions'
    ],
    disqualifying_examples: [
      'AI could potentially help with business processes',
      'Companies are considering AI for future automation',
      'AI tools are available for business use',
      'AI market growth indicates interest'
    ],
    aidma_dimension_weights: {
      'AI Visibility': 0.9,
      'Resource Readiness': 0.6,
      'Operational Dependency': 1.0,
      'Infrastructure Readiness': 0.5,
      'Governance Readiness': 0.6,
      'Sustainability Readiness': 0.2,
      'Reporting Pressure': 0.4
    }
  },

  RESOURCE_READINESS: {
    id: 'resource_readiness',
    label: 'Resource Readiness',
    definition: 'Evidence that AI requires measurable organizational resources including budget, infrastructure, and planning.',
    evidence_patterns: [
      {
        pattern: '(token cost|pricing|licensing|subscription)',
        weight: 0.9,
        description: 'Direct AI costs and pricing',
        examples: [
          'Token pricing at $0.10 per thousand',
          'AI licensing costs per user',
          'Subscription pricing for AI tools'
        ]
      },
      {
        pattern: '(budget impact|financial planning|resource allocation)',
        weight: 0.8,
        description: 'Financial resource implications',
        examples: [
          'AI tool costs affecting budget planning',
          'Financial planning for AI adoption',
          'Resource allocation for AI initiatives'
        ]
      },
      {
        pattern: '(operational cost|enterprise spending|cost management)',
        weight: 0.7,
        description: 'Organizational cost impact',
        examples: [
          'Operational costs of AI deployment',
          'Enterprise AI spending trends',
          'Cost management for AI tools'
        ]
      },
      {
        pattern: '(compute|infrastructure|capacity) (requirements|needs)',
        weight: 0.6,
        description: 'Infrastructure resource needs',
        examples: [
          'Compute requirements for AI workloads',
          'Infrastructure capacity planning',
          'AI resource needs assessment'
        ]
      }
    ],
    qualifying_examples: [
      'Claude Code pricing at $20/month per user affects development team budgets',
      'Enterprise AI licensing costs reaching $1M annually',
      'Token consumption costs becoming material line item',
      'AI infrastructure spending increasing 300% year-over-year'
    ],
    disqualifying_examples: [
      'AI tools have various pricing models',
      'Companies should budget for AI',
      'AI costs may decrease over time',
      'Pricing competition in AI market'
    ],
    aidma_dimension_weights: {
      'AI Visibility': 0.8,
      'Resource Readiness': 1.0,
      'Operational Dependency': 0.6,
      'Infrastructure Readiness': 0.7,
      'Governance Readiness': 0.3,
      'Sustainability Readiness': 0.5,
      'Reporting Pressure': 0.5
    }
  },

  VISIBILITY_GAP: {
    id: 'visibility_gap',
    label: 'Visibility Gap',
    definition: 'Evidence that organizations lack visibility into AI usage, adoption, or exposure.',
    evidence_patterns: [
      {
        pattern: '(shadow AI|unknown adoption|untracked)',
        weight: 0.9,
        description: 'Hidden or unmonitored AI usage',
        examples: [
          'Shadow AI discovered in departments',
          'Unknown AI adoption across enterprise',
          'Untracked AI tool usage'
        ]
      },
      {
        pattern: '(blind spots|incomplete inventory|undocumented)',
        weight: 0.8,
        description: 'Lack of comprehensive tracking',
        examples: [
          'AI inventory reveals blind spots',
          'Incomplete AI tool documentation',
          'Undocumented AI implementations'
        ]
      },
      {
        pattern: '(decentralized|unsanctioned|unmonitored)',
        weight: 0.7,
        description: 'Lack of centralized oversight',
        examples: [
          'Decentralized AI procurement',
          'Unsanctioned AI tool adoption',
          'Unmonitored AI usage patterns'
        ]
      },
      {
        pattern: '(survey|study) shows (hidden|unknown|untracked)',
        weight: 0.8,
        description: 'Research revealing visibility gaps',
        examples: [
          'Survey shows hidden AI adoption',
          'Study reveals untracked AI costs',
          'Research uncovers AI blind spots'
        ]
      }
    ],
    qualifying_examples: [
      'Survey finds 70% of AI usage is untracked by IT departments',
      'Study reveals $2.4M in undisclosed AI spending',
      'Audit discovers shadow AI tools in 85% of departments',
      'Enterprise AI inventory shows 60% undocumented usage'
    ],
    disqualifying_examples: [
      'Companies should track AI usage',
      'AI governance requires visibility',
      'Departments may be using AI tools',
      'Better monitoring needed for AI'
    ],
    aidma_dimension_weights: {
      'AI Visibility': 1.0,
      'Resource Readiness': 0.5,
      'Operational Dependency': 0.4,
      'Infrastructure Readiness': 0.2,
      'Governance Readiness': 0.8,
      'Sustainability Readiness': 0.2,
      'Reporting Pressure': 0.6
    }
  },

  GOVERNANCE_PRESSURE: {
    id: 'governance_pressure',
    label: 'Governance Pressure',
    definition: 'Evidence that organizations face increasing oversight expectations for AI systems.',
    evidence_patterns: [
      {
        pattern: '(regulation|policy|oversight|compliance)',
        weight: 0.9,
        description: 'Formal governance requirements',
        examples: [
          'New AI regulations require compliance',
          'Board oversight of AI policies',
          'Compliance frameworks for AI systems'
        ]
      },
      {
        pattern: '(board level|executive|leadership) AI',
        weight: 0.8,
        description: 'High-level governance involvement',
        examples: [
          'Board-level AI governance discussions',
          'Executive leadership on AI strategy',
          'C-suite AI oversight responsibilities'
        ]
      },
      {
        pattern: '(risk management|controls|standards)',
        weight: 0.7,
        description: 'Risk and control frameworks',
        examples: [
          'AI risk management frameworks',
          'Control standards for AI systems',
          'AI governance standards development'
        ]
      },
      {
        pattern: '(mandate|requirement|directive)',
        weight: 0.8,
        description: 'Compulsory governance measures',
        examples: [
          'Mandatory AI governance policies',
          'Regulatory requirements for AI oversight',
          'Directives on AI compliance'
        ]
      }
    ],
    qualifying_examples: [
      'SEC issues guidance on AI risk disclosure requirements',
      'EU AI Act creates compliance obligations for enterprises',
      'Board of directors establishes AI governance committee',
      'Industry standards body releases AI governance framework'
    ],
    disqualifying_examples: [
      'Companies should have AI governance',
      'AI governance is becoming important',
      'Best practices include AI oversight',
      'Regulators may consider AI rules'
    ],
    aidma_dimension_weights: {
      'AI Visibility': 0.8,
      'Resource Readiness': 0.3,
      'Operational Dependency': 0.5,
      'Infrastructure Readiness': 0.3,
      'Governance Readiness': 1.0,
      'Sustainability Readiness': 0.4,
      'Reporting Pressure': 0.7
    }
  },

  REPORTING_PRESSURE: {
    id: 'reporting_pressure',
    label: 'Reporting Pressure',
    definition: 'Evidence that organizations may need to disclose or explain AI usage to stakeholders.',
    evidence_patterns: [
      {
        pattern: '(disclosure|reporting|transparency)',
        weight: 0.9,
        description: 'Disclosure and reporting requirements',
        examples: [
          'AI risk disclosure requirements',
          'Transparency reporting for AI systems',
          'Mandatory AI usage disclosures'
        ]
      },
      {
        pattern: '(IPO|SEC|public company) (AI|risk)',
        weight: 0.8,
        description: 'Public company disclosure obligations',
        examples: [
          'IPO filings mention AI exposure',
          'SEC guidance on AI risk disclosure',
          'Public company AI reporting requirements'
        ]
      },
      {
        pattern: '(investor|stakeholder) (AI|disclosure)',
        weight: 0.7,
        description: 'Stakeholder disclosure demands',
        examples: [
          'Investor demands for AI disclosure',
          'Stakeholder AI transparency expectations',
          'Shareholder AI risk reporting'
        ]
      },
      {
        pattern: '(regulatory reporting|compliance disclosure)',
        weight: 0.8,
        description: 'Regulatory disclosure requirements',
        examples: [
          'Regulatory AI reporting mandates',
          'Compliance disclosure obligations',
          'Government AI transparency requirements'
        ]
      }
    ],
    qualifying_examples: [
      'SEC requires public companies to disclose AI risks in 10-K filings',
      'Investor surveys show 85% demand AI usage transparency',
      'IPO risk factors increasingly mention AI dependency',
      'EU regulations mandate AI system transparency reporting'
    ],
    disqualifying_examples: [
      'Companies should be transparent about AI',
      'Investors may ask about AI usage',
      'Disclosure best practices include AI',
      'Reporting standards may address AI'
    ],
    aidma_dimension_weights: {
      'AI Visibility': 0.9,
      'Resource Readiness': 0.5,
      'Operational Dependency': 0.3,
      'Infrastructure Readiness': 0.2,
      'Governance Readiness': 0.8,
      'Sustainability Readiness': 0.4,
      'Reporting Pressure': 1.0
    }
  },

  INFRASTRUCTURE_READINESS: {
    id: 'infrastructure_readiness',
    label: 'Infrastructure Readiness',
    definition: 'Evidence that AI adoption requires supporting infrastructure investments.',
    evidence_patterns: [
      {
        pattern: '(datacenter|energy|GPU|networking)',
        weight: 0.8,
        description: 'Physical infrastructure requirements',
        examples: [
          'Datacenter expansion for AI workloads',
          'Energy requirements for AI systems',
          'GPU procurement for AI inference'
        ]
      },
      {
        pattern: '(cloud capacity|compute expansion|infrastructure)',
        weight: 0.7,
        description: 'Cloud and compute infrastructure',
        examples: [
          'Cloud capacity planning for AI',
          'Compute expansion for AI workloads',
          'Infrastructure upgrades for AI systems'
        ]
      },
      {
        pattern: '(power|cooling|facility) (requirements|needs)',
        weight: 0.6,
        description: 'Facility infrastructure needs',
        examples: [
          'Power requirements for AI datacenters',
          'Cooling needs for AI systems',
          'Facility upgrades for AI infrastructure'
        ]
      },
      {
        pattern: '(capacity planning|resource constraints|bottlenecks)',
        weight: 0.7,
        description: 'Infrastructure capacity challenges',
        examples: [
          'AI capacity planning challenges',
          'Infrastructure resource constraints',
          'Compute bottlenecks for AI systems'
        ]
      }
    ],
    qualifying_examples: [
      'AI workloads drive 40% increase in datacenter capacity needs',
      'GPU procurement lead times extend to 6 months due to AI demand',
      'Energy consumption for AI systems requires grid upgrades',
      'Cloud providers report AI infrastructure capacity constraints'
    ],
    disqualifying_examples: [
      'AI requires computing resources',
      'Companies need infrastructure for AI',
      'Cloud providers support AI workloads',
      'Datacenters can handle AI systems'
    ],
    aidma_dimension_weights: {
      'AI Visibility': 0.5,
      'Resource Readiness': 0.9,
      'Operational Dependency': 0.6,
      'Infrastructure Readiness': 1.0,
      'Governance Readiness': 0.5,
      'Sustainability Readiness': 0.8,
      'Reporting Pressure': 0.3
    }
  },

  SUSTAINABILITY_IMPACT: {
    id: 'sustainability_impact',
    label: 'Sustainability Impact',
    definition: 'Evidence that AI operations create environmental consequences or sustainability considerations.',
    evidence_patterns: [
      {
        pattern: '(energy consumption|power usage|electricity)',
        weight: 0.8,
        description: 'Energy and power consumption',
        examples: [
          'AI systems energy consumption data',
          'Power usage for AI inference',
          'Electricity needs for AI datacenters'
        ]
      },
      {
        pattern: '(carbon|emissions|footprint)',
        weight: 0.9,
        description: 'Carbon emissions and environmental footprint',
        examples: [
          'AI carbon footprint measurements',
          'Carbon emissions from AI systems',
          'Environmental footprint of AI operations'
        ]
      },
      {
        pattern: '(water usage|cooling|efficiency)',
        weight: 0.7,
        description: 'Water usage and efficiency concerns',
        examples: [
          'Water consumption for AI cooling',
          'AI system efficiency metrics',
          'Cooling requirements for AI infrastructure'
        ]
      },
      {
        pattern: '(environmental|ESG|sustainability) (reporting|impact)',
        weight: 0.8,
        description: 'Environmental reporting and impact',
        examples: [
          'Environmental impact of AI systems',
          'ESG reporting for AI operations',
          'Sustainability metrics for AI'
        ]
      }
    ],
    qualifying_examples: [
      'AI training consumes 300MW of electricity, equivalent to 100,000 homes',
      'Datacenter water usage increases 40% due to AI cooling requirements',
      'AI operations contribute 2.5% of corporate carbon footprint',
      'Company reports AI energy consumption in sustainability disclosures'
    ],
    disqualifying_examples: [
      'AI should be more efficient',
      'Green computing is important',
      'Companies should consider environmental impact',
      'AI may have sustainability implications'
    ],
    aidma_dimension_weights: {
      'AI Visibility': 0.6,
      'Resource Readiness': 0.8,
      'Operational Dependency': 0.3,
      'Infrastructure Readiness': 0.8,
      'Governance Readiness': 0.5,
      'Sustainability Readiness': 1.0,
      'Reporting Pressure': 0.7
    }
  }
};

export function getSignalById(id: string): MaterialitySignal | undefined {
  return Object.values(MATERIALITY_SIGNALS).find(signal => signal.id === id);
}

export function getAllSignals(): MaterialitySignal[] {
  return Object.values(MATERIALITY_SIGNALS);
}

export function getAIDMADimensions(): string[] {
  return [
    'AI Visibility',
    'Resource Readiness', 
    'Operational Dependency',
    'Infrastructure Readiness',
    'Governance Readiness',
    'Sustainability Readiness',
    'Reporting Pressure'
  ];
}
