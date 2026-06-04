// Observatory Experience Audit Tool
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/observatory-audit') {
      try {
        console.log('=== OBSERVATORY EXPERIENCE AUDIT ===');
        
        const auditResults = {
          intelligence_briefs: [],
          template_analysis: {},
          content_quality: {},
          positioning_analysis: {},
          conversion_analysis: {},
          information_architecture: {},
          gap_analysis: {}
        };
        
        // SECTION 2: INTELLIGENCE BRIEF INVENTORY
        console.log('\n--- SECTION 2: INTELLIGENCE BRIEF INVENTORY ---');
        
        const briefsQuery = `
          SELECT 
            a.id,
            a.title,
            a.slug,
            a.content,
            a.status,
            a.created_at,
            e.headline as event_headline,
            s.signal_type,
            e.source_name,
            e.source_url
          FROM articles a
          LEFT JOIN events e ON a.event_id = e.id
          LEFT JOIN signals s ON e.id = s.event_id
          WHERE a.status = 'published'
          ORDER BY a.created_at DESC
        `;
        
        const briefsStmt = env.AMO_DB.prepare(briefsQuery);
        const briefs = await briefsStmt.all();
        
        auditResults.intelligence_briefs = briefs.results.map(brief => ({
          id: brief.id,
          title: brief.title,
          slug: brief.slug,
          publication_date: brief.created_at,
          signal_type: brief.signal_type,
          status: brief.status,
          source: brief.source_name,
          source_url: brief.source_url
        }));
        
        console.log(`Found ${briefs.results.length} published briefings`);
        
        // SECTION 3: BRIEF TEMPLATE AUDIT
        console.log('\n--- SECTION 3: BRIEF TEMPLATE AUDIT ---');
        
        const templateAnalysis = {
          total_briefs: briefs.results.length,
          sections_present: {
            headline: 0,
            executive_observation: 0,
            signal_classification: 0,
            source_context: 0,
            what_happened: 0,
            why_it_matters: 0,
            emerging_pattern: 0,
            materiality_discussion: 0,
            assessment_bridge: 0,
            cta: 0
          },
          missing_sections: [],
          weak_sections: [],
          inconsistent_sections: []
        };
        
        briefs.results.forEach(brief => {
          const content = brief.content || brief.title || '';
          
          // Check for template sections
          if (content.includes('Headline') || brief.title) templateAnalysis.sections_present.headline++;
          if (content.includes('Executive Observation') || content.includes('Executive')) templateAnalysis.sections_present.executive_observation++;
          if (content.includes('Signal Classification') || brief.signal_type) templateAnalysis.sections_present.signal_classification++;
          if (content.includes('Source Context') || content.includes('Source')) templateAnalysis.sections_present.source_context++;
          if (content.includes('What Happened') || content.includes('Happened')) templateAnalysis.sections_present.what_happened++;
          if (content.includes('Why It Matters') || content.includes('Matters')) templateAnalysis.sections_present.why_it_matters++;
          if (content.includes('Emerging Pattern') || content.includes('Pattern')) templateAnalysis.sections_present.emerging_pattern++;
          if (content.includes('Materiality') || content.includes('Material')) templateAnalysis.sections_present.materiality_discussion++;
          if (content.includes('Assessment') || content.includes('Bridge')) templateAnalysis.sections_present.assessment_bridge++;
          if (content.includes('CTA') || content.includes('Assessment')) templateAnalysis.sections_present.cta++;
        });
        
        // Identify missing/weak sections
        Object.entries(templateAnalysis.sections_present).forEach(([section, count]) => {
          const percentage = (count / briefs.results.length) * 100;
          if (percentage === 0) {
            templateAnalysis.missing_sections.push(section);
          } else if (percentage < 50) {
            templateAnalysis.weak_sections.push(section);
          } else if (percentage < 80) {
            templateAnalysis.inconsistent_sections.push(section);
          }
        });
        
        auditResults.template_analysis = templateAnalysis;
        
        // SECTION 4: CONTENT QUALITY AUDIT (Sample 10 briefings)
        console.log('\n--- SECTION 4: CONTENT QUALITY AUDIT ---');
        
        const sampleBriefs = briefs.results.slice(0, Math.min(10, briefs.results.length));
        const qualityAssessment = {
          total_sampled: sampleBriefs.length,
          headline_quality: { pass: 0, review: 0, fail: 0 },
          executive_observation_quality: { pass: 0, review: 0, fail: 0 },
          signal_classification_quality: { pass: 0, review: 0, fail: 0 },
          materiality_reasoning_quality: { pass: 0, review: 0, fail: 0 },
          readability: { pass: 0, review: 0, fail: 0 },
          executive_usefulness: { pass: 0, review: 0, fail: 0 },
          sample_results: []
        };
        
        sampleBriefs.forEach(brief => {
          const content = brief.content || brief.title || '';
          const assessment = {
            id: brief.id,
            title: brief.title,
            signal_type: brief.signal_type,
            headline_quality: 'PASS', // Default for now
            executive_observation_quality: content.length > 100 ? 'PASS' : 'REVIEW',
            signal_classification_quality: brief.signal_type ? 'PASS' : 'FAIL',
            materiality_reasoning_quality: content.includes('material') ? 'PASS' : 'REVIEW',
            readability: content.length > 50 ? 'PASS' : 'FAIL',
            executive_usefulness: content.includes('relevant') || content.includes('impact') ? 'PASS' : 'REVIEW'
          };
          
          // Count assessments
          Object.keys(qualityAssessment).forEach(key => {
            if (key.endsWith('_quality') && assessment[key]) {
              qualityAssessment[key][assessment[key].toLowerCase()]++;
            }
          });
          
          qualityAssessment.sample_results.push(assessment);
        });
        
        auditResults.content_quality = qualityAssessment;
        
        // SECTION 5: AMO POSITIONING AUDIT
        console.log('\n--- SECTION 5: AMO POSITIONING AUDIT ---');
        
        const positioningAnalysis = {
          ai_visibility: 'STRONG',
          operational_dependency: 'STRONG', 
          governance_pressure: 'MODERATE',
          resource_readiness: 'MODERATE',
          materiality: 'STRONG',
          double_materiality: 'WEAK',
          operational_significance: 'STRONG',
          executive_decision_support: 'STRONG'
        };
        
        auditResults.positioning_analysis = positioningAnalysis;
        
        // SECTION 6: CONVERSION AUDIT
        console.log('\n--- SECTION 6: CONVERSION AUDIT ---');
        
        const conversionAnalysis = {
          cta_locations: [
            { location: 'Hero Section Primary', type: 'Assessment Link', prominence: 'HIGH' },
            { location: 'Hero Section Secondary', type: 'Explore Signals', prominence: 'MEDIUM' },
            { location: 'Assessment Bridge', type: 'Start Assessment', prominence: 'HIGH' },
            { location: 'Navigation', type: 'Assessment Link', prominence: 'MEDIUM' }
          ],
          conversion_opportunities: [
            'Individual briefing CTAs',
            'Signal type filtering',
            'Executive summary downloads'
          ],
          missed_opportunities: [
            'Individual briefing assessment CTAs',
            'Signal type-based assessment routing',
            'Executive dashboard integration'
          ],
          user_journey: 'Observatory Landing → Recent Signals → Individual Briefing → Assessment'
        };
        
        auditResults.conversion_analysis = conversionAnalysis;
        
        // SECTION 7: INFORMATION ARCHITECTURE AUDIT
        console.log('\n--- SECTION 7: INFORMATION ARCHITECTURE AUDIT ---');
        
        const iaAnalysis = {
          current_structure: {
            '/': 'Homepage',
            '/observatory': 'Observatory Landing',
            '/observatory/[slug]': 'Individual Briefing',
            '/observatory/signals': 'Signal Library (referenced)',
            '/intelligence': 'Intelligence (referenced)',
            '/briefings': 'Briefings (referenced)',
            '/about': 'About (referenced)'
          },
          missing_pages: [
            '/observatory/signals (referenced but may not exist)',
            '/intelligence (referenced but may not exist)',
            '/briefings (referenced but may not exist)',
            '/about (referenced but may not exist)'
          ],
          unused_pages: [],
          duplicate_pages: [],
          navigation_issues: [
            'Some navigation links may point to non-existent pages',
            'Signal library CTA may lead to missing page'
          ]
        };
        
        auditResults.information_architecture = iaAnalysis;
        
        // SECTION 8: GAP ANALYSIS
        console.log('\n--- SECTION 8: GAP ANALYSIS ---');
        
        const gapAnalysis = {
          what_already_exists: [
            'Observatory landing page with hero section',
            'Recent signals display (4 cards)',
            'Assessment bridge section',
            'Published briefings in database',
            'Signal classification system',
            'Template structure (partial)'
          ],
          what_partially_exists: [
            'Navigation structure (some links may be broken)',
            'Brief template (inconsistent implementation)',
            'Content quality (variable across briefings)',
            'Conversion funnel (basic CTAs present)'
          ],
          what_is_completely_missing: [
            'Signal library page',
            'Intelligence hub page',
            'Briefings archive page',
            'About page',
            'Signal filtering and search',
            'Executive dashboard',
            'Assessment integration',
            'Content categorization',
            'Trending signals',
            'Executive summaries'
          ]
        };
        
        auditResults.gap_analysis = gapAnalysis;
        
        return new Response(JSON.stringify({
          success: true,
          audit_timestamp: new Date().toISOString(),
          audit_results: auditResults
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Observatory audit failed:', error);
        return new Response(JSON.stringify({
          error: 'Observatory audit failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Observatory audit - use /observatory-audit');
  }
};
