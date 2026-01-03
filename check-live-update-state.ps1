# Quick verification script for Live Update feature flag state
# Usage: .\check-live-update-state.ps1

$configPath = "config/live-update.ts"
$capConfigPath = "capacitor.config.ts"

Write-Host "`nChecking Live Update Feature Flag State...`n" -ForegroundColor Cyan

# Check config file
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw
    if ($config -match "LIVE_UPDATE_ENABLED = (true|false)") {
        $enabled = $matches[1] -eq "true"
        $status = $matches[1].ToUpper()
        $color = if ($enabled) { "Green" } else { "Yellow" }
        Write-Host "Config File: LIVE_UPDATE_ENABLED = $status" -ForegroundColor $color
        
        # Check capacitor config
        if (Test-Path $capConfigPath) {
            $capConfig = Get-Content $capConfigPath -Raw
            # Check if conditional spread is used (correct pattern)
            $hasConditional = $capConfig -match "\.\.\.\s*\(LIVE_UPDATE_ENABLED"
            
            if ($hasConditional) {
                Write-Host "[OK] capacitor.config.ts uses conditional spread for LiveUpdate" -ForegroundColor Green
                # Note: The string "LiveUpdate" will appear in source, but won't be in compiled config when disabled
                if ($enabled) {
                    Write-Host "[OK] LiveUpdate will be included when flag is true" -ForegroundColor Green
                } else {
                    Write-Host "[OK] LiveUpdate will be excluded when flag is false" -ForegroundColor Green
                }
            } else {
                Write-Host "[WARN] capacitor.config.ts may not use conditional spread" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[ERROR] capacitor.config.ts not found" -ForegroundColor Red
        }
        
        # Check App.tsx
        $appPath = "src/App.tsx"
        if (Test-Path $appPath) {
            $appContent = Get-Content $appPath -Raw
            if ($appContent -match "import.*LIVE_UPDATE_ENABLED.*from.*config/live-update") {
                Write-Host "[OK] App.tsx imports LIVE_UPDATE_ENABLED" -ForegroundColor Green
                
                if ($appContent -match "if\s*\(LIVE_UPDATE_ENABLED\)") {
                    Write-Host "[OK] App.tsx uses conditional check for LIVE_UPDATE_ENABLED" -ForegroundColor Green
                } else {
                    Write-Host "[WARN] App.tsx may not have conditional check" -ForegroundColor Yellow
                }
            } else {
                Write-Host "[ERROR] App.tsx does not import LIVE_UPDATE_ENABLED" -ForegroundColor Red
            }
        }
        
        Write-Host "`nSummary:" -ForegroundColor Cyan
        Write-Host "   Feature Flag: $status" -ForegroundColor $color
        Write-Host "   Expected Behavior: $(if ($enabled) { 'LiveUpdate ENABLED' } else { 'LiveUpdate DISABLED' })" -ForegroundColor White
        
    } else {
        Write-Host "[ERROR] Could not parse config file - invalid format" -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] Config file not found at: $configPath" -ForegroundColor Red
}

Write-Host ""

