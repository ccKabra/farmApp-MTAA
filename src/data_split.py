import pandas as pd
from sklearn.model_selection import train_test_split
from config import DATA_PROCESSED, RANDOM_SEED, TEST_SIZE
from labels import build_label_vocab

def load_split():
    df = pd.read_csv(DATA_PROCESSED / "dataset.csv", dtype=str)
    df["age_years"] = pd.to_numeric(df["age_years"], errors="coerce")
    df["weight_kg"] = pd.to_numeric(df.get("weight_kg"), errors="coerce")

    df, label_names = build_label_vocab(df)

    idx = list(range(len(df)))
    train_idx, test_idx = train_test_split(idx, test_size=TEST_SIZE, random_state=RANDOM_SEED)
    return df, label_names, train_idx, test_idx
