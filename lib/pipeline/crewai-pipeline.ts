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
  editorialFlags?: Array<{
    term: string;
    section: string;
  }>;
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
      // Debug: Check for prohibited words in source article
      console.log('=== Source Article Input ===');
      console.log('Source article length:', input.articleText.length);
      console.log('Contains "essential":', input.articleText.toLowerCase().includes('essential'));
      console.log('Contains "critical":', input.articleText.toLowerCase().includes('critical'));
      console.log('Contains "must":', input.articleText.toLowerCase().includes('must'));
      console.log('Contains "should":', input.articleText.toLowerCase().includes('should'));
      console.log('Contains "need to":', input.articleText.toLowerCase().includes('need to'));
      console.log('Contains "required":', input.articleText.toLowerCase().includes('required'));
      console.log('Contains "recommended":', input.articleText.toLowerCase().includes('recommended'));
      if (input.articleText.toLowerCase().includes('essential')) {
        console.log('ESSENTIAL FOUND IN SOURCE - locating position...');
        const essentialIndex = input.articleText.toLowerCase().indexOf('essential');
        const start = Math.max(0, essentialIndex - 50);
        const end = Math.min(input.articleText.length, essentialIndex + 50);
        console.log('Context around "essential":', input.articleText.substring(start, end));
      }
      
      // Agent 1: Signal Detection
      const signalDetection: SignalDetectionOutput = await this.signalDetectionAgent.process(input.articleText);
      
      // Debug: Check for prohibited words in Signal Detection output
      console.log('=== Signal Detection Agent Output ===');
      console.log('Headline:', signalDetection.headline);
      console.log('Summary length:', signalDetection.summary.length);
      console.log('Contains "essential":', signalDetection.headline.toLowerCase().includes('essential') || signalDetection.summary.toLowerCase().includes('essential'));
      console.log('Contains "critical":', signalDetection.headline.toLowerCase().includes('critical') || signalDetection.summary.toLowerCase().includes('critical'));
      console.log('Contains "must":', signalDetection.headline.toLowerCase().includes('must') || signalDetection.summary.toLowerCase().includes('must'));
      console.log('Contains "should":', signalDetection.headline.toLowerCase().includes('should') || signalDetection.summary.toLowerCase().includes('should'));
      console.log('Contains "need to":', signalDetection.headline.toLowerCase().includes('need to') || signalDetection.summary.toLowerCase().includes('need to'));
      console.log('Contains "required":', signalDetection.headline.toLowerCase().includes('required') || signalDetection.summary.toLowerCase().includes('required'));
      console.log('Contains "recommended":', signalDetection.headline.toLowerCase().includes('recommended') || signalDetection.summary.toLowerCase().includes('recommended'));
      
      // Agent 2: Materiality Qualification
      const materialityQualification: MaterialityQualificationOutput = await this.materialityQualificationAgent.process(
        input.articleText, 
        signalDetection.headline, 
        signalDetection.summary
      );
      
      // Debug: Check for prohibited words in Materiality Qualification output
      console.log('=== Materiality Qualification Agent Output ===');
      console.log('Qualified:', materialityQualification.qualified);
      console.log('Reason:', materialityQualification.reason);
      console.log('Contains "essential":', materialityQualification.reason.toLowerCase().includes('essential'));
      console.log('Contains "critical":', materialityQualification.reason.toLowerCase().includes('critical'));
      console.log('Contains "must":', materialityQualification.reason.toLowerCase().includes('must'));
      console.log('Contains "should":', materialityQualification.reason.toLowerCase().includes('should'));
      console.log('Contains "need to":', materialityQualification.reason.toLowerCase().includes('need to'));
      console.log('Contains "required":', materialityQualification.reason.toLowerCase().includes('required'));
      console.log('Contains "recommended":', materialityQualification.reason.toLowerCase().includes('recommended'));
      
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
      
      // Debug: Check for prohibited words in Signal Classification output
      console.log('=== Signal Classification Agent Output ===');
      console.log('Signal Type:', signalClassification.signal_type);
      console.log('Signal Reason:', signalClassification.signal_reason);
      console.log('Contains "essential":', signalClassification.signal_reason.toLowerCase().includes('essential'));
      console.log('Contains "critical":', signalClassification.signal_reason.toLowerCase().includes('critical'));
      console.log('Contains "must":', signalClassification.signal_reason.toLowerCase().includes('must'));
      console.log('Contains "should":', signalClassification.signal_reason.toLowerCase().includes('should'));
      console.log('Contains "need to":', signalClassification.signal_reason.toLowerCase().includes('need to'));
      console.log('Contains "required":', signalClassification.signal_reason.toLowerCase().includes('required'));
      console.log('Contains "recommended":', signalClassification.signal_reason.toLowerCase().includes('recommended'));
      
      // Agent 4: Organizational Relevance
      const organizationalRelevance: OrganizationalRelevanceOutput = await this.organizationalRelevanceAgent.process(
        input.articleText,
        signalClassification.signal_type
      );
      
      // Debug: Check for prohibited words in Organizational Relevance output
      console.log('=== Organizational Relevance Agent Output ===');
      console.log('Implications count:', organizationalRelevance.implications.length);
      console.log('Questions count:', organizationalRelevance.questions.length);
      const allImplications = organizationalRelevance.implications.join(' ').toLowerCase();
      console.log('Contains "essential":', allImplications.includes('essential'));
      console.log('Contains "critical":', allImplications.includes('critical'));
      console.log('Contains "must":', allImplications.includes('must'));
      console.log('Contains "should":', allImplications.includes('should'));
      console.log('Contains "need to":', allImplications.includes('need to'));
      console.log('Contains "required":', allImplications.includes('required'));
      console.log('Contains "recommended":', allImplications.includes('recommended'));
      if (allImplications.includes('essential')) {
        console.log('ESSENTIAL FOUND IN IMPLICATIONS:', organizationalRelevance.implications.filter(imp => imp.toLowerCase().includes('essential')));
      }
      
      // Sanitize implications to remove prohibited language before Writer
      const sanitizedImplications = organizationalRelevance.implications.map(implication => 
        implication
          .replace(/\b(essential|critical|revolutionary|game-changing|unprecedented|breakthrough|transformative|disruptive)\b/gi, 'increasingly relevant')
          .replace(/\b(should|must|need to|have to|required)\b/gi, 'may benefit from')
          .replace(/\b(best practice|recommended|strategy|action plan)\b/gi, 'worth considering')
          .replace(/\b(critical to success|vital|necessary)\b/gi, 'significant')
      );
      
      // Debug: Check sanitizer results
      console.log('=== Implication Sanitizer ===');
      console.log('Original implications:', organizationalRelevance.implications);
      console.log('Sanitized implications:', sanitizedImplications);
      console.log('Sanitizer removed prohibited language:', 
        !sanitizedImplications.some(imp => imp.toLowerCase().includes('essential')) &&
        !sanitizedImplications.some(imp => imp.toLowerCase().includes('critical')) &&
        !sanitizedImplications.some(imp => imp.toLowerCase().includes('must')) &&
        !sanitizedImplications.some(imp => imp.toLowerCase().includes('should')) &&
        !sanitizedImplications.some(imp => imp.toLowerCase().includes('need to')) &&
        !sanitizedImplications.some(imp => imp.toLowerCase().includes('required')) &&
        !sanitizedImplications.some(imp => imp.toLowerCase().includes('recommended'))
      );
      
      // Agent 5: Observatory Writer
      const writerInput: ObservatoryWriterInput = {
        headline: signalDetection.headline,
        summary: signalDetection.summary,
        signalType: signalClassification.signal_type,
        signalReason: signalClassification.signal_reason,
        implications: sanitizedImplications,
        questions: organizationalRelevance.questions,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl
      };
      
      const article = await this.observatoryWriterAgent.generateArticle(writerInput);
      
      // Extract title from generated article (first line after # )
      const titleMatch = article.match(/^#\s+(.+)$/m);
      const generatedTitle = titleMatch ? titleMatch[1].trim() : signalDetection.headline;
      
      // Debug: Check for prohibited words in Observatory Writer output
      console.log('=== Observatory Writer Agent Output ===');
      console.log('Generated article length:', article.length);
      console.log('Generated title:', generatedTitle);
      console.log('Contains "essential":', article.toLowerCase().includes('essential'));
      console.log('Contains "critical":', article.toLowerCase().includes('critical'));
      console.log('Contains "must":', article.toLowerCase().includes('must'));
      console.log('Contains "should":', article.toLowerCase().includes('should'));
      console.log('Contains "need to":', article.toLowerCase().includes('need to'));
      console.log('Contains "required":', article.toLowerCase().includes('required'));
      console.log('Contains "recommended":', article.toLowerCase().includes('recommended'));
      if (article.toLowerCase().includes('essential')) {
        console.log('ESSENTIAL FOUND IN ARTICLE - locating position...');
        const essentialIndex = article.toLowerCase().indexOf('essential');
        const start = Math.max(0, essentialIndex - 50);
        const end = Math.min(article.length, essentialIndex + 50);
        console.log('Context around "essential":', article.substring(start, end));
      }
      
      // Agent 6: Editorial Validation
      console.log('=== Editorial Validation Debug ===');
      console.log('Validation Target: generated_article');
      console.log('Generated article exists:', !!article);
      console.log('Generated article length:', article ? article.length : 0);
      
      if (!article || article.length === 0) {
        console.log('Writer did not generate article content');
        return {
          approved: false,
          validationReasons: ['Writer did not generate article content']
        };
      }
      
      const editorialValidation: EditorialValidationOutput = await this.editorialValidationAgent.validateArticle(article);
      
      console.log('Validation completed:', editorialValidation.approved);
      if (!editorialValidation.approved && editorialValidation.reasons) {
        console.log('Validation reasons:', editorialValidation.reasons);
      }
      
      return {
        approved: editorialValidation.approved,
        article: article, // Always include the generated article for debugging
        signalType: signalClassification.signal_type,
        headline: generatedTitle, // Use Writer-generated title instead of Signal Detection headline
        summary: signalDetection.summary,
        validationReasons: editorialValidation.reasons,
        editorialFlags: editorialValidation.editorial_flags
      };
      
    } catch (error) {
      return {
        approved: false,
        validationReasons: [`Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}
