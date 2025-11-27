# Test JWT flow with detailed logging

$BASE_URL = "http://localhost:8080"

Write-Host "=== JWT TOKEN FLOW TEST ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "📝 STEP 1: Login to get JWT token" -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@gmail.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Sending login request..."
try {
    $loginResponse = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token received: $($token.Substring(0, 30))..." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Test auth endpoint
Write-Host "🧪 STEP 2: Test auth endpoint with token" -ForegroundColor Yellow
try {
    $authResponse = Invoke-WebRequest -Uri "$BASE_URL/api/events/test-auth" `
        -Method GET `
        -Headers @{Authorization = "Bearer $token"} `
        -ErrorAction Stop
    
    Write-Host "✅ Auth check passed!" -ForegroundColor Green
    Write-Host "Response: $($authResponse.Content)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Auth check failed: $_" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Create event
Write-Host "📝 STEP 3: Create test event" -ForegroundColor Yellow
$eventPayload = @{
    title = "Test Event 1"
    description = "This is a test event"
    eventDate = "2025-12-30"
    eventTime = "14:30"
    location = "Indore, India"
    capacity = 100
} | ConvertTo-Json

Write-Host "Sending event creation request..."
Write-Host "Payload: $eventPayload"
try {
    $eventResponse = Invoke-WebRequest -Uri "$BASE_URL/api/events/" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{Authorization = "Bearer $token"} `
        -Body $eventPayload `
        -ErrorAction Stop
    
    Write-Host "✅ Event created successfully!" -ForegroundColor Green
    $eventData = $eventResponse.Content | ConvertFrom-Json
    Write-Host "Event ID: $($eventData.id)" -ForegroundColor Green
    Write-Host "Response: $($eventResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Event creation failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "Check backend console for JWT filter logs above" -ForegroundColor Cyan
