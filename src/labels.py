from collections import Counter
from config import MIN_REACTION_FREQ

NON_ADR_LABELS = {

    "Inappropriate Schedule Of Product Administration",
    "Incorrect Dose Administered",
    "Product Dose Omission Issue",
    "Drug Dose Omission By Device",
    "Wrong Technique In Product Usage Process",
    "Overdose",
    "Accidental Exposure To Product",

    "Device Breakage",
    "Device Issue",
    "Product Storage Error",
    "Product Use Issue",
    "Product Use In Unapproved Indication",
    "Off Label Use",

    "Drug Ineffective",
    "Therapeutic Product Effect Incomplete",
    "Therapy Interrupted",
    "No Adverse Event",

    "Maternal Exposure During Pregnancy",

    "Hospitalisation",
    "Illness",
    "General Physical Health Deterioration",
    "Condition Aggravated",
    "Toxicity To Various Agents",
}

def build_label_vocab(df):
    all_reac = [r for row in df["reactions"].dropna() for r in row.split("|")]
    freq_reac = {
        r for r, n in Counter(all_reac).items()
        if n >= MIN_REACTION_FREQ and r not in NON_ADR_LABELS
    }

    df = df.copy()
    df["reaction_list"] = df["reactions"].apply(
        lambda s: [r for r in s.split("|") if r in freq_reac] if isinstance(s, str) else []
    )
    df = df[df["reaction_list"].apply(len) > 0].reset_index(drop=True)
    return df, sorted(freq_reac)
