@echo off
REM ============================================================================
REM  PASO 2 — Entrenar (CORRER VARIAS VECES, de a tandas)
REM
REM  Cada corrida hace EPOCHS_PER_RUN epocas (ver src/config.py) y guarda.
REM  Volve a correrlo y CONTINUA donde quedo, hasta llegar a TOTAL_EPOCHS.
REM
REM  Es SEGURO cortar:
REM    - Entre tandas: cerra la ventana cuando termine, sin problema.
REM    - A mitad de una tanda: cerra la ventana o Ctrl+C. Perdes solo la epoca
REM      en curso; lo anterior queda guardado (checkpoint tras cada epoca).
REM
REM  Para que pese MENOS en la PC: baja EPOCHS_PER_RUN y/o BATCH_TRAIN en
REM  src/config.py (sesiones mas cortas / menos uso de GPU).
REM ============================================================================
setlocal
cd /d "%~dp0"
set PY=venv\Scripts\python.exe

if not exist data\processed\dataset.csv (
    echo No existe data\processed\dataset.csv
    echo Corre primero paso1_datos.bat
    pause
    exit /b 1
)

echo [PASO 2/3] Entrenando (una tanda)...
"%PY%" src\train.py
if errorlevel 1 (
    echo.
    echo ###  FALLO el entrenamiento. Revisa el mensaje de arriba.
    pause
    exit /b 1
)
echo.
echo  Tanda terminada. Si NO dice "ENTRENAMIENTO COMPLETO", volve a correr
echo  este mismo .bat para seguir entrenando cuando quieras.
pause
