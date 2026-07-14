[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8000,
    [switch]$NoInstall
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPath = Join-Path $projectRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$requirements = Join-Path $projectRoot "requirements.txt"

Set-Location $projectRoot

if (-not (Test-Path $venvPython)) {
    if ($NoInstall) {
        throw "O ambiente .venv nao existe. Execute novamente sem -NoInstall."
    }

    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        throw "Python 3 nao foi encontrado no PATH. Instale-o e tente novamente."
    }

    Write-Host "Criando ambiente virtual em .venv..."
    & python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel criar o ambiente virtual." }
}

if (-not $NoInstall) {
    Write-Host "Instalando/atualizando dependencias..."
    & $venvPython -m pip install --disable-pip-version-check -r $requirements
    if ($LASTEXITCODE -ne 0) { throw "A instalacao das dependencias falhou." }
}

$env:PORT = $Port.ToString()
$url = "http://localhost:$Port"

Write-Host ""
Write-Host "Timeline dos Evangelhos disponivel em $url"
Write-Host "Verificacao de saude: $url/health"
Write-Host "Pressione Ctrl+C para encerrar."
Write-Host ""

& $venvPython (Join-Path $projectRoot "app.py")
exit $LASTEXITCODE
