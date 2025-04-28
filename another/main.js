const sheets = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSspnRwJGKqormhkYX3LO808JlyyKo4zTmQuhZjBarHtMjb-A9v7leq2vDsHO2gW6DRmRtl-IWuNgYC/pub?output=csv";
const response = await fetch(sheets);
const csvText = await response.text();

const sanitizeName = (name) => {
  const accentsMap = new Map([
    ['á', 'a'], ['à', 'a'], ['â', 'a'], ['ä', 'a'], ['ã', 'a'], ['å', 'a'],
    ['é', 'e'], ['è', 'e'], ['ê', 'e'], ['ë', 'e'],
    ['í', 'i'], ['ì', 'i'], ['î', 'i'], ['ï', 'i'],
    ['ó', 'o'], ['ò', 'o'], ['ô', 'o'], ['ö', 'o'], ['õ', 'o'], ['ø', 'o'],
    ['ú', 'u'], ['ù', 'u'], ['û', 'u'], ['ü', 'u'],
    ['ý', 'y'], ['ÿ', 'y'], ['ñ', 'n'], ['ç', 'c']
  ]);
  let sanitized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  sanitized = Array.from(sanitized).map(char => accentsMap.get(char) || char).join('');
  return sanitized.replace(/[^A-Za-z0-9_\-]/g, '_');
};

const csvToJson = (csvString) => {
  try {
    const lines = [];
    let currentLine = '';
    let insideQuotes = false;
    for (let i = 0; i < csvString.length; i++) {
      const char = csvString[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
        currentLine += char;
      } else if (char === '\n' && !insideQuotes) {
        lines.push(currentLine);
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine) lines.push(currentLine);

    const headers = lines[0].split(',').map(header => header.trim());
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue);

      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        value = value.replace(/\r/g, '');
        if (value.includes('\n')) {
          value = value.split('\n').map(line => `<p>${line.trim()}</p>`).join('');
        }
        obj[header] = value;
      });
      result.push(obj);
    }
    return result;
  } catch (error) {
    console.error("Erreur lors de la conversion CSV en JSON:", error);
    return [];
  }
};

const addInfiniteGradient = () => {
  const style = document.createElement("style");
  style.textContent = `
    body {
      background: linear-gradient(45deg, rgb(37, 37, 37),rgb(15, 15, 15), rgb(32, 32, 32),rgb(29, 30, 29));
      background-size: 100% 300%;
      animation: gradientShift 10s linear infinite;
    }
    @keyframes gradientShift {
      0% { background-position: 50% 0%; }
      50% { background-position: 50% 50%; }
      100% { background-position: 50% 100%; }
    }
  `;
  document.head.appendChild(style);
};
addInfiniteGradient();

let json = csvToJson(csvText);
console.log(json);
json = [...json, ...json, ...json, ...json];

const $projets = document.querySelector(".projets");

$projets.style.display = "flex";
$projets.style.gap = "50px";
$projets.style.alignItems = "center";
$projets.style.justifyContent = "start";
$projets.style.position = "absolute";
$projets.style.top = "50%";
$projets.style.left = "0";
$projets.style.transform = "translateY(-50%)";
$projets.style.width = "max-content";

json.forEach((item) => {
  const div = document.createElement("div");
  div.classList.add("projet");
  $projets.appendChild(div);

  const img = document.createElement("img");
  img.src = `img/${sanitizeName(item.titre)}.png`;
  img.style.width = "450px";
  img.style.height = "auto";
  div.appendChild(img);

  div.addEventListener("click", () => {
    const header = document.querySelector("header");
    header.classList.add("fixed");
    const projets = document.querySelector(".projets");
    projets.classList.add("fixed");

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    document.body.appendChild(overlay);

    const wrap = document.createElement("div");
    wrap.classList.add("wrap");
    overlay.appendChild(wrap);

    const fiche = document.createElement("div");
    fiche.classList.add("fiche");
    wrap.appendChild(fiche);

    const close = document.createElement("div");
    close.textContent = "×";
    close.classList.add("close");
    overlay.appendChild(close);

    close.addEventListener("click", () => {
      gsap.to(overlay, { opacity: 0, duration: 1, onComplete: () => overlay.remove() });
      header.classList.remove("fixed");
      projets.classList.remove("fixed");
    });

    const img = document.createElement("img");
    img.src = `img/${sanitizeName(item.titre)}.png`;
    img.classList.add("intro");
    fiche.appendChild(img);

    const titre = document.createElement("h1");
    titre.textContent = item.titre;
    fiche.appendChild(titre);

    const desc = document.createElement("div");
    desc.innerHTML = item.modale;
    desc.classList.add("description");
    fiche.appendChild(desc);

    if(item.images !== "") {
      const images = item.images.split(",");
      const gallery = document.createElement("div");
      gallery.classList.add("gallery");
      images.forEach((image) => {
        const ext = image.split('.').pop().toLowerCase();
        if (ext === 'mp4') {
          const video = document.createElement("video");
          video.src = `img/${sanitizeName(item.titre)}/${image}`;
          video.controls = true;
          video.autoplay = true;
          video.loop = true;
          video.poster = `img/${sanitizeName(item.titre)}/${image.replace('.mp4', '.jpg')}`;
          gallery.appendChild(video);
        } else {
          const img = document.createElement("img");
          img.src = `img/${sanitizeName(item.titre)}/${image}`;
          gallery.appendChild(img);
        }
      });
      fiche.appendChild(gallery);
    }

    gsap.from(fiche, { opacity: 0, duration: 0.4 });
    gsap.from(overlay, { opacity: 0, duration: 0.4 });
  });
});

const tl = gsap.timeline({ repeat: -1 });
tl.to($projets, {
  x: () => `-${$projets.scrollWidth / 2}px`,
  duration: 20,
  ease: "linear",
});

gsap.to(".nom", {
  y: -20,
  duration: 2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut"
});