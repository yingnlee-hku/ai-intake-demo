# =============================================================
# Create "AI Use Case Intake" SharePoint List
# Requires: PnP.PowerShell module
#   Install-Module PnP.PowerShell -Scope CurrentUser
# =============================================================

param(
    [string]$SiteUrl = "https://hkuhk.sharepoint.com/sites/sgaportal",
    [string]$ListName = "AI Use Case Intake"
)

# --- Import module --------------------------------------------
Import-Module PnP.PowerShell -ErrorAction Stop
Write-Host "PnP.PowerShell loaded." -ForegroundColor Green

# --- Connect --------------------------------------------------
Write-Host "Connecting to $SiteUrl ..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive -ErrorAction Stop

# --- Create list (if not already exists) ----------------------
$existing = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "List '$ListName' already exists - skipping creation." -ForegroundColor Yellow
} else {
    New-PnPList -Title $ListName -Template GenericList -OnQuickLaunch -ErrorAction Stop
    Write-Host "List '$ListName' created." -ForegroundColor Green
}

# --- Helper: add column only if it does not exist -------------
function Add-ColumnIfMissing {
    param($ListName, $InternalName, $DisplayName, $Type, $Extra = @{})
    $col = Get-PnPField -List $ListName -Identity $InternalName -ErrorAction SilentlyContinue
    if ($col) {
        Write-Host "  [skip] $InternalName already exists." -ForegroundColor DarkGray
        return
    }
    $params = @{
        List         = $ListName
        InternalName = $InternalName
        DisplayName  = $DisplayName
        Type         = $Type
        Required     = $false
    } + $Extra
    Add-PnPField @params | Out-Null
    Write-Host "  [ok]   $InternalName ($Type)" -ForegroundColor Green
}

Write-Host "`nAdding columns to '$ListName'..." -ForegroundColor Cyan

# Title column already exists - rename it
Set-PnPField -List $ListName -Identity "Title" -Values @{ Title = "Project Name" } | Out-Null
Write-Host "  [ok]   Title renamed to 'Project Name'" -ForegroundColor Green

# Section 1 - Requestor
Add-ColumnIfMissing $ListName "Faculty"            "Faculty / Department"      "Text"
Add-ColumnIfMissing $ListName "PIC"                "Person in Charge (PIC)"    "Text"
Add-ColumnIfMissing $ListName "Email"              "Email"                     "Text"

# Section 2 - Use Case
Add-ColumnIfMissing $ListName "BusinessCase"       "Business Case Description" "Note"
Add-ColumnIfMissing $ListName "Purpose"            "Purpose"                   "Choice" `
    @{ Choices = [string[]]@("Teaching & Learning", "Research", "Admin") }
Add-ColumnIfMissing $ListName "TargetAudience"     "Target Audience"           "Text"
Add-ColumnIfMissing $ListName "ProjectDuration"    "Project Duration"          "Text"
Add-ColumnIfMissing $ListName "DateOfLog"          "Date of Log"               "DateTime"

# Section 3 - AI Configuration
Add-ColumnIfMissing $ListName "AITools"            "AI Tools"                  "Text"
Add-ColumnIfMissing $ListName "AIPlatform"         "AI Platform"               "Text"
Add-ColumnIfMissing $ListName "AISubscriptionPlan" "AI Subscription Plan"      "Text"
Add-ColumnIfMissing $ListName "DeploymentType"     "Inhouse / SaaS"            "Choice" `
    @{ Choices = [string[]]@("Inhouse", "SaaS", "Hybrid") }
Add-ColumnIfMissing $ListName "Cost"               "Estimated Cost (HKD)"      "Currency"

# Section 4 - Technical Details
Add-ColumnIfMissing $ListName "ArchServer"         "Architecture - Server"     "Text"
Add-ColumnIfMissing $ListName "Connection"         "Connection"                "Text"
Add-ColumnIfMissing $ListName "Vendor"             "Vendor"                    "Text"
Add-ColumnIfMissing $ListName "Model"              "Model"                     "Text"
Add-ColumnIfMissing $ListName "HardwareOwner"      "Hardware Owner"            "Text"
Add-ColumnIfMissing $ListName "HPCType"            "ITS HPC / Cloud HPC"       "Choice" `
    @{ Choices = [string[]]@("ITS HPC", "Cloud HPC") }

# Section 5 - Data & Compliance
Add-ColumnIfMissing $ListName "PII"                "Involves PII"              "Choice" `
    @{ Choices = [string[]]@("Yes", "No") }
Add-ColumnIfMissing $ListName "TypesOfData"        "Types of Data"             "Note"

Write-Host "`nDone! List '$ListName' is ready." -ForegroundColor Cyan
Write-Host "URL: $SiteUrl/Lists/$($ListName -replace ' ','%20')" -ForegroundColor Cyan
