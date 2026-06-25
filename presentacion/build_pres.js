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

const TOTAL = 12;

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
// 4 — Desafíos del Desarrollo y Decisiones de Riesgo
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "03  ·  DESAFIOS");
  addTitle(s, "Desafios y Decisiones de Riesgo");

  const items = [
    ["Desbalance Extremo", "La densidad de reacciones positivas es de apenas ~2%. Tomamos el riesgo de ignorar etiquetas con frecuencia menor a 300 para evitar sobre-predicción del caso negativo."],
    ["Datos Ruidosos de FDA", "FAERS mezcla efectos adversos con errores de dosis o problemas del dispositivo. Decidimos filtrar a mano términos no médicos para evitar predicciones absurdas."],
    ["Hardware Limitado (CPU)", "El fine-tuning de Transformers es costoso en CPU lenta. Decidimos estructurar un entrenamiento resumable por tandas y un sistema de caché de inferencia rápida."],
    ["Reportes Parciales", "Cada reporte FAERS tiene 2-4 reacciones, pero el fármaco causa más de 100. El modelo se evalúa bajo la limitación inherente del sub-reporte de la FDA."]
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
// 5 — Pipeline general (Caja Negra)
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "04  ·  SOLUCION");
  addTitle(s, "El pipeline de datos: Capas y Flujos");

  // Capa 1: Adquisición y Limpieza (Fondo Verde Suave)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.8, w: 12.1, h: 1.4, rectRadius: 0.05,
    fill: { color: "E2F0D9" }, line: { color: "385723", width: 1.5 }
  });
  s.addText("CAPA DE PRE-PROCESAMIENTO (DATOS CRUDOS A TABULARES)", {
    x: 0.8, y: 1.9, w: 11.7, h: 0.3, fontSize: 11, bold: true, color: "385723", fontFace: "Calibri"
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 2.3, w: 3.2, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "385723", width: 1 }
  });
  s.addText("FDA FAERS (.txt)\nArchivos crudos por trimestre", {
    x: 0.8, y: 2.3, w: 3.2, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });
  // Flecha 1
  s.addText("→", { x: 4.15, y: 2.35, w: 0.5, h: 0.5, fontSize: 24, color: "385723", align: "center" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.8, y: 2.3, w: 3.8, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "385723", width: 1 }
  });
  s.addText("Limpieza y Consolidador\nUne tablas por ID y descarta nulos", {
    x: 4.8, y: 2.3, w: 3.8, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });
  // Flecha 2
  s.addText("→", { x: 8.75, y: 2.35, w: 0.5, h: 0.5, fontSize: 24, color: "385723", align: "center" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 9.4, y: 2.3, w: 3.0, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "385723", width: 1 }
  });
  s.addText("Dataset Consolidado\ndataset.csv tabular", {
    x: 9.4, y: 2.3, w: 3.0, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });

  // Flecha conectora vertical
  s.addText("↓", { x: 6.0, y: 3.15, w: 1.3, h: 0.4, fontSize: 24, color: NAVY, align: "center" });

  // Capa 2: Feature Engineering (Fondo Naranja Suave)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 3.5, w: 12.1, h: 1.4, rectRadius: 0.05,
    fill: { color: "FCE4D6" }, line: { color: "C65911", width: 1.5 }
  });
  s.addText("CAPA DE INGENIERÍA DE CARACTERÍSTICAS (SEPARACIÓN Y FORMATEO)", {
    x: 0.8, y: 3.6, w: 11.7, h: 0.3, fontSize: 11, bold: true, color: "C65911", fontFace: "Calibri"
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 4.0, w: 3.2, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "C65911", width: 1 }
  });
  s.addText("Split Determinista 70/30\nSeparación limpia de datos", {
    x: 0.8, y: 4.0, w: 3.2, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });
  // Flecha 3
  s.addText("→", { x: 4.15, y: 4.05, w: 0.5, h: 0.5, fontSize: 24, color: "C65911", align: "center" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.8, y: 4.0, w: 3.8, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "C65911", width: 1 }
  });
  s.addText("Generador de Oraciones Clínicas\nConstruye texto para BioBERT", {
    x: 4.8, y: 4.0, w: 3.8, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });
  // Flecha 4
  s.addText("→", { x: 8.75, y: 4.05, w: 0.5, h: 0.5, fontSize: 24, color: "C65911", align: "center" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 9.4, y: 4.0, w: 3.0, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "C65911", width: 1 }
  });
  s.addText("Texto Canónico Estructurado\npatient_text representable", {
    x: 9.4, y: 4.0, w: 3.0, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });

  // Flecha conectora vertical
  s.addText("↓", { x: 6.0, y: 4.85, w: 1.3, h: 0.4, fontSize: 24, color: NAVY, align: "center" });

  // Capa 3: Inferencia y Calibración (Fondo Azul Suave)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.2, w: 12.1, h: 1.4, rectRadius: 0.05,
    fill: { color: "DDEBF7" }, line: { color: "2F5597", width: 1.5 }
  });
  s.addText("CAPA DE PREDICCIÓN Y CALIBRACIÓN DE UMBRALES", {
    x: 0.8, y: 5.3, w: 11.7, h: 0.3, fontSize: 11, bold: true, color: "2F5597", fontFace: "Calibri"
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 5.7, w: 3.2, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "2F5597", width: 1 }
  });
  s.addText("Tokenizador e Inferencia\nBioBERT procesa el texto", {
    x: 0.8, y: 5.7, w: 3.2, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });
  // Flecha 5
  s.addText("→", { x: 4.15, y: 5.75, w: 0.5, h: 0.5, fontSize: 24, color: "2F5597", align: "center" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.8, y: 5.7, w: 3.8, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "2F5597", width: 1 }
  });
  s.addText("Calibrador F2 (Thresholds)\nOptimiza umbrales por etiqueta", {
    x: 4.8, y: 5.7, w: 3.8, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });
  // Flecha 6
  s.addText("→", { x: 8.75, y: 5.75, w: 0.5, h: 0.5, fontSize: 24, color: "2F5597", align: "center" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 9.4, y: 5.7, w: 3.0, h: 0.7, rectRadius: 0.05, fill: { color: WHITE }, line: { color: "2F5597", width: 1 }
  });
  s.addText("98 Predicciones Finales\nTraducido y verificado vs SIDER", {
    x: 9.4, y: 5.7, w: 3.0, h: 0.7, fontSize: 10, align: "center", valign: "middle", fontFace: "Calibri", color: DARK
  });

  addFooter(s, 5, TOTAL);
}

// ============================================================
// 6 — Representacion: ¿Como lee el modelo actual?
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "05  ·  REPRESENTACION");
  addTitle(s, "Representacion: ¿Como lee el modelo actual?");

  // Columna 1: Tokenizador Medico
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.95, w: 6.0, h: 4.8, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: BLUE, width: 2 }
  });
  s.addText("Tokenizador Clinico Especializado (BPE)", {
    x: 0.85, y: 2.15, w: 5.5, h: 0.5, fontSize: 20, bold: true,
    color: BLUE, fontFace: "Cambria", margin: 0
  });
  s.addText("Procesamiento de texto medico — Unidad 5 (I)", {
    x: 0.85, y: 2.65, w: 5.5, h: 0.3, fontSize: 11, italic: true, color: MUTED, margin: 0
  });
  s.addText([
    { text: "Divide la oracion clinica en palabras y subpalabras (tokens).",
      options: { bullet: true, breakLine: true } },
    { text: "Utiliza un vocabulario pre-entrenado en textos medicos de 30.000 palabras.",
      options: { bullet: true, breakLine: true } },
    { text: "Maneja terminos desconocidos rompiendolos en sub-tokens (ej: 'acetaminophen' -> 'aceta', '##mino', '##phen').",
      options: { bullet: true, breakLine: true } },
    { text: "Asocia cada token a un ID numerico representable para el Transformer.",
      options: { bullet: true } }
  ], {
    x: 0.85, y: 3.15, w: 5.5, h: 3.3, fontSize: 13, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 8
  });

  // Columna 2: Embeddings Semanticos
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.95, y: 1.95, w: 6.0, h: 4.8, rectRadius: 0.15,
    fill: { color: WHITE }, line: { color: CORAL, width: 2 }
  });
  s.addText("Embeddings Densos Contextuales (BioBERT)", {
    x: 7.2, y: 2.15, w: 5.5, h: 0.5, fontSize: 20, bold: true,
    color: CORAL, fontFace: "Cambria", margin: 0
  });
  s.addText("Representacion vectorial densa — Unidad 5 (II)", {
    x: 7.2, y: 2.65, w: 5.5, h: 0.3, fontSize: 11, italic: true, color: MUTED, margin: 0
  });
  s.addText([
    { text: "Proyecta los IDs a vectores continuos en un espacio de 768 dimensiones.",
      options: { bullet: true, breakLine: true } },
    { text: "Pre-entrenado sobre millones de resumenes biomedicos (PubMed).",
      options: { bullet: true, breakLine: true } },
    { text: "Captura sinonimia clinica real de forma automatica: entiende que 'headache' y 'migraine' estan cercanos en el espacio vectorial.",
      options: { bullet: true, breakLine: true } },
    { text: "Modifica los vectores segun el contexto (ej: 'cold' como resfrio vs. clima frio).",
      options: { bullet: true } }
  ], {
    x: 7.2, y: 3.15, w: 5.5, h: 3.3, fontSize: 13, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 8
  });

  addFooter(s, 6, TOTAL);
}

// ============================================================
// 7 — Comparativa y Debate: Modelos evaluados
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "06  ·  MODELOS");
  addTitle(s, "Comparativa de Modelos y Debate");

  // Grid de 3 modelos
  const cols = [
    {
      title: "Baselines TF-IDF\n(Naive Bayes / RF)",
      color: BLUE,
      x: 0.6,
      items: [
        "Pros: Entrenamiento casi instantaneo en CPU; interpretabilidad directa de palabras clave.",
        "Contras: Rigidez absoluta. Ignora sinónimos y relaciones semanticas complejas (ej: 'nausea' y 'vomito' se procesan como mundos distintos)."
      ]
    },
    {
      title: "Aproximacion Hibrida\n(RF + Embeddings fijos)",
      color: NAVY,
      x: 4.75,
      items: [
        "Pros: Aporta conocimiento biomedico externo (PubMed) sin requerir optimizar una red neuronal profunda.",
        "Contras: BioBERT queda congelado. Los vectores no se adaptan al vocabulario coloquial o especifico de reportes de la FDA."
      ]
    },
    {
      title: "BioBERT Fine-Tuned\n(Modelo Elegido)",
      color: CORAL,
      x: 8.9,
      items: [
        "Pros: Adaptación end-to-end. Las 12 capas del Transformer se ajustaron a los patrones especificos del dataset.",
        "Contras: Alto costo computacional (lento entrenamiento en CPU); requiere calibracion posterior debido al desbalance extremo."
      ]
    }
  ];

  cols.forEach(c => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: c.x, y: 1.95, w: 3.8, h: 3.5, rectRadius: 0.1,
      fill: { color: WHITE }, line: { color: c.color, width: 1.5 }
    });
    s.addText(c.title, {
      x: c.x + 0.15, y: 2.1, w: 3.5, h: 0.75, fontSize: 15, bold: true,
      color: c.color, fontFace: "Cambria", align: "center", valign: "middle", margin: 0
    });
    s.addText(c.items.map(item => ({ text: item, options: { bullet: true, breakLine: true } })), {
      x: c.x + 0.25, y: 3.0, w: 3.3, h: 2.3, fontSize: 11, color: DARK,
      fontFace: "Calibri", paraSpaceAfter: 4
    });
  });

  // Caja inferior de debate
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.65, w: 12.1, h: 1.25, rectRadius: 0.08,
    fill: { color: "F8F9FA" }, line: { color: "E5E7EB", width: 1 }
  });
  s.addText("El Debate: ¿Por que nos quedamos con BioBERT?", {
    x: 0.85, y: 5.75, w: 11.6, h: 0.3, fontSize: 13, bold: true, color: NAVY, fontFace: "Cambria"
  });
  s.addText(
    "En farmacovigilancia, la sinonimia clinica es critica para no omitir riesgos. BioBERT supero a todos los baselines " +
    "al captar la semantica real de las oraciones. El costo de computo se soluciono con una cache de inferencia para la app, " +
    "y el desbalance se mitigo con la recalibracion F2 posterior, logrando precision clinica sin reentrenar.",
    {
      x: 0.85, y: 6.05, w: 11.6, h: 0.75, fontSize: 11.5, italic: true, color: DARK, fontFace: "Calibri"
    }
  );

  addFooter(s, 7, TOTAL);
}

// ============================================================
// 9 — Fine-tuning de BioBERT (Diseño Neural Altamente Gráfico)
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "08  ·  ARQUITECTURA DE BIOBERT");
  addTitle(s, "Esquema de Flujo y Capas de BioBERT");

  // Colores del diagrama
  const DIAG_BLUE = "0C59CF";
  const DIAG_RED = "9E0F20";
  const DIAG_GREEN = "15803D";
  const DIAG_ORANGE = "E68A00";

  // ------------------------------------------------------------
  // BLOQUE 1: Entrada (Azul)
  // ------------------------------------------------------------
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.85, w: 8.5, h: 1.45, rectRadius: 0.05,
    fill: { color: DIAG_BLUE }, line: { color: DIAG_BLUE }
  });
  s.addText("entrada", {
    x: 0.75, y: 1.9, w: 2.0, h: 0.3, fontSize: 11, bold: true, color: WHITE, fontFace: "Calibri"
  });

  // Caja Negra 1: Paciente
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 2.2, w: 2.7, h: 0.8, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Paciente (Input)\n[Edad, Sexo, Fármaco, Indi]", {
    x: 0.9, y: 2.2, w: 2.7, h: 0.8, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  s.addText("→ Datos crudos →", {
    x: 3.6, y: 2.45, w: 2.2, h: 0.3, fontSize: 9, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // Caja Negra 2: Formateador
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.8, y: 2.2, w: 2.7, h: 0.8, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Formateador\n[Genera oración descriptiva]", {
    x: 5.8, y: 2.2, w: 2.7, h: 0.8, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // ------------------------------------------------------------
  // Conector Vertical 1 -> 2 (Flecha de Entrada a BioBERT)
  // ------------------------------------------------------------
  s.addText("↓ Oración clínica (Texto) ↓", {
    x: 5.8, y: 3.32, w: 2.7, h: 0.3, fontSize: 10, bold: true, color: DIAG_BLUE, align: "center", fontFace: "Calibri"
  });

  // ------------------------------------------------------------
  // BLOQUE 2: Modelo BioBERT (Rojo) - Fluye de Derecha a Izquierda
  // ------------------------------------------------------------
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 3.65, w: 8.5, h: 1.45, rectRadius: 0.05,
    fill: { color: DIAG_RED }, line: { color: DIAG_RED }
  });
  s.addText("modelo biobert (flujo derecha-izquierda)", {
    x: 0.75, y: 3.7, w: 4.0, h: 0.3, fontSize: 11, bold: true, color: WHITE, fontFace: "Calibri"
  });

  // Caja Negra 3: Tokenizador (Derecha)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.8, y: 4.0, w: 2.7, h: 0.8, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Tokenizador\n[Divide texto en IDs]", {
    x: 5.8, y: 4.0, w: 2.7, h: 0.8, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // Flecha 1 (De Tokenizador a Transformer - Izquierda)
  s.addText("← IDs", {
    x: 5.5, y: 4.25, w: 0.3, h: 0.3, fontSize: 9, color: WHITE, align: "center", fontFace: "Calibri"
  });

  // Caja Negra 4: Transformer (Medio)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.3, y: 4.0, w: 2.2, h: 0.8, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Transformer Encoder\n[12 Capas de Atención]", {
    x: 3.3, y: 4.0, w: 2.2, h: 0.8, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // Flecha 2 (De Transformer a CLS - Izquierda)
  s.addText("← Contexto", {
    x: 3.0, y: 4.25, w: 0.3, h: 0.3, fontSize: 8, color: WHITE, align: "center", fontFace: "Calibri"
  });

  // Caja Negra 5: Vector CLS (Izquierda)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 4.0, w: 2.1, h: 0.8, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Vector [CLS]\n[Semántica 768d]", {
    x: 0.9, y: 4.0, w: 2.1, h: 0.8, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // ------------------------------------------------------------
  // Conector Vertical 2 -> 3 (Flecha de BioBERT a Clasificador)
  // ------------------------------------------------------------
  s.addText("↓ Vector de 768d ↓", {
    x: 0.9, y: 5.12, w: 2.1, h: 0.3, fontSize: 10, bold: true, color: DIAG_RED, align: "center", fontFace: "Calibri"
  });

  // ------------------------------------------------------------
  // BLOQUE 3: Cabeza Clasificadora (Verde) - Fluye de Izquierda a Derecha
  // ------------------------------------------------------------
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.45, w: 8.5, h: 1.45, rectRadius: 0.05,
    fill: { color: DIAG_GREEN }, line: { color: DIAG_GREEN }
  });
  s.addText("cabeza clasificadora", {
    x: 0.75, y: 5.5, w: 2.0, h: 0.3, fontSize: 11, bold: true, color: WHITE, fontFace: "Calibri"
  });

  // Caja Negra 6: MLP
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 5.8, w: 2.7, h: 0.8, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Capa Lineal + Dropout\n[Mapeo a 98 logits]", {
    x: 0.9, y: 5.8, w: 2.7, h: 0.8, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // Flecha 3
  s.addText("→ Logits →", {
    x: 3.6, y: 6.05, w: 2.2, h: 0.3, fontSize: 9, color: WHITE, align: "center", fontFace: "Calibri"
  });

  // Caja Negra 7: Normalización Sigmoide
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.8, y: 5.8, w: 2.7, h: 0.8, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Normalización\n[Función Sigmoide]", {
    x: 5.8, y: 5.8, w: 2.7, h: 0.8, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // ------------------------------------------------------------
  // Conector Inferencia -> Calibración (Diagonal Conectora a la derecha)
  // ------------------------------------------------------------
  s.addText("↗\nProbabilidades\n(98 clases)", {
    x: 8.5, y: 4.15, w: 0.95, h: 1.3, fontSize: 9, bold: true, color: DIAG_GREEN, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // ------------------------------------------------------------
  // BLOQUE 4: Calibración y Decisión (Naranja) - A la Derecha (Conectado)
  // ------------------------------------------------------------
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 9.45, y: 1.85, w: 3.25, h: 5.05, rectRadius: 0.05,
    fill: { color: DIAG_ORANGE }, line: { color: DIAG_ORANGE }
  });
  s.addText("calibracion & decision", {
    x: 9.6, y: 1.95, w: 3.0, h: 0.3, fontSize: 11, bold: true, color: WHITE, fontFace: "Calibri"
  });

  // Caja Negra 8: Calibrador F2
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.7, y: 2.4, w: 2.75, h: 1.2, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Calibrador F2\n\n[Optimiza umbrales por\netiqueta para evitar\nsilenciar clases raras]", {
    x: 9.7, y: 2.4, w: 2.75, h: 1.2, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // Conector Calibrador F2 -> Predicciones
  s.addText("↓ Umbrales óptimos F2 ↓", {
    x: 9.7, y: 3.75, w: 2.75, h: 1.3, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  // Caja Negra 9: Predicciones Activas
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.7, y: 5.2, w: 2.75, h: 1.2, fill: { color: "000000" }, line: { color: WHITE, width: 1 }
  });
  s.addText("Predicciones Activas\n\n[Efectos adversos con\nprobabilidad mayor al\numbral optimizado]", {
    x: 9.7, y: 5.2, w: 2.75, h: 1.2, fontSize: 10, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
  });

  addFooter(s, 8, TOTAL);
}

// ============================================================
// 10 — Calibración F2
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "08  ·  PIPELINE — CALIBRACION");
  addTitle(s, "Calibracion F2 de Sensibilidad");

  s.addText(
    "Optimizar para F1 clásico en clases altamente desbalanceadas tiende a fijar umbrales muy altos (ej. >0.70) " +
    "para evitar falsos positivos, silenciando por completo reacciones poco comunes. " +
    "Cambiamos la estrategia de optimización sin necesidad de reentrenar la red neuronal.",
    {
      x: 0.6, y: 1.85, w: 12.2, h: 1.0, fontSize: 14, color: DARK,
      fontFace: "Calibri", margin: 0
    }
  );

  // Two scenarios
  const scenarios = [
    ["Optimizacion F1 Clasica (Original)", "Maximiza el balance estricto precisión-recall. Silencia etiquetas de baja frecuencia (F1 = 0 en muchas de ellas) reduciendo la cobertura a un 40.6% de pacientes.", "E5E7EB", MUTED],
    ["Optimizacion F2-Score (Elegido)", "Prioriza el Recall (sensibilidad) sobre la precisión. Evita silenciar reacciones raras y eleva la cobertura en pacientes al 57.7% sin requerir reentrenamiento.", "FDE2DD", CORAL]
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
    "La recalibración se realiza en segundos usando una caché local de predicciones de validación.",
    {
      x: 0.6, y: 6.55, w: 12.2, h: 0.4, fontSize: 12, italic: true, color: NAVY,
      bold: true, margin: 0, fontFace: "Calibri"
    }
  );

  addFooter(s, 9, TOTAL);
}

// ============================================================
// 11 — Resultados
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "09  ·  RESULTADOS");
  addTitle(s, "Resultados y Metricas Finales (Test Set)");

  // 4 Cards de métricas explicativas
  const metricCards = [
    {
      val: "53.7%",
      lbl: "Acierto en Pacientes",
      col: CORAL,
      desc: "En más de la mitad de los casos del test set, el modelo predijo correctamente al menos 1 reacción adversa real del paciente.",
      x: 0.6
    },
    {
      val: "44.4%",
      lbl: "Recall Promedio",
      col: BLUE,
      desc: "El modelo captura y alerta de manera preventiva casi la mitad (44.4%) del total de efectos adversos reales registrados.",
      x: 3.65
    },
    {
      val: "18.1%",
      lbl: "Precision Media",
      col: NAVY,
      desc: "Alerta con ruido controlado. En medicina preventiva es preferible alertar de más (falso positivo) a omitir un riesgo.",
      x: 6.7
    },
    {
      val: "6x",
      lbl: "Desempeño vs Azar",
      col: CORAL,
      desc: "Por la baja densidad del dataset (2%), clasificar al azar da F1 macro de 0.02. Nuestro modelo rinde 6 veces más.",
      x: 9.75
    }
  ];

  metricCards.forEach(c => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: c.x, y: 1.95, w: 2.95, h: 2.7, rectRadius: 0.1,
      fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 }
    });
    s.addText(c.val, {
      x: c.x, y: 2.05, w: 2.95, h: 0.8, fontSize: 44, bold: true, color: c.col,
      align: "center", fontFace: "Cambria", margin: 0
    });
    s.addText(c.lbl, {
      x: c.x, y: 2.85, w: 2.95, h: 0.35, fontSize: 13, bold: true, color: DARK,
      align: "center", fontFace: "Calibri", margin: 0
    });
    s.addText(c.desc, {
      x: c.x + 0.15, y: 3.25, w: 2.65, h: 1.3, fontSize: 10, color: MUTED,
      align: "center", fontFace: "Calibri", margin: 0
    });
  });

  // Caja de valor clínico e interpretación inferior
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.85, w: 12.1, h: 2.0, rectRadius: 0.08,
    fill: { color: WHITE }, line: { color: SOFT, width: 1 }
  });
  s.addText("Interpretacion Clinica y Academica del Resultado", {
    x: 0.85, y: 4.95, w: 11.6, h: 0.3, fontSize: 14, bold: true, color: NAVY, fontFace: "Cambria"
  });
  s.addText([
    { text: "Utilidad Práctica Real: Al evaluar sobre reportes de la FDA (ruidosos, con múltiples fármacos e indicaciones de pacientes reales), el 53.7% de cobertura provee una herramienta de alerta temprana sumamente robusta.",
      options: { bullet: true, breakLine: true } },
    { text: "Validación Externa Cruzada vs SIDER: El 59% de las predicciones frecuentes del modelo coinciden con prospectos oficiales de la base de datos SIDER (no usada en entrenamiento). Esto comprueba que BioBERT generaliza conocimiento médico real en lugar de sobreajustar.",
      options: { bullet: true } }
  ], {
    x: 0.85, y: 5.35, w: 11.6, h: 1.4, fontSize: 11, color: DARK,
    fontFace: "Calibri", paraSpaceAfter: 5
  });

  addFooter(s, 10, TOTAL);
}

// ============================================================
// 12 — La app
// ============================================================
{
  const s = pres.addSlide();
  addBg(s, LIGHT);
  addTopBar(s, "10  ·  DEMO");
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
    ["2", "Inferencia", "Texto canonico → BioBERT → 98 probabilidades"],
    ["3", "Filtrado", "Aplica umbral calibrado F2 por etiqueta"],
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

  addFooter(s, 11, TOTAL);
}

// ============================================================
// 13 — Cierre
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
    "La representación semántica contextual (BioBERT) supera drásticamente al enfoque rígido de frecuencia (TF-IDF).",
    "La calibración individual de umbrales F2 es fundamental para que etiquetas desbalanceadas no queden silenciadas.",
    "La validación honesta contra bases externas independientes (SIDER) previene el sobreajuste y garantiza la utilidad práctica.",
    "El pipeline funciona end-to-end con una interfaz web en vivo apta para soporte de decisiones clínicas y farmacovigilancia."
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
