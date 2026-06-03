# AI Materiality Observatory V1 - Publication Quality Audit

Write-Host "=== AI MATERIALITY OBSERVATORY V1 PUBLICATION QUALITY AUDIT ==="
Write-Host "Audit Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# SECTION 1: Get all observations
Write-Host "SECTION 1 — Title Quality Audit"
Write-Host "================================"

try {
    $observations = Invoke-RestMethod -Uri 'https://ai-materiality-observatory.vic-76c.workers.dev/api/observations' -Method GET
    Write-Host "Found $($observations.Count) observations"
    Write-Host ""
    
    $auditResults = @()
    
    foreach ($obs in $observations) {
        Write-Host "=== Article ID: $($obs.id) ==="
        
        # Get full article content
        $article = Invoke-RestMethod -Uri "https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/$($obs.slug)" -Method GET
        
        # Extract observatory title from article content
        $titleMatch = $article.content -match '^#\s+(.+)$'
        $observatoryTitle = if ($titleMatch) { $titleMatch[1].Trim() } else { "NO TITLE FOUND" }
        
        Write-Host "Stored Title: $($obs.title)"
        Write-Host "Stored Slug: $($obs.slug)"
        Write-Host "Generated Observatory Title: $observatoryTitle"
        Write-Host "Signal Type: $($obs.signal_type)"
        
        # Title Quality Assessment
        $titleQuality = "PASS"
        $failReasons = @()
        
        # Check for placeholder titles
        $placeholderTitles = @('Event detected', 'Signal detected', 'Observation detected', 'Article detected', 'Infrastructure detected', 'Unknown event')
        if ($placeholderTitles -contains $obs.title) {
            $titleQuality = "FAIL"
            $failReasons += "Placeholder title detected"
        }
        
        # Check for internal system labels
        if ($obs.title -match "Pattern|Classification|Signal|Resource|Infrastructure|Governance|Dependency|Sustainability|Reporting") {
            if ($titleQuality -eq "PASS") { $titleQuality = "BORDERLINE" }
            $failReasons += "Classification label masquerading as title"
        }
        
        # Check for generic titles
        if ($obs.title.length -lt 15 -or $obs.title -match "^(AI|The|A |An )") {
            if ($titleQuality -eq "PASS") { $titleQuality = "BORDERLINE" }
            $failReasons += "Generic title pattern"
        }
        
        Write-Host "Title Quality: $titleQuality"
        if ($failReasons.Count -gt 0) {
            Write-Host "Fail Reasons: $($failReasons -join ', ')"
        }
        
        # Store for later sections
        $auditData = @{
            id = $obs.id
            title = $obs.title
            slug = $obs.slug
            observatoryTitle = $observatoryTitle
            signalType = $obs.signal_type
            content = $article.content
            titleQuality = $titleQuality
            failReasons = $failReasons
        }
        $auditResults += $auditData
        
        Write-Host ""
    }
    
} catch {
    Write-Host "ERROR: Failed to fetch observations - $($_.Exception.Message)"
    exit
}

Write-Host ""
Write-Host "SECTION 2 — Observatory Structure Compliance"
Write-Host "=========================================="

foreach ($audit in $auditResults) {
    Write-Host "=== Article ID: $($audit.id) ==="
    
    $content = $audit.content
    $structureIssues = @()
    
    # Check for required sections
    $requiredSections = @(
        "Executive Observation",
        "Source Event", 
        "What Happened",
        "Why This Matters",
        "The Larger Signal",
        "What This Could Mean For Organizations",
        "Questions Worth Considering",
        "Looking Beyond The Headline",
        "Could This Apply To Your Organization?",
        "Assessment CTA"
    )
    
    $foundSections = @()
    foreach ($section in $requiredSections) {
        if ($content -match [regex]::Escape($section)) {
            $foundSections += $section
        } else {
            $structureIssues += "Missing section: $section"
        }
    }
    
    if ($structureIssues.Count -eq 0) {
        Write-Host "Structure: PASS"
        Write-Host "Found all required sections"
    } else {
        Write-Host "Structure: FAIL"
        Write-Host "Issues: $($structureIssues -join ', ')"
    }
    
    $audit.structureQuality = if ($structureIssues.Count -eq 0) { "PASS" } else { "FAIL" }
    $audit.structureIssues = $structureIssues
    
    Write-Host ""
}

Write-Host "SECTION 3 — Observatory Voice Compliance"
Write-Host "======================================"

$forbiddenWords = @('should', 'must', 'need to', 'required', 'essential', 'critical', 'recommended', 'best practice', 'transformative', 'unprecedented')

foreach ($audit in $auditResults) {
    Write-Host "=== Article ID: $($audit.id) ==="
    
    $content = $audit.content.ToLower()
    $voiceViolations = @()
    
    foreach ($word in $forbiddenWords) {
        if ($content -match [regex]::Escape($word)) {
            # Find the exact sentence
            $sentences = $audit.content -split '(?<=[.!?])\s+'
            foreach ($sentence in $sentences) {
                if ($sentence.ToLower() -match [regex]::Escape($word)) {
                    $voiceViolations += "Found '$word' in: $($sentence.Trim())"
                    break
                }
            }
        }
    }
    
    if ($voiceViolations.Count -eq 0) {
        Write-Host "Observatory Voice: PASS"
        Write-Host "No forbidden words found"
    } else {
        Write-Host "Observatory Voice: FAIL"
        Write-Host "Violations:"
        foreach ($violation in $voiceViolations) {
            Write-Host "  - $violation"
        }
    }
    
    $audit.voiceQuality = if ($voiceViolations.Count -eq 0) { "PASS" } else { "FAIL" }
    $audit.voiceViolations = $voiceViolations
    
    Write-Host ""
}

Write-Host "SECTION 4 — Placeholder Audit"
Write-Host "============================"

$placeholderOccurrences = @()

foreach ($audit in $auditResults) {
    $content = $audit.content.ToLower()
    $title = $audit.title.ToLower()
    
    $placeholders = @('event detected', 'signal detected', 'observation detected', 'infrastructure detected', 'unknown event')
    
    foreach ($placeholder in $placeholders) {
        if ($title -match [regex]::Escape($placeholder)) {
            $placeholderOccurrences += @{
                article_id = $audit.id
                title = $audit.title
                location = "Title"
                found = $placeholder
            }
        }
        
        if ($content -match [regex]::Escape($placeholder)) {
            $placeholderOccurrences += @{
                article_id = $audit.id
                title = $audit.title
                location = "Content"
                found = $placeholder
            }
        }
    }
}

if ($placeholderOccurrences.Count -eq 0) {
    Write-Host "No placeholder occurrences found"
} else {
    Write-Host "Found $($placeholderOccurrences.Count) placeholder occurrences:"
    foreach ($occurrence in $placeholderOccurrences) {
        Write-Host "  Article ID: $($occurrence.article_id), Title: '$($occurrence.title)', Location: $($occurrence.location), Found: '$($occurrence.found)'"
    }
}

Write-Host ""
Write-Host "SECTION 5 — Publication Quality Scoring"
Write-Host "====================================="

foreach ($audit in $auditResults) {
    Write-Host "=== Article ID: $($audit.id) ==="
    
    # Title Quality Score (0-10)
    $titleScore = 10
    if ($audit.titleQuality -eq "FAIL") { $titleScore = 0 }
    elseif ($audit.titleQuality -eq "BORDERLINE") { $titleScore = 5 }
    
    # Structure Quality Score (0-10)
    $structureScore = 10
    if ($audit.structureQuality -eq "FAIL") { 
        $structureScore = 10 - $audit.structureIssues.Count
        if ($structureScore -lt 0) { $structureScore = 0 }
    }
    
    # Observatory Voice Score (0-10)
    $voiceScore = 10
    if ($audit.voiceQuality -eq "FAIL") { 
        $voiceScore = 10 - $audit.voiceViolations.Count
        if ($voiceScore -lt 0) { $voiceScore = 0 }
    }
    
    # Operational Relevance Score (0-10) - based on content analysis
    $relevanceScore = 8 # Base score
    if ($audit.content.ToLower().contains("organizations")) { $relevanceScore += 1 }
    if ($audit.content.ToLower().contains("operational")) { $relevanceScore += 1 }
    if ($relevanceScore -gt 10) { $relevanceScore = 10 }
    
    $overallScore = $titleScore + $structureScore + $voiceScore + $relevanceScore
    
    Write-Host "Title Quality: $titleScore/10"
    Write-Host "Structure Quality: $structureScore/10"
    Write-Host "Observatory Voice: $voiceScore/10"
    Write-Host "Operational Relevance: $relevanceScore/10"
    Write-Host "Overall: $overallScore/40"
    
    $audit.titleScore = $titleScore
    $audit.structureScore = $structureScore
    $audit.voiceScore = $voiceScore
    $audit.relevanceScore = $relevanceScore
    $audit.overallScore = $overallScore
    
    Write-Host ""
}

Write-Host "SECTION 6 — Publication Readiness"
Write-Host "==============================="

foreach ($audit in $auditResults) {
    Write-Host "=== Article ID: $($audit.id) ==="
    
    $readiness = "READY FOR PUBLICATION"
    $reasons = @()
    
    if ($audit.titleQuality -eq "FAIL") {
        $readiness = "REJECT"
        $reasons += "Title quality failed - placeholder or system labels"
    }
    
    if ($audit.structureQuality -eq "FAIL") {
        if ($readiness -eq "READY FOR PUBLICATION") { $readiness = "NEEDS REVISION" }
        $reasons += "Missing required sections"
    }
    
    if ($audit.voiceQuality -eq "FAIL") {
        if ($readiness -eq "READY FOR PUBLICATION") { $readiness = "NEEDS REVISION" }
        $reasons += "Voice violations - forbidden words found"
    }
    
    if ($audit.overallScore -lt 25) {
        if ($readiness -eq "READY FOR PUBLICATION") { $readiness = "NEEDS REVISION" }
        $reasons += "Overall quality score below threshold"
    }
    
    Write-Host "Status: $readiness"
    if ($reasons.Count -gt 0) {
        Write-Host "Reasons: $($reasons -join '; ')"
    }
    
    $audit.readiness = $readiness
    $audit.reasons = $reasons
    
    Write-Host ""
}

Write-Host "=== FINAL DELIVERABLES ==="
Write-Host ""

Write-Host "1. Publication Audit Report"
Write-Host "========================="
foreach ($audit in $auditResults) {
    Write-Host "Article $($audit.id): $($audit.readiness) - Score: $($audit.overallScore)/40"
}

Write-Host ""
Write-Host "2. Publication Quality Scorecard"
Write-Host "=============================="
foreach ($audit in $auditResults) {
    Write-Host "Article $($audit.id): T:$($audit.titleScore) S:$($audit.structureScore) V:$($audit.voiceScore) R:$($audit.relevanceScore) = $($audit.overallScore)/40"
}

Write-Host ""
Write-Host "3. List of All Failures"
Write-Host "===================="
$allFailures = $auditResults | Where-Object { $_.readiness -ne "READY FOR PUBLICATION" }
foreach ($failure in $allFailures) {
    Write-Host "Article $($failure.id): $($failure.readiness) - $($failure.reasons -join '; ')"
}

Write-Host ""
Write-Host "4. Top 5 Publication Quality Weaknesses"
Write-Host "===================================="
$weaknessCounts = @{}
foreach ($audit in $auditResults) {
    foreach ($reason in $audit.reasons) {
        if ($weaknessCounts.ContainsKey($reason)) {
            $weaknessCounts[$reason]++
        } else {
            $weaknessCounts[$reason] = 1
        }
    }
}

$topWeaknesses = $weaknessCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5
$i = 1
foreach ($weakness in $topWeaknesses) {
    Write-Host "$i. $($weakness.Key) ($($weakness.Value) occurrences)"
    $i++
}

Write-Host ""
Write-Host "5. Single Highest-Priority Publication Quality Issue"
Write-Host "=================================================="
if ($topWeaknesses.Count -gt 0) {
    $highestPriority = $topWeaknesses | Select-Object -First 1
    Write-Host "HIGHEST PRIORITY: $($highestPriority.Key)"
    Write-Host "Occurrences: $($highestPriority.Value)"
    Write-Host "Impact: Affects $($highestPriority.Value) of $($auditResults.Count) publications"
} else {
    Write-Host "No critical issues found - all publications ready"
}

Write-Host ""
Write-Host "=== AUDIT COMPLETE ==="
