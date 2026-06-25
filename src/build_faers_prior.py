import pandas as pd
import numpy as np
import pickle
from collections import defaultdict, Counter
from config import DATA_PROCESSED, MODELS_DIR

SALT_SUFFIXES = [" HYDROCHLORIDE", " SODIUM", " POTASSIUM", " CALCIUM",
                 " MESYLATE", " MALEATE", " TARTRATE", " FUMARATE",
                 " ACETATE", " SULFATE", " CITRATE", " BESYLATE", " SUCCINATE"]


def normalize_drug(name):
    n = name.upper().strip()
    for suf in SALT_SUFFIXES:
        if n.endswith(suf):
            return n[:-len(suf)].strip()
    return n


print("Cargando dataset...")
df = pd.read_csv(DATA_PROCESSED / "dataset.csv", dtype=str)
Y = pd.read_csv(DATA_PROCESSED / "Y.csv")
label_names = Y.columns.tolist()
label_idx = {l: i for i, l in enumerate(label_names)}

df = df.iloc[:len(Y)].reset_index(drop=True)

print(f"Construyendo prior fármaco -> efecto sobre {len(df):,} casos...")
drug_counts = Counter()
drug_effect_counts = defaultdict(lambda: np.zeros(len(label_names), dtype=np.float32))

for i in range(len(df)):
    drugs_raw = df.iloc[i]["drug"]
    if pd.isna(drugs_raw):
        continue
    drugs = [normalize_drug(d) for d in drugs_raw.split("|")]
    drugs = [d for d in drugs if d]
    if not drugs:
        continue

    y_row = Y.iloc[i].values
    for d in drugs:
        drug_counts[d] += 1
        drug_effect_counts[d] += y_row

prior = {}
for drug, counts in drug_effect_counts.items():
    n = drug_counts[drug]
    if n < 5:
        continue
    freqs = counts / n
    prior[drug] = freqs.astype(np.float32)

print(f"Fármacos con prior calculado (>= 5 casos): {len(prior):,}")

MODELS_DIR.mkdir(parents=True, exist_ok=True)
out = MODELS_DIR / "faers_drug_effect_prior.pkl"
with open(out, "wb") as f:
    pickle.dump(prior, f)
print(f"Prior guardado en: {out}")
