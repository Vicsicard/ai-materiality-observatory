$body = @{
    url = "https://www.theverge.com/2024/12/20/24326629/google-gemini-2-0-flash-ai-model"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
