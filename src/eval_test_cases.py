"""
Genera la tabla de comparacion prediccion vs realidad sobre el 30% de test.

Corre el modelo fine-tuned sobre TODOS los casos de test (nunca vistos en
entrenamiento) y guarda outputs/test_cases.csv con:
  - atributos del paciente (edad, sexo, peso, farmaco, concomitantes, indicacion)
  - reacciones reales reportadas en FAERS (las que estan en el vocabulario de 98)
  - reacciones predichas por el modelo
  - aciertos (TP), falsos positivos (FP) y no detectadas (FN) por caso

Esta tabla es la que usa la app en la pestania "Casos reales de test".
"""

import pandas as pd
import numpy as np
import torch
from config import OUTPUTS_DIR, DEVICE
from model import load_finetuned_model
from patient_text import row_to_text, MAX_LEN
from data_split import load_split

BATCH = 64

df, label_names, train_idx, test_idx = load_split()
print(f"Dataset filtrado: {len(df):,} casos | Train: {len(train_idx):,} (70%) | Test: {len(test_idx):,} (30%)")

model, tokenizer, model_labels, thresholds = load_finetuned_model()
assert model_labels == label_names, "El vocabulario de etiquetas no coincide con el del modelo"

df_test = df.iloc[test_idx].reset_index(drop=True)
texts = df_test.apply(row_to_text, axis=1).tolist()

print(f"Prediciendo {len(texts):,} casos de test...")
all_probs = []
for i in range(0, len(texts), BATCH):
    enc = tokenizer(texts[i:i+BATCH], return_tensors="pt", truncation=True,
                    max_length=MAX_LEN, padding="max_length").to(DEVICE)
    with torch.no_grad():
        logits = model(enc["input_ids"], enc["attention_mask"])
        all_probs.append(torch.sigmoid(logits).cpu().numpy())
probs = np.vstack(all_probs)

rows = []
for i, (_, r) in enumerate(df_test.iterrows()):
    real = set(r["reaction_list"])
    pred = {label_names[j] for j in range(len(label_names)) if probs[i, j] >= thresholds[j]}
    tp, fp, fn = pred & real, pred - real, real - pred
    rows.append({
        "primaryid": r["primaryid"],
        "edad": r["age_years"],
        "sexo": r["sex"],
        "peso_kg": r["weight_kg"],
        "farmaco": r["drug"],
        "medicaciones_previas": r["other_drugs"],
        "indicaciones": r["indications"],
        "reacciones_reales": "|".join(sorted(real)),
        "reacciones_predichas": "|".join(sorted(pred)),
        "aciertos_TP": "|".join(sorted(tp)),
        "falsos_positivos_FP": "|".join(sorted(fp)),
        "no_detectadas_FN": "|".join(sorted(fn)),
        "n_reales": len(real), "n_predichas": len(pred), "n_aciertos": len(tp),
    })

out_df = pd.DataFrame(rows)
out = OUTPUTS_DIR / "test_cases.csv"
out_df.to_csv(out, index=False)

n_hit = (out_df["n_aciertos"] > 0).sum()
print(f"\nGuardado: {out}")
print(f"Casos de test: {len(out_df):,}")
print(f"Casos con al menos 1 acierto: {n_hit:,} ({n_hit/len(out_df):.1%})")
print(f"Promedio reales por caso: {out_df['n_reales'].mean():.2f} | predichas: {out_df['n_predichas'].mean():.2f}")
