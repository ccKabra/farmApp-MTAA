import os
import sys
import numpy as np
import pandas as pd
import torch
from pathlib import Path
from sklearn.metrics import f1_score, precision_score, recall_score, fbeta_score

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from config import DATA_PROCESSED, MODELS_DIR, OUTPUTS_DIR, DEVICE, RANDOM_SEED
from model import load_finetuned_model
from patient_text import row_to_text, MAX_LEN
from data_split import load_split

CACHE_PATH = OUTPUTS_DIR / "val_probs_cache.npz"

def get_validation_data():
    """Carga y retorna los textos y etiquetas reales de validación (10% del train_idx)."""
    df, label_names, train_idx, _ = load_split()
    val_n = int(len(train_idx) * 0.1)
    val_idx = train_idx[:val_n]

    df_val = df.iloc[val_idx].reset_index(drop=True)
    texts = df_val.apply(row_to_text, axis=1).tolist()

    # Construir Y de validación
    num_labels = len(label_names)
    Y_val = np.zeros((len(df_val), num_labels), dtype=np.float32)
    lab2i = {l: i for i, l in enumerate(label_names)}
    for i, reacs in enumerate(df_val["reaction_list"]):
        for r in reacs:
            if r in lab2i:
                Y_val[i, lab2i[r]] = 1.0

    return texts, Y_val, label_names

def run_inference_and_cache(texts, Y_val, model, tokenizer):
    """Ejecuta inferencia en CPU/GPU por lotes y guarda en caché."""
    print("Inferencia requerida. Corriendo BioBERT sobre el set de validación (3850 casos)...")
    print("Esto puede tardar unos minutos en CPU. Se guardará en caché para ejecuciones instantáneas.")
    
    BATCH = 32
    all_probs = []
    
    for i in range(0, len(texts), BATCH):
        batch_texts = texts[i:i+BATCH]
        enc = tokenizer(batch_texts, return_tensors="pt", truncation=True,
                        max_length=MAX_LEN, padding="max_length").to(DEVICE)
        with torch.no_grad():
            logits = model(enc["input_ids"], enc["attention_mask"])
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.append(probs)
        
        if (i + BATCH) % 320 == 0 or (i + BATCH) >= len(texts):
            progress = min(100.0, (i + BATCH) / len(texts) * 100)
            print(f"  Progreso: {progress:.1f}% ({min(len(texts), i+BATCH)}/{len(texts)})")
            
    probs = np.vstack(all_probs)
    np.savez_compressed(CACHE_PATH, probs=probs, labels=Y_val)
    print(f"¡Caché guardada exitosamente en {CACHE_PATH}!")
    return probs

def load_cached_predictions():
    """Carga probabilidades y etiquetas desde caché si existe."""
    if CACHE_PATH.exists():
        data = np.load(CACHE_PATH)
        return data["probs"], data["labels"]
    return None, None

def optimize_thresholds(probs, labels, mode="fbeta", beta=2.0, min_recall=0.25, max_t_cap=0.40):
    """
    Optimiza los umbrales para cada etiqueta según diferentes estrategias:
    - 'f1': Maximizar F1 clásico.
    - 'fbeta': Maximizar F-beta (F2 por defecto prioritiza recall).
    - 'constrained_recall': Maximizar precisión sujeto a recall mínimo, o F1 con tope máximo de umbral.
    """
    num_labels = probs.shape[1]
    best_thresholds = np.full(num_labels, 0.5, dtype=np.float32)
    grid = np.arange(0.01, 0.90, 0.01) # Búsqueda más fina

    for j in range(num_labels):
        y_true = labels[:, j]
        best_metric = -1.0
        best_t = 0.5
        
        # Si no hay ejemplos positivos en validación, usar un valor por defecto conservador
        if y_true.sum() == 0:
            best_thresholds[j] = 0.15
            continue

        for t in grid:
            y_pred = (probs[:, j] >= t).astype(int)
            
            if mode == "f1":
                metric = f1_score(y_true, y_pred, zero_division=0)
            elif mode == "fbeta":
                metric = fbeta_score(y_true, y_pred, beta=beta, zero_division=0)
            elif mode == "constrained_recall":
                rec = recall_score(y_true, y_pred, zero_division=0)
                prec = precision_score(y_true, y_pred, zero_division=0)
                # Si cumplimos el recall mínimo, optimizamos la precisión. Si no, penalizamos.
                if rec >= min_recall:
                    metric = prec + rec
                else:
                    metric = rec - 1.0 # Penalizar umbrales muy altos
                
                # Aplicar un tope (cap) para evitar umbrales demasiado altos en clases raras
                if t > max_t_cap:
                    continue
            else:
                metric = f1_score(y_true, y_pred, zero_division=0)
                
            if metric > best_metric:
                best_metric = metric
                best_t = t
                
        best_thresholds[j] = best_t
        
    return best_thresholds

def evaluate_metrics(probs, labels, thresholds):
    """Calcula y muestra métricas generales en el set de validación."""
    preds = np.zeros_like(probs)
    for j in range(probs.shape[1]):
        preds[:, j] = (probs[:, j] >= thresholds[j]).astype(int)
        
    f1_mac = f1_score(labels, preds, average="macro", zero_division=0)
    f1_mic = f1_score(labels, preds, average="micro", zero_division=0)
    prec = precision_score(labels, preds, average="macro", zero_division=0)
    rec = recall_score(labels, preds, average="macro", zero_division=0)
    
    # Calcular porcentaje de casos con al menos 1 acierto (TP > 0)
    n_aciertos = np.sum((preds == 1) & (labels == 1), axis=1)
    casos_con_acierto = np.mean(n_aciertos > 0)
    
    # Promedio de predicciones por caso
    pred_counts = np.sum(preds, axis=1)
    avg_preds = np.mean(pred_counts)
    
    return {
        "F1 Macro": f1_mac,
        "F1 Micro": f1_mic,
        "Precision": prec,
        "Recall": rec,
        "Casos con acierto (%)": casos_con_acierto * 100,
        "Predicciones promedio": avg_preds
    }

def main():
    print("=== RECALIBRACIÓN RÁPIDA DE UMBRALES ===")
    
    # 1. Obtener datos de validación
    texts, Y_val, label_names = get_validation_data()
    
    # 2. Cargar o calcular predicciones del modelo
    probs, labels = load_cached_predictions()
    if probs is None:
        model, tokenizer, _, _ = load_finetuned_model()
        probs = run_inference_and_cache(texts, Y_val, model, tokenizer)
        labels = Y_val
    else:
        print("Cargadas probabilidades e inferencias de validación desde la caché.")

    # 3. Evaluar con umbral original de referencia (0.50 fijo)
    orig_thresholds_path = MODELS_DIR / "biobert_finetuned" / "thresholds.npy"
    if orig_thresholds_path.exists():
        orig_thresholds = np.load(orig_thresholds_path)
    else:
        orig_thresholds = np.full(len(label_names), 0.5, dtype=np.float32)
        
    ref_metrics = evaluate_metrics(probs, labels, orig_thresholds)
    print("\n--- Métricas Actuales (Umbrales actuales) ---")
    for k, v in ref_metrics.items():
        print(f"  {k:25s}: {v:.4f}" if "promedio" not in k and "%" not in k else f"  {k:25s}: {v:.1f}")

    # 4. Generar y comparar calibraciones
    print("\nCalculando nuevas opciones de umbrales...")
    
    # Opción A: Optimizar F2 (prioriza recall)
    th_f2 = optimize_thresholds(probs, labels, mode="fbeta", beta=2.0)
    metrics_f2 = evaluate_metrics(probs, labels, th_f2)
    
    # Opción B: Optimizar F3 (prioriza recall aún más fuerte)
    th_f3 = optimize_thresholds(probs, labels, mode="fbeta", beta=3.0)
    metrics_f3 = evaluate_metrics(probs, labels, th_f3)
    
    # Opción C: Umbral con Recall Constreñido y tope máximo a 0.30
    th_constrained = optimize_thresholds(probs, labels, mode="constrained_recall", min_recall=0.25, max_t_cap=0.30)
    metrics_constrained = evaluate_metrics(probs, labels, th_constrained)

    print("\n--- COMPARATIVA DE ESTRATEGIAS EN VALIDACIÓN ---")
    df_comp = pd.DataFrame({
        "Métrica": list(ref_metrics.keys()),
        "Actual (npy)": [ref_metrics[k] for k in ref_metrics],
        "F2-Score (Recall)": [metrics_f2[k] for k in ref_metrics],
        "F3-Score (Alto Recall)": [metrics_f3[k] for k in ref_metrics],
        "Constrained Recall (<0.30)": [metrics_constrained[k] for k in ref_metrics],
    })
    print(df_comp.to_string(index=False))

    # Seleccionar la mejor opción para guardar
    selected_mode = "F2-Score"
    selected_th = th_f2
    
    # Guardar nuevos umbrales
    save_dir = MODELS_DIR / "biobert_finetuned"
    np.save(save_dir / "thresholds.npy", selected_th)
    
    # Actualizar CSV de umbrales para fácil lectura humana
    pd.DataFrame({"label": label_names, "threshold": selected_th}).to_csv(
        save_dir / "label_thresholds.csv", index=False)
        
    print(f"\n¡Nuevos umbrales calibrados usando {selected_mode} guardados en {save_dir / 'thresholds.npy'}!")
    print("Recuerda correr paso3_evaluar.bat para actualizar los resultados de test en la app Streamlit.")

if __name__ == "__main__":
    main()
