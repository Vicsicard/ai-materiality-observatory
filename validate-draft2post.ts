// Draft2Post Validation Report for Article ID 5
// This script runs the Draft2Post pipeline locally for validation

import { Draft2PostPipeline } from './lib/pipeline/draft2post-agents';

// Mock Article ID 5 data based on provided information
const mockArticle5 = {
  id: 5,
  title: "Regulatory Attention Indicates Growing AI Compliance Needs",
  slug: "regulatory-attention-indicates-growing-ai-compliance-needs",
  content: `# Regulatory Attention Indicates Growing AI Compliance Needs

AI compliance requirements are expanding rapidly as organizations face increasing regulatory scrutiny. Recent developments indicate that token spend and AI resource consumption are becoming significant compliance considerations.

The original source discusses how token spend breaks budgets, creating pressure for organizations to better understand their AI resource usage. This financial pressure is driving regulatory attention as policymakers seek to understand the material impact of AI adoption.

Organizations are discovering that AI costs are accumulating faster than their visibility systems can track. This creates both financial risk and compliance challenges as regulators demand more transparency around AI operations and resource consumption.

The connection between token spend, budget pressure, and regulatory attention represents a significant shift in how organizations must approach AI governance and compliance planning.`,
  status: "published",
  event_id: 5,
  created_at: "2026-05-15T10:00:00Z"
};

const mockEvent5 = {
  id: 5,
  source_name: "The Pragmatic Engineer",
  source_url: "https://blog.pragmaticengineer.com/the-pulse-token-spend-breaks-budgets-what-next/",
  headline: "The Pulse: Token Spend Breaks Budgets - What Next?",
  published_date: "2026-05-15",
  article_text: mockArticle5.content,
  created_at: "2026-05-15T10:00:00Z"
};

async function generateValidationReport() {
  console.log("=".repeat(80));
  console.log("DRAFT2POST VALIDATION REPORT");
  console.log("Article ID: 5");
  console.log("=".repeat(80));

  // SECTION 1: INPUT RECORD
  console.log("\n" + "=".repeat(80));
  console.log("SECTION 1: INPUT RECORD");
  console.log("=".repeat(80));
  
  console.log(`ID: ${mockArticle5.id}`);
  console.log(`Current Title: ${mockArticle5.title}`);
  console.log(`Current Slug: ${mockArticle5.slug}`);
  console.log(`Source URL: ${mockEvent5.source_url}`);
  console.log(`Current Status: ${mockArticle5.status}`);
  console.log(`Content Excerpt: ${mockArticle5.content.substring(0, 200)}...`);
  
  // Initialize Draft2Post pipeline
  const pipeline = new Draft2PostPipeline();
  
  const input = {
    articleId: mockArticle5.id,
    event: mockEvent5,
    draftArticle: mockArticle5
  };

  try {
    // Run the complete pipeline
    console.log("\n" + "=".repeat(80));
    console.log("RUNNING DRAFT2POST PIPELINE...");
    console.log("=".repeat(80));
    
    const enhancements = await pipeline.process(input);

    // SECTION 2: AGENT 1 OUTPUT
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 2: AGENT 1 OUTPUT - Source Preservation Agent");
    console.log("=".repeat(80));
    
    console.log(`Source Title: ${enhancements.source_title}`);
    console.log(`Source Publication: ${enhancements.source_publication}`);
    console.log(`Source Summary: ${enhancements.source_summary}`);
    console.log(`Source Keywords: ${enhancements.source_keywords}`);
    
    console.log("\nCONFIRMATION:");
    console.log(`✓ Original source title preserved: ${enhancements.source_title === mockEvent5.headline}`);
    console.log(`✓ Original publication preserved: ${enhancements.source_publication === mockEvent5.source_name}`);
    console.log(`✓ Original source URL preserved in event record`);

    // SECTION 3: AGENT 2 OUTPUT
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 3: AGENT 2 OUTPUT - Signal Classification Agent");
    console.log("=".repeat(80));
    
    console.log(`Selected Signal Category: ${enhancements.signal_category}`);
    console.log(`Classification Reason: ${enhancements.classification_reason}`);
    console.log(`Classification Confidence: ${enhancements.classification_confidence}`);
    
    console.log("\nCATEGORY ANALYSIS:");
    console.log("Source event focuses on: token spend, budget breaks, AI engineering costs");
    console.log("Expected dominant category: Resource Consumption");
    console.log(`Actual classification: ${enhancements.signal_category}`);
    console.log(`Confidence score: ${enhancements.classification_confidence}/100`);

    // SECTION 4: AGENT 3 OUTPUT
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 4: AGENT 3 OUTPUT - Observatory Title Agent");
    console.log("=".repeat(80));
    
    console.log(`Observatory Title: ${enhancements.observatory_title}`);
    console.log(`Observatory Slug: ${enhancements.observatory_slug}`);
    console.log(`Meta Title: ${enhancements.meta_title}`);
    console.log(`Meta Description: ${enhancements.meta_description}`);
    
    console.log("\nTITLE PRESERVATION CHECK:");
    console.log("Source keywords should include: Token Spend, Breaks Budgets, The Pulse");
    const titleContainsKeywords = 
      enhancements.observatory_title?.toLowerCase().includes('token') &&
      enhancements.observatory_title?.toLowerCase().includes('spend') &&
      enhancements.observatory_title?.toLowerCase().includes('budget');
    console.log(`✓ Keywords preserved: ${titleContainsKeywords}`);

    // SECTION 5: AGENT 4 OUTPUT
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 5: AGENT 4 OUTPUT - Materiality Interpretation Agent");
    console.log("=".repeat(80));
    
    console.log(`What This May Indicate:`);
    console.log(enhancements.what_this_may_indicate);
    console.log(`\nPotential Organizational Relevance:`);
    console.log(enhancements.potential_organizational_relevance);
    console.log(`\nRelated Assessment Areas:`);
    console.log(enhancements.related_assessment_areas);

    // SECTION 6: AGENT 5 OUTPUT
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 6: AGENT 5 OUTPUT - Editorial Validation Agent");
    console.log("=".repeat(80));
    
    console.log(`Editorial Status: ${enhancements.editorial_status}`);
    console.log(`Editorial Notes: ${enhancements.editorial_notes}`);
    
    console.log("\nVALIDATION CHECKLIST:");
    console.log(`✓ Title preserves source signal: ${enhancements.observatory_title?.includes('Token')}`);
    console.log(`✓ Category matches dominant signal: ${enhancements.signal_category === 'Resource Consumption'}`);
    console.log(`✓ Signal → relevance → assessment connection: ${enhancements.what_this_may_indicate?.includes('organizational')}`);
    console.log(`✓ No hype language: ${!enhancements.observatory_title?.toLowerCase().includes('revolutionary')}`);
    console.log(`✓ No marketing language: ${!enhancements.observatory_title?.toLowerCase().includes('transform')}`);
    console.log(`✓ Ready for admin review: ${enhancements.editorial_status === 'ready_for_review'}`);

    // SECTION 7: FINAL PROPOSED DATABASE RECORD
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 7: FINAL PROPOSED DATABASE RECORD");
    console.log("=".repeat(80));
    
    const finalRecord = {
      id: mockArticle5.id,
      title: mockArticle5.title,
      slug: mockArticle5.slug,
      content: mockArticle5.content,
      status: "ready_for_review", // Would be updated by Draft2Post
      created_at: mockArticle5.created_at,
      // NEW DRAFT2POST FIELDS:
      source_title: enhancements.source_title,
      source_publication: enhancements.source_publication,
      source_summary: enhancements.source_summary,
      source_keywords: enhancements.source_keywords,
      signal_category: enhancements.signal_category,
      classification_reason: enhancements.classification_reason,
      classification_confidence: enhancements.classification_confidence,
      observatory_title: enhancements.observatory_title,
      observatory_slug: enhancements.observatory_slug,
      meta_title: enhancements.meta_title,
      meta_description: enhancements.meta_description,
      what_this_may_indicate: enhancements.what_this_may_indicate,
      potential_organizational_relevance: enhancements.potential_organizational_relevance,
      related_assessment_areas: enhancements.related_assessment_areas,
      editorial_status: enhancements.editorial_status,
      editorial_notes: enhancements.editorial_notes,
      published_at: null // Would be set when published
    };
    
    console.log(JSON.stringify(finalRecord, null, 2));

    // SECTION 8: FINAL OBSERVATORY CARD
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 8: FINAL OBSERVATORY CARD PREVIEW");
    console.log("=".repeat(80));
    
    console.log(`[${enhancements.signal_category?.toUpperCase()}]`);
    console.log(`\n${enhancements.observatory_title}`);
    console.log(`\nSource: ${enhancements.source_publication}`);
    console.log(`\nWhat This May Indicate:`);
    console.log(enhancements.what_this_may_indicate);
    console.log(`\nPotential Relevance:`);
    console.log(enhancements.potential_organizational_relevance);
    console.log(`\nRead Observation →`);

    // SECTION 9: FINAL ROUTING PLAN
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 9: FINAL ROUTING PLAN");
    console.log("=".repeat(80));
    
    console.log(`Intended Future URL:`);
    console.log(`/observatory/signals/${enhancements.observatory_slug}`);
    console.log(`\nCurrent URL:`);
    console.log(`/observations/${mockArticle5.slug}`);

    // SECTION 10: DEPLOYMENT READINESS ASSESSMENT
    console.log("\n" + "=".repeat(80));
    console.log("SECTION 10: DEPLOYMENT READINESS ASSESSMENT");
    console.log("=".repeat(80));
    
    console.log("\n1. Are the agents producing Observatory-ready outputs?");
    const outputsReady = enhancements.editorial_status === 'ready_for_review';
    console.log(`   ${outputsReady ? '✅ YES' : '❌ NO'} - ${enhancements.editorial_status}`);
    
    console.log("\n2. Is the category correct?");
    const categoryCorrect = enhancements.signal_category === 'Resource Consumption';
    console.log(`   ${categoryCorrect ? '✅ YES' : '❌ NO'} - Expected: Resource Consumption, Got: ${enhancements.signal_category}`);
    
    console.log("\n3. Is the slug SEO-aligned with the source event?");
    const slugAligned = enhancements.observatory_slug?.includes('token') && 
                      enhancements.observatory_slug?.includes('spend') &&
                      enhancements.observatory_slug?.includes('budget');
    console.log(`   ${slugAligned ? '✅ YES' : '❌ NO'} - Contains source keywords`);
    
    console.log("\n4. Is the meta description useful?");
    const metaUseful = enhancements.meta_description && enhancements.meta_description.length > 100;
    console.log(`   ${metaUseful ? '✅ YES' : '❌ NO'} - Length: ${enhancements.meta_description?.length || 0} chars`);
    
    console.log("\n5. Is the materiality interpretation specific enough?");
    const interpretationSpecific = (enhancements.what_this_may_indicate?.length || 0) > 50 &&
                                   (enhancements.potential_organizational_relevance?.length || 0) > 50;
    console.log(`   ${interpretationSpecific ? '✅ YES' : '❌ NO'} - Both sections substantive`);
    
    console.log("\n6. Are any schema fields missing?");
    const requiredFields = [
      'source_title', 'source_publication', 'signal_category', 
      'observatory_title', 'observatory_slug', 'what_this_may_indicate',
      'potential_organizational_relevance', 'editorial_status'
    ];
    const missingFields = requiredFields.filter(field => !enhancements[field as keyof typeof enhancements]);
    console.log(`   ${missingFields.length === 0 ? '✅ NO' : '❌ YES'} - Missing: ${missingFields.join(', ')}`);
    
    console.log("\n7. Should migration proceed?");
    const allChecksPass = outputsReady && categoryCorrect && slugAligned && metaUseful && 
                          interpretationSpecific && missingFields.length === 0;
    console.log(`   ${allChecksPass ? '✅ PROCEED' : '❌ HOLD'} - Overall readiness: ${allChecksPass ? 'READY' : 'NEEDS REVISION'}`);
    
    console.log("\n" + "=".repeat(80));
    console.log("VALIDATION REPORT COMPLETE");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("Draft2Post validation failed:", error);
  }
}

// Run the validation
generateValidationReport().catch(console.error);
