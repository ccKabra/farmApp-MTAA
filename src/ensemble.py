import pickle
import numpy as np
import pandas as pd
import torch
from pathlib import Path
from collections import Counter
from transformers import AutoTokenizer, AutoModel

from config import DATA_PROCESSED, MODELS_DIR, BIOBERT_MODEL, DEVICE
from model import BioBERTClassifier
from patient_text import build_patient_text, MAX_LEN

SALT_SUFFIXES = [" HYDROCHLORIDE", " SODIUM", " POTASSIUM", " CALCIUM",
                 " MESYLATE", " MALEATE", " TARTRATE", " FUMARATE",
                 " ACETATE", " SULFATE", " CITRATE", " BESYLATE", " SUCCINATE"]


def normalize_drug(name):
    n = name.upper().strip()
    for suf in SALT_SUFFIXES:
        if n.endswith(suf):
            return n[:-len(suf)].strip()
    return n


class EnsemblePredictor:
    def __init__(self):
        self.label_names = None
        self.has_rf_tfidf = False
        self.has_rf_biobert = False
        self.has_biobert_ft = False
        self.has_lsa_rf = False

        baseline_path = MODELS_DIR / "baseline_rf.pkl"
        if baseline_path.exists():
            with open(baseline_path, "rb") as f:
                d = pickle.load(f)
            self.rf_tfidf = d["model"]
            self.label_names = d["label_names"]
            self.rf_tfidf_features = d["feature_names"]
            self.has_rf_tfidf = True
            with open(DATA_PROCESSED / "tfidf.pkl", "rb") as f:
                self.tfidf = pickle.load(f)
            with open(DATA_PROCESSED / "mlb_drug.pkl", "rb") as f:
                self.mlb_drug = pickle.load(f)
            self.known_drugs = set(self.mlb_drug.classes_)

        rfb_path = MODELS_DIR / "rf_biobert.pkl"
        if rfb_path.exists():
            with open(rfb_path, "rb") as f:
                d = pickle.load(f)
            self.rf_biobert = d["model"]
            self.rf_biobert_features = d["feature_names"]
            self.rf_biobert_non_emb_cols = [c for c in self.rf_biobert_features
                                            if not c.startswith("bb_")]
            if self.label_names is None:
                self.label_names = d["label_names"]
            self.has_rf_biobert = True

        lsa_path = MODELS_DIR / "lsa_rf.pkl"
        if lsa_path.exists():
            with open(lsa_path, "rb") as f:
                d = pickle.load(f)
            self.lsa_rf = d["model"]
            self.lsa = d["lsa"]
            self.lsa_tfidf = d["tfidf"]
            self.has_lsa_rf = True

        ft_dir = MODELS_DIR / "biobert_finetuned"
        if ft_dir.exists():
            label_df = pd.read_csv(ft_dir / "label_names.csv")
            self.label_names = label_df["label"].tolist()
            num_labels = len(self.label_names)
            self.ft_tokenizer = AutoTokenizer.from_pretrained(str(ft_dir))
            bert_base = AutoModel.from_pretrained(BIOBERT_MODEL)
            self.ft_model = BioBERTClassifier(bert_base, num_labels).to(DEVICE)
            state = torch.load(ft_dir / "model.pt", map_location=DEVICE)
            self.ft_model.load_state_dict(state)
            self.ft_model.eval()
            self.has_biobert_ft = True

        if self.has_rf_biobert or self.has_lsa_rf or self.has_biobert_ft:
            self.emb_tokenizer = AutoTokenizer.from_pretrained(BIOBERT_MODEL)
            self.emb_model = AutoModel.from_pretrained(BIOBERT_MODEL).to(DEVICE)
            self.emb_model.eval()

        ens_th_path = MODELS_DIR / "ensemble_thresholds.npy"
        if ens_th_path.exists():
            self.ensemble_thresholds = np.load(ens_th_path)
        else:
            self.ensemble_thresholds = None

        self.faers_prior = self._load_faers_prior()

    def _load_faers_prior(self):
        prior_path = MODELS_DIR / "faers_drug_effect_prior.pkl"
        if prior_path.exists():
            with open(prior_path, "rb") as f:
                return pickle.load(f)
        return None

    def _build_text(self, drug, age, sex, weight, other_drugs, indications):
        sex_code = {"Masculino": "M", "Femenino": "F",
                    "No especificado": None}.get(sex, sex)
        return build_patient_text(
            age_years=age, sex=sex_code,
            weight_kg=weight if weight else None,
            drugs=drug,
            other_drugs="|".join(other_drugs) if other_drugs else "",
            indications="|".join(indications) if indications else "",
        )

    def _build_structured(self, cols, drug, age, sex, weight,
                          other_drugs, indications):
        row = pd.Series(0.0, index=cols, dtype=np.float32)

        if "age_norm" in cols:
            row["age_norm"] = float(age) / 100.0 if age is not None else 0.5

        if sex == "Masculino" and "sex_M" in cols:
            row["sex_M"] = 1.0
        elif sex == "Femenino" and "sex_F" in cols:
            row["sex_F"] = 1.0

        norm_drug = normalize_drug(drug)
        drug_col = f"drug_{norm_drug}"
        if drug_col in cols:
            row[drug_col] = 1.0
        elif "drug_OTHER" in cols:
            row["drug_OTHER"] = 1.0
        for od in other_drugs:
            nd = normalize_drug(od)
            c = f"drug_{nd}"
            if c in cols:
                row[c] = 1.0

        has_indi_cols = any(c.startswith("indi_") for c in cols)
        if has_indi_cols and hasattr(self, "tfidf"):
            indi_str = " ".join(indications) if indications else "unknown"
            tfidf_vec = self.tfidf.transform([indi_str]).toarray()[0]
            for i, t in enumerate(self.tfidf.get_feature_names_out()):
                c = f"indi_{t}"
                if c in cols:
                    row[c] = float(tfidf_vec[i])

        return row.values.astype(np.float32)

    def _build_x_rf_tfidf(self, drug, age, sex, weight, other_drugs, indications):
        x = self._build_structured(self.rf_tfidf_features, drug, age, sex,
                                    weight, other_drugs, indications)
        return x.reshape(1, -1)

    def _build_x_rf_biobert(self, emb, drug, age, sex, weight,
                            other_drugs, indications):
        structured = self._build_structured(
            self.rf_biobert_non_emb_cols, drug, age, sex,
            weight, other_drugs, indications)
        full = np.concatenate([structured, emb.reshape(-1)])
        return full.reshape(1, -1)

    def _build_embedding(self, text):
        enc = self.emb_tokenizer(text, return_tensors="pt", truncation=True,
                                  max_length=MAX_LEN, padding="max_length").to(DEVICE)
        with torch.no_grad():
            out = self.emb_model(enc["input_ids"], attention_mask=enc["attention_mask"])
            mask = enc["attention_mask"].unsqueeze(-1).float()
            pooled = (out.last_hidden_state * mask).sum(1) / mask.sum(1)
        return pooled.cpu().numpy()

    def _rf_proba(self, rf_model, X):
        proba_per_label = rf_model.predict_proba(X)
        n_labels = len(proba_per_label)
        out = np.zeros((X.shape[0], n_labels), dtype=np.float32)
        for j, p in enumerate(proba_per_label):
            if p.shape[1] == 2:
                out[:, j] = p[:, 1]
            else:
                out[:, j] = 0.0
        return out

    def predict_proba(self, drug, age, sex, weight, other_drugs, indications):
        probs_per_model = {}

        text = self._build_text(drug, age, sex, weight, other_drugs, indications)

        if self.has_rf_tfidf:
            X = self._build_x_rf_tfidf(drug, age, sex, weight,
                                       other_drugs, indications)
            probs_per_model["rf_tfidf"] = self._rf_proba(self.rf_tfidf, X)[0]

        if self.has_rf_biobert or self.has_biobert_ft or self.has_lsa_rf:
            emb = self._build_embedding(text)

        if self.has_rf_biobert:
            X_rfb = self._build_x_rf_biobert(emb, drug, age, sex, weight,
                                              other_drugs, indications)
            probs_per_model["rf_biobert"] = self._rf_proba(self.rf_biobert, X_rfb)[0]

        if self.has_lsa_rf:
            indi_str = " ".join(indications) if indications else "unknown"
            tfidf_vec = self.lsa_tfidf.transform([indi_str])
            lsa_vec = self.lsa.transform(tfidf_vec)
            probs_per_model["lsa_rf"] = self._rf_proba(self.lsa_rf, lsa_vec)[0]

        if self.has_biobert_ft:
            enc = self.ft_tokenizer(text, return_tensors="pt", truncation=True,
                                     max_length=MAX_LEN,
                                     padding="max_length").to(DEVICE)
            with torch.no_grad():
                logits = self.ft_model(enc["input_ids"], enc["attention_mask"])
                p = torch.sigmoid(logits).cpu().numpy()[0]
            probs_per_model["biobert_ft"] = p

        if not probs_per_model:
            raise RuntimeError("No hay modelos entrenados disponibles.")

        weights = {"rf_tfidf": 1.0, "rf_biobert": 1.5,
                   "lsa_rf": 1.0, "biobert_ft": 2.0}
        weighted_sum = np.zeros(len(self.label_names), dtype=np.float32)
        total_w = 0.0
        for name, p in probs_per_model.items():
            w = weights.get(name, 1.0)
            weighted_sum += w * p
            total_w += w
        avg = weighted_sum / total_w

        if self.faers_prior is not None:
            norm_drug = normalize_drug(drug)
            if norm_drug in self.faers_prior:
                prior_vec = self.faers_prior[norm_drug]
                boost = 1.0 + 0.3 * prior_vec
                avg = np.clip(avg * boost, 0.0, 1.0)

        return avg, probs_per_model
