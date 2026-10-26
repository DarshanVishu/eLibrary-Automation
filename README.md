$readmePath = "README.md"
$badge = "[![eLibrary E2E Tests](https://github.com/DarshanVishu/eLibrary-Automation/actions/workflows/e2e-test.yml/badge.svg)](https://github.com/DarshanVishu/eLibrary-Automation/actions/workflows/e2e-test.yml)`n`n"

if (Test-Path $readmePath) {
    $existing = Get-Content $readmePath -Raw
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Resolve-Path $readmePath).Path, $badge + $existing, $utf8NoBom)
} else {
    Set-Content -Path $readmePath -Value ($badge + "# eLibrary-Automation")
}

git add README.md
git commit -m "docs: add GitHub Actions CI build status badge"
git push origin main


---

## 📖 In-Depth Framework Documentation

For complete technical specifications, architectural patterns, React synthetic event handling details, and the test coverage matrix:

👉 **[Read the Full Automation & QA Engineering Guide (docs/AUTOMATION_DOCS.md)](docs/AUTOMATION_DOCS.md)**