from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DATA_RAW = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
OUTPUTS_DIR = ROOT / "outputs"

# FAERS: se cargan TODOS los trimestres presentes en data/raw (2025Q1..2026Q1).
# preprocess.py descubre los archivos por patron, no hace falta listarlos.
def faers_files(prefix):
    """Todos los archivos de un tipo (DEMO/DRUG/REAC/INDI) ordenados por trimestre."""
    return sorted(DATA_RAW.glob(f"{prefix}*.txt"))

# Sampling
SAMPLE_SIZE = 55000     # casos FAERS a usar. Subir = mas datos = mejor (mas lento)
RANDOM_SEED = 42
TEST_SIZE = 0.30        # 70% train / 30% test

# ── Perillas de entrenamiento ─────────────────────────────────────────────────
# El entrenamiento es RESUMABLE y POR TANDAS (ver src/train.py):
#   - TOTAL_EPOCHS    = cuantas epocas en total quiere entrenar el modelo.
#   - EPOCHS_PER_RUN  = cuantas hace CADA vez que corres paso2_entrenar.bat.
# Ej: TOTAL=15, PER_RUN=3 -> corres el .bat 5 veces, 3 epocas cada una.
# Podes parar entre tandas (o interrumpir a mitad: guarda tras cada epoca).
TOTAL_EPOCHS    = 15    # objetivo total de epocas
EPOCHS_PER_RUN  = 3     # epocas por corrida del .bat (mas bajo = sesiones mas cortas)

# Carga sobre la PC: bajar BATCH_TRAIN si se queda sin memoria de GPU o para
# que la maquina quede mas libre mientras entrena.
BATCH_TRAIN     = 32
POS_WEIGHT_CAP  = 10.0  # tope del peso de clases (mas alto = mas recall, mas FP)

# Frecuencia minima para que una reaccion sea etiqueta del modelo.
# Con 55k casos, 300 deja ~98 etiquetas bien representadas (>=300 casos c/u).
# Subir = menos etiquetas pero mejor aprendidas; bajar = mas etiquetas raras.
MIN_REACTION_FREQ = 300

# (heredados; el flujo viejo de 2 scripts los usa, el nuevo train.py no)
BASE_EPOCHS     = 5
EXTENDED_EPOCHS = 10

# Model
BIOBERT_MODEL = "dmis-lab/biobert-base-cased-v1.2"
try:
    import torch
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    DEVICE = "cpu"
