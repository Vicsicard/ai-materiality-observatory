# AI Materiality Observatory Publication Quality Audit

Write-Host "=== AI MATERIALITY OBSERVATORY V1 PUBLICATION QUALITY AUDIT ==="
Write-Host "Audit Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Get observations
try {
    $obs = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Found $($obs.Count) observations"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit
}

Write-Host ""
Write-Host "SECTION 1 — Title Quality"
Write-Host "========================"

foreach ($o in $obs) {
    Write-Host "Article ID: $($o.id)"
    Write-Host "Stored Title: $($o.title)"
    Write-Host "Stored Slug: $($o.slug)"
    
    # Get full article
    try {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($o.slug)" -Method GET
        
        # Extract title from content
        if ($article.content -match '^#\s+(.+)$') {
            Write-Host "Generated Title: $($Matches[1])"
        } else {
            Write-Host "Generated Title: NOT FOUND"
        }
        
        # Title quality check
        $quality = "PASS"
        if ($o.title -eq "Event detected" -or $o.title -eq "Signal detected") {
            $quality = "FAIL"
        } elseif ($o.title -match "Pattern|Classification|Signal|Resource|Infrastructure") {
            $quality = "BORDERLINE"
        }
        
        Write-Host "Quality: $quality"
        
    } catch {
        Write-Host "ERROR: Could not fetch article - $($_.Exception.Message)"
    }
    
    Write-Host ""
}

Write-Host "SECTION 2 — Structure Compliance"
Write-Host "=============================="

foreach ($o in $obs) {
    Write-Host "Article ID: $($o.id)"
    
    try {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($o.slug)" -Method GET
        $content = $article.content
        
        $required = @("Executive Observation", "Source Event", "What Happened", "Why This Matters", "The Larger Signal", "Questions Worth Considering", "Assessment CTA")
        $missing = @()
        
        foreach ($section in $required) {
            if ($content -notmatch [regex]::Escape($section)) {
                $missing += $section
            }
        }
        
        if ($missing.Count -eq 0) {
            Write-Host "Structure: PASS"
        } else {
            Write-Host "Structure: FAIL - Missing: $($missing -join ', ')"
        }
        
    } catch {
        Write-Host "ERROR: Could not analyze structure"
    }
    
    Write-Host ""
}

Write-Host "SECTION 3 — Voice Compliance"
Write-Host "=========================="

$forbidden = @('should', 'must', 'need to', 'required', 'essential', 'critical', 'recommended', 'best practice')

foreach ($o in $obs) {
    Write-Host "Article ID: $($o.id)"
    
    try {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($o.slug)" -Method GET
        $content = $article.content.ToLower()
        
        $violations = @()
        foreach ($word in $forbidden) {
            if ($content -match [regex]::Escape($word)) {
                $violations += $word
            }
        }
        
        if ($violations.Count -eq 0) {
            Write-Host "Voice: PASS"
        } else {
            Write-Host "Voice: FAIL - Found: $($violations -join ', ')"
        }
        
    } catch {
        Write-Host "ERROR: Could not analyze voice"
    }
    
    Write-Host ""
}

Write-Host "SECTION 4 — Placeholder Audit"
Write-Host "============================"

$placeholders = @('event detected', 'signal detected', 'observation detected', 'infrastructure detected')

foreach ($o in $obs) {
    try {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($o.slug)" -Method GET
        $content = $article.content.ToLower()
        $title = $o.title.ToLower()
        
        foreach ($placeholder in $placeholders) {
            if ($title -match $placeholder -or $content -match $placeholder) {
                Write-Host "FOUND: Article $($o.id) - '$placeholder' in title/content"
            }
        }
    } catch {
        Write-Host "ERROR: Could not check article $($o.id)"
    }
}

Write-Host ""
Write-Host "SECTION 5 — Quality Scoring"
Write-Host "========================"

foreach ($o in $obs) {
    Write-Host "Article ID: $($o.id)"
    
    try {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($o.slug)" -Method GET
        $content = $article.content
        
        # Calculate scores
        $titleScore = if ($o.title -eq "Event detected") { 0 } elseif ($o.title -match "Pattern|Classification") { 5 } else { 8 }
        
        $structureScore = 10
        $required = @("Executive Observation", "Source Event", "What Happened", "Why This Matters", "The Larger Signal", "Questions Worth Considering", "Assessment CTA")
        foreach ($section in $required) {
            if ($content -notmatch [regex]::Escape($section)) { $structureScore -= 1 }
        }
        
        $voiceScore = 10
        $forbidden = @('should', 'must', 'need to', 'required', 'essential', 'critical', 'recommended', 'best practice')
        foreach ($word in $forbidden) {
            if ($content.ToLower() -match $word) { $voiceScore -= 2 }
        }
        
        $relevanceScore = 8
        if ($content.ToLower().contains("organizations")) { $relevanceScore += 1 }
        if ($content.ToLower().contains("operational")) { $relevanceScore += 1 }
        
        $total = $titleScore + $structureScore + $voiceScore + $relevanceScore
        
        Write-Host "Title: $titleScore/10, Structure: $structureScore/10, Voice: $voiceScore/10, Relevance: $relevanceScore/10"
        Write-Host "Total: $total/40"
        
    } catch {
        Write-Host "ERROR: Could not score article"
    }
    
    Write-Host ""
}

Write-Host "SECTION 6 — Publication Readiness"
Write-Host "=============================="

foreach ($o in $obs) {
    Write-Host "Article ID: $($o.id)"
    
    $status = "READY FOR PUBLICATION"
    $issues = @()
    
    if ($o.title -eq "Event detected") {
        $status = "REJECT"
        $issues += "Placeholder title"
    }
    
    try {
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($o.slug)" -Method GET
        $content = $article.content
        
        $required = @("Executive Observation", "Source Event", "What Happened", "Why This Matters", "The Larger Signal", "Questions Worth Considering", "Assessment CTA")
        $missing = @()
        foreach ($section in $required) {
            if ($content -notmatch [regex]::Escape($section)) {
                $missing += $section
            }
        }
        
        if ($missing.Count -gt 0) {
            if ($status -eq "READY FOR PUBLICATION") { $status = "NEEDS REVISION" }
            $issues += "Missing sections"
        }
        
        $forbidden = @('should', 'must', 'need to', 'required', 'essential', 'critical', 'recommended', 'best practice')
        foreach ($word in $forbidden) {
            if ($content.ToLower() -match $word) {
                if ($status -eq "READY FOR PUBLICATION") { $status = "NEEDS REVISION" }
                $issues += "Voice violations"
                break
            }
        }
        
    } catch {
        $status = "REJECT"
        $issues += "Cannot fetch article"
    }
    
    Write-Host "Status: $status"
    if ($issues.Count -gt 0) {
        Write-Host "Issues: $($issues -join ', ')"
    }
    
    Write-Host ""
}

Write-Host "=== AUDIT COMPLETE ==="
