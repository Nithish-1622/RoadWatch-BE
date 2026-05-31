# PowerShell script to create a virtualenv and install requirements
param(
    [string]$Path = "D:/PROJECT/RoadWatch-AI"
)

Set-Location -Path $Path
python -m venv venv
$python = Join-Path $Path "venv/Scripts/python.exe"
& $python -m pip install --upgrade pip
& $python -m pip install -r requirements.txt
Write-Host "Virtualenv created at $Path\venv and dependencies installed."
