import { EnhancedDatabaseService } from '../db/enhanced-database';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

interface CurrentObservation {
  observatory_title: string;
  observatory_slug: string;
  signal_category: string;
  what_this_may_indicate: string;
  potential_organizational_relevance: string;
  related_assessment_areas: string;
  editorial_status: string;
}

interface HistoricalObservation {
  observatory_title: string;
  signal_category: string;
  what_this_may_indicate: string;
  related_assessment_areas: string;
  signal_theme?: string;
  published_at: string;
}

interface QualityAnalysis {
  titleSimilarity: number;
  interpretationSimilarity: number;
  assessmentSaturation: number;
  voiceDriftScore: number;
  themeSaturation: number;
  overallDiversityScore: number;
  detectedIssues: string[];
  recommendations: string[];
}

interface Agent6Output {
  diversity_score: number;
  quality_notes: string;
  revision_actions: string[];
  signal_theme: string;
  final_revised_title?: string;
  final_revised_interpretation?: string;
  final_revised_relevance?: string;
  final_revised_assessment_areas?: string;
}

export class ObservatoryQualityControlAgent {
  private db: EnhancedDatabaseService;
  
  constructor(env: Env) {
    this.db = new EnhancedDatabaseService(env.DB);
  }

  async processObservation(current: CurrentObservation, env: Env): Promise<Agent6Output> {
    console.log('AGENT 6: QUALITY CONTROL - START');
    
    try {
      // Step 1: Retrieve historical observations
      const historical = await this.getHistoricalObservations(env);
      
      // Step 2: Perform quality analysis
      const analysis = this.performQualityAnalysis(current, historical);
      
      // Step 3: Generate signal theme
      const signalTheme = this.generateSignalTheme(current, analysis);
      
      // Step 4: Determine if revision is needed
      if (analysis.overallDiversityScore >= 75) {
        // PASS - No revision needed
        console.log('AGENT 6: QUALITY CONTROL - PASS');
        return {
          diversity_score: analysis.overallDiversityScore,
          quality_notes: 'Quality check passed. Good diversity maintained.',
          revision_actions: [],
          signal_theme: signalTheme
        };
      }
      
      // Step 5: Auto-revision if needed
      console.log('AGENT 6: AUTO REVISION - START');
      const revised = this.performAutoRevision(current, analysis, signalTheme);
      
      // Step 6: Re-score after revision
      const revisedAnalysis = this.performQualityAnalysis(revised, historical);
      
      if (revisedAnalysis.overallDiversityScore < 60) {
        console.log('AGENT 6: QUALITY CONTROL - NEEDS MANUAL REVISION');
        return {
          diversity_score: revisedAnalysis.overallDiversityScore,
          quality_notes: `Quality check failed. Score: ${revisedAnalysis.overallDiversityScore}. Issues: ${analysis.detectedIssues.join(', ')}`,
          revision_actions: analysis.recommendations,
          signal_theme: signalTheme,
          final_revised_title: revised.observatory_title,
          final_revised_interpretation: revised.what_this_may_indicate,
          final_revised_relevance: revised.potential_organizational_relevance,
          final_revised_assessment_areas: revised.related_assessment_areas
        };
      }
      
      console.log('AGENT 6: QUALITY CONTROL - AUTO-REVISION SUCCESS');
      return {
        diversity_score: revisedAnalysis.overallDiversityScore,
        quality_notes: `Auto-revision completed. Score improved to ${revisedAnalysis.overallDiversityScore}.`,
        revision_actions: this.getRevisionActions(current, revised),
        signal_theme: signalTheme,
        final_revised_title: revised.observatory_title,
        final_revised_interpretation: revised.what_this_may_indicate,
        final_revised_relevance: revised.potential_organizational_relevance,
        final_revised_assessment_areas: revised.related_assessment_areas
      };
      
    } catch (error) {
      console.error('AGENT 6: QUALITY CONTROL - ERROR', error);
      throw error;
    }
  }

  private async getHistoricalObservations(env: Env): Promise<HistoricalObservation[]> {
    try {
      const db = new EnhancedDatabaseService(env.DB);
      const observations = await db.getEnhancedObservations(50);
      
      return observations.map(obs => ({
        observatory_title: obs.observatory_title || obs.title,
        signal_category: obs.signal_category || 'Unknown',
        what_this_may_indicate: obs.what_this_may_indicate || '',
        related_assessment_areas: obs.related_assessment_areas || '',
        signal_theme: (obs as { signal_theme?: string }).signal_theme,
        published_at: obs.published_at || obs.created_at
      }));
    } catch {
      console.warn('AGENT 6: Could not retrieve historical observations, using empty set');
      return [];
    }
  }

  private performQualityAnalysis(current: CurrentObservation, historical: HistoricalObservation[]): QualityAnalysis {
    const titleSimilarity = this.calculateTitleSimilarity(current.observatory_title, historical);
    const interpretationSimilarity = this.calculateInterpretationSimilarity(current.what_this_may_indicate, historical);
    const assessmentSaturation = this.calculateAssessmentSaturation(current.related_assessment_areas, historical);
    const voiceDriftScore = this.detectVoiceDrift(current);
    const themeSaturation = this.calculateThemeSaturation(current, historical);
    
    const detectedIssues = this.detectIssues(titleSimilarity, interpretationSimilarity, assessmentSaturation, voiceDriftScore, themeSaturation);
    const recommendations = this.generateRecommendations(detectedIssues, current);
    
    // Calculate overall diversity score (weighted average)
    const overallDiversityScore = Math.round(
      (titleSimilarity * 0.25) +
      (interpretationSimilarity * 0.25) +
      (assessmentSaturation * 0.2) +
      (voiceDriftScore * 0.15) +
      (themeSaturation * 0.15)
    );

    return {
      titleSimilarity,
      interpretationSimilarity,
      assessmentSaturation,
      voiceDriftScore,
      themeSaturation,
      overallDiversityScore,
      detectedIssues,
      recommendations
    };
  }

  private calculateTitleSimilarity(currentTitle: string, historical: HistoricalObservation[]): number {
    if (historical.length === 0) return 100;
    
    let similarityScore = 100;
    const currentTitleLower = currentTitle.toLowerCase();
    
    // Check for repeated title patterns
    const patterns = [
      /a signal of/gi,
      /what.*may indicate/gi,
      /why.*may be emerging/gi,
      /an indicator of/gi,
      /questions for organizations/gi
    ];
    
    for (const pattern of patterns) {
      const matches = currentTitleLower.match(pattern);
      if (matches) {
        // Count how many times this pattern appears in recent history
        const historicalCount = historical.filter(h => 
          h.observatory_title.toLowerCase().match(pattern)
        ).length;
        
        if (historicalCount >= 3) {
          similarityScore -= 15;
        }
      }
    }
    
    // Check for exact wording similarities
    const currentWords = currentTitleLower.split(/\s+/);
    for (const historicalObs of historical.slice(0, 10)) { // Check last 10
      const historicalWords = historicalObs.observatory_title.toLowerCase().split(/\s+/);
      const commonWords = currentWords.filter(word => 
        word.length > 3 && historicalWords.includes(word)
      ).length;
      
      const similarityRatio = commonWords / Math.max(currentWords.length, historicalWords.length);
      if (similarityRatio > 0.6) {
        similarityScore -= 20;
      }
    }
    
    return Math.max(0, Math.min(100, similarityScore));
  }

  private calculateInterpretationSimilarity(currentInterpretation: string, historical: HistoricalObservation[]): number {
    if (historical.length === 0) return 100;
    
    let similarityScore = 100;
    const currentInterpretationLower = currentInterpretation.toLowerCase();
    
    // Check for repetitive sentence structures
    const sentenceStarts = [
      'organizations may',
      'ai may',
      'governance expectations',
      'infrastructure expansion',
      'resource consumption',
      'stakeholders may'
    ];
    
    for (const start of sentenceStarts) {
      if (currentInterpretationLower.startsWith(start)) {
        const historicalCount = historical.filter(h => 
          h.what_this_may_indicate.toLowerCase().startsWith(start)
        ).length;
        
        if (historicalCount >= 5) {
          similarityScore -= 20;
        }
      }
    }
    
    // Check for repeated conclusions
    const conclusions = [
      'faster than',
      'may indicate',
      'may be emerging',
      'may be becoming',
      'may be creating'
    ];
    
    for (const conclusion of conclusions) {
      const count = (currentInterpretationLower.match(new RegExp(conclusion, 'g')) || []).length;
      if (count > 1) {
        similarityScore -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, similarityScore));
  }

  private calculateAssessmentSaturation(currentAssessment: string, historical: HistoricalObservation[]): number {
    if (historical.length === 0) return 100;
    
    let saturationScore = 100;
    const currentAssessmentLower = currentAssessment.toLowerCase();
    
    // Common assessment areas to track
    const commonAreas = [
      'ai resource visibility',
      'operational dependency',
      'governance readiness',
      'reporting exposure',
      'board visibility',
      'infrastructure dependency',
      'budget visibility',
      'cost control'
    ];
    
    for (const area of commonAreas) {
      if (currentAssessmentLower.includes(area)) {
        const historicalCount = historical.filter(h => 
          h.related_assessment_areas.toLowerCase().includes(area)
        ).length;
        
        // Penalize if this area appears in more than 30% of recent observations
        if (historicalCount > historical.length * 0.3) {
          saturationScore -= 15;
        }
      }
    }
    
    return Math.max(0, Math.min(100, saturationScore));
  }

  private detectVoiceDrift(current: CurrentObservation): number {
    let voiceScore = 100;
    const combinedText = (
      current.what_this_may_indicate + ' ' + 
      current.potential_organizational_relevance
    ).toLowerCase();
    
    // Forbidden consulting/marketing language
    const forbiddenPhrases = [
      'strategic opportunities',
      'competitive advantage',
      'transformative innovation',
      'future-proofing',
      'leveraging ai',
      'digital transformation',
      'business growth',
      'innovation opportunities',
      'market leadership',
      'strategic imperative'
    ];
    
    for (const phrase of forbiddenPhrases) {
      if (combinedText.includes(phrase)) {
        voiceScore -= 25;
      }
    }
    
    // Forbidden AI hype language
    const hypePhrases = [
      'revolutionary',
      'game-changing',
      'groundbreaking',
      'breakthrough',
      'unprecedented',
      'paradigm shift',
      'disruptive',
      'transformative'
    ];
    
    for (const phrase of hypePhrases) {
      if (combinedText.includes(phrase)) {
        voiceScore -= 20;
      }
    }
    
    // Forbidden blog language
    const blogPhrases = [
      'how to',
      'why you should',
      'best practices',
      'tips for',
      'guide to',
      'step by step'
    ];
    
    for (const phrase of blogPhrases) {
      if (combinedText.includes(phrase)) {
        voiceScore -= 15;
      }
    }
    
    return Math.max(0, Math.min(100, voiceScore));
  }

  private calculateThemeSaturation(current: CurrentObservation, historical: HistoricalObservation[]): number {
    // This will be more relevant when signal_theme is fully implemented
    // For now, detect theme saturation through title and interpretation patterns
    let saturationScore = 100;
    
    // Common themes to detect
    const themeIndicators = {
      'visibility pressure': ['visibility', 'track', 'monitor', 'see'],
      'governance pressure': ['governance', 'oversight', 'board', 'compliance'],
      'compute dependency': ['compute', 'infrastructure', 'dependency', 'rely'],
      'reporting expectations': ['report', 'disclosure', 'transparency', 'stakeholder'],
      'resource intensity': ['resource', 'cost', 'budget', 'consumption'],
      'infrastructure demand': ['infrastructure', 'data center', 'capacity', 'expansion']
    };
    
    const currentText = (current.observatory_title + ' ' + current.what_this_may_indicate).toLowerCase();
    
    for (const [, indicators] of Object.entries(themeIndicators)) {
      const hasTheme = indicators.some(indicator => currentText.includes(indicator));
      if (hasTheme) {
        const historicalCount = historical.filter(h => {
          const historicalText = (h.observatory_title + ' ' + h.what_this_may_indicate).toLowerCase();
          return indicators.some(indicator => historicalText.includes(indicator));
        }).length;
        
        // Penalize if this theme appears in more than 40% of recent observations
        if (historicalCount > historical.length * 0.4) {
          saturationScore -= 20;
        }
      }
    }
    
    return Math.max(0, Math.min(100, saturationScore));
  }

  private detectIssues(titleSimilarity: number, interpretationSimilarity: number, assessmentSaturation: number, voiceDriftScore: number, themeSaturation: number): string[] {
    const issues: string[] = [];
    
    if (titleSimilarity < 70) issues.push('Title structure repetition');
    if (interpretationSimilarity < 70) issues.push('Interpretation structure repetition');
    if (assessmentSaturation < 70) issues.push('Assessment area saturation');
    if (voiceDriftScore < 80) issues.push('Voice drift detected');
    if (themeSaturation < 70) issues.push('Theme saturation');
    
    return issues;
  }

  private generateRecommendations(issues: string[], current: CurrentObservation): string[] {
    const recommendations: string[] = [];
    
    if (issues.includes('Title structure repetition')) {
      recommendations.push('Revise title to use different pattern (What..., Why..., Questions..., Indicator...)');
    }
    
    if (issues.includes('Interpretation structure repetition')) {
      recommendations.push('Revise interpretation with different opening (Visibility..., Dependency..., Governance...)');
    }
    
    if (issues.includes('Assessment area saturation')) {
      recommendations.push('Use alternative assessment areas to avoid overused themes');
    }
    
    if (issues.includes('Voice drift detected')) {
      recommendations.push('Remove consulting/marketing language and maintain evidence-based voice');
    }
    
    if (issues.includes('Theme saturation')) {
      recommendations.push('Reframe theme to avoid repetitive patterns');
    }
    
    return recommendations;
  }

  private generateSignalTheme(current: CurrentObservation, analysis: QualityAnalysis): string {
    const combinedText = (current.observatory_title + ' ' + current.what_this_may_indicate).toLowerCase();
    
    // Theme detection logic
    const themes = {
      'Cost Visibility': ['cost', 'budget', 'spend', 'token', 'financial'],
      'Governance Pressure': ['governance', 'oversight', 'board', 'compliance', 'regulation'],
      'Compute Dependency': ['compute', 'infrastructure', 'dependency', 'rely', 'vendor'],
      'Reporting Expectations': ['report', 'disclosure', 'transparency', 'stakeholder', 'investor'],
      'Resource Intensity': ['resource', 'consumption', 'usage', 'demand'],
      'Infrastructure Demand': ['infrastructure', 'data center', 'capacity', 'expansion'],
      'Board Visibility': ['board', 'oversight', 'visibility', 'governance'],
      'Operational Reliance': ['operational', 'reliance', 'dependency', 'workflow']
    };
    
    let bestTheme = 'General AI Signal';
    let maxMatches = 0;
    
    for (const [theme, keywords] of Object.entries(themes)) {
      const matches = keywords.filter(keyword => combinedText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestTheme = theme;
      }
    }
    
    return bestTheme;
  }

  private performAutoRevision(current: CurrentObservation, analysis: QualityAnalysis, signalTheme: string): CurrentObservation {
    const revised: CurrentObservation = { ...current };
    
    // Revise title if needed
    if (analysis.titleSimilarity < 70) {
      revised.observatory_title = this.reviseTitle(current.observatory_title, analysis);
      revised.observatory_slug = this.generateSlugFromTitle(revised.observatory_title);
    }
    
    // Revise interpretation if needed
    if (analysis.interpretationSimilarity < 70) {
      revised.what_this_may_indicate = this.reviseInterpretation(current.what_this_may_indicate, analysis, signalTheme);
    }
    
    // Revise relevance if needed
    if (analysis.assessmentSaturation < 70) {
      revised.potential_organizational_relevance = this.reviseRelevance(current.potential_organizational_relevance, analysis, signalTheme);
    }
    
    // Revise assessment areas if needed
    if (analysis.assessmentSaturation < 70) {
      revised.related_assessment_areas = this.reviseAssessmentAreas(current.related_assessment_areas, analysis, signalTheme);
    }
    
    return revised;
  }

  private reviseTitle(currentTitle: string, _analysis: QualityAnalysis): string {
    // Find current pattern and switch to different one
    const patterns = [
      { pattern: /a signal of/gi, replacement: 'What...May Indicate' },
      { pattern: /what.*may indicate/gi, replacement: 'Why...May Be Emerging' },
      { pattern: /why.*may be emerging/gi, replacement: 'An Indicator Of' },
      { pattern: /an indicator of/gi, replacement: 'Questions For Organizations' },
      { pattern: /questions for organizations/gi, replacement: 'A Signal of' }
    ];
    
    let revisedTitle = currentTitle;
    
    for (const { pattern, replacement } of patterns) {
      if (currentTitle.toLowerCase().match(pattern)) {
        // Extract source event part
        const colonIndex = currentTitle.indexOf(':');
        if (colonIndex > 0) {
          const sourceEvent = currentTitle.substring(0, colonIndex);
          
          // Generate new interpretation based on replacement
          switch (replacement) {
            case 'What...May Indicate':
              revisedTitle = `${sourceEvent}: What This Signal May Indicate For Organizations`;
              break;
            case 'Why...May Be Emerging':
              revisedTitle = `${sourceEvent}: Why This Pattern May Be Emerging In Operations`;
              break;
            case 'An Indicator Of':
              revisedTitle = `${sourceEvent}: An Indicator Of Emerging AI Significance`;
              break;
            case 'Questions For Organizations':
              revisedTitle = `${sourceEvent}: Questions Organizations May Need To Consider`;
              break;
            default:
              revisedTitle = `${sourceEvent}: A Signal of Operational AI Significance`;
          }
        }
        break;
      }
    }
    
    return revisedTitle;
  }

  private reviseInterpretation(currentInterpretation: string, _analysis: QualityAnalysis, signalTheme: string): string {
    // Switch interpretation style based on theme
    const styleMap = {
      'Cost Visibility': 'Resource costs may be accumulating faster than organizational tracking systems can accommodate.',
      'Governance Pressure': 'Governance requirements appear to be expanding beyond current organizational readiness frameworks.',
      'Compute Dependency': 'Infrastructure dependencies may be becoming operationally significant before risk management can adapt.',
      'Reporting Expectations': 'Stakeholder expectations for transparency may be developing faster than current disclosure capabilities.',
      'Resource Intensity': 'Resource demands may be exceeding planned consumption faster than management systems can monitor.',
      'Infrastructure Demand': 'Infrastructure requirements may be expanding faster than current capacity planning.',
      'Board Visibility': 'Board-level oversight needs may be emerging faster than current governance frameworks.',
      'Operational Reliance': 'Operational dependencies may be creating business continuity risks faster than mitigation strategies.'
    };
    
    return styleMap[signalTheme as keyof typeof styleMap] || currentInterpretation;
  }

  private reviseRelevance(currentRelevance: string, _analysis: QualityAnalysis, signalTheme: string): string {
    // Generate alternative relevance format
    const relevanceMap = {
      'Cost Visibility': 'How visible are current AI costs?\nWhere are consumption patterns being tracked?\nWhat governance frameworks exist today?',
      'Governance Pressure': 'What governance frameworks are in place?\nHow is oversight being structured?\nWhere are compliance gaps emerging?',
      'Compute Dependency': 'What infrastructure dependencies exist?\nHow is vendor lock-in being managed?\nWhere are contingency plans needed?',
      'Reporting Expectations': 'What reporting frameworks exist?\nHow is disclosure being managed?\nWhere are transparency gaps?',
      'Resource Intensity': 'What resource monitoring exists?\nHow are consumption patterns tracked?\nWhere are planning gaps?',
      'Infrastructure Demand': 'What infrastructure capacity exists?\nHow is expansion being planned?\nWhere are dependency risks?',
      'Board Visibility': 'What board oversight exists?\nHow is AI governance structured?\nWhere are visibility gaps?',
      'Operational Reliance': 'What operational dependencies exist?\nHow is continuity being managed?\nWhere are flexibility gaps?'
    };
    
    return relevanceMap[signalTheme as keyof typeof relevanceMap] || currentRelevance;
  }

  private reviseAssessmentAreas(currentAssessment: string, _analysis: QualityAnalysis, signalTheme: string): string {
    // Generate alternative assessment areas based on theme
    const assessmentMap = {
      'Cost Visibility': 'Financial Planning, Cost Management, Resource Tracking',
      'Governance Pressure': 'Board Oversight, Compliance Frameworks, Governance Readiness',
      'Compute Dependency': 'Infrastructure Risk, Vendor Management, Business Continuity',
      'Reporting Expectations': 'Investor Relations, Regulatory Compliance, Transparency Requirements',
      'Resource Intensity': 'Resource Planning, Usage Monitoring, Demand Management',
      'Infrastructure Demand': 'Capacity Planning, Technical Risk, External Dependencies',
      'Board Visibility': 'Board Relations, Governance Structures, Oversight Requirements',
      'Operational Reliance': 'Operations Management, Dependency Tracking, Risk Mitigation'
    };
    
    return assessmentMap[signalTheme as keyof typeof assessmentMap] || currentAssessment;
  }

  private generateSlugFromTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private getRevisionActions(original: CurrentObservation, revised: CurrentObservation): string[] {
    const actions: string[] = [];
    
    if (original.observatory_title !== revised.observatory_title) {
      actions.push('Title revised to avoid pattern repetition');
    }
    
    if (original.what_this_may_indicate !== revised.what_this_may_indicate) {
      actions.push('Interpretation revised to avoid structural repetition');
    }
    
    if (original.potential_organizational_relevance !== revised.potential_organizational_relevance) {
      actions.push('Relevance revised to avoid format repetition');
    }
    
    if (original.related_assessment_areas !== revised.related_assessment_areas) {
      actions.push('Assessment areas revised to avoid saturation');
    }
    
    return actions;
  }
}
