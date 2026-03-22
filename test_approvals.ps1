$loginUrl = "http://localhost:8080/api/auth/login"
$pendingUrl = "http://localhost:8080/api/approvals/pending"

# 1. Login
$loginBody = @{
    email = "hod@kln.ac.lk"
    password = "password123" 
} | ConvertTo-Json

try {
    Write-Host "Attempting login with hod@kln.ac.lk..."
    $response = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $response.token
    Write-Host "Login successful. Token obtained."
    Write-Host "User Role: $($response.user.role)"
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errBody = $streamReader.ReadToEnd()
    Write-Host "Error Response: $errBody"
    exit
}

# 2. Fetch Pending
$headers = @{
    Authorization = "Bearer $token"
}

try {
    Write-Host "Fetching pending registrations..."
    $pending = Invoke-RestMethod -Uri $pendingUrl -Method Get -Headers $headers
    Write-Host "Pending Users Found: $($pending.Count)"
    $pending | Format-Table id, fullName, email, role, createdAt
} catch {
    Write-Host "Fetch failed: $($_.Exception.Message)"
}
