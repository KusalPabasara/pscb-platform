param(
  [Parameter(Mandatory=$true)][string]$Executable,
  [Parameter(Mandatory=$true)][string]$Url,
  [string]$Output = "$PSScriptRoot\..\capture-proof.png"
)

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeWindow {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
}
"@

$process = Start-Process -FilePath $Executable -ArgumentList "--url=$Url" -PassThru
try {
  Start-Sleep -Seconds 8
  $process.Refresh()
  $handle = $process.MainWindowHandle
  if ($handle -eq [IntPtr]::Zero) { throw "Secure Viewer window was not found." }
  $rect = New-Object NativeWindow+RECT
  if (-not [NativeWindow]::GetWindowRect($handle, [ref]$rect)) { throw "Could not read viewer bounds." }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
  $bitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

  $dark = 0
  $samples = 0
  for ($x = 0; $x -lt $width; $x += 12) {
    for ($y = 0; $y -lt $height; $y += 12) {
      $pixel = $bitmap.GetPixel($x, $y)
      if (($pixel.R + $pixel.G + $pixel.B) -lt 45) { $dark++ }
      $samples++
    }
  }
  $ratio = $dark / $samples
  Write-Output "black_pixel_ratio=$ratio"
  Write-Output "capture=$Output"
  if ($ratio -lt 0.95) { throw "Capture was not black enough; native exclusion may not be active." }
} finally {
  if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
