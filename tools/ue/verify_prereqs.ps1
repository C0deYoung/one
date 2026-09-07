$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$EngineRoot = 'E:\UE\UE_5.8'
$Editor = Join-Path $EngineRoot 'Engine\Binaries\Win64\UnrealEditor.exe'
$Blender = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
$Fbx = Join-Path $RepoRoot 'art\export\fbx\main-building.fbx'
$Project = Join-Path $RepoRoot 'unreal\YunxiCampus\YunxiCampus.uproject'
$Ddc = [Environment]::GetEnvironmentVariable('UE-LocalDataCachePath', 'User')

$checks = [ordered]@{
  UnrealEditor = Test-Path -LiteralPath $Editor
  Blender = Test-Path -LiteralPath $Blender
  MainBuildingFbx = Test-Path -LiteralPath $Fbx
  Project = Test-Path -LiteralPath $Project
  DdcOnE = $Ddc -eq 'E:\UE-DDC'
  EDriveFreeGiB = [math]::Round((Get-PSDrive E).Free / 1GB, 2)
}

$checks.GetEnumerator() | Format-Table -AutoSize
if (-not $checks.UnrealEditor -or -not $checks.Blender -or
    -not $checks.MainBuildingFbx -or -not $checks.DdcOnE) {
  throw 'UE5 prerequisite validation failed.'
}
if ($checks.EDriveFreeGiB -lt 25) {
  throw 'E: needs at least 25 GiB free before project import and packaging.'
}
if (-not $checks.Project) {
  exit 2
}
