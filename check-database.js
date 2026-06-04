/**
 * Database Reality Check
 * 
 * Gets actual row counts from all AMO V3 tables
 */

async function checkDatabase() {
  console.log('🔍 Checking Database Reality...\n');
  
  const results = {
    rss_sources: 0,
    rss_articles: 0,
    candidate_articles: 0,
    rss_ingestion_logs: 0,
    screening_logs: 0,
    errors: []
  };

  try {
    // Check if wrangler D1 commands are available
    const { execSync } = require('child_process');
    
    console.log('📋 Checking database connection...');
    try {
      const dbInfo = execSync('wrangler d1 info ai-materiality-observatory', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ Database accessible');
      console.log(dbInfo);
    } catch (error) {
      results.errors.push('Database not accessible via wrangler');
      console.log('❌ Database not accessible');
      return results;
    }

    // Get table counts
    const tables = [
      'rss_sources',
      'rss_articles', 
      'candidate_articles',
      'rss_ingestion_logs',
      'screening_logs'
    ];

    for (const table of tables) {
      console.log(`📊 Counting ${table}...`);
      
      try {
        const query = `SELECT COUNT(*) as count FROM ${table}`;
        const result = execSync(`wrangler d1 execute ai-materiality-observatory --command="${query}"`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
        
        // Parse the result to extract count
        const countMatch = result.match(/count:\s*(\d+)/);
        if (countMatch) {
          results[table] = parseInt(countMatch[1]);
          console.log(`✅ ${table}: ${results[table]} rows`);
        } else {
          console.log(`⚠️ Could not parse count for ${table}`);
          results.errors.push(`Could not parse count for ${table}`);
        }
        
      } catch (error) {
        console.log(`❌ Error counting ${table}: ${error.message}`);
        results.errors.push(`Error counting ${table}: ${error.message}`);
      }
    }

    // Get sample data from each table if they have data
    console.log('\n📋 Getting sample data...');
    
    if (results.rss_sources > 0) {
      try {
        const sampleQuery = 'SELECT name, feed_url, is_active FROM rss_sources LIMIT 5';
        const sampleResult = execSync(`wrangler d1 execute ai-materiality-observatory --command="${sampleQuery}"`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
        console.log('✅ RSS Sources sample:');
        console.log(sampleResult);
      } catch (error) {
        console.log(`⚠️ Could not get RSS sources sample`);
      }
    }

    if (results.rss_articles > 0) {
      try {
        const sampleQuery = 'SELECT title, source_name, created_at FROM rss_articles ORDER BY created_at DESC LIMIT 3';
        const sampleResult = execSync(`wrangler d1 execute ai-materiality-observatory --command="${sampleQuery}"`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
        console.log('✅ RSS Articles sample:');
        console.log(sampleResult);
      } catch (error) {
        console.log(`⚠️ Could not get RSS articles sample`);
      }
    }

    if (results.candidate_articles > 0) {
      try {
        const sampleQuery = 'SELECT title, status, created_at FROM candidate_articles ORDER BY created_at DESC LIMIT 3';
        const sampleResult = execSync(`wrangler d1 execute ai-materiality-observatory --command="${sampleQuery}"`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
        console.log('✅ Candidate Articles sample:');
        console.log(sampleResult);
      } catch (error) {
        console.log(`⚠️ Could not get candidate articles sample`);
      }
    }

  } catch (error) {
    results.errors.push(`General database error: ${error.message}`);
    console.log(`❌ General database error: ${error.message}`);
  }

  return results;
}

function generateDatabaseReport(results) {
  let report = `# Database Validation Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;

  report += `## Table Row Counts\n\n`;
  report += `| Table | Row Count |\n`;
  report += `| ---- | --------- |\n`;
  report += `| rss_sources | ${results.rss_sources} |\n`;
  report += `| rss_articles | ${results.rss_articles} |\n`;
  report += `| candidate_articles | ${results.candidate_articles} |\n`;
  report += `| rss_ingestion_logs | ${results.rss_ingestion_logs} |\n`;
  report += `| screening_logs | ${results.screening_logs} |\n\n`;

  report += `## Data Assessment\n\n`;
  
  const totalRows = Object.values(results).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
  
  if (totalRows === 0) {
    report += `❌ **Database appears to be empty**\n\n`;
    report += `No data found in any AMO V3 tables.\n\n`;
    report += `Likely causes:\n`;
    report += `1. Database not initialized\n`;
    report += `2. RSS worker not running\n`;
    report += `3. Schema not created\n\n`;
  } else if (results.rss_sources === 0) {
    report += `❌ **No RSS sources configured**\n\n`;
    report += `RSS sources table is empty. Need to seed sources.\n\n`;
  } else if (results.rss_articles === 0) {
    report += `❌ **No articles ingested**\n\n`;
    report += `RSS sources exist but no articles have been ingested.\n`;
    report += `Worker may not be running or feeds may be failing.\n\n`;
  } else if (results.candidate_articles === 0) {
    report += `❌ **No candidates created**\n\n`;
    report += `Articles ingested but no candidates created.\n`;
    report += `Issue in candidate creation process.\n\n`;
  } else {
    report += `✅ **Database contains data**\n\n`;
    report += `Data flow appears to be working:\n`;
    report += `- RSS sources: ${results.rss_sources}\n`;
    report += `- Articles ingested: ${results.rss_articles}\n`;
    report += `- Candidates created: ${results.candidate_articles}\n`;
    report += `- Ingestion logs: ${results.rss_ingestion_logs}\n`;
    report += `- Screening logs: ${results.screening_logs}\n\n`;
  }

  if (results.errors.length > 0) {
    report += `## Database Errors\n\n`;
    for (const error of results.errors) {
      report += `- ❌ ${error}\n`;
    }
    report += `\n`;
  }

  report += `## Recommendations\n\n`;
  
  if (totalRows === 0) {
    report += `1. **Initialize Database:** \`npm run db:init\`\n`;
    report += `2. **Seed RSS Sources:** \`npm run db:seed\`\n`;
    report += `3. **Deploy Worker:** \`npm run worker:deploy\`\n`;
  } else if (results.rss_articles === 0) {
    report += `1. **Check Worker Status:** Verify worker is deployed and running\n`;
    report += `2. **Verify RSS Feeds:** Check feed URLs are accessible\n`;
    report += `3. **Check Worker Logs:** \`wrangler tail rss-intake-worker\`\n`;
  } else if (results.candidate_articles === 0) {
    report += `1. **Debug Candidate Creation:** Check worker logic\n`;
    report += `2. **Verify Database Schema:** Ensure candidate_articles table exists\n`;
    report += `3. **Check Worker Logs:** Look for candidate creation errors\n`;
  } else {
    report += `1. **Monitor Performance:** Check ingestion rates\n`;
    report += `2. **Verify Screening:** Ensure screening process is working\n`;
    report += `3. **Check Quality:** Review article relevance\n`;
  }

  return report;
}

// Run database check
checkDatabase()
  .then(results => {
    const report = generateDatabaseReport(results);
    console.log(report);
    
    // Save report
    const fs = require('fs');
    fs.writeFileSync('database-validation-report.md', report);
    console.log('\n📄 Report saved to: database-validation-report.md');
  })
  .catch(error => {
    console.error('💥 Database check failed:', error);
    process.exit(1);
  });
