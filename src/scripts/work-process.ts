/**
 * Scroll model for the production line:
 * 1. Approach — the product box travels down to the center while the belt
 *    moves upward beneath it. Stations stay put until the box arrives.
 * 2. Processing — the box stays centered while the belt and stations move upward.
 *
 * Travel distance is derived from the stations in the DOM, so the stage count
 * can change without rewriting this interaction.
 */

interface Metrics {
  anchor: number;
  spacing: number;
  approach: number;
  processing: number;
  total: number;
  scrollable: number;
  tallest: number;
  productHalf: number;
  beltCenter: number;
}

interface MountedRoot extends HTMLElement {
  __workProcessAbort?: AbortController;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Drawing shown with the active text panel. */
function productVariant(contentId: string): string {
  if (contentId === "building") return "plan";
  if (contentId === "iteration") return "soft";
  if (contentId === "fit") return "concrete";
  return "threads";
}

export function mountWorkProcess(root: HTMLElement): void {
  const host = root as MountedRoot;
  host.__workProcessAbort?.abort();

  const controller = new AbortController();
  host.__workProcessAbort = controller;
  const { signal } = controller;

  const pin = root.querySelector<HTMLElement>("[data-pin]");
  const line = root.querySelector<HTMLElement>("[data-line]");
  const track = root.querySelector<HTMLElement>("[data-track]");
  const belt = root.querySelector<HTMLElement>("[data-belt]");
  const product = root.querySelector<HTMLElement>("[data-product]");
  if (!pin || !line || !track || !belt || !product) return;

  const stations = [...root.querySelectorAll<HTMLElement>("[data-station]")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")];
  const resting = root.querySelector<HTMLElement>("[data-resting]");
  const restingId = resting?.dataset.panel ?? "";
  if (stations.length === 0) return;

  let metrics = measure();
  let activeKey = "";
  let scrollQueued = false;
  let lastLineWidth = -1;
  let lastLineHeight = -1;
  let lastPinHeight = -1;

  function measure(): Metrics {
    const lineHeight = line!.clientHeight;
    const viewport = pin!.clientHeight || window.innerHeight;
    const productHalf = product!.offsetHeight / 2;
    const tallest = Math.max(
      88,
      ...stations.map((station) => station.offsetHeight),
    );
    const anchor = lineHeight / 2;
    const spacing = clamp(lineHeight * 0.4, tallest + 64, 340);
    const minCenter = productHalf + Math.max(20, lineHeight * 0.05);
    const approach = Math.min(spacing * 0.9, Math.max(0, anchor - minCenter));
    const processing = Math.max(0, stations.length - 1) * spacing;
    const hold = spacing * 0.72;
    const total = approach + processing + hold;
    const scrollable = Math.max(
      viewport * 0.85,
      (total * viewport * 0.84) / spacing,
    );

    const lineWidth = line!.clientWidth;
    const lineRect = line!.getBoundingClientRect();
    const beltRect = belt!.getBoundingClientRect();
    const beltCenter = beltRect.left - lineRect.left + beltRect.width / 2;

    stations.forEach((station, index) => {
      const seat = station.querySelector<HTMLElement>(".station__seat");
      const seatMid = seat
        ? seat.offsetTop + seat.offsetHeight / 2
        : station.offsetHeight / 2;
      const half = station.offsetWidth / 2;
      const left = clamp(beltCenter, half, Math.max(half, lineWidth - half));
      station.style.top = `${anchor + index * spacing - seatMid}px`;
      station.style.left = `${left}px`;
    });

    track!.style.height = `${anchor + processing + lineHeight}px`;
    root.style.height = `${viewport + scrollable}px`;

    return {
      anchor,
      spacing,
      approach,
      processing,
      total,
      scrollable,
      tallest,
      productHalf,
      beltCenter,
    };
  }

  function resolveStage(
    boxCenter: number,
    trackY: number,
  ): { contentId: string; litId: string | null } {
    const threshold = metrics.tallest * 0.5;
    let closestId = restingId;
    let closestDist = Infinity;
    let passedId = restingId;

    stations.forEach((station, index) => {
      const center = metrics.anchor + index * metrics.spacing + trackY;
      const dist = Math.abs(center - boxCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = station.dataset.station ?? restingId;
      }
      if (center <= boxCenter + metrics.tallest * 0.12) {
        passedId = station.dataset.station ?? passedId;
      }
    });

    const inside = closestDist <= threshold && closestId !== restingId;
    return {
      contentId: inside ? closestId : passedId,
      litId: inside ? closestId : null,
    };
  }

  function setActive(contentId: string, litId: string | null): void {
    const key = `${contentId}|${litId ?? ""}`;
    if (key === activeKey) return;
    activeKey = key;
    root.dataset.active = contentId;
    product.dataset.state = productVariant(contentId);

    for (const station of stations) {
      station.classList.toggle("is-active", station.dataset.station === litId);
    }

    for (const panel of panels) {
      const on = panel.dataset.panel === contentId;
      panel.classList.toggle("is-active", on);
      panel.toggleAttribute("inert", !on);
      panel.setAttribute("aria-hidden", on ? "false" : "true");
    }
  }

  function render(): void {
    const sectionTop = window.scrollY + root.getBoundingClientRect().top;
    const scrolled = window.scrollY - sectionTop;
    const progress =
      metrics.scrollable <= 0 ? 0 : clamp(scrolled / metrics.scrollable, 0, 1);
    const traveled = progress * metrics.total;

    let boxCenter: number;
    let trackY: number;
    let beltShift: number;

    if (traveled <= metrics.approach) {
      boxCenter = metrics.anchor - metrics.approach + traveled;
      trackY = 0;
      beltShift = -traveled;
    } else {
      boxCenter = metrics.anchor;
      trackY = -Math.min(traveled - metrics.approach, metrics.processing);
      beltShift = -metrics.approach;
    }

    product!.style.left = `${metrics.beltCenter}px`;
    product!.style.transform = `translate3d(-50%, ${Math.round(boxCenter - metrics.productHalf - trackY)}px, 0)`;
    track!.style.transform = `translate3d(0, ${Math.round(trackY)}px, 0)`;
    belt!.style.setProperty("--belt-shift", `${Math.round(beltShift)}px`);
    line!.dataset.phase =
      traveled <= metrics.approach ? "approach" : "processing";
    const stage = resolveStage(boxCenter, trackY);
    setActive(stage.contentId, stage.litId);
  }

  function onScroll(): void {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      if (signal.aborted) return;
      render();
    });
  }

  function onResize(): void {
    const width = line!.clientWidth;
    const height = line!.clientHeight;
    const pinHeight = pin!.clientHeight;
    if (
      width === lastLineWidth &&
      height === lastLineHeight &&
      pinHeight === lastPinHeight
    )
      return;
    lastLineWidth = width;
    lastLineHeight = height;
    lastPinHeight = pinHeight;
    metrics = measure();
    render();
  }

  window.addEventListener("scroll", onScroll, { passive: true, signal });
  window.addEventListener("resize", onResize, { signal });
  document.fonts?.ready.then(() => {
    if (signal.aborted) return;
    onResize();
  });

  const observer = new ResizeObserver(() => {
    if (signal.aborted) return;
    onResize();
  });
  observer.observe(line);
  signal.addEventListener("abort", () => observer.disconnect());

  onResize();
  line.dataset.ready = "true";
}
