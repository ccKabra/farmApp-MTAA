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
    ├── train.py                    # Etapa 5: entrenamiento resumable por tandas BioBERT
    ├── recalibrate_thresholds.py   # Etapa 5b: calibración rápida de umbrales (F2/F-beta)
    ├── eval_test_cases.py          # Etapa 5c: tabla de predicciones vs realidad
    ├── validate_sider.py           # Etapa 6: validacion contra SIDER 4.1
    ├── visualize.py                # Etapa 7: grafos, heatmaps, Plotly
    ├── naive_bayes_baseline.py     # Extra: Naive Bayes (Unidad 5)
    ├── ner_extract.py              # Extra: NER biomedico (Unidad 6)
    ├── drug_similarity.py          # Extra: similitud coseno entre farmacos (Unidad 2)
    └── archive/                    # Carpeta para archivar scripts obsoletos o duplicados
        ├── train_biobert_finetune.py # Versión vieja de entrenamiento BioBERT
        └── tune_threshold.py         # Versión vieja de tuneo de umbral F1
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

## Flujo de ejecución paso a paso

Esta sección explica, en lenguaje sencillo, **qué hace el proyecto desde el
principio hasta el final**: desde los archivos crudos que descargás de la FDA
hasta el momento en que la app te muestra los efectos adversos predichos para
un paciente. Cada paso incluye qué recibe, qué hace, qué entrega y por qué.

### Idea general

El proyecto resuelve una pregunta: **dado un paciente (edad, sexo, peso, qué
medicamento toma, qué otros medicamentos, para qué se lo recetaron), ¿qué
efectos adversos es más probable que sufra?**

Para responderla, se sigue el flujo clásico de minería de texto + aprendizaje
automático:

```
Datos crudos  →  Limpieza  →  Representación numérica  →  Modelo  →  Predicción
   (FAERS)      (dataset)        (TF-IDF / BioBERT)        (RF/BERT)     (app)
```

Cada paso transforma la información a un formato que el siguiente paso
necesita. Si saltás un paso, los siguientes no funcionan.

---

### Fase A — De archivos crudos a un dataset limpio

#### Paso 1 — Preprocesamiento: `python src/preprocess.py`

**¿Qué recibe?** Carpeta `data/raw/` con archivos `.txt` de FAERS. La FDA los
publica en cuatro archivos por trimestre:
- `DEMO25Q1.txt` — datos demográficos del paciente (edad, sexo, peso).
- `DRUG25Q1.txt` — los medicamentos que tomaba.
- `REAC25Q1.txt` — las reacciones adversas reportadas.
- `INDI25Q1.txt` — para qué le recetaron cada medicamento.

Estos cuatro archivos están separados pero comparten un `primaryid` (ID del
caso). Cada caso clínico está repartido entre los cuatro.

**¿Qué hace?**
1. Lee los cuatro tipos de archivos de todos los trimestres presentes.
2. **Junta los pedazos** usando `primaryid`: la edad va con el medicamento, con
   las reacciones, con la indicación → todo en una sola fila.
3. **Normaliza** edad (la FDA la guarda en años, meses o días — se pasa todo a
   años) y peso (libras o kilos → kilos).
4. **Descarta** filas inválidas (sin edad, sin reacción, etc.).
5. Toma una **muestra aleatoria** de `SAMPLE_SIZE` casos (55.000 por defecto)
   con semilla fija para que el resultado sea reproducible.

**¿Qué entrega?** `data/processed/dataset.csv`. Una fila por caso clínico.
Cada fila se ve más o menos así:

| primaryid | drug | age_years | sex | weight_kg | other_drugs | indications | reactions |
|---|---|---|---|---|---|---|---|
| 254258761 | ASPIRIN | 67 | F | 72.5 | METFORMIN\|LISINOPRIL | DIABETES\|HYPERTENSION | NAUSEA\|HEADACHE |

Las barras `|` separan valores múltiples (varios medicamentos o varias
reacciones en el mismo caso).

**¿Por qué este paso? ¿Qué ventaja nos da?**
- Los modelos de ML no leen archivos sueltos; necesitan **una tabla única**
  donde cada fila sea un ejemplo de entrenamiento. Esto convierte los cuatro
  archivos crudos en ese formato.
- Hacerlo **una sola vez y persistir en CSV** evita tener que volver a leer y
  cruzar los `.txt` cada vez que probamos algo. Las etapas siguientes
  arrancan directamente del CSV.
- **Normalizar edad y peso** en un único lugar garantiza que después no
  aparezcan unidades mezcladas (años con meses, kg con libras). Si lo
  hiciéramos en cada script, era cuestión de tiempo que alguno quedara
  desincronizado.
- **El sampleo con semilla fija** hace que el experimento sea reproducible:
  cualquiera que corra el pipeline obtiene exactamente los mismos 55.000
  casos.

#### Paso 2 — Exploración: `python src/explore.py` *(opcional)*

**¿Qué hace?** Lee el dataset y dibuja distribuciones (edad, sexo, top
fármacos, top reacciones, etc.). Sirve para **entender** los datos antes de
modelar. No produce nada que los pasos siguientes necesiten — se puede saltar.

**¿Qué entrega?** Gráficos PNG en `outputs/figures/`.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Modelar a ciegas es peligroso.** Saber que el 80% de los casos son
  mujeres mayores de 60 años cambia cómo interpretamos las métricas: si la
  app falla con hombres jóvenes, es porque no había datos, no porque el
  modelo sea malo.
- **Detectar problemas antes de entrenar.** Si una columna tiene 90% de
  valores nulos, conviene saberlo acá y no después de pasar horas
  entrenando un modelo que iba a fallar igual.
- Es un paso de la **Unidad 3 (EDA previo al modelo)** que demuestra que las
  decisiones siguientes están informadas por los datos reales.

#### Paso 3 — Preparación de features: `python src/prepare_features.py`

Este paso es **crítico** y aplica un concepto importante de la Unidad 3:
**evitar data leakage**.

**¿Qué recibe?** `dataset.csv`.

**¿Qué hace?**
1. **Filtra etiquetas raras.** El campo `reactions` tiene cientos de términos.
   Muchos aparecen poquísimas veces (1–2 casos) y no se puede aprender de
   ellos. Conserva solo las que aparecen al menos `MIN_REACTION_FREQ` veces
   (300 por defecto) y descarta términos MedDRA que no son reacciones
   farmacológicas (ej. "ERROR DE MEDICACIÓN", "EMBARAZO"). Quedan ~97 etiquetas.
2. **Hace el split 70/30 PRIMERO.** Separa 70% para entrenar y 30% para
   testear, antes de calcular cualquier estadística.
3. **Calcula la representación TF-IDF SOLO con train.** TF-IDF necesita saber
   qué palabras son frecuentes en el corpus — esa información se calcula
   usando exclusivamente el conjunto de entrenamiento. Si usara el test, el
   modelo "vería" datos que no debería ver (data leakage).
4. **Aplica esa representación tanto a train como a test.**
5. Lo mismo para imputar la edad faltante: usa la mediana **del train** para
   rellenar tanto train como test.
6. **Binariza las etiquetas.** Cada caso tiene varias reacciones; se crea una
   matriz `Y` donde cada columna es una reacción y vale `1` si el caso la
   tuvo, `0` si no.

**¿Qué entrega?**
- `X.csv` — matriz de features (TF-IDF + edad + sexo + peso codificados).
- `Y.csv` — matriz binaria de etiquetas (cada columna = una reacción).
- `label_names.txt` — nombres de las etiquetas en orden.

**Ejemplo de una fila de Y:**
```
NAUSEA HEADACHE FATIGUE RASH ...
   1      1       0      0   ...
```
Significa: este caso tuvo náusea y dolor de cabeza, pero no fatiga ni sarpullido.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Split antes que TF-IDF = cero data leakage.** Si TF-IDF mira el test set
  para calcular qué palabras son "raras", está usando información del futuro.
  Las métricas darían artificialmente mejores y el modelo en producción sería
  peor de lo que parecía. Hacerlo al revés es la decisión que más impacta en
  la honestidad del resultado.
- **Filtrar etiquetas raras (`MIN_REACTION_FREQ = 300`)** hace el problema
  tratable. Si dejáramos las 600+ reacciones originales, muchas tendrían
  1–2 ejemplos: no se puede aprender de eso y el F1 macro caería por el piso
  porque promedia todas las etiquetas por igual.
- **Binarizar Y** convierte el problema a algo que sklearn y PyTorch saben
  resolver nativamente: una columna por etiqueta, predicción independiente
  por cada una.
- **Persistir `X.csv` e `Y.csv` en disco** permite que todos los modelos
  baseline (RF, NB, KNN) compartan exactamente las mismas features. Si cada
  uno las recalculara, no se podrían comparar las métricas honestamente.

---

### Fase B — Modelos clásicos (baselines)

Antes de usar BioBERT (caro y lento) se entrenan modelos sencillos para tener
una referencia. Si BioBERT no supera a estos baselines, no vale la pena.

#### Paso 4 — Random Forest + TF-IDF: `python src/train_baseline.py`

**¿Qué recibe?** `X.csv` (features TF-IDF) e `Y.csv` (etiquetas binarias).

**¿Qué hace?**
1. Rehace el mismo split 70/30 con la misma semilla.
2. Entrena un **Random Forest** (bosque de árboles de decisión). Sklearn maneja
   nativamente el caso multi-output: entrena, en la práctica, un árbol por
   etiqueta.
3. Predice sobre el 30% de test.
4. Calcula métricas: **F1 macro** (promedio simple por etiqueta — penaliza
   ignorar etiquetas raras), **F1 micro** (mira todos los aciertos globales),
   **F1 samples** (por caso), precision y recall.

**¿Qué entrega?** `models/baseline_rf.pkl` y un gráfico con las métricas.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Tener un punto de comparación obligatorio.** Si después entrenamos
  BioBERT (caro, lento, complejo) y da F1 = 0.13, ¿es bueno o malo? Sin un
  baseline no se puede responder. Con este baseline sabemos que cualquier
  modelo más complejo tiene que superar ~0.10 para justificar su costo.
- **Random Forest es ideal como baseline**: maneja datos mixtos (texto +
  numéricos), no necesita normalización, soporta multi-output nativamente
  y casi no tiene hiperparámetros que ajustar. En unos minutos tenemos un
  número decente con el que comparar.
- **Reportar las tres variantes de F1** (macro/micro/samples) es importante
  en multi-label: macro penaliza ignorar etiquetas raras, micro mide
  performance global y samples mide "por paciente". Cada una cuenta una
  historia distinta.

#### Paso 5 — Validación cruzada: `python src/cross_validation.py`

**¿Por qué?** Un solo split puede ser engañoso (podrías tener suerte o mala
suerte con qué casos quedaron en test). La validación cruzada da una
estimación más estable.

**¿Qué hace?**
1. **K-Fold con 5 pliegues**: divide el dataset en 5 partes, entrena 5 veces
   usando 4 partes y testeando con la quinta (rotando cuál queda afuera).
2. Reporta el F1 promedio y la desviación entre folds (si la desviación es
   grande, el modelo es inestable).
3. Genera **curvas de aprendizaje**: entrena con 10%, 30%, 50%, 70%, 100% del
   train y mide F1 en train vs validación.
   - Si train y validation suben juntos → el modelo aprende bien.
   - Si train sube mucho y validation se queda → **overfitting** (memoriza,
     no generaliza).
   - Si los dos están bajos → **underfitting** (el modelo es demasiado simple).

**¿Qué entrega?** `outputs/figures/cross_validation.png`.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Un solo split puede mentir.** Si por azar el 30% de test te quedó con
  los casos más fáciles, el F1 va a estar inflado. K-Fold te da 5 mediciones
  distintas y un desvío estándar: si los 5 dan parecido, podés confiar; si
  hay mucha varianza, el modelo es inestable.
- **Las curvas de aprendizaje son un diagnóstico gratis.** Te dicen si el
  problema es de **datos** (poco entrenamiento → curva sigue subiendo, hay
  que conseguir más datos) o de **modelo** (curvas planas y bajas → el
  modelo es demasiado simple, hay que cambiarlo). Esa diferencia define qué
  hacer a continuación; sin las curvas, estaríamos adivinando.
- Es **contenido explícito de la Unidad 3** (validación cruzada,
  overfitting/underfitting): no podía faltar.

#### Paso 6 — Naive Bayes: `python src/naive_bayes_baseline.py`

**¿Qué hace?** Entrena un **BernoulliNB** (Naive Bayes para features binarias)
envuelto en `OneVsRestClassifier` (un clasificador binario por etiqueta).
Naive Bayes asume que las palabras son independientes dado el efecto adverso;
es ingenuo (de ahí el nombre) pero rapidísimo y útil como tercer punto de
comparación.

**¿Qué entrega?** Métricas comparables al RF + gráfico de los 3 baselines.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Cubre la Unidad 5-I** (clasificación de texto con Naive Bayes), que
  enseñan explícitamente en clase.
- **Es un piso súper bajo a propósito.** Si NB da F1 ~0.05 y RF da ~0.10,
  significa que las features tienen información que NB no logra explotar
  (porque asume independencia entre palabras). Sirve para mostrar que la
  representación TF-IDF tiene señal aunque NB no la aproveche bien.
- **Es velocísimo.** Entrena en segundos. Tener un baseline barato siempre
  ayuda a detectar bugs: si NB da 0.0, hay algo roto antes del modelo.

---

### Fase C — Representación con BioBERT

Hasta acá las features eran TF-IDF: conteos ponderados de palabras. El
problema es que TF-IDF no "entiende" sinónimos ni contexto: "headache" y
"cephalalgia" son palabras distintas para TF-IDF, aunque signifiquen lo mismo.

BioBERT (un BERT pre-entrenado sobre literatura biomédica) convierte el texto
en un vector denso que **sí captura significado**: textos parecidos quedan
cerca en el espacio vectorial.

#### Paso 7 — Generar embeddings: `python src/biobert_embeddings.py`

**¿Qué hace?**
1. Descarga (la primera vez) el modelo BioBERT pre-entrenado.
2. Para cada caso del dataset, arma un **texto canónico** con la función
   `patient_text.row_to_text(...)`. Algo así:
   ```
   Patient: 67 years old female, weight 72.5 kg.
   Drug: ASPIRIN. Other medications: METFORMIN, LISINOPRIL.
   Indication: DIABETES, HYPERTENSION.
   ```
   **Es crítico que el formato sea exactamente igual en este paso, en el
   fine-tuning y en la app**, porque el modelo se entrena con un formato y si
   en producción ve otro, "lee" algo distinto.
3. Tokeniza ese texto, lo pasa por BioBERT (sin calcular gradientes — solo
   inferencia) y obtiene un vector por **cada token**.
4. Aplica **mean pooling** enmascarado: promedia los vectores de los tokens
   reales (ignorando padding) para obtener **un solo vector de 768
   dimensiones** que representa al caso entero.

**¿Qué entrega?** `X_biobert.csv` — 768 columnas numéricas por caso.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **TF-IDF no entiende sinónimos ni contexto.** Para TF-IDF, "headache" y
  "cephalalgia" son palabras distintas; "diabetes type 2" y "type 2 diabetes
  mellitus" también. BioBERT fue pre-entrenado sobre literatura biomédica
  (PubMed) y aprendió que esas son la misma cosa. Esa "comprensión" se
  refleja en que textos parecidos quedan cerca en el espacio vectorial.
- **Permite usar el mismo Random Forest con representación distinta.** En el
  paso siguiente comparamos RF+TF-IDF vs RF+BioBERT con todo lo demás igual
  → la diferencia en métricas mide **el aporte de la representación**, no
  del algoritmo.
- **Generar los embeddings UNA vez y guardarlos en CSV** evita pagar el
  costo (4 GB de RAM/VRAM + minutos de cómputo) cada vez que entrenamos un
  modelo nuevo sobre ellos.
- **Mean pooling enmascarado** es la operación estándar para colapsar los
  vectores token-a-token en un único vector por caso. Sin esto, no se puede
  alimentar a un Random Forest con la salida de BERT.

#### Paso 8 — RF sobre embeddings: `python src/train_rf_biobert.py`

**¿Por qué?** Para comparar **la misma máquina** (Random Forest) con dos
representaciones distintas (TF-IDF vs BioBERT). Si BioBERT mejora las
métricas, la representación es lo que aporta — no es magia del algoritmo.

**¿Qué entrega?** `models/rf_biobert.pkl` + métricas.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Es un experimento controlado.** Misma máquina (RF), distintas features.
  Si BioBERT mejora, sabemos que viene de la representación. Si no, sabemos
  que el algoritmo es el cuello de botella y conviene fine-tunear BERT
  (paso siguiente).
- **Es barato comparado con fine-tuning.** Entrenar un RF tarda minutos.
  Hacer fine-tuning de BioBERT tarda horas. Probar primero el RF nos dice
  rápidamente si vale la pena pagar el costo del fine-tuning.
- **Resulta ser el modelo con mejor F1 micro en este proyecto** (0.1498).
  Si no lo entrenábamos, no tendríamos forma de saberlo y asumiríamos que
  fine-tuning siempre es la mejor opción.

---

### Fase D — Fine-tuning de BioBERT (el modelo principal)

Hasta acá BioBERT solo generó vectores: nunca aprendió a predecir
efectos adversos. El fine-tuning ajusta los pesos del propio BioBERT
**para esta tarea específica**.

#### Paso 9 — Entrenar BioBERT: `python src/train.py`

Este es el paso largo. La idea es: tomar BioBERT pre-entrenado, agregarle una
**cabeza lineal** que tenga tantas salidas como etiquetas (97), y entrenarlo
con los datos FAERS para que aprenda a predecir cuáles activar.

Como entrenar puede tardar horas, el script está pensado para correrse
**varias veces seguidas**, cada vez avanzando unas pocas épocas y guardando
el progreso.

**Lo que pasa en una corrida:**

1. **Carga el split** (los mismos 70/30 de siempre).
2. **¿Hay checkpoint previo?**
   - Sí → carga el modelo, el optimizador, el scheduler y la mejor F1 vista
     hasta ahora. Sigue desde la época guardada.
   - No → arranca de cero: BioBERT pre-entrenado + cabeza lineal nueva.
3. **Configura el entrenamiento:**
   - Optimizador: `AdamW` (variante de Adam con weight decay).
   - Scheduler: linear warmup (el learning rate sube al principio y después
     baja en línea recta — estabiliza el fine-tuning de transformers).
   - Función de error: `BCEWithLogitsLoss`. Es la versión multi-etiqueta de
     la cross-entropy: cada salida es un problema binario independiente
     (¿sufre este efecto? sí/no).
   - **Pesos de clase**: las etiquetas raras tienen más peso en la pérdida
     para que el modelo no las ignore. Se clipean a `POS_WEIGHT_CAP` para
     que ninguna se vuelva extrema.
4. **Loop por época** (se repite `EPOCHS_PER_RUN` veces por corrida):
   - **Para cada batch de pacientes:**
     a. Forward: el modelo predice probabilidades.
     b. Calcula la pérdida (qué tan lejos está de la verdad).
     c. Backprop: calcula los gradientes.
     d. `clip_grad_norm_`: corta gradientes muy grandes (estabilidad).
     e. `optimizer.step()`: ajusta los pesos.
     f. `scheduler.step()`: actualiza el learning rate.
   - **Al final de la época:**
     a. Predice sobre validación.
     b. Busca el **mejor umbral por etiqueta**: en vez de usar 0.5, prueba
        valores y se queda con el que maximiza F1 para esa etiqueta.
     c. Calcula F1 macro de validación.
     d. Si es el mejor F1 visto, guarda los pesos en memoria como
        `best_state`.
     e. **Guarda checkpoint atómico**: escribe a `checkpoint.tmp`, después
        renombra a `checkpoint.pt`. Si se corta la luz a mitad de la
        escritura, el archivo viejo sigue intacto.
5. **Cuando se completa la última época**, vuelca el mejor modelo a:
   - `models/biobert_finetuned/model.pt` — pesos.
   - `models/biobert_finetuned/thresholds.npy` — umbral óptimo por etiqueta.
   - `models/biobert_finetuned/label_names.csv` — orden de las etiquetas.
   - El tokenizer, también ahí.

**Importante:** la lógica "una corrida = pocas épocas, se guarda y sale" deja
correr el entrenamiento de a pedacitos. Si pusiste 15 épocas totales y 3 por
corrida, corrés el script 5 veces.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Fine-tuning > usar BERT como extractor de features.** En el paso 8
  usamos BioBERT solo como generador de vectores (sus pesos no cambian).
  Acá ajustamos esos pesos a la tarea específica de predecir efectos
  adversos: el modelo aprende qué partes de "Patient: 67yo female taking
  ASPIRIN..." son relevantes para esta predicción concreta.
- **Tandas resumables = el proyecto sigue corriendo en una PC normal.**
  15 épocas seguidas son varias horas en GPU. Si se corta la luz, si
  Windows decide actualizarse, si necesitás apagar la PC para dormir →
  con tandas y checkpoint atómico no se pierde nada. Sin esto, entrenar
  el modelo principal sería un compromiso de muchas horas seguidas.
- **Checkpoint atómico (`tmp` + `os.replace`).** Si se corta la luz a
  mitad de la escritura, el archivo viejo sigue intacto. Es el detalle
  más subestimado del proyecto: perder 10 horas de fine-tuning por una
  escritura a medias sería inaceptable.
- **`pos_weight` con tope (`POS_WEIGHT_CAP = 10`)** compensa el desbalance
  severo (algunas etiquetas aparecen en 2% de los casos) sin que ninguna
  domine la pérdida. Sin esto, el modelo aprendería solo las etiquetas
  comunes y daría F1 = 0 en todo lo raro.
- **Umbral óptimo por etiqueta dentro de la misma corrida** ahorra un paso
  separado. En vez de entrenar, salir, correr otro script y volver,
  durante la validación de cada época ya se busca el umbral.
- **Guardar el mejor modelo de validación (no el último)** evita usar
  uno que se haya empezado a sobreajustar en las últimas épocas.

#### Paso 10 — Evaluar sobre test: `python src/eval_test_cases.py`

**¿Qué hace?**
1. Carga el modelo fine-tuned.
2. Para cada uno de los ~16.500 casos de test (30%, **nunca vistos** durante
   el entrenamiento):
   - Arma el texto canónico.
   - Tokeniza, pasa por el modelo, aplica sigmoide → probabilidades por
     etiqueta.
   - Compara cada probabilidad con su umbral; las que pasan, son las
     predicciones.
3. Compara las predicciones con las reacciones reales del caso:
   - **TP** (acierto): el modelo dijo "náusea" y el paciente realmente tuvo
     náusea.
   - **FP** (falso positivo): el modelo dijo "náusea" pero no la tuvo.
   - **FN** (no detectada): el paciente tuvo náusea pero el modelo no la
     predijo.

**¿Qué entrega?** `outputs/test_cases.csv` — la tabla que la app muestra en la
pestaña "Casos reales".

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Las métricas agregadas (F1, precision, recall) ocultan el comportamiento
  caso por caso.** Un F1 de 0.13 puede significar "predice bien todos los
  casos a medias" o "predice perfecto la mitad y pésimo la otra mitad". La
  tabla TP/FP/FN por caso muestra esa diferencia.
- **Da material concreto para la defensa oral.** En lugar de mostrar
  números abstractos, podemos abrir la app, elegir un paciente real, y
  mostrar: "el modelo predijo náusea y dolor de cabeza; el paciente
  realmente tuvo náusea, dolor de cabeza y mareo. Acertó dos, le faltó
  uno". Mucho más entendible.
- **Pre-calcularlo y guardar en CSV** hace que la app no tenga que correr
  el modelo sobre 16.500 casos cada vez que el usuario abre la pestaña
  "Casos reales". Lectura de CSV = instantánea.

---

### Fase E — Validación externa y extras

#### Paso 11 — Validación contra SIDER: `python src/validate_sider.py`

**¿Por qué?** Las métricas sobre el test set están bien, pero todo viene de la
misma fuente (FAERS). Si el modelo y los datos comparten un sesgo, las
métricas no lo van a detectar. SIDER 4.1 es **otra base de datos completamente
distinta** (curada manualmente desde prospectos de medicamentos), entonces
validar contra ella es una prueba más exigente.

**¿Qué hace?**
1. Descarga SIDER (la primera vez).
2. **Mapea fármacos FAERS ↔ SIDER por nombre**: ASPIRIN en FAERS = el mismo
   stitch_id en SIDER.
3. Para los 30 fármacos más frecuentes, pide al modelo que prediga sus
   efectos y los compara con los efectos que SIDER lista para ese fármaco.
4. Calcula precision/recall/F1 vs SIDER por fármaco.

**¿Qué entrega?** `outputs/sider_validation.csv`.

**¿Por qué este paso? ¿Qué ventaja nos da?**
- **Test set y train set vienen de la misma fuente (FAERS).** Si FAERS
  tiene sesgos (médicos que sobre-reportan ciertas reacciones, sub-reporte
  de efectos leves, modas en los términos MedDRA usados), las métricas
  sobre test set comparten esos sesgos y no los detectan. SIDER es otra
  base, curada manualmente desde prospectos: es una fuente **independiente**.
- **Si el modelo coincide con SIDER**, sabemos que aprendió relaciones
  fármaco→efecto reales, no artefactos del dataset. Esa es la diferencia
  entre "el modelo se aprendió FAERS de memoria" y "el modelo aprendió
  algo del dominio médico".
- **Es una validación más exigente y más honesta** que cualquier métrica
  que se calcule sobre el mismo dataset.

#### Extras

- **`ner_extract.py`** — detecta entidades biomédicas (drogas, enfermedades)
  en el texto libre de indicaciones usando spaCy/scispaCy. Útil para
  documentación; no se usa en la predicción.
- **`drug_similarity.py`** — calcula similitud coseno entre fármacos en el
  espacio BioBERT (qué fármacos son "parecidos" según el modelo).
- **`visualize.py`** — gráficos finales: grafo fármaco↔efecto, heatmap de
  co-ocurrencias, red interactiva.

**¿Por qué estos extras? ¿Qué ventaja nos dan?**
- **NER cubre la Unidad 5-I** (extracción de entidades nombradas). Sin
  este paso, el temario de NLP quedaría incompleto en la entrega.
- **Similitud coseno cubre la Unidad 2** (modelo vectorial) **usando
  BioBERT en vez de TF-IDF.** Demuestra que la representación densa
  permite operaciones semánticas (encontrar fármacos parecidos por
  significado, no por palabras compartidas).
- **Las visualizaciones convierten los CSV en gráficos defendibles
  oralmente.** Un grafo fármaco↔efecto comunica más en 5 segundos que
  abrir un CSV con 16.500 filas.

---

### Fase F — La app Streamlit

`streamlit run app.py`

**Lo que pasa cuando el usuario abre el navegador en `localhost:8501`:**

#### Al iniciar la app (una sola vez)

1. **Carga del modelo (cacheada con `@st.cache_resource`)**: se llama a
   `load_finetuned_model()`, que lee de `models/biobert_finetuned/`:
   - los pesos (`model.pt`),
   - el tokenizer,
   - los nombres de etiquetas (`label_names.csv`),
   - los umbrales óptimos por etiqueta (`thresholds.npy`).
   Se queda residente en memoria (RAM o VRAM si hay GPU).
2. **Carga de vocabularios (cacheada con `@st.cache_data`)**: lee
   `dataset.csv` y extrae los 100 fármacos más usados, las 200 medicaciones
   concomitantes más frecuentes y las 100 indicaciones más comunes. Sirven
   para autocompletar los desplegables del formulario.

#### Vista del usuario: dos pestañas

**Pestaña 1 — "Predicción para nuevo paciente"**

El usuario completa el formulario:
- Fármaco (desplegable o texto libre).
- Edad, sexo, peso.
- Otras medicaciones (multi-select).
- Indicaciones (multi-select).

Al apretar **"Predecir"**:

1. La función `predict(...)` recibe los valores del formulario.
2. `build_patient_text(...)` arma el **mismo texto canónico** que se usó en el
   entrenamiento. *Si este texto fuera distinto del que vio el modelo en
   entrenamiento, las predicciones serían basura — por eso `patient_text.py`
   es la única fuente de verdad.*
3. El tokenizer convierte el texto en `input_ids` (IDs numéricos de tokens) y
   `attention_mask` (cuáles son reales vs padding), con largo `MAX_LEN`.
4. **Inferencia**: `model(input_ids, attention_mask)` produce logits (un valor
   por etiqueta).
5. **Sigmoide**: convierte cada logit en probabilidad entre 0 y 1.
6. **Umbral por etiqueta**: cada probabilidad se compara con `thresholds[j]`.
   Si pasa, esa etiqueta se predice. (Es importante usar el umbral por
   etiqueta porque etiquetas raras suelen necesitar umbrales más bajos.)
7. **Traducción**: cada etiqueta predicha pasa por `translate_effect(...)`
   para mostrarse en español (`"NAUSEA"` → `"Náuseas"`). Internamente todo
   sigue en inglés (label_names, datos, métricas).
8. **Render**: Streamlit muestra:
   - Lista de efectos adversos predichos en español.
   - Gráfico Plotly con las top probabilidades (incluso las que no pasaron
     el umbral, para que el usuario vea qué tan cerca estuvo el modelo).

**Pestaña 2 — "Casos reales de test"**

1. Lee `outputs/test_cases.csv` (generado en el Paso 10).
2. Muestra una tabla con los pacientes del 30% de test: lo que el modelo
   predijo, lo que realmente sufrieron, los aciertos, los falsos positivos
   y las no detectadas.
3. Sirve para que el usuario vea **casos reales** sin meter datos a mano y
   pueda evaluar la calidad del modelo "a ojo".

**¿Por qué esta fase? ¿Qué ventaja nos da?**
- **Una app interactiva comunica el proyecto mejor que cualquier informe.**
  Mostrar un formulario donde se carga un paciente y aparecen sus efectos
  adversos predichos hace tangible algo que en código sería abstracto.
- **`@st.cache_resource` para el modelo y `@st.cache_data` para el dataset**:
  primera carga ~5 segundos, después instantáneo. Sin caching, cada
  interacción del usuario cargaría 440 MB de pesos de BioBERT y la app
  sería inusable.
- **Reutilizar `patient_text.py` y `load_finetuned_model`** (no
  redefinirlos en `app.py`) garantiza que la app vea **exactamente** lo
  mismo que vio el modelo en entrenamiento. Si redefiniéramos el formato
  acá, las predicciones serían silenciosamente peores.
- **La pestaña "Casos reales"** convierte la tabla CSV en algo navegable y
  evita que el usuario tenga que cargar datos a mano para probar el modelo
  — basta con elegir un paciente real del test set.
- **Traducción solo en la capa de UI**: el usuario ve "Náuseas" en español
  pero internamente el modelo y los datos siguen en inglés (MedDRA). Si
  algún día agregamos portugués, alcanza con otro diccionario; no hay que
  reentrenar nada.

---

### Orden total del pipeline (cheat-sheet)

```
1.  python src/preprocess.py            # FAERS .txt → dataset.csv
2.  python src/explore.py               # EDA (opcional)
3.  python src/prepare_features.py      # dataset.csv → X.csv, Y.csv
4.  python src/train_baseline.py        # RF + TF-IDF
5.  python src/cross_validation.py      # K-Fold + curvas
6.  python src/naive_bayes_baseline.py  # NB como tercer baseline
7.  python src/biobert_embeddings.py    # genera X_biobert.csv
8.  python src/train_rf_biobert.py      # RF + embeddings
9.  python src/train.py                 # fine-tuning BioBERT (repetir)
10. python src/eval_test_cases.py       # test_cases.csv
11. python src/validate_sider.py        # validación externa
12. python src/ner_extract.py           # NER (extra)
13. python src/drug_similarity.py       # similitud coseno (extra)
14. python src/visualize.py             # gráficos finales
15. streamlit run app.py                # app interactiva
```

Los pasos 2, 6, 12, 13 y 14 son opcionales/independientes (no son
dependencia del modelo final). El resto sí debe correrse en orden.

---

## Decisiones de diseño y por qué

Esta sección explica **por qué el proyecto está armado así** y no de otra
manera. Cada decisión tiene una alternativa que se descartó y un motivo
concreto. Sirve para defender el proyecto en la cursada y para que cualquiera
que lea el código entienda qué problema resolvió cada elección.

---

### 1. Pipeline por scripts independientes en vez de un solo `main.py`

**Diseño elegido:** un script por etapa (`preprocess.py`, `prepare_features.py`,
`train_baseline.py`, etc.), cada uno con un input y un output bien definidos
en `data/processed/`.

**Alternativa descartada:** un único `main.py` que corra todo de punta a punta.

**Ventajas:**
- **Iteración rápida.** Si toco solo la generación de features, no tengo que
  volver a leer 55.000 archivos FAERS — corro `prepare_features.py` y listo.
  En un `main.py` monolítico, cualquier cambio implica volver a correr todo.
- **Debuggear es barato.** Si las métricas dan mal, sé exactamente en qué
  archivo intermedio mirar (`X.csv`, `Y.csv`, `X_biobert.csv`) sin imprimir
  variables a mano.
- **Reproducibilidad académica.** Cada paso del temario (Unidad 2, 3, 4, 5)
  se corresponde con un archivo. Cuando hay que defender "¿dónde está la
  validación cruzada?", la respuesta es "en `cross_validation.py`", no
  "líneas 412–438 del main".
- **Compatible con hardware modesto.** No hace falta tener RAM/GPU para todo
  al mismo tiempo: se generan embeddings, se libera la GPU, se entrena RF,
  se libera RAM, etc.

---

### 2. Persistir resultados intermedios en CSV (`X.csv`, `Y.csv`, `X_biobert.csv`)

**Diseño elegido:** guardar cada paso intermedio en disco como CSV.

**Alternativa descartada:** mantener todo en memoria entre etapas o usar
formatos binarios (parquet, pickle).

**Ventajas:**
- **Inspeccionables.** Se pueden abrir con Excel/pandas para mirar a ojo si
  algo se ve raro.
- **Independencia de versiones.** Un `.pkl` puede romperse si cambia la
  versión de sklearn; un CSV no.
- **Defensa oral.** Se pueden mostrar las matrices reales en pantalla durante
  la entrega — no es un "confíen en mí, en memoria estaba así".

**Costo aceptado:** los CSV ocupan más espacio y son más lentos de leer que
parquet. Para el tamaño del proyecto (~55k filas) la diferencia es trivial.

---

### 3. Una sola fuente de verdad para el texto canónico (`patient_text.py`)

**Diseño elegido:** todas las etapas que generan texto para BioBERT (embeddings,
fine-tuning, app) llaman a las **mismas funciones** `build_patient_text` /
`row_to_text` en `patient_text.py`.

**Alternativa descartada:** que cada script arme el string como necesite.

**Ventajas:**
- **Evita el bug más caro de un proyecto de NLP.** Si entreno con un formato
  ("Patient: 67yo female...") y en la app uso otro ("67-year-old female
  patient..."), el modelo recibe en producción una distribución de texto que
  nunca vio. Las predicciones son basura y es **dificilísimo** detectarlo
  porque las métricas de test (que sí usan el formato correcto) dan bien.
- **Cambiar el formato es seguro.** Si decido agregar el peso o cambiar el
  orden, lo edito en un solo lugar y se propaga a todos los componentes.
- **Coherencia con la cátedra.** La Unidad 5-II enseña que el preprocesamiento
  de texto debe ser idéntico en entrenamiento e inferencia.

---

### 4. Vocabulario único de etiquetas (`labels.py`)

**Diseño elegido:** `build_label_vocab(df)` filtra términos MedDRA no
farmacológicos (errores, embarazo, contexto social) y aplica
`MIN_REACTION_FREQ` en una sola función. Todos los scripts la llaman.

**Alternativa descartada:** repetir el filtrado en cada script.

**Ventajas:**
- **Las etiquetas son las mismas en todos lados.** Si `prepare_features.py`
  produce 97 etiquetas y `train.py` esperaba 98, todo se rompe. Centralizar
  garantiza consistencia.
- **Cambiar el criterio de filtrado se hace en un solo lugar.** Si subo
  `MIN_REACTION_FREQ` de 300 a 500, todos los scripts se ajustan al
  siguiente run.

---

### 5. Split train/test antes de cualquier transformación

**Diseño elegido:** en `prepare_features.py`, primero se separa train/test y
**después** se fitea TF-IDF, la mediana de edad y todas las estadísticas —
usando exclusivamente train.

**Alternativa descartada:** fitear TF-IDF sobre todo el dataset y después
separar.

**Ventajas:**
- **Cero data leakage.** Si TF-IDF "ve" el test al calcular IDF, está usando
  información del futuro. Las métricas dan artificialmente mejores y el
  modelo es peor en la realidad.
- **Concepto enseñado en la Unidad 3.** Es una decisión de diseño defendible
  con teoría, no un capricho.

---

### 6. Tres baselines (NB, RF+TF-IDF, RF+BioBERT) antes del modelo final

**Diseño elegido:** entrenar Naive Bayes, RF con TF-IDF y RF con embeddings
ANTES de hacer fine-tuning de BioBERT.

**Alternativa descartada:** ir directo al fine-tuning.

**Ventajas:**
- **Aislar la ganancia de cada decisión.**
  - NB → RF: cuánto aporta cambiar el algoritmo.
  - RF+TF-IDF → RF+BioBERT: cuánto aporta cambiar la **representación**.
  - RF+BioBERT → BioBERT fine-tuned: cuánto aporta entrenar el modelo
    completo end-to-end.
- **Sin baselines no se puede defender el modelo final.** Si BioBERT
  fine-tuned da F1 0.13, ¿está bien o mal? Solo lo sabés comparándolo con
  algo más simple. (En este proyecto los baselines dan ~0.10, así que el
  fine-tuning aporta — pero poco. Eso también es información valiosa.)
- **Cubre múltiples unidades de la materia.** NB (U5-I) + RF (U3) + BERT
  (U5-II) están todos representados, no es solo "BioBERT y nada más".

---

### 7. Fine-tuning resumable por tandas con checkpoint atómico (`train.py`)

**Diseño elegido:** cada corrida de `train.py` hace solo `EPOCHS_PER_RUN`
épocas y guarda `checkpoint.pt` (vía `tmp` + `os.replace`). La próxima
corrida reanuda donde quedó.

**Alternativa descartada:** un script que entrena `TOTAL_EPOCHS` épocas
seguidas y guarda solo al final.

**Ventajas:**
- **Soporta hardware doméstico.** En una RTX 4070 Ti SUPER, 15 épocas tardan
  varias horas. Dejarla 12h corriendo es arriesgado (corte de luz,
  Windows Update, etc.). Tandas de 3 épocas son manejables.
- **El checkpoint atómico nunca corrompe el archivo.** Si se corta la luz
  mientras se escribe `checkpoint.tmp`, el `checkpoint.pt` viejo sigue
  intacto. Esto es importantísimo: perder 10 horas de fine-tuning por una
  escritura a medias es inaceptable.
- **Permite interrumpir y reanudar el laburo.** Cierro la PC a la noche,
  retomo a la mañana sin perder progreso.
- **Permite ajustar hiperparámetros en caliente.** Si después de 6 épocas
  veo que el F1 de validación se estancó, puedo bajar `TOTAL_EPOCHS` en
  `config.py` y la próxima corrida termina el run.

---

### 8. Umbral óptimo POR ETIQUETA (`tune_threshold.py` y dentro de `train.py`)

**Diseño elegido:** después de entrenar, para cada una de las 97 etiquetas
se busca el umbral (entre 0.1 y 0.9) que maximiza F1 en validación. Se guarda
un array `thresholds.npy` con un valor distinto por etiqueta.

**Alternativa descartada:** usar 0.5 como umbral fijo para todas.

**Ventajas:**
- **Las etiquetas raras necesitan umbrales más bajos.** Una etiqueta que
  aparece en el 2% de los casos casi nunca cruza 0.5 — el modelo aprende a
  predecir probabilidades bajas. Bajar el umbral permite que esa etiqueta se
  prediga.
- **Mejora F1 macro significativamente** sin re-entrenar el modelo. Es la
  decisión de menor costo y mayor impacto del proyecto.
- **El umbral se guarda con el modelo**, así que en la app se aplica
  automáticamente: el usuario nunca lo ve.

---

### 9. `POS_WEIGHT_CAP` en la función de error

**Diseño elegido:** en `BCEWithLogitsLoss`, se ponderan las clases positivas
con `(negativos / positivos)` pero clipeado a `POS_WEIGHT_CAP = 10.0`.

**Alternativa descartada A:** no usar `pos_weight` (la red ignora las
etiquetas raras).
**Alternativa descartada B:** usar `pos_weight` sin clipear (peso = 500 para
etiquetas que aparecen 100 veces en 55.000 casos → la pérdida explota,
el modelo solo aprende esa etiqueta).

**Ventajas:**
- **Soluciona el desbalance severo sin desestabilizar.** Las etiquetas raras
  contribuyen más a la pérdida pero ninguna domina.
- **Tope simple y robusto.** Un único hiperparámetro (`POS_WEIGHT_CAP`)
  controla el efecto, fácil de ajustar.

---

### 10. Caching en la app Streamlit (`@st.cache_resource`, `@st.cache_data`)

**Diseño elegido:** el modelo se carga una sola vez (`@st.cache_resource`); el
dataset para autocompletar se lee una sola vez (`@st.cache_data`).

**Alternativa descartada:** cargar todo en cada interacción del usuario.

**Ventajas:**
- **Primera carga: ~5 segundos. Siguientes interacciones: instantáneas.**
  BioBERT pesa ~440 MB; cargarlo en cada click sería inaceptable.
- **La inferencia real es ~100 ms por paciente.** Lo que se siente "rápido"
  en la app depende casi enteramente de este cacheo.

---

### 11. Validación contra SIDER (`validate_sider.py`) además de test set

**Diseño elegido:** además de medir F1 sobre el 30% de test, se compara
contra SIDER 4.1 — una base completamente externa.

**Alternativa descartada:** solo evaluar con métricas sobre test FAERS.

**Ventajas:**
- **Test set y train set vienen del mismo lugar (FAERS).** Si FAERS tiene un
  sesgo (médicos que reportan más reacciones de cierto tipo, sub-reporte de
  efectos leves), las métricas sobre test set comparten ese sesgo y no lo
  detectan.
- **SIDER usa curado manual desde prospectos.** Es una fuente independiente.
  Si el modelo coincide con SIDER, es porque aprendió relaciones reales, no
  artefactos del dataset.
- **Es una forma honesta de reportar resultados.** "Da bien en test" es más
  débil que "da bien en test Y coincide razonablemente con la base de
  referencia del dominio".

---

### 12. Capa de traducción separada (`translations.py`)

**Diseño elegido:** el modelo y los datos están en inglés (MedDRA terms);
hay un diccionario que traduce a español **solo** al renderizar en la app.

**Alternativa descartada:** entrenar/almacenar todo en español o traducir
durante el preprocesamiento.

**Ventajas:**
- **No degrada el modelo.** BioBERT fue pre-entrenado en inglés biomédico;
  alimentarlo con español traducido a mano introduciría ruido.
- **MedDRA es un estándar internacional en inglés.** Mantenerlo en inglés
  permite comparar con SIDER y con la literatura médica.
- **Cambiar idiomas es trivial.** Para agregar portugués alcanza con otro
  diccionario; no hay que tocar nada del pipeline.

---

### Resumen de prioridades de diseño

| Prioridad | Cómo se refleja en el código |
|---|---|
| **Reproducibilidad** | Semilla fija, splits centralizados, CSVs intermedios |
| **Correspondencia con la materia** | Un script por unidad, terminología alineada |
| **Robustez ante fallas** | Checkpoint atómico, fallbacks de modelo (scispaCy → spaCy) |
| **Comparabilidad** | Tres baselines + modelo final con métricas idénticas |
| **Validación honesta** | Test interno + SIDER externo |
| **Mantenibilidad** | Fuentes únicas (`patient_text`, `labels`, `config`) |
| **Usabilidad de la app** | Caching, formulario con autocompletado, traducción al renderizar |

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

## Mapeo proyecto ↔ unidades de la materia

El proyecto refleja el temario de **Minería de Texto y Aprendizaje Automático**
(MTAA). El detalle por archivo está en este mismo README.

| Unidad de la materia | Cómo aparece en el proyecto |
|---|---|
| **U2** — Representación y recuperación de datos no estructurados | TF-IDF (`prepare_features.py`), embeddings BioBERT (`biobert_embeddings.py`), similitud coseno (`drug_similarity.py`) |
| **U3** — Aprendizaje automático supervisado | Partición train/test (`data_split.py`), Random Forest (`train_baseline.py`, `train_rf_biobert.py`), validación cruzada y curvas de aprendizaje (`cross_validation.py`), umbral (`tune_threshold.py`), métricas (precision/recall/F1) |
| **U4** — Redes neuronales | Fine-tuning BioBERT con backprop, optimizador Adam y BCE (`model.py`, `train_biobert_finetune.py`, `train.py`) |
| **U5-I** — NLP parte 1 | Naive Bayes (`naive_bayes_baseline.py`), NER con spaCy/scispaCy (`ner_extract.py`) |
| **U5-II** — NLP parte 2 | BERT/BioBERT, embeddings contextuales, fine-tuning (`model.py`, `biobert_embeddings.py`, `train_biobert_finetune.py`) |

---

## Funcionamiento detallado por archivo

El código no lleva comentarios ni docstrings: la explicación de cada módulo
vive acá.

### `src/config.py`
Rutas absolutas (`DATA_RAW`, `DATA_PROCESSED`, `MODELS_DIR`, `OUTPUTS_DIR`),
semilla `RANDOM_SEED`, hiperparámetros (`SAMPLE_SIZE`, `MIN_REACTION_FREQ`,
`TEST_SIZE`, `TOTAL_EPOCHS`, `EPOCHS_PER_RUN`, `BATCH_TRAIN`, `POS_WEIGHT_CAP`)
y detección de `DEVICE` (CUDA si está disponible).

### `src/labels.py` — Unidad 3
`build_label_vocab(df)` arma el vocabulario único de etiquetas (efectos
adversos) filtrando términos MedDRA que no son reacciones farmacológicas
(errores de medicación, contexto, etc.) y aplicando `MIN_REACTION_FREQ`.

### `src/patient_text.py`
`build_patient_text(...)` y `row_to_text(row)` producen el texto canónico que
recibe BioBERT a partir de los atributos del paciente. Es la **única**
definición del formato; entrenamiento e inferencia la usan para evitar
discrepancias de distribución.

### `src/data_split.py` — Unidad 3 (partición train/test)
`load_split()` reproduce el split 70/30 con `RANDOM_SEED`, devolviendo los
índices de train y test que comparten todos los scripts.

### `src/preprocess.py` — Etapa 1
Lee todos los `.txt` de FAERS en `data/raw/`, normaliza edad/peso, junta
DEMO+DRUG+REAC+INDI, samplea `SAMPLE_SIZE` casos y guarda
`data/processed/dataset.csv`.

### `src/explore.py` — Etapa 2a (EDA, Unidad 3)
Análisis exploratorio: distribuciones, frecuencias, faltantes. Produce
gráficos en `outputs/figures/`.

### `src/prepare_features.py` — Etapa 2b (Unidad 2 + 3)
Hace **primero** el split y luego ajusta el `TfidfVectorizer` y la mediana de
edad **solo sobre train** (evita data leakage, Unidad 3). Genera `X.csv`,
`Y.csv` (matriz multi-label binarizada) y `label_names.txt`.

### `src/train_baseline.py` — Etapa 3 (Unidad 3)
Entrena `RandomForestClassifier` multi-output sobre las features TF-IDF.
Reporta F1 macro/micro/samples, precision y recall. Guarda
`models/baseline_rf.pkl`.

### `src/cross_validation.py` — Etapa 3b (Unidad 3)
Validación cruzada K-Fold (5 pliegues) sobre el RF baseline + curvas de
aprendizaje (train vs validation) para diagnosticar over/underfitting.

### `src/biobert_embeddings.py` — Etapa 4a (Unidad 2 + 5-II)
Carga BioBERT, tokeniza el texto canónico de cada caso y aplica **mean
pooling** enmascarado para obtener un vector de 768 dimensiones por caso.
Guarda `data/processed/X_biobert.csv`.

### `src/train_rf_biobert.py` — Etapa 4b (Unidad 3 + 5-II)
Mismo RF que el baseline pero entrenado sobre los embeddings BioBERT. Permite
comparar TF-IDF vs embeddings contextuales con el mismo clasificador.

### `src/model.py` — Unidad 4 + 5-II
Clase `BioBERTClassifier`: backbone BioBERT + cabeza lineal con `num_labels`
salidas (sigmoid implícita vía `BCEWithLogitsLoss`). Función
`load_finetuned_model()` que reconstruye el modelo desde
`models/biobert_finetuned/`.

### `src/train.py` — Versión resumable por tandas
Mismo algoritmo de fine-tuning base, pero corre solo `EPOCHS_PER_RUN` épocas por ejecución, persistiendo un `checkpoint.pt` atómico (`tmp` + `os.replace`) que permite continuar tras un corte. Usa `get_linear_schedule_with_warmup` para estabilizar el aprendizaje.

### `src/recalibrate_thresholds.py` — Etapa 5b (Calibración Rápida)
Script para recalibrar los umbrales de decisión sin necesidad de reentrenar el modelo de lenguaje en CPU lenta. Corre inferencia sobre el set de validación una sola vez y guarda el resultado en caché (`outputs/val_probs_cache.npz`). Permite calibrar usando optimización de F-beta (ej. F2-Score) para aumentar el recall y la cobertura de respuesta del modelo, guardando los nuevos umbrales en `models/biobert_finetuned/thresholds.npy`.

### `src/archive/` — Scripts Obsoletos y de Iteración Previa
- `train_biobert_finetune.py`: Fine-tuning clásico (loop entero en un solo run).
- `tune_threshold.py`: Tuneo original de umbrales maximizando F1 clásico sobre validación.

### `src/naive_bayes_baseline.py` — Etapa extra (Unidad 5-I)
`BernoulliNB` envuelto en `OneVsRestClassifier` sobre TF-IDF; tercer baseline
para comparar con RF+TF-IDF y RF+BioBERT.

### `src/ner_extract.py` — Etapa NER (Unidad 5-I)
NER sobre el texto libre de indicaciones FAERS. Intenta `en_core_sci_md` →
`en_core_sci_sm` → `en_core_web_sm` (fallback). Guarda entidades extraídas en
`outputs/ner_entities.csv`.

### `src/drug_similarity.py` — Etapa extra (Unidad 2)
Calcula similitud por coseno entre embeddings BioBERT promedio por fármaco;
encuentra fármacos cercanos en el espacio semántico.

### `src/eval_test_cases.py` — Etapa 5c (Unidad 3)
Corre el modelo fine-tuned sobre el 30% de test y arma `outputs/test_cases.csv`
con atributos del paciente, reacciones reales, predichas, TP, FP y FN por caso.

### `src/validate_sider.py` — Etapa 6 (extensión fuera del temario)
Descarga SIDER 4.1, mapea fármacos FAERS↔SIDER por nombre y compara las
predicciones del modelo contra los efectos conocidos por fármaco. Reporta
precision/recall/F1 vs SIDER en `outputs/sider_validation.csv`.

### `src/visualize.py` — Etapa 7 (auxiliar)
Genera grafos fármaco↔efecto, heatmaps de co-ocurrencia y red interactiva.
Salida en `outputs/figures/` y `outputs/grafo_interactivo.html`.

### `src/translations.py` — auxiliar (UI)
Diccionario EN→ES de efectos adversos para la app Streamlit. Importado por
`app.py`. No afecta entrenamiento ni métricas (internamente todo va en inglés).

### `app.py` — App Streamlit (auxiliar)
Carga el modelo fine-tuned (`load_finetuned_model`), expone un formulario para
predecir efectos adversos de un paciente nuevo y muestra los casos de test
reales con su comparación predicho vs reportado.

---

## Extensiones fuera del temario (declaradas explícitamente)

El dominio del proyecto (FAERS, multi-label, ~98 etiquetas desbalanceadas)
requiere algunas técnicas que **no aparecen en las diapositivas**. Se documentan
para transparencia académica; ninguna reemplaza un concepto enseñado, sino que
los extiende:

| Extensión | En qué archivo | Por qué se incluye | Tema de la materia que sí aplica |
|---|---|---|---|
| Clasificación **multi-label** (matriz Y binarizada) | `prepare_features.py`, todos los `train_*` | FAERS reporta múltiples reacciones por caso. La materia enseña binaria/multiclase. | U3 (clasificación supervisada, métricas) |
| **POS_WEIGHT_CAP** en BCE | `train.py`, `train_biobert_finetune.py` | Compensar desbalance severo entre etiquetas. La materia menciona `class_weight="balanced"` en RF, no ponderación manual en redes. | U4 (función de error) |
| **Linear warmup** del learning rate | `train.py` | Práctica habitual al fine-tunear transformers; mejora estabilidad. Slides enseñan lr fijo o decay simple. | U4 (learning rate, optimización) |
| **Umbral por etiqueta** | `tune_threshold.py` | El umbral 0.5 no es óptimo en multi-label desbalanceado. La materia trata el umbral en binario. | U3 (curva PR, ajuste del clasificador) |
| **Mean pooling** sobre tokens BERT | `biobert_embeddings.py` | Necesario para obtener un vector por caso a partir de embeddings token a token. Slides no detallan la operación de pooling. | U2 / U5-II (representación vectorial) |
| **Validación contra SIDER 4.1** | `validate_sider.py` | Refuerza la evaluación con una fuente externa al dataset de entrenamiento. SIDER no figura en slides. | U3 (idea de evaluar fuera del train) |
| **Entrenamiento resumable por tandas** | `train.py` | Estrategia operativa (checkpoint atómico) para no perder progreso. No introduce algoritmos nuevos. | — |
| **App Streamlit + `translations.py`** | `app.py` y módulos asociados | Capa de presentación para la defensa oral. No es contenido de la materia. | — |

Temas del temario **no utilizados** (intencionalmente): SVM, LSA/PCA,
LDA/BERTopic, regresión, word2vec/GloVe/FastText. Se reemplazaron por
alternativas equivalentes o no aplican al objetivo.

---

## Bibliografía

- Lee, J. et al. (2020). *BioBERT: a pre-trained biomedical language representation model for biomedical text mining*. Bioinformatics, 36(4), 1234–1240.
- Kuhn, M. et al. (2016). *The SIDER database of drugs and side effects*. Nucleic Acids Research, 44(D1), D1075–D1079.
- FDA Adverse Event Reporting System (FAERS). https://www.fda.gov/drugs/questions-research-reporting/fda-adverse-event-reporting-system-faers
- Pedregosa, F. et al. (2011). *Scikit-learn: Machine Learning in Python*. JMRL, 12, 2825–2830.
- Neumann, M. et al. (2019). *ScispaCy: Fast and Robust Models for Biomedical Natural Language Processing*. Proceedings of BioNLP.
