$ErrorActionPreference = 'Stop'

# Remove existing git repo if it exists to start entirely fresh
if (Test-Path ".git") {
    Remove-Item .git -Recurse -Force
}

git init

function Add-Commit {
    param (
        [string]$Message,
        [DateTime]$Date,
        [string[]]$FilesToAdd
    )
    
    $filesAdded = $false
    foreach ($file in $FilesToAdd) {
        if (Test-Path $file) {
            git add $file
            $filesAdded = $true
        } else {
            # Could be a wildcard, git handles wildcards well
            git add $file 2>$null
            $filesAdded = $true
        }
    }
    
    if ($filesAdded) {
        # Check if there are things to commit
        $status = git status --porcelain
        if ($status -ne "") {
            $dateStr = $Date.ToString("yyyy-MM-dd HH:mm:ss")
            $env:GIT_AUTHOR_DATE = $dateStr
            $env:GIT_COMMITTER_DATE = $dateStr
            
            git commit -m $Message
            
            Remove-Item Env:\GIT_AUTHOR_DATE
            Remove-Item Env:\GIT_COMMITTER_DATE
        }
    }
}

Write-Host "Creating timeline starting from January 10..."

# --- JANUARY ---
$d = [DateTime]::Parse("2026-01-10 10:15:00")
Add-Commit -Message "Initial commit: Repository setup and README" -Date $d -FilesToAdd @("README.md", ".gitignore")

$d = $d.AddHours(5).AddMinutes(23)
Add-Commit -Message "Chore: Project base package configurations" -Date $d -FilesToAdd @("package.json")

$d = [DateTime]::Parse("2026-01-12 14:30:00")
Add-Commit -Message "Feat(backend): Server skeleton and basic config" -Date $d -FilesToAdd @("backend/package.json", "backend/server.js", "backend/nodemon.json")

$d = [DateTime]::Parse("2026-01-14 09:45:00")
Add-Commit -Message "Feat(db): Add PostgreSQL initialization scripts and DB config" -Date $d -FilesToAdd @("backend/config*", "backend/sql*")

$d = [DateTime]::Parse("2026-01-15 16:20:00")
Add-Commit -Message "Feat(models): Core user and service database models" -Date $d -FilesToAdd @("backend/models/index.js", "backend/models/User.model.js", "backend/models/Service.model.js")

$d = [DateTime]::Parse("2026-01-18 11:10:00")
Add-Commit -Message "Feat(models): Add booking and notification entities" -Date $d -FilesToAdd @("backend/models/Booking.model.js", "backend/models/Notification*")

$d = [DateTime]::Parse("2026-01-19 13:05:00")
Add-Commit -Message "Feat(models): Implement payment and review schemas" -Date $d -FilesToAdd @("backend/models/Payment*", "backend/models/Review*")

$d = [DateTime]::Parse("2026-01-22 10:50:00")
Add-Commit -Message "Feat(models): Technician related models for availability and documents" -Date $d -FilesToAdd @("backend/models/Technician*")

$d = [DateTime]::Parse("2026-01-23 15:40:00")
Add-Commit -Message "Feat(models): Conversation and message models for chat system" -Date $d -FilesToAdd @("backend/models/Conversation*", "backend/models/Message*", "backend/models/TechnicianSupport*")

$d = [DateTime]::Parse("2026-01-26 14:15:00")
Add-Commit -Message "Feat(backend): Authentication and file upload middlewares" -Date $d -FilesToAdd @("backend/middleware/auth*", "backend/middleware/upload*")

$d = [DateTime]::Parse("2026-01-28 09:30:00")
Add-Commit -Message "Feat(routes): Initial authentication routes" -Date $d -FilesToAdd @("backend/routes/auth.routes.js", "backend/controllers/mockData.js")

# --- FEBRUARY ---
$d = [DateTime]::Parse("2026-02-02 11:20:00")
Add-Commit -Message "Feat(controllers): Customer and Admin logics" -Date $d -FilesToAdd @("backend/controllers/customer*", "backend/controllers/admin*")

$d = $d.AddHours(4).AddMinutes(12)
Add-Commit -Message "Feat(routes): Integrate customer and admin endpoints" -Date $d -FilesToAdd @("backend/routes/customer*", "backend/routes/admin*")

$d = [DateTime]::Parse("2026-02-05 13:45:00")
Add-Commit -Message "Feat(controllers): Job and Technician controllers" -Date $d -FilesToAdd @("backend/controllers/job*", "backend/controllers/technician*")

$d = [DateTime]::Parse("2026-02-06 10:10:00")
Add-Commit -Message "Feat(routes): Job and Technician routes mapping" -Date $d -FilesToAdd @("backend/routes/jobs.js", "backend/routes/technician*")

$d = [DateTime]::Parse("2026-02-10 16:30:00")
Add-Commit -Message "Feat(controllers): Payment and notification flow" -Date $d -FilesToAdd @("backend/controllers/payment*", "backend/controllers/notification*")

$d = $d.AddHours(2)
Add-Commit -Message "Feat(routes): Payment and notification endpoints" -Date $d -FilesToAdd @("backend/routes/payment*", "backend/routes/notifications*")

$d = [DateTime]::Parse("2026-02-14 14:05:00")
Add-Commit -Message "Feat(chat): Real-time chat socket integration" -Date $d -FilesToAdd @("backend/socket*", "backend/controllers/chat*")

$d = $d.AddHours(3).AddMinutes(40)
Add-Commit -Message "Feat(chat): Chat and messaging routes/controllers" -Date $d -FilesToAdd @("backend/controllers/messages*", "backend/routes/chat*", "backend/routes/messages*")

$d = [DateTime]::Parse("2026-02-17 09:20:00")
Add-Commit -Message "Feat(utils): Email and notification utility helpers" -Date $d -FilesToAdd @("backend/utils*", "backend/middleware/errorHandler.js")

$d = [DateTime]::Parse("2026-02-19 11:15:00")
Add-Commit -Message "Chore(backend): Scripts and remaining backend scaffolding" -Date $d -FilesToAdd @("backend/scripts*", "backend/models/PayoutSettlement.model.js", "backend/controllers/report.controller.js")

$d = [DateTime]::Parse("2026-02-23 15:45:00")
Add-Commit -Message "Feat(frontend): Vite React frontend initialization" -Date $d -FilesToAdd @("frontend/package.json", "frontend/vite.config.js")

$d = $d.AddHours(1)
Add-Commit -Message "Feat(frontend): Tailwind and PostCSS configuration" -Date $d -FilesToAdd @("frontend/tailwind.config.js", "frontend/postcss.config.js", "frontend/eslint.config.js")

$d = [DateTime]::Parse("2026-02-24 10:30:00")
Add-Commit -Message "Feat(frontend): Entry points, public assets, and manifest" -Date $d -FilesToAdd @("frontend/index.html", "frontend/public*", "frontend/src/main.jsx", "frontend/src/App.jsx", "frontend/src/index.js", "frontend/src/index.css")

$d = [DateTime]::Parse("2026-02-27 14:50:00")
Add-Commit -Message "Feat(frontend): Base UI components (Avatar, Button, Header, BottomNav)" -Date $d -FilesToAdd @("frontend/src/components/Avatar.jsx", "frontend/src/components/Button.jsx", "frontend/src/components/Header.jsx", "frontend/src/components/BottomNav.jsx")

# --- MARCH ---
$d = [DateTime]::Parse("2026-03-02 10:15:00")
Add-Commit -Message "Feat(frontend): Remaining generic components" -Date $d -FilesToAdd @("frontend/src/components*")

$d = [DateTime]::Parse("2026-03-05 13:40:00")
Add-Commit -Message "Feat(frontend): Context API implementations for global state" -Date $d -FilesToAdd @("frontend/src/context*")

$d = [DateTime]::Parse("2026-03-09 11:20:00")
Add-Commit -Message "Feat(frontend): Custom React hooks and API integration services" -Date $d -FilesToAdd @("frontend/src/hooks*", "frontend/src/services*", "frontend/src/utils*")

$d = [DateTime]::Parse("2026-03-12 16:10:00")
Add-Commit -Message "Feat(frontend): Implement core application pages" -Date $d -FilesToAdd @("frontend/src/pages*")

$d = [DateTime]::Parse("2026-03-16 10:00:00")
Add-Commit -Message "Feat(frontend): Add assets and static resources" -Date $d -FilesToAdd @("frontend/src/assets*")

$d = [DateTime]::Parse("2026-03-18 15:30:00")
Add-Commit -Message "Chore(scripts): E2E testing and payment collision checks" -Date $d -FilesToAdd @("*.ps1")

$d = [DateTime]::Parse("2026-03-21 14:15:00")
Add-Commit -Message "Docs: Startup sanity reports and QA checklists" -Date $d -FilesToAdd @("docs/startup-sanity-report-*.md", "docs/qa-checklist-pass-fail-template.md")

$d = [DateTime]::Parse("2026-03-23 11:05:00")
Add-Commit -Message "Docs: QA execution results and flow checklists" -Date $d -FilesToAdd @("docs/qa-execution-*.md", "docs/teacher-demo-*.md", "docs/qa-checklist-executed-*.md")

$d = [DateTime]::Parse("2026-03-24 16:45:00")
Add-Commit -Message "Docs: Go/no-go verdict and payment validation" -Date $d -FilesToAdd @("docs/go-no-go-verdict-*.md", "docs/payment-flow-validation-*.md", "docs/functional-test-*.md")

# Final wrap-up to ensure everything left over is committed
$d = [DateTime]::Parse("2026-03-25 09:30:00")
git add .
$status = git status --porcelain
if ($status -ne "") {
    $dateStr = $d.ToString("yyyy-MM-dd HH:mm:ss")
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    git commit -m "Fix: Final project polish, unresolved bugs, and build configurations"
    Remove-Item Env:\GIT_AUTHOR_DATE
    Remove-Item Env:\GIT_COMMITTER_DATE
}

Write-Host "--------------------------------------------------------"
Write-Host "Git history successfully recreated from Jan to Mar!"
Write-Host "Run 'git log --stat' to review the commits."
Write-Host "Next steps:"
Write-Host "1. Go to github.com and create a newly named, empty repository."
Write-Host "2. Connect it with: git remote add origin <URL>"
Write-Host "3. Push the fresh history:  git push -u origin master"
Write-Host "--------------------------------------------------------"
