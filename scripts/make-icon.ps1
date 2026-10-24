param([string]$Destination = (Join-Path $PSScriptRoot '..\icon.png'))
Add-Type -AssemblyName System.Drawing
$canvas = New-Object System.Drawing.Bitmap 256,256
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)
$outline = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#455337')),7
$leaf = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#8da873'))
$petal = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#f5d16c'))
$center = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#cf9259'))
$pot = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#e8a180'))
$cheek = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#df897c'))
$graphics.DrawLine($outline,128,82,128,168)
$graphics.FillEllipse($leaf,68,112,59,29)
$graphics.DrawEllipse($outline,68,112,59,29)
$graphics.FillEllipse($leaf,130,102,59,29)
$graphics.DrawEllipse($outline,130,102,59,29)
foreach ($point in @(@(109,29),@(135,46),@(128,76),@(91,76),@(84,44))) {
  $graphics.FillEllipse($petal,$point[0],$point[1],42,42)
  $graphics.DrawEllipse($outline,$point[0],$point[1],42,42)
}
$graphics.FillEllipse($center,110,61,35,35)
$graphics.DrawEllipse($outline,110,61,35,35)
$potPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$potPath.AddPolygon([System.Drawing.Point[]]@([System.Drawing.Point]::new(75,164),[System.Drawing.Point]::new(181,164),[System.Drawing.Point]::new(169,227),[System.Drawing.Point]::new(87,227)))
$graphics.FillPath($pot,$potPath)
$graphics.DrawPath($outline,$potPath)
$graphics.FillRectangle($pot,66,151,124,25)
$graphics.DrawRectangle($outline,66,151,124,25)
$graphics.FillEllipse($outline.Brush,104,188,8,9)
$graphics.FillEllipse($outline.Brush,145,188,8,9)
$graphics.FillEllipse($cheek,94,201,13,8)
$graphics.FillEllipse($cheek,151,201,13,8)
$graphics.DrawArc($outline,118,196,21,15,5,170)
$canvas.Save($Destination,[System.Drawing.Imaging.ImageFormat]::Png)
$potPath.Dispose()
foreach ($resource in @($outline,$leaf,$petal,$center,$pot,$cheek,$graphics,$canvas)) { $resource.Dispose() }
