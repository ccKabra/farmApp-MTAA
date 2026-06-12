"""Smoke test: prediccion end-to-end con perfiles de paciente distintos."""
import torch
from model import load_finetuned_model
from patient_text import build_patient_text, MAX_LEN
from config import DEVICE

model, tok, labels, th = load_finetuned_model()

def pred(**kw):
    text = build_patient_text(**kw)
    enc = tok(text, return_tensors="pt", truncation=True,
              max_length=MAX_LEN, padding="max_length").to(DEVICE)
    with torch.no_grad():
        probs = torch.sigmoid(model(enc["input_ids"], enc["attention_mask"])).cpu().numpy()[0]
    top = sorted(zip(labels, probs, th), key=lambda x: -x[1])[:10]
    n_pred = sum(1 for l, p, t in zip(labels, probs, th) if p >= t)
    print(text)
    print(f"  [{n_pred} efectos predichos]")
    for l, p, t in top:
        print(f"   {l:<34} p={p:.3f} pred={p >= t}")
    print()

pred(age_years=72, sex="F", weight_kg=82, drugs="GABAPENTIN",
     other_drugs="TRAMADOL", indications="Pain")
pred(age_years=25, sex="M", drugs="ADALIMUMAB",
     other_drugs="METHOTREXATE|PREDNISONE", indications="Crohn'S Disease")
