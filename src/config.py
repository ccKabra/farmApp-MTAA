from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DATA_RAW = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
OUTPUTS_DIR = ROOT / "outputs"

def faers_files(prefix):

    return sorted(DATA_RAW.glob(f"{prefix}*.txt"))

SAMPLE_SIZE = 55000
RANDOM_SEED = 42
TEST_SIZE = 0.30

TOTAL_EPOCHS    = 15
EPOCHS_PER_RUN  = 3

BATCH_TRAIN     = 32
POS_WEIGHT_CAP  = 10.0

MIN_REACTION_FREQ = 300

BASE_EPOCHS     = 5
EXTENDED_EPOCHS = 10

BIOBERT_MODEL = "dmis-lab/biobert-base-cased-v1.2"
try:
    import torch
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    DEVICE = "cpu"
