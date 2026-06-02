Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\Admin\.gemini\antigravity\scratch\mushroomie\public\logo.png')
$targetSize = 1024

$bmp = New-Object System.Drawing.Bitmap $targetSize, $targetSize
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.Clear([System.Drawing.Color]::White)

$ratioX = $targetSize / $img.Width
$ratioY = $targetSize / $img.Height
$ratio = if ($ratioX -lt $ratioY) { $ratioX } else { $ratioY }
$ratio = $ratio * 0.9

$newWidth = [int]($img.Width * $ratio)
$newHeight = [int]($img.Height * $ratio)
$posX = [int](($targetSize - $newWidth) / 2)
$posY = [int](($targetSize - $newHeight) / 2)

$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.DrawImage($img, $posX, $posY, $newWidth, $newHeight)

$bmp.Save('C:\Users\Admin\.gemini\antigravity\scratch\mushroomie\logo_facebook_1024.png', [System.Drawing.Imaging.ImageFormat]::Png)

$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
