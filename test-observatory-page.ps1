# Test Observatory page deployment
$response = Invoke-WebRequest -Uri 'https://ai-materiality-observatory.vercel.app/observatory' -Method GET
Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Content Length: $($response.Content.Length)"

# Check for key content
$content = $response.Content
if ($content -like '*Observatory*') {
    Write-Host "✅ Observatory content found"
} else {
    Write-Host "❌ Observatory content NOT found"
}

if ($content -like '*AI MATERIALITY*') {
    Write-Host "✅ AI Materiality label found"
} else {
    Write-Host "❌ AI Materiality label NOT found"
}

if ($content -like '*Assess Your Organization*') {
    Write-Host "✅ CTA found"
} else {
    Write-Host "❌ CTA NOT found"
}

if ($content -like '*404*') {
    Write-Host "⚠️ 404 error content found - page may be falling back to Next.js 404"
} else {
    Write-Host "✅ No 404 error content"
}
