(() => {
  "use strict";

  const DATA_PATH = "data/events.json";
  const BOOKS = ["mateus", "marcos", "lucas", "joao"];
  const BOOK_NAMES = { mateus: "Mateus", marcos: "Marcos", lucas: "Lucas", joao: "João" };

  const state = {
    data: null,
    events: [],
    filteredEvents: [],
    query: "",
    phase: "",
    parallelOnly: false
  };

  const elements = {
    appHeader: document.querySelector(".app-header"),
    title: document.querySelector("#page-title"),
    subtitle: document.querySelector("#page-subtitle"),
    timelineBody: document.querySelector("#timeline-body"),
    timelineHeaderScroller: document.querySelector("#timeline-header-scroller"),
    rowTemplate: document.querySelector("#event-row-template"),
    searchInput: document.querySelector("#search-input"),
    phaseFilter: document.querySelector("#phase-filter"),
    parallelFilter: document.querySelector("#parallel-filter"),
    clearFilters: document.querySelector("#clear-filters"),
    emptyState: document.querySelector("#empty-state"),
    errorState: document.querySelector("#error-state"),
    retryLoad: document.querySelector("#retry-load"),
    phaseNavigation: document.querySelector("#phase-navigation"),
    railProgress: document.querySelector("#rail-progress"),
    backToTop: document.querySelector("#back-to-top")
  };

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function countReferences(event) {
    return event._referenceCount ?? BOOKS.reduce(
      (total, book) => total + (event.references?.[book] ? 1 : 0),
      0
    );
  }

  function buildSearchIndex(event) {
    const terms = [event.event, event.phase];
    BOOKS.forEach(book => {
      const passage = event.passages?.[book];
      terms.push(passage?.reference || event.references?.[book] || "");
      passage?.verses?.forEach(verse => terms.push(verse.text));
    });
    return normalize(terms.join(" "));
  }

  function validateData(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("O conteúdo do JSON não é um objeto válido.");
    }
    if (!Array.isArray(payload.events)) {
      throw new Error('O JSON precisa conter uma propriedade "events" em formato de lista.');
    }

    payload.events.forEach((event, index) => {
      const label = `Evento ${event?.order ?? index + 1}`;
      if (!event?.event || !event.references || !event.passages) {
        throw new Error(`${label} está incompleto: nome, references e passages são obrigatórios.`);
      }

      BOOKS.forEach(book => {
        const reference = event.references[book];
        const passage = event.passages[book];
        if (reference) {
          if (!passage || !Array.isArray(passage.verses) || passage.verses.length === 0) {
            throw new Error(`${label}: ${BOOK_NAMES[book]} (${reference}) não possui versículos.`);
          }
          if (passage.reference !== reference) {
            throw new Error(`${label}: a referência de ${BOOK_NAMES[book]} não corresponde à passagem.`);
          }
          passage.verses.forEach((verse, verseIndex) => {
            if (!verse || verse.verse == null || !String(verse.text ?? "").trim()) {
              throw new Error(`${label}: versículo ${verseIndex + 1} de ${BOOK_NAMES[book]} é inválido.`);
            }
          });
        } else if (passage !== null) {
          throw new Error(`${label}: ${BOOK_NAMES[book]} deve ser null quando não há referência.`);
        }
      });
    });
    return payload;
  }

  async function loadDefaultData() {
    if (window.__TIMELINE_EVENTS_DATA__) {
      return validateData(window.__TIMELINE_EVENTS_DATA__);
    }
    const response = await fetch(DATA_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error(`Falha ao carregar ${DATA_PATH}: ${response.status}`);
    return validateData(await response.json());
  }

  function applyData(payload, sourceLabel = "events.json") {
    state.data = payload;
    state.events = payload.events
      .map(event => ({
        ...event,
        _referenceCount: BOOKS.reduce(
          (total, book) => total + (event.references?.[book] ? 1 : 0), 0
        ),
        _searchIndex: buildSearchIndex(event)
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    elements.title.textContent = payload.meta?.title || "Timeline";
    elements.subtitle.textContent = payload.meta?.subtitle ||
      "";
    elements.errorState.hidden = true;
    populatePhaseFilter();
    applyFilters();
  }

  function populatePhaseFilter() {
    const selected = elements.phaseFilter.value;
    const phases = [...new Set(state.events.map(event => event.phase).filter(Boolean))];
    elements.phaseFilter.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Todas as fases";
    elements.phaseFilter.append(allOption);
    phases.forEach(phase => {
      const option = document.createElement("option");
      option.value = phase;
      option.textContent = phase;
      elements.phaseFilter.append(option);
    });
    if (phases.includes(selected)) elements.phaseFilter.value = selected;
  }

  function applyFilters() {
    const query = normalize(state.query);
    state.filteredEvents = state.events.filter(event => {
      const matchesQuery = !query || event._searchIndex.includes(query);
      const matchesPhase = !state.phase || event.phase === state.phase;
      const matchesParallel = !state.parallelOnly || countReferences(event) >= 2;
      return matchesQuery && matchesPhase && matchesParallel;
    });
    renderTimeline();
  }

  function renderVerse(verse) {
    const element = document.createElement("span");
    element.className = "verse";
    const number = document.createElement("sup");
    number.className = "verse-number";
    number.textContent = verse.verse;
    const text = document.createElement("span");
    text.className = "verse-text";
    text.textContent = verse.text;
    element.append(number, text);
    return element;
  }

  function renderPassage(passage, book) {
    const card = document.createElement("section");
    card.className = "passage-card";
    card.setAttribute("aria-label", `${BOOK_NAMES[book]}, ${passage.reference}`);
    const reference = document.createElement("h3");
    reference.className = "passage-reference";
    reference.textContent = passage.reference;
    const verses = document.createElement("div");
    verses.className = "passage-verses";
    const fragment = document.createDocumentFragment();
    passage.verses.forEach(verse => fragment.append(renderVerse(verse)));
    verses.append(fragment);
    card.append(reference, verses);
    return card;
  }

  function createMissingPassage(book) {
    const missing = document.createElement("div");
    missing.className = "passage-missing";
    missing.setAttribute("aria-label", `${BOOK_NAMES[book]}: não relatado neste Evangelho`);
    missing.textContent = "Não relatado neste Evangelho";
    return missing;
  }

  function renderTimeline() {
    const fragment = document.createDocumentFragment();
    let previousPhase = "";
    state.filteredEvents.forEach(event => {
      const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);
      row.id = `evento-${event.order}`;
      row.dataset.order = event.order;
      row.dataset.phase = event.phase || "";
      row.classList.toggle("is-phase-start", event.phase !== previousPhase);
      row.querySelector(".event-order").textContent = `Evento ${String(event.order).padStart(3, "0")}`;
      row.querySelector(".event-title").textContent = event.event;
      row.querySelector(".phase-label").textContent = event.phase || "Sem fase definida";
      row.querySelector(".event-note").textContent = event.note || "";
      BOOKS.forEach(book => {
        const cell = row.querySelector(`[data-book="${book}"]`);
        const mobileLabel = document.createElement("h3");
        mobileLabel.className = "mobile-book-label";
        mobileLabel.textContent = BOOK_NAMES[book];
        cell.append(mobileLabel, event.passages[book]
          ? renderPassage(event.passages[book], book)
          : createMissingPassage(book));
      });
      fragment.append(row);
      previousPhase = event.phase;
    });
    elements.timelineBody.replaceChildren(fragment);
    elements.emptyState.hidden = state.filteredEvents.length !== 0;
    buildPhaseNavigation();
    requestAnimationFrame(updateScrollState);
  }

  function buildPhaseNavigation() {
    elements.phaseNavigation.replaceChildren();
    const phaseStarts = [];
    const seen = new Set();
    state.filteredEvents.forEach(event => {
      if (!seen.has(event.phase)) { seen.add(event.phase); phaseStarts.push(event); }
    });
    phaseStarts.forEach((event, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "phase-nav-button";
      button.style.top = phaseStarts.length === 1 ? "0%" : `${(index / (phaseStarts.length - 1)) * 100}%`;
      button.title = event.phase;
      button.setAttribute("aria-label", `Ir para ${event.phase}`);
      button.addEventListener("click", () => document.querySelector(`#evento-${event.order}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      elements.phaseNavigation.append(button);
    });
  }

  function updateScrollState() {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = documentHeight > 0 ? window.scrollY / documentHeight : 0;
    elements.railProgress.style.height = `${Math.min(1, Math.max(0, progress)) * 100}%`;
    elements.backToTop.classList.toggle("is-visible", window.scrollY > 600);
    const threshold = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) + 120;
    let activePhase = "";
    for (const row of document.querySelectorAll(".timeline-row")) {
      if (row.getBoundingClientRect().top <= threshold) activePhase = row.dataset.phase;
      else break;
    }
    elements.phaseNavigation.querySelectorAll(".phase-nav-button").forEach(button => {
      button.classList.toggle("is-active", button.title === activePhase);
    });
  }

  function syncHeaderHeight() {
    document.documentElement.style.setProperty(
      "--header-height",
      `${Math.ceil(elements.appHeader.getBoundingClientRect().height)}px`
    );
  }

  elements.searchInput.addEventListener("input", event => { state.query = event.target.value; applyFilters(); });
  elements.phaseFilter.addEventListener("change", event => { state.phase = event.target.value; applyFilters(); });
  elements.parallelFilter.addEventListener("change", event => { state.parallelOnly = event.target.checked; applyFilters(); });
  elements.clearFilters.addEventListener("click", () => {
    state.query = ""; state.phase = ""; state.parallelOnly = false;
    elements.searchInput.value = ""; elements.phaseFilter.value = ""; elements.parallelFilter.checked = false;
    applyFilters();
  });
  elements.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  elements.retryLoad.addEventListener("click", () => window.location.reload());
  elements.timelineBody.addEventListener("scroll", () => {
    elements.timelineHeaderScroller.scrollLeft = elements.timelineBody.scrollLeft;
  }, { passive: true });
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", () => {
    syncHeaderHeight();
    updateScrollState();
  });
  new ResizeObserver(() => {
    syncHeaderHeight();
    updateScrollState();
  }).observe(elements.appHeader);
  syncHeaderHeight();
  loadDefaultData().then(payload => applyData(payload)).catch(error => {
    elements.errorState.hidden = false;
    console.error(error);
  });
})();
