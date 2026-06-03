# Check dashboard articles
$articles = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles' -Method GET
Write-Host "Dashboard Articles:"
foreach ($article in $articles) {
    Write-Host "ID: $($article.id), Slug: $($article.slug), Title: $($article.title)"
}
