# Test API Script for Registration Requests
# This script tests the Spring Boot backend API endpoints

Write-Host "Testing Spring Boot Backend API..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as HOD to get JWT token
Write-Host "Step 1: Logging in as HOD..." -ForegroundColor Yellow
$loginBody = @{
    email = "hod@kln.ac.lk"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    if ($loginResponse.success -and $loginResponse.token) {
        Write-Host "✓ Login successful!" -ForegroundColor Green
        Write-Host "  User: $($loginResponse.user.fullName)" -ForegroundColor Gray
        Write-Host "  Role: $($loginResponse.user.role)" -ForegroundColor Gray
        $token = $loginResponse.token
    } else {
        Write-Host "✗ Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure the Spring Boot backend is running on port 8080" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Fetch pending registrations
Write-Host "Step 2: Fetching pending registrations..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $pendingUsers = Invoke-RestMethod -Uri "http://localhost:8080/api/approvals/pending" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Successfully fetched pending registrations!" -ForegroundColor Green
    Write-Host "  Total pending users: $($pendingUsers.Count)" -ForegroundColor Gray
    Write-Host ""
    
    if ($pendingUsers.Count -gt 0) {
        Write-Host "Pending Users:" -ForegroundColor Cyan
        foreach ($user in $pendingUsers) {
            Write-Host "  - $($user.fullName) ($($user.email))" -ForegroundColor White
            Write-Host "    Role: $($user.role) | Mobile: $($user.mobile)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠ No pending users found in the database!" -ForegroundColor Yellow
        Write-Host "  This might indicate the database seed file didn't execute properly." -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to fetch pending registrations: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Test completed successfully!" -ForegroundColor Green
