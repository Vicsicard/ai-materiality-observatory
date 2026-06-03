$url = 'https://reuters.com/technology/artificial-intelligence/microsoft-ai-investing-2026-06-02/'
$body = @{ url = $url } | ConvertTo-Json

$response = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article' -Method POST -ContentType 'application/json' -Body $body

$response | ConvertTo-Json -Depth 10 | Out-File -FilePath 'C:\Users\digit\CascadeProjects\ai-materiality-observatory\reuters-response.json' -Encoding UTF8

Write-Host 'Response saved to reuters-response.json'
Write-Host 'Approved:' $response.approved
if ($response.validationReasons) { 
    Write-Host 'Validation Reasons:' ($response.validationReasons -join ', ') 
} else { 
    Write-Host 'Validation Reasons: None' 
}
Write-Host 'Article length:' $response.article.length
if ($response.article) { 
    Write-Host 'First 200 chars:' $response.article.Substring(0, [Math]::Min(200, $response.article.Length)) 
}
