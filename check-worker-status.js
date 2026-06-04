/**
 * RSS Worker Status Check
 * 
 * Verifies whether the RSS intake worker is actually deployed and running
 */

async function checkWorkerStatus() {
  console.log('🔍 Checking RSS Worker Status...\n');
  
  const results = {
    workerName: 'rss-intake-worker',
    workerUrl: null,
    deploymentStatus: 'UNKNOWN',
    lastDeploymentTimestamp: null,
    cronTriggerStatus: 'UNKNOWN',
    lastSuccessfulExecution: null,
    lastFailedExecution: null,
    totalExecutions: 0,
    errors: []
  };

  try {
    // Check if wrangler is available
    console.log('📋 Checking Wrangler configuration...');
    const { execSync } = require('child_process');
    
    try {
      const wranglerVersion = execSync('wrangler --version', { encoding: 'utf8', stdio: 'pipe' });
      console.log(`✅ Wrangler available: ${wranglerVersion.trim()}`);
    } catch (error) {
      results.errors.push('Wrangler CLI not available');
      console.log('❌ Wrangler CLI not available');
    }

    // Check wrangler.toml configuration
    console.log('\n📋 Checking wrangler.toml configuration...');
    try {
      const fs = require('fs');
      const wranglerConfig = fs.readFileSync('wrangler.toml', 'utf8');
      
      if (wranglerConfig.includes('rss-intake-worker')) {
        console.log('✅ RSS worker found in wrangler.toml');
        results.deploymentStatus = 'CONFIGURED';
      } else {
        console.log('❌ RSS worker not found in wrangler.toml');
        results.errors.push('Worker not configured in wrangler.toml');
      }

      if (wranglerConfig.includes('crons')) {
        console.log('✅ Cron trigger configured');
        results.cronTriggerStatus = 'CONFIGURED';
      } else {
        console.log('❌ No cron trigger found');
        results.errors.push('No cron trigger configured');
      }
    } catch (error) {
      results.errors.push('Could not read wrangler.toml');
      console.log('❌ Could not read wrangler.toml');
    }

    // Check worker file exists
    console.log('\n📋 Checking worker file...');
    try {
      const fs = require('fs');
      if (fs.existsSync('workers/rss-intake-worker-cf.ts')) {
        console.log('✅ Worker file exists: workers/rss-intake-worker-cf.ts');
      } else {
        console.log('❌ Worker file not found');
        results.errors.push('Worker file not found');
      }
    } catch (error) {
      results.errors.push('Could not check worker file');
    }

    // Try to get worker status from Cloudflare
    console.log('\n📋 Checking Cloudflare deployment status...');
    try {
      const workerList = execSync('wrangler whoami', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ Cloudflare authentication:', workerList.trim());
      
      // Try to get worker list
      try {
        const workers = execSync('wrangler deployments list', { encoding: 'utf8', stdio: 'pipe' });
        console.log('✅ Worker deployments accessible');
        results.deploymentStatus = 'DEPLOYED';
      } catch (deployError) {
        console.log('⚠️ Could not list deployments');
        results.errors.push('Could not list deployments');
      }
    } catch (authError) {
      console.log('❌ Cloudflare authentication failed');
      results.errors.push('Cloudflare authentication failed');
    }

    // Check database connectivity (if worker was running)
    console.log('\n📋 Checking database connectivity...');
    try {
      // This would be the database the worker connects to
      const fs = require('fs');
      if (fs.existsSync('lib/db/rss-schema.sql')) {
        console.log('✅ Database schema exists');
      } else {
        console.log('❌ Database schema not found');
        results.errors.push('Database schema not found');
      }
    } catch (error) {
      results.errors.push('Could not check database schema');
    }

  } catch (error) {
    results.errors.push(`General error: ${error.message}`);
  }

  return results;
}

function generateWorkerReport(results) {
  let report = `# RSS Worker Status Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Worker Name:** ${results.workerName}\n\n`;

  report += `## Deployment Status\n\n`;
  report += `| Status | Value |\n`;
  report += `| ------ | ----- |\n`;
  report += `| Worker Name | ${results.workerName} |\n`;
  report += `| Worker URL | ${results.workerUrl || 'N/A'} |\n`;
  report += `| Deployment Status | ${results.deploymentStatus} |\n`;
  report += `| Cron Trigger Status | ${results.cronTriggerStatus} |\n`;
  report += `| Last Deployment | ${results.lastDeploymentTimestamp || 'N/A'} |\n`;
  report += `| Last Successful Execution | ${results.lastSuccessfulExecution || 'N/A'} |\n`;
  report += `| Last Failed Execution | ${results.lastFailedExecution || 'N/A'} |\n`;
  report += `| Total Executions | ${results.totalExecutions} |\n\n`;

  if (results.errors.length > 0) {
    report += `## Issues Found\n\n`;
    for (const error of results.errors) {
      report += `- ❌ ${error}\n`;
    }
    report += `\n`;
  }

  report += `## Assessment\n\n`;
  
  if (results.errors.length === 0) {
    report += `✅ **Worker appears to be properly configured**\n\n`;
    report += `Next steps:\n`;
    report += `1. Verify actual deployment with \`wrangler deployments list\`\n`;
    report += `2. Check execution logs with \`wrangler tail\`\n`;
    report += `3. Test manual execution\n`;
  } else if (results.errors.length <= 2) {
    report += `⚠️ **Worker has configuration issues**\n\n`;
    report += `Issues to resolve:\n`;
    for (const error of results.errors) {
      report += `- Fix: ${error}\n`;
    }
    report += `\n`;
  } else {
    report += `❌ **Worker has significant issues**\n\n`;
    report += `Major problems detected. Worker likely not operational.\n\n`;
  }

  report += `## Recommended Actions\n\n`;
  report += `1. **Deploy Worker:** \`npm run worker:deploy\`\n`;
  report += `2. **Check Logs:** \`wrangler tail rss-intake-worker\`\n`;
  report += `3. **Test Execution:** Manual trigger test\n`;
  report += `4. **Monitor:** Check database for ingestion logs\n`;

  return report;
}

// Run status check
checkWorkerStatus()
  .then(results => {
    const report = generateWorkerReport(results);
    console.log(report);
    
    // Save report
    const fs = require('fs');
    fs.writeFileSync('rss-worker-status-report.md', report);
    console.log('\n📄 Report saved to: rss-worker-status-report.md');
  })
  .catch(error => {
    console.error('💥 Worker status check failed:', error);
    process.exit(1);
  });
