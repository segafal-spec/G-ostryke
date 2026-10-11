Add-Type -AssemblyName System.Drawing
[System.IO.Directory]::CreateDirectory('public/icons') | Out-Null
$src = "C:\Users\lenovo\.gemini\antigravity-ide\brain\63f5e827-1a08-4924-bf23-24be453b704c\bizgames_app_icon_1790888369822.jpg"
$img = [System.Drawing.Image]::FromFile($src)

$sizes = @(64, 180, 192, 512)
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $s, $s)

    if ($s -eq 180) {
        $bmp.Save('public/icons/apple-touch-icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
    } elseif ($s -eq 64) {
        $bmp.Save('public/icons/favicon-64.png', [System.Drawing.Imaging.ImageFormat]::Png)
    } else {
        $bmp.Save("public/icons/icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
        if ($s -eq 512) {
            $bmp.Save('public/icons/icon-maskable-512.png', [System.Drawing.Imaging.ImageFormat]::Png)
        }
    }
    $g.Dispose()
    $bmp.Dispose()
}

$img.Dispose()
Write-Host "Icons generated successfully in public/icons!"
