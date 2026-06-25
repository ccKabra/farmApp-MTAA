import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import f1_score, precision_score, recall_score
from config import DATA_PROCESSED, MODELS_DIR, RANDOM_SEED, TEST_SIZE

print("Cargando dataset...")
df = pd.read_csv(DATA_PROCESSED / "dataset.csv", dtype=str)
Y = pd.read_csv(DATA_PROCESSED / "Y.csv")
label_names = Y.columns.tolist()

df = df.iloc[:len(Y)].reset_index(drop=True)
text_corpus = df["indications"].fillna("unknown").astype(str)
text_corpus = (text_corpus + " " + df["drug"].fillna("").astype(str)).tolist()

train_idx, test_idx = train_test_split(
    np.arange(len(Y)), test_size=TEST_SIZE, random_state=RANDOM_SEED)

print("Construyendo TF-IDF expandido...")
tfidf = TfidfVectorizer(max_features=2000, min_df=3,
                        token_pattern=r"[A-Za-z][A-Za-z ]{2,}")
X_tfidf_train = tfidf.fit_transform([text_corpus[i] for i in train_idx])
X_tfidf_test  = tfidf.transform([text_corpus[i] for i in test_idx])
print(f"TF-IDF shape train: {X_tfidf_train.shape}")

print("Reduciendo dimensionalidad con LSA (TruncatedSVD)...")
lsa = TruncatedSVD(n_components=200, random_state=RANDOM_SEED)
X_lsa_train = lsa.fit_transform(X_tfidf_train)
X_lsa_test  = lsa.transform(X_tfidf_test)
print(f"LSA shape: {X_lsa_train.shape} | Varianza explicada: "
      f"{lsa.explained_variance_ratio_.sum():.3f}")

Y_train = Y.iloc[train_idx]
Y_test  = Y.iloc[test_idx]

print("Entrenando Random Forest sobre features LSA...")
rf = RandomForestClassifier(
    n_estimators=200, max_depth=20, min_samples_leaf=5,
    n_jobs=-1, random_state=RANDOM_SEED, class_weight="balanced")
model = MultiOutputClassifier(rf, n_jobs=-1)
model.fit(X_lsa_train, Y_train)
print("OK.")

Y_pred = model.predict(X_lsa_test)
f1m = f1_score(Y_test, Y_pred, average="macro", zero_division=0)
f1mi = f1_score(Y_test, Y_pred, average="micro", zero_division=0)
prec = precision_score(Y_test, Y_pred, average="macro", zero_division=0)
rec = recall_score(Y_test, Y_pred, average="macro", zero_division=0)

print(f"\n=== LSA + RF ===")
print(f"  F1 macro : {f1m:.4f}")
print(f"  F1 micro : {f1mi:.4f}")
print(f"  Precision: {prec:.4f}")
print(f"  Recall   : {rec:.4f}")

MODELS_DIR.mkdir(parents=True, exist_ok=True)
with open(MODELS_DIR / "lsa_rf.pkl", "wb") as f:
    pickle.dump({"model": model, "lsa": lsa, "tfidf": tfidf,
                 "label_names": label_names}, f)
print(f"\nModelo guardado: {MODELS_DIR / 'lsa_rf.pkl'}")
