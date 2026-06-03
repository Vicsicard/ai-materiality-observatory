$body = @{
    url = "https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
