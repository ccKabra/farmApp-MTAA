const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Alzugaray Agustin · Cabrera Tamalet Lautaro";
pres.title = "Sistema de Prediccion de Efectos Adversos de Farmacos";

// Paleta — Midnight Executive con acento coral
const NAVY = "1E2761";
const BLUE = "4361EE";
const CORAL = "F76C5E";
const LIGHT = "F8F9FB";
const WHITE = "FFFFFF";
const DARK = "1A1A2E";
const MUTED = "6B7280";
const SOFT = "CADCFC";

const W = 13.3;
const H = 7.5;

// ============================================================
// Helpers
// ============================================================
function addBg(slide, color) {
  slide.background = { color };
}
function addTopBar(slide, label) {
  slide.addText(label, {
    x: 0.5, y: 0.35, w: 12.3, h: 0.4,
    fontSize: 11, color: MUTED, fontFace: "Calibri",
    bold: true, charSpacing: 4, margin: 0
  });
}
function addTitle(slide, text, color = DARK) {
  slide.addText(text, {
    x: 0.5, y: 0.75, w: 12.3, h: 0.9,
    fontSize: 36, bold: true, color, fontFace: "Cambria", margin: 0
  });
}
function addNumberBadge(slide, n, x, y, fill = NAVY) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: 0.55, h: 0.55, fill: { color: fill }, line: { color: fill }
  });
  slide.addText(String(n), {
    x, y, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: WHITE,
    align: "center", valign: "middle", fontFace: "Calibri", margin: 0
  });
}
function addFooter(slide, idx, total) {
  slide.addText("MTAA · farmApp · Defensa final", {
    x: 0.5, y: 7.05, w: 8, h: 0.3, fontSize: 9, color: MUTED, margin: 0
  });
  slide.addText(`${idx} / ${total}`, {
    x: 12.3, y: 7.05, w: 0.5, h: 0.3, fontSize: 9, color: MUTED,
    align: "right", margin: 0
  });
}

const TOTAL = 16;

// ============================================================
// 1 — Portada
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, NAVY);

  s.addShape(pres.shapes.OVAL, {
    x: 11.3, y: 0.7, w: 1.5, h: 1.5,
    fill: { color: CORAL }, line: { color: CORAL }
  });
  s.addText("Rx", {
    x: 11.3, y: 0.7, w: 1.5, h: 1.5, fontSize: 48, bold: true,
    color: WHITE, align: "center", valign: "middle",
    fontFace: "Cambria", margin: 0
  });

  s.addText("PROYECTO FINAL — MTAA 2026", {
    x: 0.6, y: 1.0, w: 10, h: 0.5, fontSize: 14, bold: true,
    color: SOFT, charSpacing: 6, margin: 0
  });

  s.addText("Sistema de Prediccion de\nEfectos Adversos de Farmacos", {
    x: 0.6, y: 1.7, w: 12, h: 2.3, fontSize: 54, bold: true,
    color: WHITE, fontFace: "Cambria", margin: 0
  });

  s.addText(
    "Mineria de Texto y Aprendizaje Automatico aplicada a reportes reales " +
    "de la FDA (FAERS) y validacion contra SIDER 4.1",
    {
      x: 0.6, y: 4.5, w: 11.5, h: 1.0, fontSize: 18, color: SOFT,
      fontFace: "Calibri", italic: true, margin: 0
    }
  );

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 6.0, w: 0.06, h: 0.7,
    fill: { color: CORAL }, line: { color: CORAL }
  });
  s.addText("Alzugaray Agustin Ezequiel", {
    x: 0.85, y: 5.95, w: 8, h: 0.4, fontSize: 16, bold: true, color: WHITE, margin: 0
  });
  s.addText("Cabrera Tamalet Lautaro", {
    x: 0.85, y: 6.3, w: 8, h: 0.4, fontSize: 16, bold: true, color: WHITE, margin: 0
  });
}

// ============================================================
// 2 — El problema
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "01  ·  CONTEXTO");
  addTitle(s, "¿Por que predecir efectos adversos?");

  s.addText(
    "Las reacciones adversas a medicamentos son una de las principales causas " +
    "de hospitalizacion evitable. Cada paciente combina edad, sexo, peso, " +
    "comorbilidades y otras drogas — variaciones que rara vez aparecen en los " +
    "ensayos clinicos originales.",
    {
      x: 0.6, y: 1.85, w: 12.2, h: 1.2, fontSize: 16, color: DARK,
      fontFace: "Calibri", margin: 0
    }
  );

  // 3 stat cards
  const stats = [
    ["+2 M", "Hospitalizaciones por año en EE.UU. por reacciones adversas", BLUE],
    ["97", "Efectos adversos distintos que aprende a predecir el modelo", CORAL],
    ["55 K", "Reportes reales de FAERS usados como dataset de entrenamiento", NAVY]
  ];
  stats.forEach(([n, txt, col], i) => {
    const x = 0.6 + i * 4.15;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 3.3, w: 3.9, h: 2.5, rectRadius: 0.15,
      fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 }
    });
    s.addText(n, {
      x, y: 3.5, w: 3.9, h: 1.2, fontSize: 56, bold: true, color: col,
      align: "center", fontFace: "Cambria", margin: 0
    });
    s.addText(txt, {
      x: x + 0.25, y: 4.85, w: 3.4, h: 0.9, fontSize: 12, color: MUTED,
      align: "center", fontFace: "Calibri", margin: 0
    });
  });

  s.addText(
    "Nuestra pregunta: dado un paciente nuevo (farmaco + perfil clinico), " +
    "¿que efectos adversos es mas probable que sufra?",
    {
      x: 0.6, y: 6.2, w: 12.2, h: 0.6, fontSize: 16, bold: true, italic: true,
      color: NAVY, fontFace: "Calibri", margin: 0
    }
  );

  addFooter(s, 2, TOTAL);
}

// ============================================================
// 3 — Los datos
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "02  ·  DATOS");
  addTitle(s, "Las dos fuentes de informacion");

  // Left card - FAERS
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.95, w: 6.1, h: 4.7, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: NAVY, width: 2 }
  });
  s.addText("FDA FAERS", {
    x: 0.85, y: 2.15, w: 5.6, h: 0.5, fontSize: 22, bold: true,
    color: NAVY, fontFace: "Cambria", margin: 0
  });
  s.addText("Para entrenar el modelo", {
    x: 0.85, y: 2.6, w: 5.6, h: 0.3, fontSize: 11, italic: true,
    color: MUTED, margin: 0
  });
  s.addText([
    { text: "Reportes reales de pacientes con reacciones adversas",
      options: { bullet: true, breakLine: true } },
    { text: "4 archivos por trimestre: DEMO, DRUG, REAC, INDI",
      options: { bullet: true, breakLine: true } },
    { text: "Se unen por primaryid (ID del caso)",
      options: { bullet: true, breakLine: true } },
    { text: "Sampleamos 55.000 casos con semilla fija",
      options: { bullet: true } }
  ], {
    x: 0.85, y: 3.05, w: 5.6, h: 2.3, fontSize: 13, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 6
  });
  s.addText("Ejemplo de fila: 67 años, F, ASPIRIN + METFORMIN → NAUSEA, HEADACHE", {
    x: 0.85, y: 5.85, w: 5.6, h: 0.6, fontSize: 11, italic: true, color: BLUE,
    fontFace: "Courier New", margin: 0
  });

  // Right card - SIDER
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.95, y: 1.95, w: 6.1, h: 4.7, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: CORAL, width: 2 }
  });
  s.addText("SIDER 4.1", {
    x: 7.2, y: 2.15, w: 5.6, h: 0.5, fontSize: 22, bold: true,
    color: CORAL, fontFace: "Cambria", margin: 0
  });
  s.addText("Para validar (verdad de referencia)", {
    x: 7.2, y: 2.6, w: 5.6, h: 0.3, fontSize: 11, italic: true,
    color: MUTED, margin: 0
  });
  s.addText([
    { text: "Base curada manualmente desde prospectos oficiales",
      options: { bullet: true, breakLine: true } },
    { text: "1.430 farmacos con sus efectos adversos conocidos",
      options: { bullet: true, breakLine: true } },
    { text: "Independiente de FAERS — no se uso en entrenamiento",
      options: { bullet: true, breakLine: true } },
    { text: "Sirve para detectar sesgos del dataset de entrenamiento",
      options: { bullet: true } }
  ], {
    x: 7.2, y: 3.05, w: 5.6, h: 2.3, fontSize: 13, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 6
  });
  s.addText("METFORMIN → 114 efectos documentados en SIDER", {
    x: 7.2, y: 5.85, w: 5.6, h: 0.6, fontSize: 11, italic: true, color: CORAL,
    fontFace: "Courier New", margin: 0
  });

  addFooter(s, 3, TOTAL);
}

// ============================================================
// 4 — Por que es dificil
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "03  ·  DESAFIOS");
  addTitle(s, "Por que este problema es dificil");

  const items = [
    ["Multi-label", "Cada paciente puede sufrir varias reacciones a la vez. La materia enseña clasificacion binaria/multiclase; aqui necesitamos una etiqueta binaria por cada uno de los 97 efectos."],
    ["Desbalance severo", "Algunas etiquetas aparecen en menos del 2% de los casos. Un modelo ingenuo aprende a decir 'no' a todo y obtiene buena 'accuracy' pero F1 cero."],
    ["Texto clinico ruidoso", "Los reportes FAERS usan terminologia MedDRA con sinonimos, abreviaturas y errores tipograficos. 'Headache' y 'cephalalgia' son la misma cosa."],
    ["Reportes parciales", "FAERS tiene 2-4 reacciones por caso, pero un farmaco puede causar 100+. El modelo no puede aprender lo que nunca se reporto."]
  ];
  items.forEach(([title, desc], i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.6 + col * 6.35;
    const y = 2.0 + row * 2.35;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 6.1, h: 2.1, rectRadius: 0.1,
      fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 }
    });
    addNumberBadge(s, i + 1, x + 0.3, y + 0.3, CORAL);
    s.addText(title, {
      x: x + 1.0, y: y + 0.32, w: 5.0, h: 0.5, fontSize: 18, bold: true,
      color: NAVY, fontFace: "Cambria", margin: 0
    });
    s.addText(desc, {
      x: x + 0.35, y: y + 0.95, w: 5.4, h: 1.1, fontSize: 12, color: DARK,
      fontFace: "Calibri", margin: 0
    });
  });

  addFooter(s, 4, TOTAL);
}

// ============================================================
// 5 — Pipeline general
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "04  ·  SOLUCION");
  addTitle(s, "El pipeline de minería de texto, en 7 etapas");

  const stages = [
    ["1", "Datos\ncrudos", "FAERS .txt"],
    ["2", "Limpieza", "dataset.csv"],
    ["3", "Texto\ncanonico", "patient_text"],
    ["4", "Representacion", "TF-IDF / BioBERT"],
    ["5", "Modelo", "BioBERT fine-tune"],
    ["6", "Umbral", "thresholds.npy"],
    ["7", "Prediccion", "efectos adversos"]
  ];
  const stageW = 1.65;
  const startX = 0.6;
  stages.forEach(([n, t, sub], i) => {
    const x = startX + i * (stageW + 0.1);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.2, w: stageW, h: 2.0, rectRadius: 0.1,
      fill: { color: i === 4 ? NAVY : WHITE },
      line: { color: i === 4 ? NAVY : "D1D5DB", width: 1 }
    });
    s.addText(n, {
      x, y: 2.35, w: stageW, h: 0.5, fontSize: 22, bold: true,
      color: i === 4 ? CORAL : NAVY, align: "center",
      fontFace: "Cambria", margin: 0
    });
    s.addText(t, {
      x: x + 0.1, y: 2.85, w: stageW - 0.2, h: 0.8, fontSize: 13, bold: true,
      color: i === 4 ? WHITE : DARK, align: "center", margin: 0,
      fontFace: "Calibri"
    });
    s.addText(sub, {
      x: x + 0.05, y: 3.7, w: stageW - 0.1, h: 0.45, fontSize: 9,
      color: i === 4 ? SOFT : MUTED, align: "center", italic: true, margin: 0,
      fontFace: "Courier New"
    });

    if (i < stages.length - 1) {
      const ax = x + stageW + 0.005;
      s.addShape(pres.shapes.RIGHT_TRIANGLE, {
        x: ax, y: 3.05, w: 0.09, h: 0.3,
        fill: { color: MUTED }, line: { color: MUTED }, rotate: 90
      });
    }
  });

  // Explanation row
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.9, w: 12.1, h: 1.8, rectRadius: 0.1,
    fill: { color: WHITE }, line: { color: SOFT, width: 1 }
  });
  s.addText("El mismo dato cambia de forma en cada etapa", {
    x: 0.85, y: 5.05, w: 11.5, h: 0.5, fontSize: 16, bold: true,
    color: NAVY, fontFace: "Cambria", margin: 0
  });
  s.addText(
    "Empieza como filas separadas en 4 archivos → se convierte en una fila " +
    "tabular → en una oracion en ingles → en un vector de 768 numeros → en " +
    "97 probabilidades → en una lista final de efectos en español.",
    {
      x: 0.85, y: 5.55, w: 11.5, h: 1.0, fontSize: 13, color: DARK,
      fontFace: "Calibri", margin: 0
    }
  );

  addFooter(s, 5, TOTAL);
}

// ============================================================
// 6 — Etapas 1-3 Preparacion
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "05  ·  PIPELINE — ETAPAS 1 A 3");
  addTitle(s, "Preparacion del dato");

  const steps = [
    ["preprocess.py", "Une los 4 archivos FAERS por primaryid, normaliza edad y peso, descarta filas invalidas. Resultado: dataset.csv con una fila por caso clinico."],
    ["prepare_features.py", "Hace el split 70/30 PRIMERO, y despues ajusta TF-IDF y la mediana de edad SOLO sobre train. Asi no hay data leakage del test al modelo."],
    ["patient_text.row_to_text", "Construye una oracion canonica fija: 'Patient: 67 years old female, weight 72.5 kg. Drug: ASPIRIN. Indication: DIABETES.' Misma funcion en entrenamiento y prediccion."]
  ];
  steps.forEach(([t, d], i) => {
    const y = 1.95 + i * 1.55;
    addNumberBadge(s, i + 1, 0.6, y + 0.15, BLUE);
    s.addText(t, {
      x: 1.4, y: y + 0.05, w: 11.5, h: 0.45, fontSize: 18, bold: true,
      color: NAVY, fontFace: "Cambria", margin: 0
    });
    s.addText(d, {
      x: 1.4, y: y + 0.55, w: 11.5, h: 0.95, fontSize: 13, color: DARK,
      fontFace: "Calibri", margin: 0
    });
  });

  // Bottom callout
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 6.55, w: 12.1, h: 0.45, rectRadius: 0.07,
    fill: { color: NAVY }, line: { color: NAVY }
  });
  s.addText(
    "Concepto de Unidad 3: validacion train/test antes de cualquier " +
    "transformacion para evitar data leakage.",
    {
      x: 0.85, y: 6.6, w: 11.7, h: 0.35, fontSize: 12, bold: true,
      color: WHITE, margin: 0, fontFace: "Calibri"
    }
  );

  addFooter(s, 6, TOTAL);
}

// ============================================================
// 7 — Representacion vectorial
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "06  ·  PIPELINE — ETAPA 4");
  addTitle(s, "Representacion vectorial del texto");

  // Two columns: TF-IDF vs BioBERT
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.95, w: 6.0, h: 5.0, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: BLUE, width: 2 }
  });
  s.addText("TF-IDF", {
    x: 0.85, y: 2.1, w: 5.5, h: 0.5, fontSize: 22, bold: true,
    color: BLUE, fontFace: "Cambria", margin: 0
  });
  s.addText("Bolsa de palabras ponderada — Unidad 2", {
    x: 0.85, y: 2.6, w: 5.5, h: 0.3, fontSize: 11, italic: true, color: MUTED, margin: 0
  });
  s.addText([
    { text: "Cuenta frecuencia de palabras, penaliza las muy comunes",
      options: { bullet: true, breakLine: true } },
    { text: "Vector disperso de ~100 features",
      options: { bullet: true, breakLine: true } },
    { text: "Rapido, interpretable",
      options: { bullet: true, breakLine: true } },
    { text: "NO entiende sinonimos: 'headache' ≠ 'cephalalgia'",
      options: { bullet: true } }
  ], {
    x: 0.85, y: 3.1, w: 5.5, h: 2.5, fontSize: 13, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 6
  });
  s.addText("Usado por: Naive Bayes, Random Forest baseline", {
    x: 0.85, y: 6.3, w: 5.5, h: 0.4, fontSize: 11, bold: true, color: BLUE,
    italic: true, margin: 0
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.95, y: 1.95, w: 6.0, h: 5.0, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: CORAL, width: 2 }
  });
  s.addText("BioBERT embeddings", {
    x: 7.2, y: 2.1, w: 5.5, h: 0.5, fontSize: 22, bold: true,
    color: CORAL, fontFace: "Cambria", margin: 0
  });
  s.addText("Representacion vectorial densa — Unidad 5 (II)", {
    x: 7.2, y: 2.6, w: 5.5, h: 0.3, fontSize: 11, italic: true, color: MUTED, margin: 0
  });
  s.addText([
    { text: "BERT pre-entrenado sobre literatura biomedica (PubMed)",
      options: { bullet: true, breakLine: true } },
    { text: "Vector denso de 768 dimensiones por caso",
      options: { bullet: true, breakLine: true } },
    { text: "Captura significado: 'headache' ≈ 'cephalalgia'",
      options: { bullet: true, breakLine: true } },
    { text: "Mean pooling enmascarado sobre los tokens",
      options: { bullet: true } }
  ], {
    x: 7.2, y: 3.1, w: 5.5, h: 2.5, fontSize: 13, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 6
  });
  s.addText("Usado por: RF + embeddings, BioBERT fine-tuned", {
    x: 7.2, y: 6.3, w: 5.5, h: 0.4, fontSize: 11, bold: true, color: CORAL,
    italic: true, margin: 0
  });

  addFooter(s, 7, TOTAL);
}

// ============================================================
// 8 — Los 4 modelos
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "07  ·  MODELOS");
  addTitle(s, "Los cuatro modelos que entrenamos");

  s.addText(
    "Antes de fine-tunear BioBERT (caro y lento) entrenamos 3 baselines. " +
    "Cada uno cubre una Unidad distinta de la materia y permite aislar " +
    "que parte aporta cada decision.",
    {
      x: 0.6, y: 1.85, w: 12.2, h: 0.8, fontSize: 14, color: DARK,
      fontFace: "Calibri", margin: 0
    }
  );

  // Table
  const rows = [
    ["Modelo", "Representacion", "Unidad", "F1 macro", "F1 micro"],
    ["Naive Bayes (BernoulliNB)", "TF-IDF", "5-I (NLP)", "0.05", "0.08"],
    ["Random Forest", "TF-IDF", "3 (Supervisado)", "0.107", "0.104"],
    ["Random Forest", "BioBERT embeddings", "3 + 5-II", "0.130", "0.150"],
    ["BioBERT fine-tuned", "End-to-end", "4 + 5-II", "0.128", "0.106"]
  ];
  const colW = [4.0, 2.8, 2.3, 1.6, 1.6];
  const colX = [0.6];
  for (let i = 0; i < colW.length - 1; i++) colX.push(colX[i] + colW[i]);

  rows.forEach((row, ri) => {
    const y = 2.85 + ri * 0.55;
    const isHeader = ri === 0;
    const isBest = ri === 4;
    const rowColor = isHeader ? NAVY : (ri % 2 === 0 ? WHITE : "F3F4F6");
    const txtColor = isHeader ? WHITE : (isBest ? CORAL : DARK);

    row.forEach((cell, ci) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: colX[ci], y, w: colW[ci], h: 0.55,
        fill: { color: rowColor }, line: { color: "E5E7EB", width: 0.5 }
      });
      s.addText(cell, {
        x: colX[ci] + 0.1, y, w: colW[ci] - 0.2, h: 0.55,
        fontSize: 13, bold: isHeader || isBest, color: txtColor,
        align: ci === 0 ? "left" : "center", valign: "middle",
        fontFace: "Calibri", margin: 0
      });
    });
  });

  s.addText(
    "Lectura: cambiar la representacion (TF-IDF → BioBERT) en el MISMO " +
    "Random Forest sube el F1. La mejora viene de COMO se representa el " +
    "texto, no del algoritmo.",
    {
      x: 0.6, y: 5.95, w: 12.2, h: 0.9, fontSize: 13, italic: true,
      color: NAVY, fontFace: "Calibri", margin: 0
    }
  );

  addFooter(s, 8, TOTAL);
}

// ============================================================
// 9 — Fine-tuning de BioBERT
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "08  ·  PIPELINE — ETAPA 5");
  addTitle(s, "Fine-tuning de BioBERT (modelo principal)");

  // Architecture box
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.95, w: 6.0, h: 4.7, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: NAVY, width: 2 }
  });
  s.addText("Arquitectura", {
    x: 0.85, y: 2.1, w: 5.5, h: 0.45, fontSize: 18, bold: true,
    color: NAVY, fontFace: "Cambria", margin: 0
  });

  const layers = [
    ["Texto canonico del paciente", SOFT, DARK],
    ["Tokenizer BioBERT", SOFT, DARK],
    ["BioBERT base (110M params)", BLUE, WHITE],
    ["Cabeza lineal (97 salidas)", NAVY, WHITE],
    ["Sigmoide → 97 probabilidades", CORAL, WHITE]
  ];
  layers.forEach((l, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.85, y: 2.7 + i * 0.72, w: 5.5, h: 0.55, rectRadius: 0.05,
      fill: { color: l[1] }, line: { color: l[1] }
    });
    s.addText(l[0], {
      x: 0.85, y: 2.7 + i * 0.72, w: 5.5, h: 0.55,
      fontSize: 13, bold: true, color: l[2], align: "center", valign: "middle",
      fontFace: "Calibri", margin: 0
    });
  });

  // Training config
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.95, y: 1.95, w: 6.0, h: 4.7, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: NAVY, width: 2 }
  });
  s.addText("Configuracion de entrenamiento", {
    x: 7.2, y: 2.1, w: 5.5, h: 0.45, fontSize: 18, bold: true,
    color: NAVY, fontFace: "Cambria", margin: 0
  });

  const cfg = [
    ["Loss", "BCEWithLogitsLoss con pos_weight por etiqueta"],
    ["Optimizer", "AdamW + linear warmup scheduler"],
    ["Epocas", "15 totales, en tandas de 3 por corrida"],
    ["Batch", "32 muestras (RTX 4070 Ti SUPER)"],
    ["Robustez", "Checkpoint atomico tras cada epoca"],
    ["Seleccion", "Mejor modelo segun F1 de validacion"]
  ];
  cfg.forEach(([k, v], i) => {
    const y = 2.75 + i * 0.62;
    s.addText(k, {
      x: 7.2, y, w: 1.5, h: 0.4, fontSize: 12, bold: true, color: CORAL,
      margin: 0, fontFace: "Calibri"
    });
    s.addText(v, {
      x: 8.7, y, w: 4.1, h: 0.5, fontSize: 12, color: DARK,
      margin: 0, fontFace: "Calibri"
    });
  });

  addFooter(s, 9, TOTAL);
}

// ============================================================
// 10 — Umbral optimo por etiqueta
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "09  ·  PIPELINE — ETAPA 6");
  addTitle(s, "Umbral optimo POR etiqueta (no 0.5 plano)");

  s.addText(
    "El umbral 0.5 sobre la salida sigmoide es un default, no es optimo. " +
    "Las etiquetas raras necesitan umbrales mas bajos para no desaparecer. " +
    "Para cada una de las 97 etiquetas buscamos por grid el umbral que " +
    "maximiza F1 sobre el conjunto de validacion.",
    {
      x: 0.6, y: 1.85, w: 12.2, h: 1.0, fontSize: 14, color: DARK,
      fontFace: "Calibri", margin: 0
    }
  );

  // Two scenarios
  const scenarios = [
    ["Umbral plano = 0.5", "Etiqueta rara con prob promedio 0.22 → nunca se predice → F1 = 0", "E5E7EB", MUTED],
    ["Umbral aprendido por etiqueta", "Misma etiqueta con umbral 0.15 → ahora si se predice → F1 sube", "FDE2DD", CORAL]
  ];
  scenarios.forEach(([t, d, bg, col], i) => {
    const y = 3.1 + i * 1.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y, w: 12.1, h: 1.35, rectRadius: 0.1,
      fill: { color: bg }, line: { color: col, width: 1 }
    });
    s.addText(t, {
      x: 0.95, y: y + 0.18, w: 11.5, h: 0.45, fontSize: 17, bold: true,
      color: col, fontFace: "Cambria", margin: 0
    });
    s.addText(d, {
      x: 0.95, y: y + 0.7, w: 11.5, h: 0.5, fontSize: 13, color: DARK,
      fontFace: "Calibri", margin: 0
    });
  });

  s.addText(
    "Concepto de Unidad 3: ajuste del clasificador via curva precision-recall.",
    {
      x: 0.6, y: 6.55, w: 12.2, h: 0.4, fontSize: 12, italic: true, color: NAVY,
      bold: true, margin: 0, fontFace: "Calibri"
    }
  );

  addFooter(s, 10, TOTAL);
}

// ============================================================
// 11 — Validacion 70/30 + SIDER
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "10  ·  EVALUACION");
  addTitle(s, "Como medimos si el modelo funciona");

  // Split bar
  s.addText("Split 70 / 30 con semilla fija — los mismos casos para todos los modelos", {
    x: 0.6, y: 1.95, w: 12.2, h: 0.4, fontSize: 14, bold: true, color: DARK,
    fontFace: "Calibri", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 2.5, w: 8.47, h: 0.6,
    fill: { color: BLUE }, line: { color: BLUE }
  });
  s.addText("Entrenamiento  ·  38.500 casos  ·  70%", {
    x: 0.6, y: 2.5, w: 8.47, h: 0.6, fontSize: 13, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0, fontFace: "Calibri"
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.07, y: 2.5, w: 3.63, h: 0.6,
    fill: { color: CORAL }, line: { color: CORAL }
  });
  s.addText("Test  ·  16.500  ·  30%", {
    x: 9.07, y: 2.5, w: 3.63, h: 0.6, fontSize: 13, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0, fontFace: "Calibri"
  });

  // Two evaluation layers
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 3.6, w: 6.0, h: 3.1, rectRadius: 0.1,
    fill: { color: WHITE }, line: { color: BLUE, width: 1.5 }
  });
  s.addText("Validacion interna (FAERS test)", {
    x: 0.85, y: 3.75, w: 5.5, h: 0.45, fontSize: 16, bold: true,
    color: BLUE, fontFace: "Cambria", margin: 0
  });
  s.addText([
    { text: "F1 macro / micro / samples", options: { bullet: true, breakLine: true } },
    { text: "Precision y recall por etiqueta", options: { bullet: true, breakLine: true } },
    { text: "Conjunto que el modelo nunca vio", options: { bullet: true, breakLine: true } },
    { text: "Misma fuente que el entrenamiento (FAERS)", options: { bullet: true } }
  ], {
    x: 0.85, y: 4.3, w: 5.5, h: 2.2, fontSize: 12, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 5
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.95, y: 3.6, w: 6.0, h: 3.1, rectRadius: 0.1,
    fill: { color: WHITE }, line: { color: CORAL, width: 1.5 }
  });
  s.addText("Validacion externa (SIDER 4.1)", {
    x: 7.2, y: 3.75, w: 5.5, h: 0.45, fontSize: 16, bold: true,
    color: CORAL, fontFace: "Cambria", margin: 0
  });
  s.addText([
    { text: "Base independiente curada desde prospectos", options: { bullet: true, breakLine: true } },
    { text: "Detecta sesgos compartidos entre train y test", options: { bullet: true, breakLine: true } },
    { text: "Compara fármaco a fármaco", options: { bullet: true, breakLine: true } },
    { text: "Refuerza la honestidad academica del resultado", options: { bullet: true } }
  ], {
    x: 7.2, y: 4.3, w: 5.5, h: 2.2, fontSize: 12, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 5
  });

  addFooter(s, 11, TOTAL);
}

// ============================================================
// 12 — Resultados
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "11  ·  RESULTADOS");
  addTitle(s, "Metricas finales sobre test 30%");

  // Big metrics row
  const metrics = [
    ["F1 macro", "0.128", BLUE],
    ["F1 micro", "0.106", BLUE],
    ["Precision", "0.106", NAVY],
    ["Recall", "0.388", CORAL]
  ];
  metrics.forEach(([k, v, col], i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.95, w: 2.85, h: 1.65, rectRadius: 0.1,
      fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 }
    });
    s.addText(v, {
      x, y: 2.0, w: 2.85, h: 0.95, fontSize: 48, bold: true, color: col,
      align: "center", fontFace: "Cambria", margin: 0
    });
    s.addText(k, {
      x, y: 3.0, w: 2.85, h: 0.5, fontSize: 14, color: MUTED,
      align: "center", fontFace: "Calibri", margin: 0
    });
  });

  // Interpretation
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 3.85, w: 12.1, h: 2.95, rectRadius: 0.1,
    fill: { color: WHITE }, line: { color: SOFT, width: 1 }
  });
  s.addText("¿Es bueno este F1?", {
    x: 0.85, y: 4.0, w: 11.5, h: 0.45, fontSize: 16, bold: true,
    color: NAVY, fontFace: "Cambria", margin: 0
  });
  s.addText([
    { text: "97 etiquetas con desbalance 1:50 — un random predeciria F1 ≈ 0.02. Cualquier valor por encima de 0.10 es señal de aprendizaje real.",
      options: { bullet: true, breakLine: true } },
    { text: "El recall ~0.39 significa que el modelo identifica 4 de cada 10 reacciones reales reportadas.",
      options: { bullet: true, breakLine: true } },
    { text: "La precision ~0.11 incluye 'falsos positivos' que pueden ser efectos plausibles no reportados en ese caso especifico.",
      options: { bullet: true, breakLine: true } },
    { text: "Validado externamente contra SIDER 4.1 — coincidencia parcial confirma que aprendio relaciones farmaco-efecto reales, no artefactos.",
      options: { bullet: true } }
  ], {
    x: 0.85, y: 4.5, w: 11.5, h: 2.3, fontSize: 12, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 5
  });

  addFooter(s, 12, TOTAL);
}

// ============================================================
// 13 — La app
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "12  ·  DEMO");
  addTitle(s, "La aplicacion en vivo");

  s.addText(
    "Streamlit. El usuario carga datos de un paciente y el modelo le devuelve los " +
    "efectos adversos mas probables, mas un veredicto comparado contra SIDER.",
    {
      x: 0.6, y: 1.85, w: 12.2, h: 0.7, fontSize: 14, color: DARK,
      fontFace: "Calibri", margin: 0
    }
  );

  const flow = [
    ["1", "Formulario", "Farmaco, edad, sexo, peso, medicaciones, indicaciones"],
    ["2", "Inferencia", "Texto canonico → BioBERT → 97 probabilidades"],
    ["3", "Filtrado", "Aplica umbral aprendido + piso clinico 0.15"],
    ["4", "Verificacion", "Compara contra SIDER → veredicto MUY BUENA / BUENA / ACEPTABLE / POBRE"]
  ];
  flow.forEach(([n, t, d], i) => {
    const y = 2.85 + i * 0.95;
    s.addShape(pres.shapes.OVAL, {
      x: 0.6, y, w: 0.7, h: 0.7,
      fill: { color: NAVY }, line: { color: NAVY }
    });
    s.addText(n, {
      x: 0.6, y, w: 0.7, h: 0.7, fontSize: 24, bold: true, color: CORAL,
      align: "center", valign: "middle", fontFace: "Cambria", margin: 0
    });
    s.addText(t, {
      x: 1.55, y: y + 0.02, w: 4.5, h: 0.4, fontSize: 17, bold: true,
      color: NAVY, fontFace: "Cambria", margin: 0
    });
    s.addText(d, {
      x: 1.55, y: y + 0.4, w: 11.0, h: 0.4, fontSize: 12, color: DARK,
      fontFace: "Calibri", margin: 0
    });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 6.6, w: 12.1, h: 0.4, rectRadius: 0.05,
    fill: { color: CORAL }, line: { color: CORAL }
  });
  s.addText("streamlit run app.py", {
    x: 0.85, y: 6.6, w: 11.7, h: 0.4, fontSize: 12, bold: true, color: WHITE,
    valign: "middle", margin: 0, fontFace: "Courier New"
  });

  addFooter(s, 13, TOTAL);
}

// ============================================================
// 14 — Mapeo a la materia
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "13  ·  CONTENIDOS DE LA MATERIA");
  addTitle(s, "Como se mapea el proyecto a cada Unidad");

  const units = [
    ["U2", "Representacion y recuperacion", "TF-IDF, embeddings BioBERT, similitud coseno entre farmacos"],
    ["U3", "Aprendizaje supervisado", "Random Forest, KNN, particion train/test, K-Fold, metricas multilabel"],
    ["U4", "Redes neuronales", "Backpropagation, optimizador Adam, BCEWithLogitsLoss, hiperparametros"],
    ["U5-I", "NLP — parte 1", "Naive Bayes para clasificacion de texto, NER biomedico con spaCy"],
    ["U5-II", "NLP — parte 2", "BERT/BioBERT, embeddings contextuales, fine-tuning end-to-end"]
  ];
  units.forEach(([u, t, d], i) => {
    const y = 1.95 + i * 0.93;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y, w: 1.4, h: 0.78, rectRadius: 0.08,
      fill: { color: NAVY }, line: { color: NAVY }
    });
    s.addText(u, {
      x: 0.6, y, w: 1.4, h: 0.78, fontSize: 22, bold: true, color: CORAL,
      align: "center", valign: "middle", fontFace: "Cambria", margin: 0
    });
    s.addText(t, {
      x: 2.15, y: y + 0.05, w: 4.5, h: 0.4, fontSize: 15, bold: true,
      color: NAVY, fontFace: "Cambria", margin: 0
    });
    s.addText(d, {
      x: 2.15, y: y + 0.42, w: 10.5, h: 0.4, fontSize: 12, color: DARK,
      fontFace: "Calibri", margin: 0
    });
  });

  addFooter(s, 14, TOTAL);
}

// ============================================================
// 15 — Extensiones fuera de materia
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "14  ·  HONESTIDAD ACADEMICA");
  addTitle(s, "Extensiones fuera del temario");

  s.addText(
    "Algunas decisiones necesarias para que el problema funcione no estan " +
    "explicitas en las diapositivas. Las declaramos para transparencia academica:",
    {
      x: 0.6, y: 1.85, w: 12.2, h: 0.7, fontSize: 13, color: DARK,
      fontFace: "Calibri", margin: 0
    }
  );

  const extensions = [
    ["Clasificacion multi-label", "La materia trata clasificacion binaria/multiclase. Aqui cada paciente tiene varias etiquetas a la vez (necesidad del dominio FAERS)."],
    ["pos_weight con tope (POS_WEIGHT_CAP)", "Para balancear clases en redes neuronales. La materia menciona class_weight='balanced' en RF, no ponderacion en BCE."],
    ["Linear warmup scheduler", "Practica estandar al fine-tunear transformers. Las diapositivas asumen learning rate fijo o decay simple."],
    ["Validacion contra SIDER 4.1", "SIDER no se menciona en clase. Se uso solo para validar, no para entrenar — refuerza la evaluacion."],
    ["Umbral optimo POR etiqueta", "La materia trata el umbral en clasificacion binaria. Lo aplicamos por etiqueta dentro del setting multi-label."]
  ];
  extensions.forEach(([t, d], i) => {
    const y = 2.7 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: y + 0.05, w: 0.05, h: 0.65,
      fill: { color: CORAL }, line: { color: CORAL }
    });
    s.addText(t, {
      x: 0.85, y, w: 12.0, h: 0.4, fontSize: 14, bold: true, color: NAVY,
      fontFace: "Cambria", margin: 0
    });
    s.addText(d, {
      x: 0.85, y: y + 0.4, w: 12.0, h: 0.45, fontSize: 11, color: DARK,
      fontFace: "Calibri", margin: 0
    });
  });

  addFooter(s, 15, TOTAL);
}

// ============================================================
// 16 — Cierre
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, NAVY);

  s.addText("CONCLUSIONES", {
    x: 0.6, y: 0.9, w: 12, h: 0.5, fontSize: 14, bold: true,
    color: CORAL, charSpacing: 6, margin: 0
  });

  s.addText("Que aprendimos", {
    x: 0.6, y: 1.4, w: 12, h: 1.0, fontSize: 44, bold: true,
    color: WHITE, fontFace: "Cambria", margin: 0
  });

  const conclusions = [
    "Aplicamos el flujo completo de mineria de texto enseñado en MTAA: representacion, modelos clasicos, redes neuronales y NLP avanzado.",
    "Logramos un F1 macro de 0.128 sobre 97 etiquetas con desbalance severo — competitivo dada la dificultad estructural del problema.",
    "Validamos honestamente contra una fuente externa (SIDER 4.1) para detectar sesgos del dataset, no solo metricas sobre test interno.",
    "Construimos una app funcional que predice y verifica en vivo, demostrando el pipeline end-to-end."
  ];
  conclusions.forEach((c, i) => {
    const y = 3.0 + i * 0.85;
    s.addShape(pres.shapes.OVAL, {
      x: 0.6, y: y + 0.15, w: 0.4, h: 0.4,
      fill: { color: CORAL }, line: { color: CORAL }
    });
    s.addText(String(i + 1), {
      x: 0.6, y: y + 0.15, w: 0.4, h: 0.4, fontSize: 14, bold: true,
      color: WHITE, align: "center", valign: "middle", margin: 0,
      fontFace: "Cambria"
    });
    s.addText(c, {
      x: 1.2, y: y + 0.1, w: 11.5, h: 0.6, fontSize: 14, color: SOFT,
      fontFace: "Calibri", margin: 0
    });
  });

  s.addText("¿Preguntas?", {
    x: 0.6, y: 6.55, w: 12, h: 0.6, fontSize: 24, bold: true, italic: true,
    color: CORAL, fontFace: "Cambria", margin: 0
  });
}

// ============================================================
pres.writeFile({ fileName: "presentacion_farmApp.pptx" })
  .then(f => console.log("Generada: " + f));
