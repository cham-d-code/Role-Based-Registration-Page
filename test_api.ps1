# Test script to verify the API
Write-Host "Testing Registration Requests API..." -ForegroundColor Cyan

# Step 1: Login as HOD
Write-Host "`n1. Logging in as HOD..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "hod@kln.ac.lk"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "   ✓ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get pending registrations
Write-Host "`n2. Fetching pending registrations..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $($loginResponse.token)"
    }
    
    $pendingUsers = Invoke-RestMethod -Uri "http://localhost:8080/api/approvals/pending" `
        -Method Get `
        -Headers $headers
    
    Write-Host "   ✓ API call successful!" -ForegroundColor Green
    Write-Host "   Found $($pendingUsers.Count) pending user(s)" -ForegroundColor Cyan
    
    if ($pendingUsers.Count -gt 0) {
        Write-Host "`n   Pending Users:" -ForegroundColor Cyan
        foreach ($user in $pendingUsers) {
            Write-Host "   - $($user.fullName) ($($user.email)) - Role: $($user.role)" -ForegroundColor White
        }
    } else {
        Write-Host "   No pending users found in database" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ API call failed: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nTest completed successfully!" -ForegroundColor Green
