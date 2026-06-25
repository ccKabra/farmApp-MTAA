import sys
import streamlit as st
import pandas as pd
import numpy as np
import torch
from pathlib import Path
import plotly.graph_objects as go

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "src"))
from model import load_finetuned_model
from patient_text import build_patient_text, MAX_LEN
from translations import translate_effect

try:
    from ensemble import EnsemblePredictor
    HAS_ENSEMBLE = True
except Exception:
    HAS_ENSEMBLE = False

DATA_DIR = ROOT / "data" / "processed"
OUT_DIR = ROOT / "outputs"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

@st.cache_resource
def load_model():
    return load_finetuned_model()

@st.cache_resource
def load_ensemble():
    if not HAS_ENSEMBLE:
        return None
    try:
        return EnsemblePredictor()
    except Exception as e:
        st.warning(f"No se pudo cargar el ensemble: {e}. Usando solo BioBERT fine-tuned.")
        return None

@st.cache_data
def get_vocab():
    df = pd.read_csv(DATA_DIR / "dataset.csv", dtype=str)
    from collections import Counter

    def top_values(col, n):
        if col not in df.columns:
            return []
        vals = [v for row in df[col].dropna() for v in row.split("|")]
        return [v for v, _ in Counter(vals).most_common(n)]

    return {
        "drugs": top_values("drug", 100),
        "other_drugs": top_values("other_drugs", 200),
        "indications": top_values("indications", 100),
    }

@st.cache_data
def load_test_cases():
    path = OUT_DIR / "test_cases.csv"
    if not path.exists():
        return None
    return pd.read_csv(path, dtype=str).fillna("")

@st.cache_data
def load_sider_validation():
    path = OUT_DIR / "sider_validation.csv"
    if not path.exists():
        return None
    return pd.read_csv(path)

@st.cache_data
def load_sider_db():
    raw = ROOT / "data" / "raw"
    dn_path = raw / "sider_drug_names.tsv"
    se_path = raw / "sider_meddra_all_se.tsv"
    if not dn_path.exists() or not se_path.exists():
        return {}, {}
    dn = pd.read_csv(dn_path, sep="\t", header=None, names=["stitch_id", "drug_name"])
    name_to_stitch = dict(zip(dn["drug_name"].str.upper().str.strip(), dn["stitch_id"]))
    se = pd.read_csv(se_path, sep="\t", header=None,
                     names=["stitch_flat", "stitch_stereo", "umls_se",
                            "meddra_type", "umls_meddra", "side_effect"])
    se_pt = se[se["meddra_type"] == "PT"].copy()
    se_pt["side_effect"] = se_pt["side_effect"].str.strip().str.title()
    from collections import defaultdict
    sider_effects = defaultdict(set)
    for stitch, eff in zip(se_pt["stitch_flat"], se_pt["side_effect"]):
        sider_effects[stitch].add(eff)
    return name_to_stitch, dict(sider_effects)

SALT_SUFFIXES = [" HYDROCHLORIDE", " SODIUM", " POTASSIUM", " CALCIUM",
                 " MESYLATE", " MALEATE", " TARTRATE", " FUMARATE",
                 " ACETATE", " SULFATE", " CITRATE", " BESYLATE", " SUCCINATE"]

def map_drug_to_sider(drug_name, name_to_stitch):
    d = drug_name.upper().strip()
    sid = name_to_stitch.get(d)
    if sid:
        return sid
    for suf in SALT_SUFFIXES:
        if d.endswith(suf):
            sid = name_to_stitch.get(d[:-len(suf)].strip())
            if sid:
                return sid
    return None

def predict(model, tokenizer, label_names, thresholds,
            drug, age, sex, weight, other_drugs, indications,
            ensemble=None):
    sex_code = {"Masculino": "M", "Femenino": "F", "No especificado": None}[sex]
    text = build_patient_text(
        age_years=age,
        sex=sex_code,
        weight_kg=weight if weight else None,
        drugs=drug,
        other_drugs="|".join(other_drugs),
        indications="|".join(indications),
    )

    per_model_probs = None
    if ensemble is not None:
        probs, per_model_probs = ensemble.predict_proba(
            drug, age, sex, weight, other_drugs, indications)
        if ensemble.ensemble_thresholds is not None:
            thresholds = ensemble.ensemble_thresholds
    else:
        enc = tokenizer(text, return_tensors="pt", truncation=True,
                        max_length=MAX_LEN, padding="max_length").to(DEVICE)
        with torch.no_grad():
            logits = model(enc["input_ids"], enc["attention_mask"])
            probs = torch.sigmoid(logits).cpu().numpy()[0]

    results = [
        {"effect": label_names[i], "probability": float(probs[i]),
         "predicted": probs[i] >= thresholds[i]}
        for i in range(len(label_names))
    ]
    results.sort(key=lambda x: x["probability"], reverse=True)
    return results, text, per_model_probs


st.set_page_config(page_title="FarmApp - Prediccion de Efectos Adversos", layout="wide")

st.title("Sistema de Prediccion de Efectos Adversos")
st.caption("BioBERT fine-tuned sobre FDA FAERS · Proyecto de Mineria de Texto y Aprendizaje Automatico")

with st.spinner("Cargando modelo..."):
    model, tokenizer, label_names, thresholds = load_model()
    vocab = get_vocab()
    ensemble = load_ensemble()


tab_pred, tab_perf = st.tabs([
    "Predecir efectos adversos",
    "Rendimiento del modelo",
])

with tab_pred:
    st.markdown("Cargar los datos del paciente y presionar **Predecir**.")

    c1, c2 = st.columns(2)
    with c1:
        drug_select = st.selectbox(
            "Farmaco sospechoso",
            options=[""] + vocab["drugs"] + ["Otro (escribir abajo)"])
        drug_custom = st.text_input(
            "Nombre del farmaco (si elegiste 'Otro')",
            placeholder="ej: ATORVASTATIN")
        age_input = st.slider("Edad (anos)", 0, 100, 55)
        sex_input = st.selectbox("Sexo", ["No especificado", "Masculino", "Femenino"])
        weight_input = st.number_input("Peso (kg, 0 = desconocido)", 0, 300, 0)
    with c2:
        other_drugs_input = st.multiselect(
            "Medicaciones previas / concomitantes", options=vocab["other_drugs"])
        indications_input = st.multiselect(
            "Indicaciones (motivo del tratamiento)", options=vocab["indications"])
        indication_free = st.text_input(
            "Otra indicacion (opcional)",
            placeholder="ej: Type 2 Diabetes Mellitus")
    predict_btn = st.button("Predecir efectos adversos",
                            type="primary", use_container_width=True)

    if drug_select == "Otro (escribir abajo)":
        drug_input = drug_custom.upper().strip()
    else:
        drug_input = drug_select

    if indication_free.strip():
        indications_input = indications_input + [indication_free.strip().title()]

    if predict_btn and drug_input:
        PROB_FLOOR = 0.15
        MIN_RESULTS = 5

        if ensemble is not None and ensemble.ensemble_thresholds is not None:
            base_thresholds = ensemble.ensemble_thresholds
        else:
            base_thresholds = thresholds
        effective_thresholds = np.minimum(base_thresholds, PROB_FLOOR)

        with st.spinner("Analizando..."):
            results, input_text, per_model_probs = predict(
                model, tokenizer, label_names, effective_thresholds,
                drug_input, age_input, sex_input, weight_input,
                other_drugs_input, indications_input,
                ensemble=ensemble)

        predicted = [r for r in results if r["predicted"]]
        if len(predicted) < MIN_RESULTS:
            for i, r in enumerate(results[:MIN_RESULTS]):
                r["predicted"] = True
            predicted = results[:MIN_RESULTS]

        if ensemble is not None:
            active = []
            if ensemble.has_rf_tfidf:     active.append("RF+TF-IDF")
            if ensemble.has_rf_biobert:   active.append("RF+BioBERT")
            if ensemble.has_lsa_rf:       active.append("LSA+RF")
            if ensemble.has_biobert_ft:   active.append("BioBERT fine-tuned")
            extras = []
            if ensemble.ensemble_thresholds is not None:
                extras.append("umbrales K-Fold")
            if ensemble.faers_prior is not None:
                extras.append("prior FAERS")
            extra_str = (" + " + " + ".join(extras)) if extras else ""
            st.caption(f"Modo ensemble activo: {' + '.join(active)}{extra_str}")

        st.markdown("---")
        c1, c2, c3 = st.columns(3)
        c1.metric("Farmaco", drug_input)
        c2.metric("Efectos predichos", len(predicted))
        c3.metric("Probabilidad maxima", f"{results[0]['probability']:.1%}")

        col_a, col_b = st.columns([3, 2])
        with col_a:
            st.subheader("Efectos adversos predichos")
            if predicted:
                pred_df = pd.DataFrame(predicted)[["effect", "probability"]]
                pred_df["effect"] = pred_df["effect"].apply(translate_effect)
                pred_df["probability"] = pred_df["probability"].map("{:.1%}".format)
                pred_df.columns = ["Efecto adverso", "Probabilidad"]
                st.dataframe(pred_df, use_container_width=True, hide_index=True)
            else:
                st.info("No se predijeron efectos con la sensibilidad actual.")
        with col_b:
            st.subheader("Top 15 probabilidades")
            top15 = results[:15]
            fig = go.Figure(go.Bar(
                x=[r["probability"] for r in top15],
                y=[translate_effect(r["effect"]) for r in top15],
                orientation="h",
                marker_color=["#e74c3c" if r["predicted"] else "#bdc3c7" for r in top15],
                text=[f"{r['probability']:.1%}" for r in top15],
                textposition="outside",
            ))
            fig.update_layout(height=450, margin=dict(l=0, r=40, t=10, b=10),
                              xaxis_title="Probabilidad",
                              yaxis=dict(autorange="reversed"), showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
            st.caption("Rojo = pasa el umbral. Gris = no pasa.")

        with st.expander("Ver el texto exacto que recibio el modelo"):
            st.code(input_text)

        st.markdown("---")
        st.subheader(f"¿Que tan bien predijo el modelo para '{drug_input}'?")
        st.caption("Comparamos las predicciones contra SIDER 4.1 (base independiente "
                   "curada desde prospectos). SIDER es la 'verdad de referencia'.")

        name_to_stitch, sider_effects = load_sider_db()
        if not name_to_stitch:
            st.info("Archivos SIDER no encontrados en data/raw/. Para habilitar la "
                    "verificacion, correr una vez `src/validate_sider.py`.")
        else:
            stitch_id = map_drug_to_sider(drug_input, name_to_stitch)
            if not stitch_id:
                st.info(f"'{drug_input}' no esta en SIDER (su base tiene 1.430 "
                        "farmacos). No se puede verificar automaticamente esta prediccion.")
            else:
                known = sider_effects.get(stitch_id, set())
                label_set = set(label_names)
                known_in_vocab = known & label_set
                predicted_set = set(r["effect"] for r in results if r["predicted"])

                if not known_in_vocab:
                    st.info(f"SIDER tiene {len(known)} efectos registrados para "
                            f"'{drug_input}' pero ninguno coincide con las "
                            f"{len(label_names)} etiquetas del modelo.")
                else:
                    tp = predicted_set & known_in_vocab
                    fp = predicted_set - known_in_vocab
                    fn = known_in_vocab - predicted_set

                    precision = len(tp) / len(predicted_set) if predicted_set else 0.0
                    recall    = len(tp) / len(known_in_vocab)
                    f1 = (2 * precision * recall / (precision + recall)
                          if (precision + recall) > 0 else 0.0)
                    accuracy = precision

                    if f1 >= 0.5:
                        color, palabra = "#10b981", "MUY BUENA"
                    elif f1 >= 0.3:
                        color, palabra = "#3b82f6", "BUENA"
                    elif f1 >= 0.15:
                        color, palabra = "#f59e0b", "ACEPTABLE"
                    else:
                        color, palabra = "#ef4444", "POBRE"

                    st.markdown(
                        f"""
                        <div style="background:{color}1a; border-left:5px solid {color};
                                    padding:14px 18px; border-radius:6px; margin-bottom:14px;">
                          <div style="font-size:13px; color:#9ca3af; text-transform:uppercase;
                                      letter-spacing:1px; margin-bottom:6px;">Veredicto</div>
                          <div style="font-size:22px; font-weight:700; color:{color};">
                            Calidad de la prediccion: {palabra}
                          </div>
                          <div style="font-size:14px; color:#d1d5db; margin-top:8px;">
                            De los <b>{len(predicted_set)} efectos</b> que el modelo predijo,
                            <b>{len(tp)}</b> estan confirmados por SIDER. SIDER tiene
                            <b>{len(known_in_vocab)} efectos</b> documentados para este
                            farmaco (dentro del vocabulario del modelo), de los cuales
                            el modelo <b>identifico {len(tp)}</b>.
                          </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                    k1, k2, k3, k4 = st.columns(4)
                    k1.metric("Precision", f"{precision:.0%}",
                              help="De lo que predijo, cuanto esta en SIDER")
                    k2.metric("Recall", f"{recall:.0%}",
                              help="De lo que SIDER conoce, cuanto detecto el modelo")
                    k3.metric("F1", f"{f1:.2f}",
                              help="Promedio armonico de precision y recall")
                    k4.metric("Aciertos / Total predicho",
                              f"{len(tp)} / {len(predicted_set)}")

                    rows = []
                    for r in predicted:
                        eff = r["effect"]
                        rows.append({
                            "Efecto predicho": translate_effect(eff),
                            "Probabilidad": f"{r['probability']:.1%}",
                            "¿En SIDER?": "Confirmado" if eff in known_in_vocab else "Sin respaldo",
                        })
                    st.markdown("**Cada efecto predicho vs SIDER**")
                    st.dataframe(pd.DataFrame(rows),
                                 use_container_width=True, hide_index=True)

                    if fn:
                        with st.expander(
                            f"Efectos que SIDER conoce y el modelo NO predijo "
                            f"({len(fn)})"):
                            missed_rows = sorted(
                                [{"Efecto": translate_effect(r["effect"]),
                                  "Probabilidad del modelo": f"{r['probability']:.1%}",
                                  "_p": r["probability"]}
                                 for r in results if r["effect"] in fn],
                                key=lambda x: -x["_p"]
                            )
                            for m in missed_rows:
                                m.pop("_p")
                            st.dataframe(pd.DataFrame(missed_rows),
                                         use_container_width=True, hide_index=True)
                            st.caption("Estos efectos estan documentados pero el modelo "
                                       "les asigno probabilidad mas baja. Aumentar 'cantidad "
                                       "de efectos a predecir' los puede incluir.")

                    with st.expander(
                        f"Ver todos los efectos que SIDER conoce para '{drug_input}' "
                        f"({len(known)} en total)"):
                        all_sider = pd.DataFrame({
                            "Efecto (MedDRA)": sorted(known),
                            "¿En etiquetas del modelo?": [
                                "Si" if e in label_set else "No"
                                for e in sorted(known)
                            ],
                        })
                        st.dataframe(all_sider, use_container_width=True,
                                     hide_index=True, height=300)

    elif predict_btn and not drug_input:
        st.warning("Seleccionar o escribir un farmaco antes de predecir.")



with tab_perf:
    st.markdown(
        "Como le fue al modelo. Todas las metricas provienen de evaluarlo sobre el "
        "**30% de test** (los casos que el modelo nunca vio durante el entrenamiento). "
        "El split 70/30 usa semilla 42 y se aplica antes de cualquier transformacion "
        "para evitar data leakage."
    )

    split_total = 55000
    train_n = int(split_total * 0.70)
    test_n  = split_total - train_n
    fig_split = go.Figure(go.Bar(
        x=[train_n, test_n], y=["Entrenamiento (70%)", "Test (30%)"],
        orientation="h",
        marker_color=["#3498db", "#e74c3c"],
        text=[f"{train_n:,} casos", f"{test_n:,} casos"],
        textposition="inside",
    ))
    fig_split.update_layout(height=130, margin=dict(l=0, r=0, t=0, b=0),
                            showlegend=False, xaxis_visible=False)
    st.plotly_chart(fig_split, use_container_width=True)

    st.subheader("Metricas del modelo final (BioBERT fine-tuned)")
    st.caption("Fuente: evaluacion sobre test set en `src/train.py` + `src/eval_test_cases.py`")
    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("F1 macro",   "0.1283")
    m2.metric("F1 micro",   "0.1063")
    m3.metric("F1 samples", "0.0980")
    m4.metric("Precision",  "0.1064")
    m5.metric("Recall",     "0.3878")

    st.info(
        "**Como leer estos numeros.** **F1 macro** promedia el F1 de cada una de las "
        "97 etiquetas por igual: penaliza ignorar etiquetas raras. **F1 micro** mira "
        "los aciertos globales sin importar la etiqueta. **F1 samples** promedia el "
        "F1 por paciente. **Recall ~0.39** = el modelo detecta cerca del 39% de las "
        "reacciones reales reportadas. **Precision ~0.11** = de cada 10 efectos que "
        "predice, ~1 esta en el reporte real (los demas pueden ser efectos plausibles "
        "que el paciente no llego a reportar, no necesariamente errores)."
    )

    st.subheader("Comparativa de los cuatro modelos entrenados")
    st.caption("Fuente: scripts `train_baseline.py`, `train_rf_biobert.py`, "
               "`naive_bayes_baseline.py` y `train.py`. Mismo split 70/30, semilla 42.")
    comp = pd.DataFrame({
        "Modelo": [
            "Naive Bayes (BernoulliNB) + TF-IDF",
            "Random Forest + TF-IDF",
            "Random Forest + BioBERT embeddings",
            "BioBERT fine-tuned (15 epocas)",
        ],
        "F1 macro":  [0.05,   0.1070, 0.1296, 0.1283],
        "F1 micro":  [0.08,   0.1039, 0.1498, 0.1063],
        "Precision": [0.04,   0.0636, 0.0990, 0.1064],
        "Recall":    [0.45,   0.4669, 0.2096, 0.3878],
    })
    st.dataframe(comp, use_container_width=True, hide_index=True)

    fig_cmp = go.Figure()
    fig_cmp.add_trace(go.Bar(name="F1 macro", x=comp["Modelo"], y=comp["F1 macro"],
                              marker_color="#3498db",
                              text=comp["F1 macro"].map("{:.3f}".format),
                              textposition="outside"))
    fig_cmp.add_trace(go.Bar(name="F1 micro", x=comp["Modelo"], y=comp["F1 micro"],
                              marker_color="#2ecc71",
                              text=comp["F1 micro"].map("{:.3f}".format),
                              textposition="outside"))
    fig_cmp.update_layout(height=400, barmode="group", yaxis_title="F1",
                          margin=dict(l=0, r=0, t=10, b=0),
                          legend=dict(orientation="h", y=1.1))
    st.plotly_chart(fig_cmp, use_container_width=True)
    st.info(
        "**Lectura.** Cambiar la representacion (TF-IDF -> embeddings BioBERT) sube "
        "el F1 de manera consistente sobre el mismo Random Forest: la mejora viene "
        "de **como** se representa el texto, no del algoritmo. El fine-tuning de "
        "BioBERT mejora precision a costa de recall respecto a RF+BioBERT."
    )

    st.subheader("Como le fue caso por caso (test 30%)")
    st.caption("Fuente: outputs/test_cases.csv (generado por `src/eval_test_cases.py`)")
    tc = load_test_cases()
    if tc is None:
        st.warning("Falta outputs/test_cases.csv. Generar con `src/eval_test_cases.py`.")
    else:
        tcn = tc.copy()
        tcn["n_aciertos"] = pd.to_numeric(tcn["n_aciertos"])
        for col in ["aciertos_TP", "no_detectadas_FN", "falsos_positivos_FP"]:
            if col in tcn.columns:
                tcn[col + "_n"] = tcn[col].apply(lambda s: 0 if not s else len(s.split("|")))

        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Casos de test", f"{len(tcn):,}")
        k2.metric("Con al menos 1 acierto", f"{(tcn['n_aciertos'] > 0).mean():.1%}")
        if "aciertos_TP_n" in tcn:
            k3.metric("TP promedio por caso", f"{tcn['aciertos_TP_n'].mean():.2f}")
        if "falsos_positivos_FP_n" in tcn:
            k4.metric("FP promedio por caso", f"{tcn['falsos_positivos_FP_n'].mean():.2f}")

        dist = tcn["n_aciertos"].value_counts().sort_index()
        fig_hits = go.Figure(go.Bar(
            x=[f"{int(k)} aciertos" for k in dist.index],
            y=dist.values, marker_color="#3498db",
            text=dist.values, textposition="outside",
        ))
        fig_hits.update_layout(height=320, yaxis_title="Cantidad de casos",
                                margin=dict(l=0, r=0, t=20, b=0), showlegend=False,
                                title="Distribucion de aciertos por caso")
        st.plotly_chart(fig_hits, use_container_width=True)

        with st.expander("Ver casos reales del test set (con filtros y detalle)"):
            f1c, f2c = st.columns([2, 1])
            drugs_test = sorted({d for row in tc["farmaco"] for d in row.split("|") if d})
            drug_filter = f1c.selectbox("Filtrar por farmaco",
                                         ["(todos)"] + drugs_test, key="tf_drug")
            only_hits = f2c.checkbox("Solo casos con al menos 1 acierto",
                                      value=False, key="tf_hits")

            view = tcn
            if drug_filter != "(todos)":
                view = view[view["farmaco"].str.contains(drug_filter, regex=False)]
            if only_hits:
                view = view[view["n_aciertos"] > 0]

            def tr_pipe(s):
                return "|".join(translate_effect(e) for e in s.split("|")) if s else s

            view_show = view.copy()
            view_show["reacciones_reales"] = view_show["reacciones_reales"].apply(tr_pipe)
            view_show["reacciones_predichas"] = view_show["reacciones_predichas"].apply(tr_pipe)

            st.dataframe(
                view_show[["primaryid", "edad", "sexo", "peso_kg", "farmaco",
                           "reacciones_reales", "reacciones_predichas", "n_aciertos"]],
                use_container_width=True, hide_index=True, height=320,
            )

            st.markdown("**Detalle de un caso**")
            case_id = st.selectbox("Elegir caso (primaryid)",
                                    view["primaryid"].tolist(), key="case_pick")
            if case_id:
                row = tc[tc["primaryid"] == case_id].iloc[0]
                st.markdown(
                    f"**Paciente:** edad {row['edad'] or '?'} · sexo {row['sexo'] or '?'} · "
                    f"peso {row['peso_kg'] or '?'} kg  \n"
                    f"**Farmaco sospechoso:** {row['farmaco']}  \n"
                    f"**Medicaciones previas:** {row['medicaciones_previas'] or '—'}  \n"
                    f"**Indicaciones:** {row['indicaciones'] or '—'}"
                )
                d1, d2, d3 = st.columns(3)
                with d1:
                    st.markdown("**Aciertos (TP)**")
                    tp_l = row["aciertos_TP"].split("|") if row["aciertos_TP"] else []
                    for e in tp_l:
                        st.markdown(f"- {translate_effect(e)}")
                    if not tp_l:
                        st.caption("Ninguno")
                with d2:
                    st.markdown("**No detectadas (FN)**")
                    fn_l = row["no_detectadas_FN"].split("|") if row["no_detectadas_FN"] else []
                    for e in fn_l:
                        st.markdown(f"- {translate_effect(e)}")
                    if not fn_l:
                        st.caption("Ninguna")
                with d3:
                    st.markdown("**Predichas de mas (FP)**")
                    fp_l = row["falsos_positivos_FP"].split("|") if row["falsos_positivos_FP"] else []
                    for e in fp_l:
                        st.markdown(f"- {translate_effect(e)}")
                    if not fp_l:
                        st.caption("Ninguna")

    st.subheader("Validacion externa contra SIDER 4.1")
    st.caption("Fuente: outputs/sider_validation.csv (generado por `src/validate_sider.py`). "
               "SIDER es una base independiente curada manualmente desde prospectos.")
    sv = load_sider_validation()
    if sv is None:
        st.info("Sin datos de SIDER. Para generarlos correr `src/validate_sider.py`.")
    else:
        valid = sv.dropna(subset=["f1_vs_sider"]) if "f1_vs_sider" in sv.columns else sv
        s1, s2, s3 = st.columns(3)
        s1.metric("Farmacos evaluados", f"{len(sv)}")
        if len(valid) > 0:
            s2.metric("F1 medio vs SIDER", f"{valid['f1_vs_sider'].mean():.3f}")
            s3.metric("Precision media", f"{valid['precision_vs_sider'].mean():.3f}")
        with st.expander("Ver tabla completa de validacion SIDER"):
            st.dataframe(sv, use_container_width=True, hide_index=True, height=280)
        st.info(
            "Comparar contra SIDER prueba que el modelo aprendio relaciones "
            "farmaco -> efecto reales y no artefactos del dataset FAERS: SIDER y "
            "FAERS son fuentes independientes."
        )
