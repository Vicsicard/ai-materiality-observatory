# Check for Snowflake article
try {
    $obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Found $($obs.Count) articles"
    
    foreach ($o in $obs) {
        Write-Host "Article $($o.id): $($o.title)"
        if ($o.title -like "*Snowflake*" -or $o.slug -like "*snowflake*") {
            Write-Host "  *** SNOWFLAKE ARTICLE FOUND ***"
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
