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

function initGalleryCarousels() {
  const carousels = document.querySelectorAll(".gallery-carousel");
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".gallery-carousel__track");
    const prevButton = carousel.querySelector('[data-dir="prev"]');
    const nextButton = carousel.querySelector('[data-dir="next"]');
    const viewport = carousel.querySelector(".gallery-carousel__viewport");

    if (!track || !prevButton || !nextButton) return;

    const items = Array.from(track.children);
    if (!items.length) return;

    let currentIndex = 0;

    const getGap = () => {
      const computed = getComputedStyle(track);
      return parseFloat(computed.columnGap || computed.gap || 0) || 0;
    };

    const getVisibleCount = () => {
      const firstItem = items[0];
      if (!firstItem || !viewport) return 1;

      const viewportWidth = viewport.clientWidth || track.clientWidth || 0;
      const firstItemWidth = firstItem.getBoundingClientRect().width || 0;
      const gap = getGap();

      if (!viewportWidth || !firstItemWidth) return 1;

      const visible = Math.max(1, Math.min(items.length, Math.floor((viewportWidth + gap) / (firstItemWidth + gap))));
      return visible;
    };

    const getOffset = () => {
      const firstItem = items[0];
      if (!firstItem) return 0;

      const firstItemWidth = firstItem.getBoundingClientRect().width || 0;
      return firstItemWidth + getGap();
    };

    const updateButtons = () => {
      const maxIndex = Math.max(0, items.length - getVisibleCount());
      prevButton.disabled = currentIndex <= 0;
      nextButton.disabled = currentIndex >= maxIndex;
    };

    const moveTo = (index) => {
      const maxIndex = Math.max(0, items.length - getVisibleCount());
      currentIndex = Math.max(0, Math.min(index, maxIndex));
      track.style.transform = `translateX(-${currentIndex * getOffset()}px)`;
      updateButtons();
    };

    prevButton.addEventListener("click", () => moveTo(currentIndex - 1));
    nextButton.addEventListener("click", () => moveTo(currentIndex + 1));
    window.addEventListener("resize", () => moveTo(currentIndex));

    moveTo(0);
  });
}

function initImageLightbox() {
  const galleryImages = Array.from(document.querySelectorAll(".gallery img, .gallery-carousel__item img, .gallery-section img, .gallery-subsection img"));
  if (!galleryImages.length) return;

  let activeIndex = -1;
  let lightbox = document.querySelector(".image-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "image-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.innerHTML = `
      <button class="image-lightbox__close" type="button" aria-label="Close image">×</button>
      <img class="image-lightbox__image" alt="" />
    `;
    document.body.appendChild(lightbox);
  }

  const lightboxImage = lightbox.querySelector(".image-lightbox__image");
  const closeButton = lightbox.querySelector(".image-lightbox__close");

  const showImage = (index) => {
    if (!galleryImages.length) return;

    activeIndex = (index + galleryImages.length) % galleryImages.length;
    const img = galleryImages[activeIndex];
    const source = img.currentSrc || img.src;
    lightboxImage.src = source;
    lightboxImage.alt = img.alt || "";
  };

  const openLightbox = (img) => {
    activeIndex = galleryImages.indexOf(img);
    if (activeIndex === -1) activeIndex = 0;
    showImage(activeIndex);
    document.body.classList.add("lightbox-open");
    lightbox.classList.add("is-open");
  };

  const closeLightbox = () => {
    document.body.classList.remove("lightbox-open");
    lightbox.classList.remove("is-open");
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
  };

  galleryImages.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", (event) => {
      event.preventDefault();
      openLightbox(img);
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) {
      if (event.key === "Escape") closeLightbox();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showImage(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showImage(activeIndex - 1);
    }
  });
}

function loadAosLibrary() {
  return new Promise((resolve, reject) => {
    if (window.AOS) {
      resolve();
      return;
    }

    const existingCss = document.querySelector('link[href*="aos.css"]');
    if (!existingCss) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/aos@2.3.4/dist/aos.css";
      document.head.appendChild(css);
    }

    const existingScript = document.querySelector('script[src*="aos.js"]');
    if (existingScript) {
      if (window.AOS) {
        resolve();
        return;
      }
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/aos@2.3.4/dist/aos.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function applyAosAnimations() {
  if (!window.AOS) return;

  const selectors = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "p",
    "blockquote",
    "li",
    ".eyebrow",
    ".lead",
    ".muted",
    ".nav__link",
    ".nav__dropdown-link",
    ".header__cta",
    ".hero__content > *",
    ".section-head",
    ".card",
    ".service",
    ".quote"
  ];

  const elements = Array.from(document.querySelectorAll(selectors.join(", ")));

  elements.forEach((el, index) => {
    if (el.hasAttribute("data-aos")) return;
    el.setAttribute("data-aos", "fade-up");
    el.setAttribute("data-aos-duration", "550");
    el.setAttribute("data-aos-delay", String(Math.min(index * 40, 220)));
  });

  AOS.init({
    once: true,
    duration: 550,
    easing: "ease-out-cubic",
    offset: 80,
    mirror: false
  });
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
  initGalleryCarousels();
  initImageLightbox();
  await loadAosLibrary();
  applyAosAnimations();
  if (typeof wireScrollSheen === "function") {
    wireScrollSheen();
  }
})();
