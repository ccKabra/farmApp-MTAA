import pandas as pd

MAX_LEN = 160

def build_patient_text(age_years=None, sex=None, weight_kg=None,
                       drugs="", other_drugs="", indications=""):
    age = f"age {int(float(age_years))} years" if pd.notna(age_years) else "age unknown"
    sex_str = {"M": "sex male", "F": "sex female"}.get(
        str(sex).strip().upper() if pd.notna(sex) else "", "sex unknown")
    wt = f"weight {int(float(weight_kg))} kg" if pd.notna(weight_kg) else "weight unknown"

    def clean(s, max_chars):
        if pd.isna(s) or not str(s).strip():
            return "unknown"
        return str(s).replace("|", ", ").strip()[:max_chars]

    return (
        f"patient: {age}, {sex_str}, {wt}. "
        f"drug: {clean(drugs, 120)}. "
        f"other medications: {clean(other_drugs, 150)}. "
        f"indication: {clean(indications, 200)}"
    )

def row_to_text(row):

    return build_patient_text(
        age_years=row.get("age_years"),
        sex=row.get("sex"),
        weight_kg=row.get("weight_kg"),
        drugs=row.get("drug"),
        other_drugs=row.get("other_drugs"),
        indications=row.get("indications"),
    )
