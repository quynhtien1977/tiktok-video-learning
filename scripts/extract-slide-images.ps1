<#
Trich so do trong file .pptx ra PNG do phan giai cao.

    powershell -ExecutionPolicy Bypass -File scripts/extract-slide-images.ps1 `
        -Pptx "docs/Ch18 Service-oriented software engineering.pptx" -Out "public/images/ch18" [-Scale 3]

Slide cua Sommerville nhung so do duoi dang EMF (vector) nen phong to van net.
Ten file xuat ra: slide08-image2.png  => biet ngay so do thuoc slide nao.
#>
param(
    [Parameter(Mandatory = $true)][string]$Pptx,
    [Parameter(Mandatory = $true)][string]$Out,
    [int]$Scale = 3
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$pptxPath = (Resolve-Path $Pptx).Path
$outDir = New-Item -ItemType Directory -Force -Path $Out
$work = Join-Path ([System.IO.Path]::GetTempPath()) ("pptx_" + [guid]::NewGuid().ToString("N"))
$zip = Join-Path $work "deck.zip"
New-Item -ItemType Directory -Force -Path $work | Out-Null
Copy-Item $pptxPath $zip
Expand-Archive -Path $zip -DestinationPath $work -Force

# Map: moi slide -> danh sach file media no tham chieu
$slideFiles = Get-ChildItem (Join-Path $work "ppt\slides") -Filter "slide*.xml" | Sort-Object {
    [int]($_.BaseName -replace '\D', '')
}

$count = 0
foreach ($slide in $slideFiles) {
    $num = [int]($slide.BaseName -replace '\D', '')
    $relPath = Join-Path $slide.DirectoryName "_rels\$($slide.Name).rels"
    if (-not (Test-Path $relPath)) { continue }

    [xml]$rels = Get-Content $relPath -Encoding UTF8
    $media = $rels.Relationships.Relationship |
        Where-Object { $_.Type -like "*image" } |
        ForEach-Object { Split-Path $_.Target -Leaf } |
        Select-Object -Unique

    foreach ($m in $media) {
        $src = Join-Path $work "ppt\media\$m"
        if (-not (Test-Path $src)) { continue }

        $base = [System.IO.Path]::GetFileNameWithoutExtension($m)
        $ext = [System.IO.Path]::GetExtension($m).ToLower()
        $dest = Join-Path $outDir ("slide{0:d2}-{1}.png" -f $num, $base)

        if ($ext -eq ".emf" -or $ext -eq ".wmf") {
            $mf = [System.Drawing.Imaging.Metafile]::FromFile($src)
            $w = [int]($mf.Width * $Scale)
            $h = [int]($mf.Height * $Scale)
            $bmp = New-Object System.Drawing.Bitmap $w, $h
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.SmoothingMode = 'AntiAlias'
            $g.InterpolationMode = 'HighQualityBicubic'
            $g.TextRenderingHint = 'AntiAliasGridFit'
            $g.Clear([System.Drawing.Color]::White)
            $g.DrawImage($mf, 0, 0, $w, $h)
            $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
            $g.Dispose(); $bmp.Dispose(); $mf.Dispose()
            Write-Host ("- slide {0,2}: {1} -> {2}x{3}" -f $num, $m, $w, $h)
        }
        else {
            Copy-Item $src ([System.IO.Path]::ChangeExtension($dest, $ext)) -Force
            Write-Host ("- slide {0,2}: {1} (copy nguyen ban)" -f $num, $m)
        }
        $count++
    }
}

Remove-Item $work -Recurse -Force
Write-Host ""
Write-Host "Da xuat $count anh vao $($outDir.FullName)"
Write-Host "Dung trong content/epNN.json:  { `"type`": `"image`", `"src`": `"images/<thu muc>/slideNN-imageX.png`" }"
