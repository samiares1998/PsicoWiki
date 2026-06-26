const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath = "/Users/sami.arevalo/Desktop/info.txt";
const source = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");

const topics = [
  {
    key: "mobbing",
    title: "Mobbing",
    label: "Mobbing o acoso laboral",
    summary:
      "Conductas persistentes de hostigamiento, intimidacion o degradacion que afectan la dignidad y la salud de la persona trabajadora.",
  },
  {
    key: "burnout",
    title: "Burnout",
    label: "Burnout o sindrome de desgaste laboral",
    summary:
      "Cronificacion del estres laboral que se expresa en agotamiento fisico, mental y emocional, perdida de interes y deterioro del desempeno.",
  },
  {
    key: "duelo",
    title: "duelo",
    label: "Duelo organizacional",
    summary:
      "Proceso emocional individual y colectivo frente a perdidas significativas dentro de la organizacion.",
  },
  {
    key: "doble-presencia",
    title: "Doble presencia",
    label: "Doble presencia",
    summary:
      "Necesidad de responder simultaneamente a las demandas del trabajo remunerado y del ambito domestico-familiar.",
  },
  {
    key: "techo-cristal",
    title: "Techo de cristal",
    label: "Techo de cristal",
    summary:
      "Barreras invisibles que limitan el avance profesional de mujeres y otros grupos subrepresentados hacia posiciones de liderazgo.",
  },
  {
    key: "presentismo",
    title: "Presentismo",
    label: "Presentismo laboral",
    summary:
      "Presencia fisica en el trabajo con baja productividad real por enfermedad, agotamiento, desmotivacion o cultura de permanencia.",
  },
  {
    key: "boreout",
    title: "Boreout",
    label: "Boreout o aburrimiento laboral",
    summary:
      "Aburrimiento cronico, infraexigencia y desinteres derivados de tareas poco estimulantes o carentes de sentido.",
  },
  {
    key: "sindrome-superviviente",
    title: "Síndrome del superviviente",
    label: "Sindrome del superviviente",
    summary:
      "Impacto psicologico en quienes permanecen despues de despidos, reducciones de personal o perdidas organizacionales.",
  },
  {
    key: "tecnoestres",
    title: "Tecnoestrés",
    label: "Tecnoestres",
    summary:
      "Efectos psicosociales negativos asociados al uso intensivo, complejo o invasivo de tecnologias digitales.",
  },
];

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function youtubeId(url) {
  const match = url.match(/[?&]v=([^&\s]+)/) || url.match(/youtu\.be\/([^?\s]+)/);
  return match ? match[1] : "";
}

function linkLabel(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return "Mirar video en YouTube";
  if (/\.pdf(\?|$)/i.test(url)) return "Abrir documento PDF";
  try {
    return `Abrir recurso en ${new URL(url).hostname.replace(/^www\./, "")}`;
  } catch {
    return "Abrir recurso externo";
  }
}

function extractSections() {
  const start = source.search(/^Mobbing\s*$/m);
  const body = start >= 0 ? source.slice(start) : source;
  const positions = topics
    .map((topic) => {
      const re = new RegExp(`^${topic.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
      const match = body.match(re);
      return match ? { ...topic, pos: match.index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.pos - b.pos);

  return positions.map((topic, index) => {
    const next = positions[index + 1]?.pos ?? body.length;
    const raw = body.slice(topic.pos, next).trim();
    return { ...topic, raw };
  });
}

const headingMap = new Map([
  ["definición", "Definicion"],
  ["definicion", "Definicion"],
  ["definición y concepto", "Definicion y concepto"],
  ["definicion y concepto", "Definicion y concepto"],
  ["características", "Caracteristicas"],
  ["caracteristicas", "Caracteristicas"],
  ["causas", "Causas"],
  ["causas del presentismo laboral", "Causas"],
  ["causas del tecnoestrés", "Causas"],
  ["causas del tecnoestres", "Causas"],
  ["consecuencias", "Consecuencias"],
  ["consecuencias del presentismo", "Consecuencias"],
  ["consecuencias del tecnoestrés", "Consecuencias"],
  ["consecuencias del tecnoestres", "Consecuencias"],
  ["prevención y recomendaciones", "Prevencion y recomendaciones"],
  ["prevencion y recomendaciones", "Prevencion y recomendaciones"],
  ["mecanismos de prevención en el contexto organizacional", "Mecanismos de prevencion organizacional"],
  ["mecanismos de prevencion en el contexto organizacional", "Mecanismos de prevencion organizacional"],
  ["material de apoyo (videos)", "Material de apoyo"],
  ["material de apoyo ( videos )", "Material de apoyo"],
  ["material de apoyo ( video )", "Material de apoyo"],
  ["referencias bibliográficas", "Referencias bibliograficas"],
  ["referencia bibliográficas", "Referencias bibliograficas"],
  ["referencia bibliograficas", "Referencias bibliograficas"],
]);

function normalizeHeading(line) {
  const normalized = line
    .trim()
    .replace(/\s+/g, " ")
    .replace(/:$/, "")
    .toLowerCase();
  return headingMap.get(normalized);
}

function parseTopic(raw, title) {
  const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
  const content = lines[0] === title ? lines.slice(1) : lines;
  const sections = [];
  let current = { title: "Resumen", lines: [] };

  for (const line of content) {
    const heading = normalizeHeading(line);
    if (heading) {
      if (current.lines.length) sections.push(current);
      current = { title: heading, lines: [] };
    } else {
      current.lines.push(line);
    }
  }

  if (current.lines.length) sections.push(current);
  return sections;
}

function extractGroupedReferences(sections) {
  const tecno = sections.find((topic) => topic.key === "tecnoestres");
  if (!tecno) return new Map();

  const marker = tecno.raw.search(/^Referencia bibliográficas\s*$/m);
  if (marker < 0) return new Map();

  const block = tecno.raw.slice(marker).split("\n").map((line) => line.trim()).filter(Boolean);
  const referenceMap = new Map();
  const headingToKey = new Map([
    ["Techo de cristal", "techo-cristal"],
    ["Presentismo", "presentismo"],
    ["Boreout", "boreout"],
    ["Sindrome del superviviente", "sindrome-superviviente"],
    ["Síndrome del superviviente", "sindrome-superviviente"],
    ["Tecnoestrés", "tecnoestres"],
    ["Tecnoestres", "tecnoestres"],
  ]);
  let currentKey = "";

  for (const line of block.slice(1)) {
    if (headingToKey.has(line)) {
      currentKey = headingToKey.get(line);
      if (!referenceMap.has(currentKey)) referenceMap.set(currentKey, []);
    } else if (currentKey) {
      referenceMap.get(currentKey).push(line);
    }
  }

  tecno.raw = tecno.raw.slice(0, marker).trim();
  return referenceMap;
}

function renderLines(lines) {
  const html = [];
  let list = [];

  function flushList() {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  for (const line of lines) {
    const urlOnly = line.match(/^https?:\/\/\S+$/);
    const bullet = line.match(/^(?:[-•]|\d+[.)])\s*(.+)$/);
    const labelValue = line.match(/^([^:]{3,80}):\s+(.+)$/);

    if (urlOnly) {
      flushList();
      const url = urlOnly[0];
      const id = youtubeId(url);
      const label = id ? `${linkLabel(url)} (${id})` : linkLabel(url);
      html.push(`<a class="resource-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`);
    } else if (bullet) {
      list.push(bullet[1]);
    } else if (labelValue && line.length < 240) {
      flushList();
      html.push(`<p><strong>${escapeHtml(labelValue[1])}:</strong> ${renderInline(labelValue[2])}</p>`);
    } else {
      flushList();
      html.push(`<p>${renderInline(line)}</p>`);
    }
  }

  flushList();
  return html.join("\n");
}

function renderInline(line) {
  const escaped = escapeHtml(line);
  return escaped.replace(/(https?:\/\/[^\s]+)/g, (url) => {
    const clean = url.replace(/[),.]+$/, "");
    const suffix = url.slice(clean.length);
    return `<a href="${clean}" target="_blank" rel="noreferrer">${clean}</a>${escapeHtml(suffix)}`;
  });
}

function layout({ title, body, activeKey = "", description = "" }) {
  const nav = topics
    .map((topic) => {
      const active = topic.key === activeKey ? " active" : "";
      return `<a class="${active}" href="${topic.key}.html">${topic.label}</a>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description || title)}" />
    <title>${escapeHtml(title)} | PsicoWiki</title>
    <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="../styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="../index.html" aria-label="Ir al inicio">
        <span class="brand-mark">PW</span>
        <span>PsicoWiki</span>
      </a>
      <button class="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="top-nav" aria-label="Navegacion principal">
        <a href="../index.html">Inicio</a>
        <a href="../index.html#temas">Temas</a>
        <a href="../index.html#bibliografia">Bibliografia</a>
      </nav>
    </header>

    <aside class="side-nav" aria-label="Temas de la wiki">
      <p>Temas</p>
      ${nav}
    </aside>

    <main class="page-shell">
      ${body}
    </main>

    <footer>
      <p>PsicoWiki - Riesgos Psicosociales en el Entorno Laboral</p>
      <a href="../index.html">Volver al inicio</a>
    </footer>
    <script src="../script.js"></script>
  </body>
</html>
`;
}

function renderTopicPage(topic, groupedReferences) {
  const sections = parseTopic(topic.raw, topic.title);
  const extraReferences = groupedReferences.get(topic.key);
  if (extraReferences?.length && !sections.some((section) => section.title === "Referencias bibliograficas")) {
    sections.push({ title: "Referencias bibliograficas", lines: extraReferences });
  }
  const toc = sections
    .map((section) => `<a href="#${slugify(section.title)}">${escapeHtml(section.title)}</a>`)
    .join("");
  const content = sections
    .map(
      (section) => `<section class="article-section" id="${slugify(section.title)}">
        <h2>${escapeHtml(section.title)}</h2>
        ${renderLines(section.lines)}
      </section>`,
    )
    .join("\n");

  const body = `<article class="topic-page">
        <nav class="breadcrumb" aria-label="Ruta"><a href="../index.html">Inicio</a><span>/</span><span>${escapeHtml(topic.label)}</span></nav>
        <section class="topic-hero">
          <p class="eyebrow">Riesgo psicosocial</p>
          <h1>${escapeHtml(topic.label)}</h1>
          <p>${escapeHtml(topic.summary)}</p>
        </section>
        <section class="article-toc" aria-label="Contenido de la pagina">
          ${toc}
        </section>
        ${content}
      </article>`;

  return layout({
    title: topic.label,
    body,
    activeKey: topic.key,
    description: topic.summary,
  });
}

function renderHome(sections, groupedReferences) {
  const cards = topics
    .map(
      (topic) => `<a class="topic-card" href="topics/${topic.key}.html">
          <span>${escapeHtml(topic.label)}</span>
          <small>${escapeHtml(topic.summary)}</small>
        </a>`,
    )
    .join("\n");

  const bibliography = sections
    .flatMap((topic) =>
      parseTopic(topic.raw, topic.title)
        .filter((section) => section.title === "Referencias bibliograficas")
        .flatMap((section) => section.lines),
    )
    .concat([...groupedReferences.values()].flat())
    .map((line) => `<li>${renderInline(line)}</li>`)
    .join("\n");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Wiki sobre riesgos psicosociales en el entorno laboral." />
    <title>PsicoWiki | Riesgos Psicosociales en el Entorno Laboral</title>
    <link rel="icon" href="favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html" aria-label="Ir al inicio">
        <span class="brand-mark">PW</span>
        <span>PsicoWiki</span>
      </a>
      <button class="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="top-nav" aria-label="Navegacion principal">
        <a href="#temas">Temas</a>
        <a href="#como-usar">Como usar</a>
        <a href="#bibliografia">Bibliografia</a>
      </nav>
    </header>

    <main class="home-shell">
      <section class="hero" id="inicio">
        <div class="hero-content">
          <p class="eyebrow">Wiki colaborativa</p>
          <h1>Riesgos Psicosociales en el Entorno Laboral</h1>
          <p>
            Un portal para comprender, prevenir y gestionar factores psicosociales que afectan la
            salud mental, el bienestar y el desempeno de las personas trabajadoras.
          </p>
          <div class="hero-actions">
            <a class="button primary" href="#temas">Explorar temas</a>
            <a class="button secondary" href="#bibliografia">Ver fuentes</a>
          </div>
        </div>
      </section>

      <section class="section intro" id="temas">
        <p class="eyebrow">Mapa de la wiki</p>
        <h2>Temas principales</h2>
        <p>Selecciona un tema para abrir su pagina con definicion, causas, consecuencias, recomendaciones, recursos y referencias.</p>
        <div class="topic-grid">
          ${cards}
        </div>
      </section>

      <section class="section" id="como-usar">
        <p class="eyebrow">Navegacion</p>
        <h2>Como usar esta wiki</h2>
        <div class="resource-grid">
          <div><h3>1. Elige un tema</h3><p>Cada tarjeta abre una pagina independiente con contenido completo.</p></div>
          <div><h3>2. Revisa recursos</h3><p>Los videos y documentos se abren como enlaces externos para evitar errores de reproductor.</p></div>
          <div><h3>3. Consulta fuentes</h3><p>La bibliografia general reune las referencias importadas desde el archivo base.</p></div>
        </div>
      </section>

      <section class="section bibliography" id="bibliografia">
        <p class="eyebrow">Fuentes de consulta</p>
        <h2>Bibliografia general</h2>
        <ul>${bibliography}</ul>
      </section>
    </main>

    <footer>
      <p>PsicoWiki - Riesgos Psicosociales en el Entorno Laboral</p>
      <a href="#inicio">Volver al inicio</a>
    </footer>
    <script src="script.js"></script>
  </body>
</html>
`;
}

const sections = extractSections();
const groupedReferences = extractGroupedReferences(sections);
fs.mkdirSync(path.join(root, "topics"), { recursive: true });
for (const topic of sections) {
  fs.writeFileSync(path.join(root, "topics", `${topic.key}.html`), renderTopicPage(topic, groupedReferences));
}
fs.writeFileSync(path.join(root, "index.html"), renderHome(sections, groupedReferences));
