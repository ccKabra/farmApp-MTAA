import warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

import numpy as np
import pandas as pd
import pickle
from sklearn.model_selection import KFold
from sklearn.metrics import f1_score
from config import DATA_PROCESSED, MODELS_DIR, RANDOM_SEED, TEST_SIZE

from ensemble import EnsemblePredictor
from data_split import load_split


def safe_split(value, sep="|"):
    if value is None:
        return []
    if isinstance(value, float):
        return []
    s = str(value).strip()
    if not s or s.lower() == "nan":
        return []
    return [x for x in s.split(sep) if x]

print("Cargando ensemble...")
ens = EnsemblePredictor()
print(f"Modelos activos: rf_tfidf={ens.has_rf_tfidf}, "
      f"rf_biobert={ens.has_rf_biobert}, lsa_rf={ens.has_lsa_rf}, "
      f"biobert_ft={ens.has_biobert_ft}")

df, label_names, train_idx, test_idx = load_split()
num_labels = len(label_names)

Y = np.zeros((len(df), num_labels), dtype=np.float32)
lab2i = {l: i for i, l in enumerate(label_names)}
for i, reacs in enumerate(df["reaction_list"]):
    for r in reacs:
        Y[i, lab2i[r]] = 1.0

cache_path = MODELS_DIR / "ensemble_train_probs.npy"
if cache_path.exists():
    print(f"Cargando probabilidades cacheadas desde {cache_path}...")
    P = np.load(cache_path)
    if P.shape != (len(train_idx), num_labels):
        print(f"  Cache invalido (shape {P.shape}), recalculando...")
        P = None
    else:
        print(f"  OK, {P.shape}")
else:
    P = None

if P is None:
    print(f"Calculando probabilidades del ensemble sobre {len(train_idx):,} casos...")
    P = np.zeros((len(train_idx), num_labels), dtype=np.float32)
    import time
    t0 = time.time()
    for k, idx in enumerate(train_idx):
        row = df.iloc[idx]
        drugs_all = safe_split(row.get("drug"))
        drug = drugs_all[0] if drugs_all else ""
        other_drugs = drugs_all[1:]
        indications = safe_split(row.get("indications"))

        age_val = row.get("age_years")
        age = float(age_val) if pd.notna(age_val) else None

        sex_val = row.get("sex")
        if pd.notna(sex_val):
            sex = {"M": "Masculino", "F": "Femenino"}.get(sex_val, "No especificado")
        else:
            sex = "No especificado"

        weight_val = row.get("weight_kg")
        weight = float(weight_val) if pd.notna(weight_val) else None

        try:
            avg, _ = ens.predict_proba(drug, age, sex, weight,
                                        other_drugs, indications)
            P[k] = avg
        except Exception as e:
            print(f"  Error en caso {k}: {e}")

        if (k + 1) % 100 == 0:
            elapsed = time.time() - t0
            rate = (k + 1) / elapsed
            eta = (len(train_idx) - k - 1) / rate
            print(f"  {k+1}/{len(train_idx)} | {rate:.1f} casos/s | ETA: {eta/60:.1f} min")

        if (k + 1) % 1000 == 0:
            np.save(cache_path, P)

    np.save(cache_path, P)
    print(f"Probabilidades guardadas en {cache_path}")

Y_tr = Y[train_idx]

print("\nBuscando umbral optimo por etiqueta con K-Fold (k=5)...")
kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
grid = np.arange(0.05, 0.81, 0.05)
best_thresholds = np.full(num_labels, 0.5, dtype=np.float32)

for j in range(num_labels):
    best_f1, best_t = 0.0, 0.15
    for t in grid:
        fold_f1 = []
        for _, val_idx in kf.split(P):
            y_true = Y_tr[val_idx, j]
            y_pred = (P[val_idx, j] >= t).astype(int)
            fold_f1.append(f1_score(y_true, y_pred, zero_division=0))
        mean_f1 = np.mean(fold_f1)
        if mean_f1 > best_f1:
            best_f1, best_t = mean_f1, t
    best_thresholds[j] = best_t
    if (j + 1) % 20 == 0:
        print(f"  Etiqueta {j+1}/{num_labels} | mejor t={best_t:.2f}")

print(f"\nUmbrales encontrados — min={best_thresholds.min():.2f}, "
      f"max={best_thresholds.max():.2f}, media={best_thresholds.mean():.2f}")

out = MODELS_DIR / "ensemble_thresholds.npy"
np.save(out, best_thresholds)
print(f"Guardado en: {out}")
