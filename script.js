const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
const typingLines = [...document.querySelectorAll(".typing-line")];
const gallery = document.querySelector("[data-gallery]");
const folderTabs = [...document.querySelectorAll("[data-folder-tab]")];
const folderPanels = [...document.querySelectorAll("[data-folder-panel]")];
const copyEmailButtons = [...document.querySelectorAll("[data-copy-email]")];

menuButton?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});

function setupEmailCopy() {
  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  copyEmailButtons.forEach((button) => {
    const hint = button.querySelector(".copy-hint");
    const defaultHint = hint?.textContent ?? "Click to copy";
    let resetTimer;

    button.addEventListener("click", async () => {
      const email = button.dataset.copyEmail;
      if (!email) return;

      try {
        await copyText(email);
        button.classList.add("is-copied");
        if (hint) hint.textContent = "Copied";
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.classList.remove("is-copied");
          if (hint) hint.textContent = defaultHint;
        }, 1800);
      } catch {
        if (hint) hint.textContent = "Copy failed";
      }
    });
  });
}

function typeText(element, delay = 56) {
  const text = element.dataset.text ?? "";
  let index = 0;

  return new Promise((resolve) => {
    const writeNextCharacter = () => {
      element.textContent = text.slice(0, index);

      if (index > text.length) {
        element.classList.add("is-complete");
        resolve();
        return;
      }

      index += 1;
      window.setTimeout(writeNextCharacter, delay);
    };

    writeNextCharacter();
  });
}

async function runTypingIntro() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typingLines.forEach((line) => {
      line.textContent = line.dataset.text ?? "";
      line.classList.add("is-complete");
    });
    return;
  }

  for (const [index, line] of typingLines.entries()) {
    await typeText(line, index === 0 ? 54 : 44);
    await new Promise((resolve) => window.setTimeout(resolve, 360));
  }
}

runTypingIntro();
setupEmailCopy();

const galleryPhotos = [
  {
    title: "Midnight Signal",
    meta: "Urban light study",
    alt: "Monochrome city light study",
    src: "https://picsum.photos/seed/kevin-frame-01/1400/900"
  },
  {
    title: "Glass Crossing",
    meta: "Street reflection",
    alt: "Reflected street scene in glass",
    src: "https://picsum.photos/seed/kevin-frame-02/1400/900"
  },
  {
    title: "Soft Horizon",
    meta: "Landscape mood",
    alt: "Quiet landscape with distant horizon",
    src: "https://picsum.photos/seed/kevin-frame-03/1400/900"
  },
  {
    title: "Room Tone",
    meta: "Interior portrait",
    alt: "Atmospheric portrait scene",
    src: "https://picsum.photos/seed/kevin-frame-04/1400/900"
  },
  {
    title: "Station Drift",
    meta: "Travel note",
    alt: "Travel photograph near a transit station",
    src: "https://picsum.photos/seed/kevin-frame-05/1400/900"
  },
  {
    title: "After Rain",
    meta: "Night texture",
    alt: "Wet pavement and night texture",
    src: "https://picsum.photos/seed/kevin-frame-06/1400/900"
  }
];

function createStackButton(photo, index, stackIndex) {
  const button = document.createElement("button");
  button.className = "stack-thumb";
  button.type = "button";
  button.style.setProperty("--stack-index", String(stackIndex));
  button.setAttribute("aria-label", `Show ${photo.title}`);
  button.dataset.photoIndex = String(index);
  button.innerHTML = `<img src="${photo.src}" alt="${photo.alt}" />`;
  return button;
}

function setupGallery() {
  if (!gallery) return;

  const mainScreen = gallery.querySelector(".main-screen");
  const mainPhoto = gallery.querySelector("[data-main-photo]");
  const photoTitle = gallery.querySelector("[data-photo-title]");
  const photoMeta = gallery.querySelector("[data-photo-meta]");
  const photoCount = gallery.querySelector("[data-photo-count]");
  const previousStack = gallery.querySelector('[data-stack="previous"]');
  const nextStack = gallery.querySelector('[data-stack="next"]');
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentIndex = 0;
  let autoSlide;

  if (!mainScreen || !mainPhoto || !photoTitle || !photoMeta || !photoCount || !previousStack || !nextStack) {
    return;
  }

  const wrapIndex = (index) => (index + galleryPhotos.length) % galleryPhotos.length;

  const renderStacks = () => {
    previousStack.replaceChildren();
    nextStack.replaceChildren();

    for (let offset = 1; offset <= 3; offset += 1) {
      const previousIndex = wrapIndex(currentIndex - offset);
      const nextIndex = wrapIndex(currentIndex + offset);
      previousStack.append(createStackButton(galleryPhotos[previousIndex], previousIndex, offset - 1));
      nextStack.append(createStackButton(galleryPhotos[nextIndex], nextIndex, offset - 1));
    }
  };

  const setPhoto = (index, animate = true) => {
    currentIndex = wrapIndex(index);
    const photo = galleryPhotos[currentIndex];

    if (animate) {
      mainScreen.classList.add("is-switching");
    }

    window.setTimeout(
      () => {
        mainPhoto.src = photo.src;
        mainPhoto.alt = photo.alt;
        photoTitle.textContent = photo.title;
        photoMeta.textContent = photo.meta;
        photoCount.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(galleryPhotos.length).padStart(2, "0")}`;
        renderStacks();
        mainScreen.classList.remove("is-switching");
      },
      animate ? 190 : 0
    );
  };

  const restartAutoSlide = () => {
    window.clearInterval(autoSlide);
    if (!reducedMotion) {
      autoSlide = window.setInterval(() => setPhoto(currentIndex + 1), 3600);
    }
  };

  gallery.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const stackButton = event.target.closest("[data-photo-index]");
    const control = event.target.closest("[data-gallery-control]");

    if (stackButton) {
      setPhoto(Number(stackButton.dataset.photoIndex));
      restartAutoSlide();
      return;
    }

    if (control?.dataset.galleryControl === "next") {
      setPhoto(currentIndex + 1);
      restartAutoSlide();
      return;
    }

    if (control?.dataset.galleryControl === "prev") {
      setPhoto(currentIndex - 1);
      restartAutoSlide();
    }
  });

  setPhoto(0, false);
  restartAutoSlide();
}

function setupFolders() {
  if (!folderTabs.length || !folderPanels.length) return;

  folderTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const activeFolder = tab.dataset.folderTab;

      folderTabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      folderPanels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.folderPanel === activeFolder);
      });
    });
  });
}

setupGallery();
setupFolders();
