param(
  [int]$JpegQuality = 78
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Save-ResizedJpeg {
  param(
    [Parameter(Mandatory)] [string]$Source,
    [Parameter(Mandatory)] [string]$Destination,
    [Parameter(Mandatory)] [int]$Width
  )

  $sourcePath = (Resolve-Path -LiteralPath $Source).Path
  $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
  try {
    $height = [Math]::Round($sourceImage.Height * ($Width / $sourceImage.Width))
    $bitmap = New-Object System.Drawing.Bitmap($Width, $height)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $Width, $height)
      } finally {
        $graphics.Dispose()
      }

      $directory = Split-Path -Parent $Destination
      if (-not (Test-Path -LiteralPath $directory)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
      }

      $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object MimeType -eq "image/jpeg"
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality,
        [long]$JpegQuality
      )
      try {
        $bitmap.Save($Destination, $jpegCodec, $encoderParams)
      } finally {
        $encoderParams.Dispose()
      }
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $sourceImage.Dispose()
  }
}

$hero = "public/images/properties/dream-village-302-v/originals/2017-05-IMG_4361.jpg"
Save-ResizedJpeg -Source $hero -Destination "public/images/optimized/home-hero-800.jpg" -Width 800
Save-ResizedJpeg -Source $hero -Destination "public/images/optimized/home-hero-1600.jpg" -Width 1600

Get-ChildItem "src/content/properties/*.json" | ForEach-Object {
  $property = Get-Content $_.FullName -Raw | ConvertFrom-Json
  $sourceRelative = $property.gallery[0].src.TrimStart("/")
  $source = Join-Path "public" $sourceRelative
  $directory = [System.IO.Path]::GetDirectoryName($source)
  $basename = [System.IO.Path]::GetFileNameWithoutExtension($source)
  Save-ResizedJpeg -Source $source -Destination (Join-Path $directory ($basename + "-card-480.jpg")) -Width 480
  Save-ResizedJpeg -Source $source -Destination (Join-Path $directory ($basename + "-card.jpg")) -Width 720
}

Write-Host "Generated responsive hero and property card images."
