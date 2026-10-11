# Connection configuration
$server   = "localhost"
$username = "admin"
$password = "admin"

# Map of [Folder/Project Name] = [Database Name]
$dbs = [ordered]@{
    'AstroSim Nexus'     = 'astrosim'
    'HotelOps'           = 'hotelops'
    'KwanPro'            = 'kwanpro'
    'Nuclear Launch Sim' = 'nuclear_launch_sim'
    'OmniPOS Core'       = 'omnipos'
    'OpsGrid'            = 'opsgrid'
    'ProdIntel StageOps' = 'prodintel'
    'War Matrix'         = 'warmatrix'
}

# 1. Create all databases (connected to master)
Write-Host "--- Step 1: Creating Databases ---" -ForegroundColor Cyan
foreach ($db in $dbs.Values) {
    Write-Host "Creating database: $db"
    sqlcmd -S $server -U $username -P $password -d master -Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$db') CREATE DATABASE [$db];"
}

# 2. Apply schemas to target databases (-d flag avoids master permission issues)
Write-Host "`n--- Step 2: Applying Schemas ---" -ForegroundColor Cyan
foreach ($project in $dbs.Keys) {
    $targetDb = $dbs[$project]
    $schemaPath = "$project\backend\schema.sql"

    if (Test-Path $schemaPath) {
        Write-Host "Applying schema -> $targetDb ($project)" -ForegroundColor Green
        sqlcmd -S $server -U $username -P $password -d $targetDb -i "$schemaPath" -b
    } else {
        Write-Host "ERROR: File not found at $schemaPath" -ForegroundColor Red
    }
}