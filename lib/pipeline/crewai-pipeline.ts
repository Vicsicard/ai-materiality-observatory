import { SignalDetectionAgent, SignalDetectionOutput } from '../agents/signal-detection-agent';
import { MaterialityQualificationAgent, MaterialityQualificationOutput } from '../agents/materiality-qualification-agent';
import { SignalClassificationAgent, SignalClassificationOutput } from '../agents/signal-classification-agent';
import { OrganizationalRelevanceAgent, OrganizationalRelevanceOutput } from '../agents/organizational-relevance-agent';
import { ObservatoryWriterAgent, ObservatoryWriterInput } from '../agents/observatory-writer-agent';
import { EditorialValidationAgent, EditorialValidationOutput } from '../agents/editorial-validation-agent';

export interface PipelineInput {
  articleText: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate?: string;
}

export interface PipelineOutput {
  approved: boolean;
  article?: string;
  signalType?: string;
  headline?: string;
  summary?: string;
  validationReasons?: string[];
}

export class CrewAIPipeline {
  private signalDetectionAgent: SignalDetectionAgent;
  private materialityQualificationAgent: MaterialityQualificationAgent;
  private signalClassificationAgent: SignalClassificationAgent;
  private organizationalRelevanceAgent: OrganizationalRelevanceAgent;
  private observatoryWriterAgent: ObservatoryWriterAgent;
  private editorialValidationAgent: EditorialValidationAgent;

  constructor() {
    this.signalDetectionAgent = new SignalDetectionAgent();
    this.materialityQualificationAgent = new MaterialityQualificationAgent();
    this.signalClassificationAgent = new SignalClassificationAgent();
    this.organizationalRelevanceAgent = new OrganizationalRelevanceAgent();
    this.observatoryWriterAgent = new ObservatoryWriterAgent();
    this.editorialValidationAgent = new EditorialValidationAgent();
  }

  async process(input: PipelineInput): Promise<PipelineOutput> {
    try {
      // Agent 1: Signal Detection
      const signalDetection: SignalDetectionOutput = await this.signalDetectionAgent.process(input.articleText);
      
      // Agent 2: Materiality Qualification
      const materialityQualification: MaterialityQualificationOutput = await this.materialityQualificationAgent.process(
        input.articleText, 
        signalDetection.headline, 
        signalDetection.summary
      );
      
      // Stop pipeline if not qualified
      if (!materialityQualification.qualified) {
        return {
          approved: false,
          validationReasons: [`Not qualified: ${materialityQualification.reason}`]
        };
      }
      
      // Agent 3: Signal Classification
      const signalClassification: SignalClassificationOutput = await this.signalClassificationAgent.process(
        input.articleText,
        signalDetection.headline,
        signalDetection.summary
      );
      
      // Agent 4: Organizational Relevance
      const organizationalRelevance: OrganizationalRelevanceOutput = await this.organizationalRelevanceAgent.process(
        input.articleText,
        signalClassification.signal_type
      );
      
      // Agent 5: Observatory Writer
      const writerInput: ObservatoryWriterInput = {
        headline: signalDetection.headline,
        summary: signalDetection.summary,
        signalType: signalClassification.signal_type,
        signalReason: signalClassification.signal_reason,
        implications: organizationalRelevance.implications,
        questions: organizationalRelevance.questions,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl
      };
      
      const article = await this.observatoryWriterAgent.generateArticle(writerInput);
      
      // Agent 6: Editorial Validation
      const editorialValidation: EditorialValidationOutput = await this.editorialValidationAgent.validateArticle(article);
      
      return {
        approved: editorialValidation.approved,
        article: editorialValidation.approved ? article : undefined,
        signalType: signalClassification.signal_type,
        headline: signalDetection.headline,
        summary: signalDetection.summary,
        validationReasons: editorialValidation.reasons
      };
      
    } catch (error) {
      return {
        approved: false,
        validationReasons: [`Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}
