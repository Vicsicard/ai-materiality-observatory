# Test complete Admin Dashboard workflow

Write-Host "=== COMPLETE ADMIN DASHBOARD WORKFLOW TEST ==="
Write-Host ""

# Submit a new article
Write-Host "STEP 1: Submit new article URL"
try {
    $body = @{ url = 'https://techcrunch.com/2026/06/02/ai-startup-raises-series-b-for-enterprise-solutions' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body
    
    Write-Host "✅ Article submitted successfully"
    Write-Host "Title: $($response.headline)"
    Write-Host "Article ID: $($response.articleId)"
    Write-Host "Status: $($response.approved)"
    
    $newArticleId = $response.articleId
    $newSlug = $response.slug
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
    exit
}

Write-Host ""

# Check if article appears in admin list
Write-Host "STEP 2: Check admin articles list"
try {
    $articles = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
    $newArticle = $articles | Where-Object { $_.id -eq $newArticleId }
    
    if ($newArticle) {
        Write-Host "✅ New article appears in admin list"
        Write-Host "Title: $($newArticle.title)"
        Write-Host "Status: $($newArticle.status)"
        Write-Host "Slug: $($newArticle.slug)"
    } else {
        Write-Host "❌ New article not found in admin list"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Test publish functionality
Write-Host "STEP 3: Test publish functionality"
try {
    $publishResponse = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles/$newArticleId/publish" -Method POST
    Write-Host "✅ Publish endpoint working"
    Write-Host "Response: $($publishResponse | ConvertTo-Json)"
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""

# Check if article appears in public feed
Write-Host "STEP 4: Check public observations feed"
try {
    $publicArticles = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    $publishedArticle = $publicArticles | Where-Object { $_.id -eq $newArticleId }
    
    if ($publishedArticle) {
        Write-Host "✅ Article appears in public feed"
        Write-Host "Title: $($publishedArticle.title)"
    } else {
        Write-Host "❌ Article not found in public feed"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== WORKFLOW TEST COMPLETE ==="
