# Publication Audit - Examine exact contents of articles.id = 1 and 2

Write-Host "=== Publication Audit ==="

# Function to get article details
function Get-ArticleDetails($articleId) {
    try {
        # First get all observations to find the slug for this article ID
        $observations = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
        $observation = $observations | Where-Object { $_.id -eq $articleId }
        
        if ($observation) {
            Write-Host "`n=== Article ID: $articleId ==="
            Write-Host "Title: $($observation.title)"
            Write-Host "Slug: $($observation.slug)"
            
            # Get full article content
            $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($observation.slug)" -Method GET
            Write-Host "Content Length: $($article.content.length)"
            Write-Host "First 500 Characters:"
            Write-Host ($article.content.Substring(0, [Math]::Min(500, $article.content.Length)))
            
            # Check for "Event detected" in title
            if ($observation.title -eq "Event detected") {
                Write-Host "⚠️  WARNING: 'Event detected' found as final title"
                Write-Host "Need to trace origin of this value"
            }
            
            return @{
                Title = $observation.title
                Slug = $observation.slug
                Content = $article.content
                ContentLength = $article.content.length
            }
        } else {
            Write-Host "❌ Article ID $articleId not found"
            return $null
        }
    } catch {
        Write-Host "❌ Error fetching article ID $articleId: $($_.Exception.Message)"
        return $null
    }
}

# Audit both articles
$article1 = Get-ArticleDetails 1
$article2 = Get-ArticleDetails 2

Write-Host "`n=== Observatory Quality Verification ==="

function Verify-ObservatoryQuality($article, $id) {
    if (-not $article) {
        Write-Host "Article $id: Not available for verification"
        return
    }
    
    Write-Host "`nArticle $id Verification:"
    
    # 1. Title is observatory-quality
    if ($article.Title -eq "Event detected") {
        Write-Host "❌ Title quality: FAILED - 'Event detected' is not observatory-quality"
    } else {
        Write-Host "✅ Title quality: PASSED - Title is observatory-quality"
    }
    
    # 2. Title is not a placeholder
    if ($article.Title -eq "Event detected" -or $article.Title -eq "" -or $article.Title -eq $null) {
        Write-Host "❌ Title placeholder: FAILED - Title appears to be a placeholder"
    } else {
        Write-Host "✅ Title placeholder: PASSED - Title is not a placeholder"
    }
    
    # 3. Slug is derived from final article title
    $expectedSlug = $article.Title.ToLower().Replace(/[^a-z0-9\s-]/g, '').Replace(/\s+/, '-').Substring(0, [Math]::Min(100, $article.Title.Length))
    if ($article.Slug -eq $expectedSlug) {
        Write-Host "✅ Slug derivation: PASSED - Slug derived from title"
    } else {
        Write-Host "❌ Slug derivation: FAILED - Slug not derived from title"
        Write-Host "   Expected: $expectedSlug"
        Write-Host "   Actual: $($article.Slug)"
    }
    
    # 4. Content is full observatory brief
    if ($article.ContentLength -gt 2000 -and $article.Content.Contains("# Executive Observation")) {
        Write-Host "✅ Full observatory brief: PASSED - Content appears to be a complete observatory brief"
    } else {
        Write-Host "❌ Full observatory brief: FAILED - Content does not appear to be a complete observatory brief"
    }
}

Verify-ObservatoryQuality $article1 1
Verify-ObservatoryQuality $article2 2

Write-Host "`n=== Audit Complete ==="
