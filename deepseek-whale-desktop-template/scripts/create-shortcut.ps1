$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$electron = Join-Path $appRoot 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path -LiteralPath $electron)) { throw 'Run npm ci in the project folder first.' }
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Whale Template.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $electron
$shortcut.Arguments = '"' + $appRoot + '"'
$shortcut.WorkingDirectory = $appRoot
$shortcut.Description = 'Local Ollama chat and whale companion source template'
$shortcut.IconLocation = (Join-Path $appRoot 'assets\whale.ico') + ',0'
$shortcut.Save()
Write-Output ('Created: ' + $shortcutPath)
