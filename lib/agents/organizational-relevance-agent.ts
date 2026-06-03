export interface OrganizationalRelevanceOutput {
  implications: string[];
  questions: string[];
}

export class OrganizationalRelevanceAgent {
  async process(articleText: string, signalType: string): Promise<OrganizationalRelevanceOutput> {
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

BAD EXAMPLE:
AI governance is becoming essential for organizations adopting AI.
Organizations need to establish controls.
This is a critical development.

GOOD EXAMPLE:
The event may raise questions regarding governance visibility as AI adoption expands.
The development may become increasingly relevant for organizations evaluating operational dependency on AI systems.
The pattern may indicate growing organizational reliance on AI-enabled processes.

BAD EXAMPLE:
Organizations should evaluate infrastructure readiness.

GOOD EXAMPLE:
The event may raise questions regarding infrastructure capacity and operational dependency.

---

ARTICLE TEXT:
${articleText}

SIGNAL TYPE:
${signalType}

TASK:
Based on the article text and signal type, identify:

1. What organizational questions might this event raise?
2. What areas of organizational visibility may become relevant?
3. What operational patterns may be associated with this event?
4. What emerging considerations may become increasingly relevant if similar patterns continue?

Provide 3-4 observational implications (not recommendations) and 3-4 relevant questions.

Format your response as JSON:
{
  "implications": ["implication 1", "implication 2", "implication 3"],
  "questions": ["question 1", "question 2", "question 3"]
}
`;

    // Simulate AI response - in production would use actual AI service
    const response = await this.simulateAIResponse(prompt, signalType);
    
    try {
      const parsed = JSON.parse(response);
      return {
        implications: parsed.implications || [],
        questions: parsed.questions || []
      };
    } catch (error) {
      // Fallback to basic responses if JSON parsing fails
      return {
        implications: [
          'The event may raise questions regarding organizational AI visibility',
          'The pattern may indicate emerging operational considerations',
          'The development may become increasingly relevant for organizational planning'
        ],
        questions: [
          'What organizational questions might this event raise?',
          'What areas of visibility may become relevant?',
          'How might this affect organizational operations?'
        ]
      };
    }
  }
  
  private async simulateAIResponse(prompt: string, signalType: string): Promise<string> {
    // For now, return predefined responses that follow observatory guidelines
    // In production, this would call an actual AI service
    
    const responses: Record<string, {implications: string[], questions: string[]}> = {
      'Governance': {
        implications: [
          'The event may raise questions regarding governance visibility as AI adoption expands',
          'The development may become increasingly relevant for organizational policy frameworks',
          'The pattern may indicate growing board-level oversight considerations'
        ],
        questions: [
          'What governance questions might this event raise for our organization?',
          'What areas of policy visibility may become relevant?',
          'How might this affect board-level oversight considerations?'
        ]
      },
      'Infrastructure': {
        implications: [
          'The event may raise questions regarding infrastructure capacity and operational dependency',
          'The development may become increasingly relevant for system integration planning',
          'The pattern may indicate emerging scalability considerations'
        ],
        questions: [
          'What infrastructure questions might this event raise?',
          'What areas of technical visibility may become relevant?',
          'How might this affect existing system dependencies?'
        ]
      },
      'Dependency': {
        implications: [
          'The event may raise questions regarding vendor reliance and supply chain visibility',
          'The development may become increasingly relevant for third-party risk assessment',
          'The pattern may indicate growing ecosystem dependency considerations'
        ],
        questions: [
          'What dependency questions might this event raise?',
          'What areas of vendor visibility may become relevant?',
          'How might this affect supply chain considerations?'
        ]
      },
      'Resource': {
        implications: [
          'The event may raise questions regarding talent competition and skill availability',
          'The development may become increasingly relevant for training investment planning',
          'The pattern may indicate emerging resource allocation considerations'
        ],
        questions: [
          'What resource questions might this event raise for our organization?',
          'What areas of talent visibility may become relevant?',
          'How might this affect budget and investment planning?'
        ]
      },
      'Sustainability': {
        implications: [
          'The event may raise questions regarding energy consumption and environmental impact',
          'The development may become increasingly relevant for sustainability reporting',
          'The pattern may indicate emerging efficiency considerations'
        ],
        questions: [
          'What sustainability questions might this event raise?',
          'What areas of environmental visibility may become relevant?',
          'How might this affect efficiency and resource planning?'
        ]
      },
      'Reporting': {
        implications: [
          'The event may raise questions regarding transparency expectations and disclosure requirements',
          'The development may become increasingly relevant for stakeholder communication',
          'The pattern may indicate emerging metrics and measurement considerations'
        ],
        questions: [
          'What reporting questions might this event raise?',
          'What areas of disclosure visibility may become relevant?',
          'How might this affect stakeholder communication planning?'
        ]
      }
    };
    
    const defaultResponse = {
      implications: [
        'The event may raise questions regarding organizational AI considerations',
        'The development may become increasingly relevant for operational planning',
        'The pattern may indicate emerging visibility requirements'
      ],
      questions: [
        'What organizational questions might this event raise?',
        'What areas of visibility may become relevant?',
        'How might this affect operational considerations?'
      ]
    };
    
    const selectedResponse = responses[signalType] || defaultResponse;
    return JSON.stringify(selectedResponse);
  }
}
