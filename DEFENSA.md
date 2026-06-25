# Ayuda memoria para la defensa

Cheat-sheet de decisiones de diseño y respuestas a preguntas probables de tribunal.
Para uso/estructura ver `README.md`. Acá va el **por qué** de cada cosa.

---

## 1. El problema en una frase

Clasificación **multi-label**: dado un paciente (edad, sexo, peso, fármaco sospechoso,
medicaciones concomitantes, indicación) predecir **qué efectos adversos** puede sufrir.
Datos reales de **FDA FAERS**, ~98 etiquetas MedDRA, densidad ~2% (muy desbalanceado).

---

## 2. Mapa de arquitectura (qué hace cada módulo y por qué existe)

**Núcleo compartido — la regla es "una sola definición de cada cosa":**

| Módulo | Responsabilidad única | Por qué está separado |
|---|---|---|
| `config.py` | Rutas, semilla, perillas de entrenamiento, DEVICE | Cambiar un hiperparámetro en un solo lugar |
| `patient_text.py` | Formato canónico paciente → texto | **Lo más importante:** si entrenamiento e inferencia usan textos distintos, el modelo ve en producción una distribución que nunca vio → predicciones inválidas. Una sola función (`build_patient_text`) garantiza que sean idénticos |
| `labels.py` | Vocabulario de etiquetas (frecuencia mínima + filtro de no-ADR) | Centraliza 2 decisiones que antes estaban duplicadas en cada script |
| `data_split.py` | Split 70/30 determinista (semilla 42) | Que cualquier script sepa qué casos son de test (nunca vistos) |
| `model.py` | `BioBERTClassifier` + `load_finetuned_model()` | Definición única del modelo, importable desde todos lados |

**Pipeline (etapas, en orden):** `preprocess.py` → `prepare_features.py` /
`biobert_embeddings.py` → entrenamiento → `eval_test_cases.py` → `app.py`.

---

## 3. Decisiones que te pueden preguntar (y la respuesta)

**¿Por qué BioBERT y no un modelo clásico?**
Naive Bayes y KNN dan F1 macro ~0 por el desbalance severo. RF mejora con
`class_weight='balanced'`. El salto grande viene de BioBERT: aporta comprensión
semántica del texto biomédico (está pre-entrenado en PubMed). Ver tabla comparativa
en la pestaña 3 de la app.

**¿Por qué `pos_weight` capado a 10 (`POS_WEIGHT_CAP`)?**
En etiquetas raras la razón neg/pos llega a ~100. Sin cap, el modelo predice "sí" a
casi todo (probabilidades aplanadas en 60-67%). Cap a 10 = recall razonable sin
sobre-predicción masiva. Se usa en `BCEWithLogitsLoss(pos_weight=...)`.

**¿Por qué umbral por etiqueta y no 0.5 fijo?**
El fine-tuning base tiene recall alto pero precisión baja. Cada etiqueta tiene su umbral óptimo. Optimizamos usando F2-Score (para darle mayor importancia al Recall y así elevar el porcentaje de respuesta y cobertura de aciertos del modelo en casos de test, sin que clases desbalanceadas queden en silencio). Estos umbrales se recalibran de forma rápida y sin reentrenar en CPU usando el script `src/recalibrate_thresholds.py` (que cachea predicciones en `outputs/val_probs_cache.npz`) y se guardan en `thresholds.npy`.

**¿Cómo evitás el data leakage?**
En `prepare_features.py`: **split primero**, después TF-IDF, mediana de edad y
frecuencias de fármacos se fitean **solo sobre train** y se transforman ambos.
El vocabulario de etiquetas (Y) sí se calcula sobre todo el dataset — es correcto
porque solo define qué columnas existen, no ajusta un estimador.

**¿Por qué se filtran etiquetas en `labels.py` (NON_ADR_LABELS)?**
FAERS mezcla en el campo de reacciones términos que NO son reacciones farmacológicas:
errores de medicación, problemas de dispositivo, embarazo, hospitalización. Si quedan,
el modelo predice cosas absurdas como "Maternal Exposure During Pregnancy" para un
paciente de 72 años.

**¿Cómo validás contra una fuente externa?**
SIDER 4.1: base curada de efectos adversos conocidos por fármaco. La app mapea el
nombre FAERS → STITCH id (probando sin sufijos de sales tipo "HYDROCHLORIDE") y
compara predicciones vs. lo documentado. Es validación independiente del test set.

**¿Qué garantiza que la app prediga igual que como se entrenó?**
`app.py` importa `build_patient_text` y `load_finetuned_model` del mismo `src/` —
no reimplementa nada. El "slider de sensibilidad" solo escala los umbrales guardados.

---

## 4. Entrenamiento resumable (`train.py`) — por si preguntan por robustez

- Guarda checkpoint **después de cada época**, de forma **atómica** (escribe `.tmp` y
  renombra: un corte a mitad no corrompe el archivo).
- Corre `EPOCHS_PER_RUN` por tanda y termina; al re-ejecutar **continúa** desde la
  última época completa hasta `TOTAL_EPOCHS`.
- Valida que el nº de etiquetas del checkpoint coincida con el actual; si cambiaron
  los datos, arranca de cero en vez de romper.

---

## 5. Limitaciones honestas (mejor decirlas vos que el tribunal)

- F1 absoluto bajo: es inherente al problema (98 clases, ~2% densidad, etiquetas con
  ~50 casos). Lo importante es la **mejora relativa** entre modelos y la metodología.
- Overfitting visible en la curva de aprendizaje del RF (gap train/test): otra razón
  para BioBERT, que generaliza mejor por el pre-entrenamiento.
- Hay scripts de entrenamiento "viejos" (como `train_biobert_finetune.py` y `tune_threshold.py`) conservados a modo de documentación histórica, pero movidos a `src/archive/` para mantener ordenada la raíz del código.
</content>
</invoke>
