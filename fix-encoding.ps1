# PowerShell script to fix UTF-8 encoding issues in HTML files
$encoding = [System.Text.Encoding]::UTF8

# Define file paths and emoji replacements
$files = @{
    "checkout.html" = "c:\Users\Rahul_Singh\OneDrive\Documents\CV_Projects\The Piquant Pan\the-piquant-pan-frontend\src\app\pages\checkout\checkout.html"
    "contact.html" = "c:\Users\Rahul_Singh\OneDrive\Documents\CV_Projects\The Piquant Pan\the-piquant-pan-frontend\src\app\pages\contact\contact.html"
    "order-summary.html" = "c:\Users\Rahul_Singh\OneDrive\Documents\CV_Projects\The Piquant Pan\the-piquant-pan-frontend\src\app\pages\order-summary\order-summary.html"
    "wishlist.html" = "c:\Users\Rahul_Singh\OneDrive\Documents\CV_Projects\The Piquant Pan\the-piquant-pan-frontend\src\app\pages\wishlist\wishlist.html"
}

# Emoji replacements
$replacements = @{
    "ðŸ"" = "📍"
    "ðŸ"ž" = "📞"
    "ðŸ"'" = "🔒"
    "ðŸ›¡ï¸" = "🛡️"
    "ðŸ'¬" = "💬"
    "ðŸŽ‰" = "🎉"
    "ðŸ'š" = "💚"
    "ðŸ'¤" = "👤"
}

foreach ($file in $files.Values) {
    if (Test-Path $file) {
        Write-Host "Processing: $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            $content = $content -replace [regex]::Escape($old), $new
        }
        
        Set-Content $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "All files processed!"
