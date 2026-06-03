$body = @{
    url = "https://www.reuters.com/technology/artificial-intelligence/2024/12/20/openai-launches-new-reasoning-model"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
