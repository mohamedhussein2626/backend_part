# Test API Endpoints
$baseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "=== Testing Toolur Backend API ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Root endpoint
Write-Host "1. Testing Root Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl" -Method Get
    Write-Host "Root endpoint works!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Root endpoint failed: $_" -ForegroundColor Red
}

# Test 2: User Registration
Write-Host ""
Write-Host "2. Testing User Registration..." -ForegroundColor Yellow
$userRegisterBody = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/register" -Method Post -Body $userRegisterBody -ContentType "application/json"
    Write-Host "User registered successfully!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    $userToken = $response.token
} catch {
    Write-Host "User registration failed: $_" -ForegroundColor Red
    $userToken = $null
}

# Test 3: User Login
Write-Host ""
Write-Host "3. Testing User Login..." -ForegroundColor Yellow
$userLoginBody = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/login" -Method Post -Body $userLoginBody -ContentType "application/json"
    Write-Host "User login successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "User login failed: $_" -ForegroundColor Red
}

# Test 4: Admin Registration
Write-Host ""
Write-Host "4. Testing Admin Registration..." -ForegroundColor Yellow
$adminRegisterBody = @{
    name = "Admin User"
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/register" -Method Post -Body $adminRegisterBody -ContentType "application/json"
    Write-Host "Admin registered successfully!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    $adminToken = $response.token
} catch {
    Write-Host "Admin registration failed: $_" -ForegroundColor Red
    $adminToken = $null
}

# Test 5: Admin Login
Write-Host ""
Write-Host "5. Testing Admin Login..." -ForegroundColor Yellow
$adminLoginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
    Write-Host "Admin login successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Admin login failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
