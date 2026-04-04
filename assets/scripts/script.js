// assets/scripts/script.js

const cfg = window.SITE_CONFIG || {};

function getCurrentPageKey() {
  const path = window.location.pathname;
  const file = path.split("/").pop() || "index.html";
  return file;
}

function applySeo() {
  const pageKey = getCurrentPageKey();
  const page = (cfg.pages && cfg.pages[pageKey]) || {};

  const title = page.title || cfg.businessName || "Website";
  document.title = title;

  const desc = page.description || "";
  if (desc) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }
}

function renderTemplate(html) {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = cfg[key];
    return typeof val === "string" || typeof val === "number" ? String(val) : "";
  });
}

async function includePartials() {
  const nodes = document.querySelectorAll("[data-include]");
  for (const node of nodes) {
    const url = node.getAttribute("data-include");
    if (!url) continue;

    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      node.innerHTML = `<!-- include failed: ${url} -->`;
      continue;
    }

    const html = await res.text();
    node.innerHTML = renderTemplate(html);
  }
}

function applyYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = year));
}

function wireNav() {
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.querySelector(".nav-panel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => panel.classList.toggle("is-open"));

  panel.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.matches("a")) panel.classList.remove("is-open");
  });
}

function wireHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const update = () => {
    const isScrolled = window.scrollY > 0;
    header.classList.toggle("site-header--scrolled", isScrolled);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

// function wireScrollSheen() {
//   const aboutSection = document.querySelector(".section--about");
//   if (!aboutSection) return;

//   const update = () => {
//     const rect = aboutSection.getBoundingClientRect();
//     const sectionTop = rect.top;
//     const sectionHeight = rect.height;
//     const windowHeight = window.innerHeight;
    
//     // Calculate progress: 0 when section enters top of viewport, 1 when section exits bottom
//     const progress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (windowHeight + sectionHeight)));
    
//     // Calculate translate amounts based on scroll progress
//     // Start at -150% and move to +150%
//     const translatePercent = -150 + (progress * 300);
    
//     aboutSection.style.setProperty("--sheen-x", translatePercent + "%");
//     aboutSection.style.setProperty("--sheen-y", translatePercent + "%");
//   };

//   update();
//   window.addEventListener("scroll", update, { passive: true });
// }

(async function init() {
  applySeo();
  await includePartials();
  applyYear();
  wireNav();
  wireHeaderScroll();
  wireScrollSheen();
})();
