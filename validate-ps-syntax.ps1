# Quick PowerShell syntax validator
param([string]$ScriptPath)

try {
    $content = Get-Content $ScriptPath -Raw
    $errors = $null
    $tokens = [System.Management.Automation.PSParser]::Tokenize($content, [ref]$errors)
    
    if ($errors.Count -eq 0) {
        Write-Host "✓ Syntax is valid" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "✗ Syntax errors found:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  Line $($error.Token.StartLine): $($error.Message)" -ForegroundColor Red
        }
        exit 1
    }
} catch {
    Write-Host "✗ Failed to parse: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}


