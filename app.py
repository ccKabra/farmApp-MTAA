"""
Demo: Prediccion de efectos adversos de farmacos
Ejecutar: venv\Scripts\streamlit run app.py
"""

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

DATA_DIR = ROOT / "data" / "processed"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

@st.cache_resource
def load_model():
    return load_finetuned_model()

@st.cache_data
def get_vocab():
    """Vocabularios del dataset de entrenamiento para poblar el formulario."""
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

def predict(model, tokenizer, label_names, thresholds,
            drug, age, sex, weight, other_drugs, indications):
    sex_code = {"Masculino": "M", "Femenino": "F", "No especificado": None}[sex]
    # MISMA representacion del paciente que en entrenamiento (patient_text.py)
    text = build_patient_text(
        age_years=age,
        sex=sex_code,
        weight_kg=weight if weight else None,
        drugs=drug,
        other_drugs="|".join(other_drugs),
        indications="|".join(indications),
    )
    enc = tokenizer(text, return_tensors="pt", truncation=True,
                    max_length=MAX_LEN, padding="max_length").to(DEVICE)
    with torch.no_grad():
        logits = model(enc["input_ids"], enc["attention_mask"])
        probs = torch.sigmoid(logits).cpu().numpy()[0]
    results = [
        {"effect": label_names[i], "probability": float(probs[i]), "predicted": probs[i] >= thresholds[i]}
        for i in range(len(label_names))
    ]
    results.sort(key=lambda x: x["probability"], reverse=True)
    return results, text

# ── UI ────────────────────────────────────────────────────────────────────────
st.set_page_config(page_title="FarmApp - Prediccion de Efectos Adversos",
                   page_icon="💊", layout="wide")

st.title("💊 Sistema de Prediccion de Efectos Adversos")
st.caption("Modelo BioBERT fine-tuned sobre FDA FAERS Q1 2026 — Proyecto Mineria de Texto y Aprendizaje Automatico")

with st.spinner("Cargando modelo BioBERT..."):
    model, tokenizer, label_names, thresholds = load_model()
    vocab = get_vocab()

st.success(f"Modelo listo | {len(label_names)} efectos adversos | Device: {DEVICE.upper()}")

@st.cache_data
def load_test_cases():
    path = ROOT / "outputs" / "test_cases.csv"
    if not path.exists():
        return None
    return pd.read_csv(path, dtype=str).fillna("")

tab_pred, tab_test = st.tabs(["🔮 Predecir paciente nuevo", "📋 Casos reales de test (30%)"])

# ── Sidebar: mismos atributos con los que se entreno el modelo ────────────────
st.sidebar.header("Datos del paciente")

drug_input = st.sidebar.selectbox("Farmaco sospechoso", options=[""] + vocab["drugs"] + ["Otro (escribir abajo)"])
if drug_input == "Otro (escribir abajo)":
    drug_input = st.sidebar.text_input("Nombre del farmaco (ingrediente activo)").upper()

age_input = st.sidebar.slider("Edad (anos)", min_value=0, max_value=100, value=55)
sex_input = st.sidebar.selectbox("Sexo", ["No especificado", "Masculino", "Femenino"])
weight_input = st.sidebar.number_input("Peso (kg, 0 = desconocido)", min_value=0, max_value=300, value=0)
other_drugs_input = st.sidebar.multiselect(
    "Medicaciones previas / concomitantes", options=vocab["other_drugs"])
indications_input = st.sidebar.multiselect(
    "Indicaciones (motivo del tratamiento)", options=vocab["indications"])
indication_free = st.sidebar.text_input("Otra indicacion (opcional)",
                                        placeholder="ej: Type 2 Diabetes Mellitus")
if indication_free.strip():
    indications_input = indications_input + [indication_free.strip().title()]

predict_btn = st.sidebar.button("Predecir efectos adversos", type="primary")

# ── Pestania 1: Prediccion ────────────────────────────────────────────────────
with tab_pred:
    if predict_btn and drug_input:
        with st.spinner("Analizando..."):
            results, input_text = predict(model, tokenizer, label_names, thresholds,
                                           drug_input, age_input, sex_input, weight_input,
                                           other_drugs_input, indications_input)

        predicted = [r for r in results if r["predicted"]]

        col1, col2, col3 = st.columns(3)
        col1.metric("Farmaco", drug_input)
        col2.metric("Efectos adversos predichos", len(predicted))
        col3.metric("Confianza maxima", f"{results[0]['probability']:.1%}")

        st.markdown("---")
        col_a, col_b = st.columns([3, 2])

        with col_a:
            st.subheader("Efectos adversos predichos")
            if predicted:
                pred_df = pd.DataFrame(predicted)[["effect", "probability"]]
                pred_df["probability"] = pred_df["probability"].map("{:.1%}".format)
                pred_df.columns = ["Efecto adverso", "Probabilidad"]
                st.dataframe(pred_df, use_container_width=True, hide_index=True)
            else:
                st.info("No se predijeron efectos adversos con los umbrales actuales.")

        with col_b:
            st.subheader("Top 15 probabilidades")
            top15 = results[:15]
            fig = go.Figure(go.Bar(
                x=[r["probability"] for r in top15],
                y=[r["effect"] for r in top15],
                orientation="h",
                marker_color=["#e74c3c" if r["predicted"] else "#3498db" for r in top15],
                text=[f"{r['probability']:.1%}" for r in top15],
                textposition="outside"
            ))
            fig.update_layout(
                height=450, margin=dict(l=0, r=40, t=10, b=10),
                xaxis_title="Probabilidad", yaxis=dict(autorange="reversed"),
                showlegend=False
            )
            st.plotly_chart(fig, use_container_width=True)

        with st.expander("Texto de entrada al modelo"):
            st.code(input_text)

        with st.expander("Tabla completa de probabilidades"):
            all_df = pd.DataFrame(results)[["effect", "probability", "predicted"]]
            all_df["probability"] = all_df["probability"].map("{:.3f}".format)
            all_df.columns = ["Efecto adverso", "Probabilidad", "Predicho"]
            st.dataframe(all_df, use_container_width=True, hide_index=True)

    elif predict_btn and not drug_input:
        st.warning("Por favor selecciona o escribe un farmaco.")
    else:
        st.info("Selecciona un farmaco y presiona 'Predecir efectos adversos' para comenzar.")

# ── Pestania 2: Casos reales de test (30% nunca visto por el modelo) ─────────
with tab_test:
    tc = load_test_cases()
    if tc is None:
        st.warning("No existe outputs/test_cases.csv. Generarlo con: venv\\Scripts\\python.exe src\\eval_test_cases.py")
    else:
        st.markdown(
            "Estos casos son el **30% de test** (mismo split 70/30, semilla 42, "
            "que se uso para entrenar): el modelo **nunca los vio**. Para cada paciente "
            "real de FAERS se muestran las reacciones reportadas vs. las predichas."
        )

        tc_num = tc.copy()
        tc_num["n_aciertos"] = pd.to_numeric(tc_num["n_aciertos"])
        c1, c2, c3 = st.columns(3)
        c1.metric("Casos de test", f"{len(tc):,}")
        c2.metric("Con al menos 1 acierto", f"{(tc_num['n_aciertos'] > 0).mean():.1%}")
        c3.metric("Split", "70% train / 30% test")

        # Filtros
        fcol1, fcol2 = st.columns([2, 1])
        all_drugs_test = sorted({d for row in tc["farmaco"] for d in row.split("|") if d})
        drug_filter = fcol1.selectbox("Filtrar por farmaco", ["(todos)"] + all_drugs_test)
        only_hits = fcol2.checkbox("Solo casos con aciertos", value=False)

        view = tc_num
        if drug_filter != "(todos)":
            view = view[view["farmaco"].str.contains(drug_filter, regex=False)]
        if only_hits:
            view = view[view["n_aciertos"] > 0]

        st.dataframe(
            view[["primaryid", "edad", "sexo", "peso_kg", "farmaco",
                  "medicaciones_previas", "indicaciones",
                  "reacciones_reales", "reacciones_predichas", "n_aciertos"]],
            use_container_width=True, hide_index=True, height=350
        )

        # Detalle de un caso
        st.markdown("### Detalle de un caso")
        case_id = st.selectbox("Elegir caso (primaryid)", view["primaryid"].tolist())
        if case_id:
            row = tc[tc["primaryid"] == case_id].iloc[0]
            st.markdown(
                f"**Paciente:** edad {row['edad'] or '?'} | sexo {row['sexo'] or '?'} | "
                f"peso {row['peso_kg'] or '?'} kg  \n"
                f"**Farmaco sospechoso:** {row['farmaco']}  \n"
                f"**Medicaciones previas:** {row['medicaciones_previas'] or '—'}  \n"
                f"**Indicaciones:** {row['indicaciones'] or '—'}"
            )
            d1, d2, d3 = st.columns(3)
            with d1:
                st.markdown("#### ✅ Aciertos (TP)")
                for e in (row["aciertos_TP"].split("|") if row["aciertos_TP"] else []):
                    st.markdown(f"- {e}")
                if not row["aciertos_TP"]:
                    st.caption("Ninguno")
            with d2:
                st.markdown("#### ❌ No detectadas (FN)")
                for e in (row["no_detectadas_FN"].split("|") if row["no_detectadas_FN"] else []):
                    st.markdown(f"- {e}")
                if not row["no_detectadas_FN"]:
                    st.caption("Ninguna")
            with d3:
                st.markdown("#### ⚠️ Predichas de mas (FP)")
                for e in (row["falsos_positivos_FP"].split("|") if row["falsos_positivos_FP"] else []):
                    st.markdown(f"- {e}")
                if not row["falsos_positivos_FP"]:
                    st.caption("Ninguna")
