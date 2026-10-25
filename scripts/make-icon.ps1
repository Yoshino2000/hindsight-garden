param([string]$Destination = (Join-Path $PSScriptRoot '..\icon.png'))

# A reproducible five-color flat mark. No fonts, source images, gradients or shadows.
Add-Type -AssemblyName System.Drawing
$canvas = [System.Drawing.Bitmap]::new(256, 256)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$background = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#DFE9CF'))
$leaf = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#3F7958'))
$petal = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#FFFEF2'))
$pollen = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#E4B64D'))
$pot = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#BE7F60'))
$groundPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$leafPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$potPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$rimPath = [System.Drawing.Drawing2D.GraphicsPath]::new()

try {
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  # Opaque light-green tile; only its outside rounded corners are transparent.
  $groundPath.AddArc(0, 0, 108, 108, 180, 90)
  $groundPath.AddArc(148, 0, 108, 108, 270, 90)
  $groundPath.AddArc(148, 148, 108, 108, 0, 90)
  $groundPath.AddArc(0, 148, 108, 108, 90, 90)
  $groundPath.CloseFigure()
  $graphics.FillPath($background, $groundPath)

  $graphics.FillRectangle($leaf, 122, 105, 12, 73)
  $leafPath.AddBezier(128, 159, 99, 163, 80, 151, 72, 132)
  $leafPath.AddBezier(72, 132, 101, 125, 120, 137, 128, 159)
  $leafPath.CloseFigure()
  $leafPath.StartFigure()
  $leafPath.AddBezier(128, 148, 152, 152, 176, 139, 184, 120)
  $leafPath.AddBezier(184, 120, 156, 114, 136, 126, 128, 148)
  $leafPath.CloseFigure()
  $graphics.FillPath($leaf, $leafPath)

  # Five broad, overlapping petals remain legible at 24 and 32 pixels.
  foreach ($center in @(@(128, 55), @(158, 77), @(147, 111), @(109, 111), @(98, 77))) {
    $graphics.FillEllipse($petal, $center[0] - 23, $center[1] - 23, 46, 46)
  }
  $graphics.FillEllipse($pollen, 107, 66, 42, 42)

  $potPath.AddLine(81, 180, 175, 180)
  $potPath.AddLine(175, 180, 166, 217)
  $potPath.AddBezier(166, 217, 164, 226, 162, 228, 152, 228)
  $potPath.AddLine(152, 228, 104, 228)
  $potPath.AddBezier(104, 228, 94, 228, 92, 226, 90, 217)
  $potPath.CloseFigure()
  $graphics.FillPath($pot, $potPath)
  $rimPath.AddArc(72, 167, 14, 14, 180, 90)
  $rimPath.AddArc(170, 167, 14, 14, 270, 90)
  $rimPath.AddArc(170, 176, 14, 14, 0, 90)
  $rimPath.AddArc(72, 176, 14, 14, 90, 90)
  $rimPath.CloseFigure()
  $graphics.FillPath($pot, $rimPath)

  $destinationPath = [System.IO.Path]::GetFullPath($Destination)
  $canvas.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $size = (Get-Item -LiteralPath $destinationPath).Length
  if ($size -gt 256KB) { throw 'The icon exceeds the 256 KB host limit.' }
  Write-Output "256 x 256 PNG; $size bytes"
} finally {
  foreach ($resource in @($rimPath, $potPath, $leafPath, $groundPath, $background, $leaf, $petal, $pollen, $pot, $graphics, $canvas)) {
    $resource.Dispose()
  }
}
