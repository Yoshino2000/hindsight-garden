param([string]$Destination = (Join-Path $PSScriptRoot '..\icon.png'))
# Reproducible single-color line icon. No background tile, gradients or shadows.
Add-Type -AssemblyName System.Drawing
$canvas = [System.Drawing.Bitmap]::new(256, 256)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$stroke = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#59AF91'), 16)
$flower = [System.Drawing.Drawing2D.GraphicsPath]::new()
$leaves = [System.Drawing.Drawing2D.GraphicsPath]::new()
try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $stroke.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $stroke.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $stroke.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $flower.AddBezier(128, 42, 145, 15, 180, 36, 169, 64)
    $flower.AddBezier(169, 64, 201, 60, 211, 100, 179, 110)
    $flower.AddBezier(179, 110, 191, 140, 155, 160, 137, 133)
    $flower.AddBezier(137, 133, 118, 160, 82, 141, 94, 111)
    $flower.AddBezier(94, 111, 61, 102, 69, 62, 101, 64)
    $flower.AddBezier(101, 64, 90, 35, 116, 17, 128, 42)
    $flower.CloseFigure()
    $graphics.DrawPath($stroke, $flower)
    $graphics.DrawEllipse($stroke, 120, 79, 26, 26)
    $graphics.DrawLine($stroke, 133, 143, 133, 226)
    $leaves.AddBezier(133, 198, 102, 200, 78, 184, 76, 164)
    $leaves.AddBezier(76, 164, 105, 158, 127, 175, 133, 198)
    $leaves.StartFigure()
    $leaves.AddBezier(133, 216, 163, 218, 190, 199, 190, 176)
    $leaves.AddBezier(190, 176, 161, 172, 137, 193, 133, 216)
    $graphics.DrawPath($stroke, $leaves)
    $canvas.Save([System.IO.Path]::GetFullPath($Destination), [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "256 x 256 transparent outline PNG; $((Get-Item -LiteralPath $Destination).Length) bytes"
} finally {
    foreach ($resource in @($leaves, $flower, $stroke, $graphics, $canvas)) { $resource.Dispose() }
}
