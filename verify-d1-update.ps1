# Verify D1 update
$obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
$article = $obs | Where-Object { $_.id -eq 2 }

Write-Host "D1 Title:" $article.title
Write-Host "D1 Slug:" $article.slug

if ($article.title -eq "Funding Patterns Signal AI Resource Intensification") {
    Write-Host "✅ SUCCESS: D1 updated with Writer-generated title"
} else {
    Write-Host "❌ FAILED: D1 still has old title"
}

if ($article.slug -eq "funding-patterns-signal-ai-resource-intensification") {
    Write-Host "✅ SUCCESS: D1 updated with new slug"
} else {
    Write-Host "❌ FAILED: D1 still has old slug"
}
