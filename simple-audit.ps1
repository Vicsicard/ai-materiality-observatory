# Simple Publication Audit

Write-Host "=== Publication Audit ==="

# Get observations
try {
    $observations = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Found $($observations.Count) observations"
} catch {
    Write-Host "Error fetching observations: $($_.Exception.Message)"
    exit
}

# Audit each article
foreach ($obs in $observations) {
    Write-Host "`n=== Article ID: $($obs.id) ==="
    Write-Host "Title: $($obs.title)"
    Write-Host "Slug: $($obs.slug)"
    
    # Get full article
    try {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($obs.slug)" -Method GET
        Write-Host "Content Length: $($article.content.length)"
        Write-Host "First 500 Characters:"
        Write-Host ($article.content.Substring(0, [Math]::Min(500, $article.content.Length)))
        
        # Check for "Event detected"
        if ($obs.title -eq "Event detected") {
            Write-Host "⚠️  WARNING: 'Event detected' found as final title"
        }
    } catch {
        Write-Host "Error fetching article: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Observatory Quality Check ==="

foreach ($obs in $observations) {
    Write-Host "`nArticle $($obs.id):"
    
    if ($obs.title -eq "Event detected") {
        Write-Host "❌ Title is 'Event detected' - NOT observatory quality"
    } else {
        Write-Host "✅ Title is observatory quality"
    }
    
    if ($obs.slug -eq "event-detected") {
        Write-Host "❌ Slug is 'event-detected' - likely from placeholder title"
    } else {
        Write-Host "✅ Slug appears properly derived"
    }
}
