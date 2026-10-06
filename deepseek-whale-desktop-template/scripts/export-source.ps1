param([string]$OutputPath)
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
if (-not $OutputPath) { $OutputPath = Join-Path (Split-Path -Parent $appRoot) 'deepseek-whale-desktop-template-source.zip' }
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $OutputPath) { throw 'Output file already exists; choose a new OutputPath.' }
$manifest = Get-Content -Raw -LiteralPath (Join-Path $appRoot 'source-files.json') | ConvertFrom-Json
$checked = @()
foreach ($relative in $manifest) {
    $full = [IO.Path]::GetFullPath((Join-Path $appRoot $relative))
    if (-not $full.StartsWith($appRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid source manifest path.' }
    $item = Get-Item -LiteralPath $full
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Source must be a regular file.' }
    if ($full -eq $OutputPath) { throw 'Archive cannot replace a source file.' }
    $checked += [pscustomobject]@{Full=$full; Relative=$relative}
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($OutputPath, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($entry in $checked) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $entry.Full, ('deepseek-whale-desktop-template/' + $entry.Relative.Replace('\','/')), [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $archive.Dispose() }
Write-Output ('Exported ' + $checked.Count + ' source files to ' + $OutputPath)
