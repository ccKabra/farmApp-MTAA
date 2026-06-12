# Sistema de Prediccion de Efectos Adversos de Farmacos

Proyecto final de **Mineria de Texto y Aprendizaje Automatico**.

**Integrantes:** Alzugaray Agustin Ezequiel · Lautaro Cabrera Tamalet

Toma reportes reales de pacientes de FDA FAERS, construye features con TF-IDF y BioBERT, entrena modelos de clasificacion multilabel para predecir efectos adversos, valida contra SIDER 4.1 y presenta los resultados en una app Streamlit.

---

## Estructura del proyecto

```
farmApp/
├── app.py                          # App Streamlit
├── requirements.txt
├── README.md
├── data/
│   ├── raw/                        # FAERS .txt (no se sube a git)
│   └── processed/                  # Archivos generados por el pipeline
│       ├── dataset.csv
│       ├── X.csv / Y.csv
│       ├── X_biobert.csv           # Embeddings 768d
│       └── label_names.txt
├── models/                         # Modelos entrenados (no se sube a git)
│   └── biobert_finetuned/
│       ├── model.pt
│       ├── thresholds.npy
│       ├── label_names.csv
│       └── checkpoint.pt
├── outputs/
│   ├── figures/                    # Graficos PNG
│   ├── test_cases.csv
│   ├── sider_validation.csv
│   └── drug_similarity.csv
└── src/
    ├── config.py                   # Rutas, constantes y DEVICE
    ├── labels.py                   # Vocabulario de etiquetas centralizado
    ├── patient_text.py             # Formato canonico de texto para BioBERT
    ├── model.py                    # BioBERTClassifier + load_finetuned_model()
    ├── data_split.py               # Split reproducible 70/30
    ├── preprocess.py               # Etapa 1: FAERS -> dataset.csv
    ├── explore.py                  # Etapa 2a: EDA
    ├── prepare_features.py         # Etapa 2b: TF-IDF + one-hot -> X.csv/Y.csv
    ├── train_baseline.py           # Etapa 3: Random Forest + TF-IDF
    ├── cross_validation.py         # Etapa 3b: K-Fold + curvas de aprendizaje
    ├── biobert_embeddings.py       # Etapa 4a: embeddings BioBERT
    ├── train_rf_biobert.py         # Etapa 4b: RF con embeddings BioBERT
    ├── train_biobert_finetune.py   # Etapa 5: fine-tuning BioBERT (modo clasico)
    ├── train.py                    # Etapa 5 alt: entrenamiento resumable por tandas
    ├── tune_threshold.py           # Etapa 5b: umbral optimo por etiqueta
    ├── eval_test_cases.py          # Etapa 5c: tabla de predicciones vs realidad
    ├── validate_sider.py           # Etapa 6: validacion contra SIDER 4.1
    ├── visualize.py                # Etapa 7: grafos, heatmaps, Plotly
    ├── naive_bayes_baseline.py     # Extra: Naive Bayes (Unidad 5)
    ├── ner_extract.py              # Extra: NER biomedico (Unidad 6)
    ├── drug_similarity.py          # Extra: similitud coseno entre farmacos (Unidad 2)
    └── smoke_test.py               # Test rapido end-to-end
```

---

## Requisitos

- Python 3.10 o superior
- CUDA opcional (se detecta automaticamente; sin GPU funciona en CPU, mas lento)

---

## Instalacion

```bash
# 1. Clonar el repositorio
git clone <URL-del-repo>
cd farmApp

# 2. Crear entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# 3. Instalar dependencias base
pip install -r requirements.txt

# 4. Instalar PyTorch segun hardware
# GPU (CUDA 12.4):
pip install torch==2.6.0+cu124 --index-url https://download.pytorch.org/whl/cu124
# CPU solamente:
pip install torch

# 5. Descargar el modelo de lenguaje de spaCy
python -m spacy download en_core_web_sm
```

---

## Descargar datos FAERS

1. Ir a: https://www.fda.gov/drugs/questions-research-reporting/fda-adverse-event-reporting-system-faers
2. Descargar los trimestres deseados (ej: 2025Q1 a 2026Q1) en formato ASCII
3. Descomprimir los archivos `.txt` en `data/raw/`

La estructura esperada es:
```
data/raw/
├── DEMO25Q1.txt
├── DRUG25Q1.txt
├── REAC25Q1.txt
├── INDI25Q1.txt
├── DEMO26Q1.txt
...
```

---

## Ejecutar el pipeline

Correr cada etapa en orden:

```bash
# Etapa 1: preprocesar FAERS -> dataset.csv (~55k casos)
python src/preprocess.py

# Etapa 2a: analisis exploratorio
python src/explore.py

# Etapa 2b: construir X.csv, Y.csv (split primero, TF-IDF solo en train)
python src/prepare_features.py

# Etapa 3: baseline Random Forest + TF-IDF
python src/train_baseline.py

# Etapa 3b: validacion cruzada 5-fold + curvas de aprendizaje
python src/cross_validation.py

# Etapa 4a: generar embeddings BioBERT (requiere ~4 GB RAM/VRAM)
python src/biobert_embeddings.py

# Etapa 4b: RF con embeddings BioBERT
python src/train_rf_biobert.py

# Extra: Naive Bayes como tercer baseline (Unidad 5)
python src/naive_bayes_baseline.py

# Extra: NER biomedico sobre indicaciones (Unidad 6)
python src/ner_extract.py

# Extra: similitud coseno entre farmacos (Unidad 2)
python src/drug_similarity.py

# Etapa 5: fine-tuning BioBERT (entrenamiento resumable por tandas)
# Correr varias veces hasta completar TOTAL_EPOCHS (ver src/config.py)
python src/train.py

# Etapa 5c: generar tabla de predicciones vs realidad para el test set
python src/eval_test_cases.py

# Etapa 6: validacion contra SIDER 4.1
python src/validate_sider.py

# Etapa 7: visualizaciones finales
python src/visualize.py
```

---

## Correr la app Streamlit

```bash
# Requiere que el modelo este entrenado (models/biobert_finetuned/)
streamlit run app.py
```

La app se abre en `http://localhost:8501`. Permite:
- **Predecir efectos adversos** para un paciente nuevo (farmaco, edad, sexo, peso, medicaciones, indicaciones)
- **Ver casos reales de test** (30% nunca visto por el modelo) con comparacion predicho vs reportado

---

## Metricas obtenidas

| Modelo | F1 macro | F1 micro | F1 samples | Precision | Recall |
|--------|----------|----------|------------|-----------|--------|
| Naive Bayes (BernoulliNB) | ~0.05 | ~0.08 | ~0.07 | ~0.04 | ~0.45 |
| Random Forest + TF-IDF | 0.1070 | 0.1039 | 0.1052 | 0.0636 | 0.4669 |
| Random Forest + BioBERT | 0.1296 | 0.1498 | 0.1267 | 0.0990 | 0.2096 |
| BioBERT Fine-tuned (15 ep.) | **0.1283** | **0.1063** | **0.0980** | **0.1064** | **0.3878** |

> El problema es inherentemente dificil (97 etiquetas multilabel, desbalance severo, texto clinico ruidoso). El BioBERT fine-tuned mejora precision a costa de recall respecto al RF+BioBERT.

---

## Configuracion

Los parametros principales estan en `src/config.py`:

| Parametro | Default | Descripcion |
|-----------|---------|-------------|
| `SAMPLE_SIZE` | 55 000 | Casos FAERS a usar |
| `MIN_REACTION_FREQ` | 300 | Frecuencia minima para incluir una etiqueta |
| `TOTAL_EPOCHS` | 15 | Epocas totales de fine-tuning |
| `EPOCHS_PER_RUN` | 3 | Epocas por corrida del script |
| `BATCH_TRAIN` | 32 | Batch size en entrenamiento |
| `POS_WEIGHT_CAP` | 10.0 | Tope del peso de clases positivas |
| `TEST_SIZE` | 0.30 | Proporcion del conjunto de test |

---

## Bibliografía

- Lee, J. et al. (2020). *BioBERT: a pre-trained biomedical language representation model for biomedical text mining*. Bioinformatics, 36(4), 1234–1240.
- Kuhn, M. et al. (2016). *The SIDER database of drugs and side effects*. Nucleic Acids Research, 44(D1), D1075–D1079.
- FDA Adverse Event Reporting System (FAERS). https://www.fda.gov/drugs/questions-research-reporting/fda-adverse-event-reporting-system-faers
- Pedregosa, F. et al. (2011). *Scikit-learn: Machine Learning in Python*. JMRL, 12, 2825–2830.
- Neumann, M. et al. (2019). *ScispaCy: Fast and Robust Models for Biomedical Natural Language Processing*. Proceedings of BioNLP.
