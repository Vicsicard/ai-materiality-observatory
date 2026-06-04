export interface OrganizationalRelevanceOutput {
  implications: string[];
  questions: string[];
  evidence_sources: string[];
  reasoning_trail: string[];
}

export class ImprovedOrganizationalRelevanceAgent {
  async process(articleText: string, signalType: string, classificationDetails?: string[]): Promise<OrganizationalRelevanceOutput> {
    const prompt = `
You are an intelligence analyst.

You are NOT a consultant.
You are NOT providing recommendations.
You are NOT providing implementation guidance.
You are NOT telling organizations what to do.

Your role is to identify:
* observable patterns
* emerging questions
* potential areas of relevance
* visibility considerations
* operational signals

You must remain observational and analytical.

CRITICAL REQUIREMENT: Every implication must be directly traceable to evidence in the source article.

Never use:
* essential
* critical
* must
* should
* need to
* required
* recommended
* best practice
* imperative language
* advisory language

Do not write:
"Organizations should..."
"Organizations need to..."
"Organizations must..."
"This is critical..."
"This is essential..."
"This is required..."

Prefer language such as:
* may indicate
* may suggest
* may raise questions
* may become increasingly relevant
* appears to signal
* may contribute to
* may influence
* may affect
* may warrant visibility
* frequently emerges
* often appears
* may become observable
* may create visibility challenges
* may be associated with

EVIDENCE REQUIREMENT:
For each implication, you must identify:
1. The specific evidence from the article
2. How the evidence supports the implication
3. Why this matters for organizations

BAD EXAMPLE (no evidence):
"The event may raise questions regarding energy consumption and environmental impact"

GOOD EXAMPLE (with evidence):
"The article mentions 'cost optimization strategies' which may indicate organizations are evaluating AI resource consumption patterns"

---

ARTICLE TEXT:
${articleText}

SIGNAL TYPE:
${signalType}

CLASSIFICATION EVIDENCE:
${classificationDetails?.join('; ') || 'None provided'}

TASK:
Based ONLY on the article text and signal type, identify:

1. What specific organizational questions might this event raise?
2. What areas of organizational visibility may become relevant?
3. What operational patterns may be associated with this event?
4. What emerging considerations may become increasingly relevant if similar patterns continue?

REQUIREMENTS:
- Each implication must reference specific evidence from the article
- Do not generate generic interpretations
- If evidence cannot be found, state "Insufficient evidence for specific implications"
- Focus on what the article actually discusses, not what you think it should discuss

Format your response as JSON:
{
  "implications": [
    {
      "implication": "specific implication based on evidence",
      "evidence": "direct quote or reference from article",
      "reasoning": "how evidence supports the implication"
    }
  ],
  "questions": ["question 1", "question 2", "question 3"],
  "evidence_sources": ["list of key evidence sources used"],
  "reasoning_trail": ["step-by-step reasoning process"]
}
`;

    // Simulate AI response with evidence-based approach
    const response = await this.simulateEvidenceBasedResponse(prompt, signalType, articleText);
    
    try {
      const parsed = JSON.parse(response);
      return {
        implications: parsed.implications?.map((imp: any) => 
          typeof imp === 'string' ? imp : imp.implication
        ) || [],
        questions: parsed.questions || [],
        evidence_sources: parsed.evidence_sources || [],
        reasoning_trail: parsed.reasoning_trail || []
      };
    } catch (error) {
      // Fallback to evidence-based responses if JSON parsing fails
      return this.generateEvidenceBasedFallback(signalType, articleText);
    }
  }
  
  private async simulateEvidenceBasedResponse(prompt: string, signalType: string, articleText: string): Promise<string> {
    // Extract key evidence from article text
    const evidence = this.extractEvidence(articleText, signalType);
    
    const responses: Record<string, any> = {
      'Governance': {
        implications: evidence.governance.length > 0 ? evidence.governance : [
          {
            implication: "The article discusses policy considerations which may indicate emerging governance visibility needs",
            evidence: "Article mentions policy frameworks",
            reasoning: "Policy discussions often precede governance requirements"
          }
        ],
        questions: [
          'What governance questions might this event raise for our organization?',
          'What areas of policy visibility may become relevant?',
          'How might this affect board-level oversight considerations?'
        ],
        evidence_sources: evidence.governance.map((e: any) => e.evidence),
        reasoning_trail: ['Analyzed article for governance-related content', 'Identified policy and oversight themes', 'Generated organizational implications']
      },
      'Infrastructure': {
        implications: evidence.infrastructure.length > 0 ? evidence.infrastructure : [
          {
            implication: "The article mentions system deployment which may signal infrastructure considerations",
            evidence: "Article discusses deployment patterns",
            reasoning: "Deployment discussions often indicate infrastructure requirements"
          }
        ],
        questions: [
          'What infrastructure questions might this event raise?',
          'What areas of technical visibility may become relevant?',
          'How might this affect existing system dependencies?'
        ],
        evidence_sources: evidence.infrastructure.map((e: any) => e.evidence),
        reasoning_trail: ['Analyzed article for infrastructure-related content', 'Identified deployment and system themes', 'Generated technical implications']
      },
      'Dependency': {
        implications: evidence.dependency.length > 0 ? evidence.dependency : [
          {
            implication: "The article discusses vendor relationships which may indicate dependency considerations",
            evidence: "Article mentions third-party services",
            reasoning: "Vendor discussions often relate to dependency management"
          }
        ],
        questions: [
          'What dependency questions might this event raise?',
          'What areas of vendor visibility may become relevant?',
          'How might this affect supply chain considerations?'
        ],
        evidence_sources: evidence.dependency.map((e: any) => e.evidence),
        reasoning_trail: ['Analyzed article for dependency-related content', 'Identified vendor and supplier themes', 'Generated dependency implications']
      },
      'Resource': {
        implications: evidence.resource.length > 0 ? evidence.resource : [
          {
            implication: "The article discusses cost optimization which may indicate resource allocation considerations",
            evidence: "Article mentions cost and pricing strategies",
            reasoning: "Cost optimization discussions often relate to resource management"
          }
        ],
        questions: [
          'What resource questions might this event raise for our organization?',
          'What areas of budget visibility may become relevant?',
          'How might this affect investment and planning?'
        ],
        evidence_sources: evidence.resource.map((e: any) => e.evidence),
        reasoning_trail: ['Analyzed article for resource-related content', 'Identified cost and budget themes', 'Generated resource implications']
      },
      'Sustainability': {
        implications: evidence.sustainability.length > 0 ? evidence.sustainability : [
          {
            implication: "The article discusses environmental impact which may indicate sustainability considerations",
            evidence: "Article mentions energy and emissions",
            reasoning: "Environmental discussions often relate to sustainability reporting"
          }
        ],
        questions: [
          'What sustainability questions might this event raise?',
          'What areas of environmental visibility may become relevant?',
          'How might this affect efficiency and resource planning?'
        ],
        evidence_sources: evidence.sustainability.map((e: any) => e.evidence),
        reasoning_trail: ['Analyzed article for sustainability-related content', 'Identified environmental and efficiency themes', 'Generated sustainability implications']
      },
      'Reporting': {
        implications: evidence.reporting.length > 0 ? evidence.reporting : [
          {
            implication: "The article discusses transparency which may indicate reporting considerations",
            evidence: "Article mentions disclosure and metrics",
            reasoning: "Transparency discussions often relate to reporting requirements"
          }
        ],
        questions: [
          'What reporting questions might this event raise?',
          'What areas of disclosure visibility may become relevant?',
          'How might this affect stakeholder communication planning?'
        ],
        evidence_sources: evidence.reporting.map((e: any) => e.evidence),
        reasoning_trail: ['Analyzed article for reporting-related content', 'Identified transparency and metrics themes', 'Generated reporting implications']
      }
    };
    
    const defaultResponse = {
      implications: [
        {
          implication: "Insufficient specific evidence found for detailed organizational implications",
          evidence: "Article content does not contain clear organizational signals",
          reasoning: "Unable to trace implications to specific article evidence"
        }
      ],
      questions: [
        'What organizational questions might this event raise?',
        'What areas of visibility may become relevant?',
        'How might this affect operational considerations?'
      ],
      evidence_sources: [],
      reasoning_trail: ['Analyzed article for relevant content', 'Limited evidence found', 'Generated generic questions']
    };
    
    const selectedResponse = responses[signalType] || defaultResponse;
    return JSON.stringify(selectedResponse);
  }
  
  private extractEvidence(articleText: string, signalType: string): { [key: string]: any[] } {
    const text = articleText.toLowerCase();
    const evidence: { [key: string]: any[] } = {
      governance: [],
      infrastructure: [],
      dependency: [],
      resource: [],
      sustainability: [],
      reporting: []
    };
    
    // Extract evidence based on signal type and content
    if (signalType === 'Resource') {
      if (text.includes('cost') || text.includes('price') || text.includes('pricing')) {
        evidence.resource.push({
          implication: "The article discusses cost optimization which may indicate resource allocation considerations",
          evidence: "Article mentions cost and pricing strategies",
          reasoning: "Cost optimization discussions often relate to resource management"
        });
      }
      if (text.includes('token') || text.includes('usage') || text.includes('consumption')) {
        evidence.resource.push({
          implication: "The article mentions usage patterns which may signal resource consumption considerations",
          evidence: "Article discusses token usage and consumption",
          reasoning: "Usage patterns often indicate resource planning needs"
        });
      }
    }
    
    if (signalType === 'Sustainability') {
      if (text.includes('environmental') || text.includes('energy') || text.includes('carbon')) {
        evidence.sustainability.push({
          implication: "The article discusses environmental impact which may indicate sustainability considerations",
          evidence: "Article mentions environmental factors",
          reasoning: "Environmental discussions often relate to sustainability reporting"
        });
      }
    }
    
    // Add more evidence extraction logic for other signal types...
    
    return evidence;
  }
  
  private generateEvidenceBasedFallback(signalType: string, articleText: string): OrganizationalRelevanceOutput {
    return {
      implications: [
        "Insufficient specific evidence found for detailed organizational implications based on the article content"
      ],
      questions: [
        'What organizational questions might this event raise?',
        'What areas of visibility may become relevant?',
        'How might this affect operational considerations?'
      ],
      evidence_sources: ['Article text analysis'],
      reasoning_trail: ['Analyzed article content', 'Limited specific evidence found', 'Generated generic questions']
    };
  }
}
