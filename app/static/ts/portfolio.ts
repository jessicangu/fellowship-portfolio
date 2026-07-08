type SectionId = "about" | "projects" | "contact";

const FOLDER_OPEN_DURATION = 1650;
const FOLDER_CLOSE_DURATION = 1350;
const SLOW_FOLDER_OPEN_DURATION = 4000;
const SLOW_FOLDER_CLOSE_DURATION = 2600;
const FOLDER_OPEN_EASE = "cubic-bezier(0.38, 0, 0.15, 1)";
const FOLDER_CLOSE_EASE = "cubic-bezier(0.33, 0, 0.15, 1)";
const SLOW_FOLDER_OPEN_EASE = "cubic-bezier(0.42, 0, 0.12, 1)";
const SLOW_FOLDER_CLOSE_EASE = "cubic-bezier(0.33, 0, 0.1, 1)";

const archive = document.querySelector<HTMLElement>(".archive");
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".folder-tab"));
const panels = Array.from(document.querySelectorAll<HTMLElement>(".panel"));
const folderSections = Array.from(document.querySelectorAll<HTMLElement>(".folder-section"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const sectionIds: SectionId[] = ["about", "projects", "contact"];

let animating = false;

const coerceSectionId = (value: string | undefined): SectionId | undefined =>
    value === "about" || value === "projects" || value === "contact" ? value : undefined;

const getPanel = (id: SectionId): HTMLElement | undefined =>
    panels.find((panel) => panel.dataset.panel === id);

const getCollapse = (panel: HTMLElement): HTMLElement | null =>
    panel.querySelector<HTMLElement>(".panel-collapse");

const nextFrame = (): Promise<void> =>
    new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });

const syncUiState = (id: SectionId | undefined): void => {
    archive?.setAttribute("data-open-section", id ?? "");

    for (const section of folderSections) {
        section.classList.toggle("is-open", section.dataset.section === id);
    }

    for (const tab of tabs) {
        const isOpen = tab.dataset.section === id;
        tab.setAttribute("aria-expanded", String(isOpen));
        tab.tabIndex = id ? (isOpen ? 0 : -1) : 0;
    }
};

const getPanelTiming = (panel: HTMLElement, closing: boolean): { duration: number; ease: string } => {
    if (panel.dataset.panel === "about" || panel.dataset.panel === "projects") {
        return {
            duration: closing ? SLOW_FOLDER_CLOSE_DURATION : SLOW_FOLDER_OPEN_DURATION,
            ease: closing ? SLOW_FOLDER_CLOSE_EASE : SLOW_FOLDER_OPEN_EASE,
        };
    }

    return {
        duration: closing ? FOLDER_CLOSE_DURATION : FOLDER_OPEN_DURATION,
        ease: closing ? FOLDER_CLOSE_EASE : FOLDER_OPEN_EASE,
    };
};

const prepareCollapse = (
    collapse: HTMLElement,
    panel: HTMLElement,
    closing = false,
): void => {
    const { duration, ease } = getPanelTiming(panel, closing);
    collapse.classList.add("is-animating");
    collapse.style.overflow = "hidden";

    if (prefersReducedMotion) {
        collapse.style.transition = "none";
        return;
    }

    collapse.style.transition = `height ${duration}ms ${ease}`;
};

const finishCollapse = (collapse: HTMLElement): void => {
    collapse.classList.remove("is-animating");
};

const waitForHeightTransition = (collapse: HTMLElement, duration: number): Promise<void> =>
    new Promise((resolve) => {
        if (prefersReducedMotion) {
            resolve();
            return;
        }

        const onEnd = (event: TransitionEvent): void => {
            if (event.target !== collapse || event.propertyName !== "height") {
                return;
            }

            collapse.removeEventListener("transitionend", onEnd);
            resolve();
        };

        collapse.addEventListener("transitionend", onEnd);
        window.setTimeout(resolve, duration + 120);
    });

const measurePanelContentHeight = (collapse: HTMLElement): number => {
    const previousHeight = collapse.style.height;
    const previousOverflow = collapse.style.overflow;

    collapse.style.height = "auto";
    collapse.style.overflow = "hidden";
    const measured = collapse.scrollHeight;

    collapse.style.height = previousHeight;
    collapse.style.overflow = previousOverflow;

    return measured;
};

const closePanel = async (panel: HTMLElement): Promise<void> => {
    const collapse = getCollapse(panel);
    if (!collapse || !panel.classList.contains("is-open")) {
        return;
    }

    prepareCollapse(collapse, panel, true);

    const startHeight = collapse.scrollHeight;
    collapse.style.height = `${startHeight}px`;
    await nextFrame();

    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    collapse.style.height = "0px";

    await waitForHeightTransition(collapse, getPanelTiming(panel, true).duration);
    finishCollapse(collapse);
};

const openPanel = async (panel: HTMLElement): Promise<void> => {
    const collapse = getCollapse(panel);
    if (!collapse) {
        return;
    }

    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");

    const targetHeight = measurePanelContentHeight(collapse);
    const { duration: openDuration } = getPanelTiming(panel, false);

    prepareCollapse(collapse, panel, false);
    collapse.style.height = "0px";
    await nextFrame();
    collapse.style.height = `${targetHeight}px`;

    await waitForHeightTransition(collapse, openDuration);

    if (!panel.classList.contains("is-open")) {
        finishCollapse(collapse);
        return;
    }

    collapse.style.height = "auto";
    collapse.style.overflow = "";
    finishCollapse(collapse);
};

const setOpenSection = async (id: SectionId | undefined): Promise<void> => {
    if (animating) {
        return;
    }

    const current = coerceSectionId(archive?.dataset.openSection);
    if (current === id) {
        return;
    }

    animating = true;

    try {
        if (current) {
            const currentPanel = getPanel(current);
            if (currentPanel) {
                await closePanel(currentPanel);
            }
        }

        syncUiState(id);

        if (id) {
            const nextPanel = getPanel(id);
            if (nextPanel) {
                await openPanel(nextPanel);
            }
        }
    } finally {
        animating = false;
    }
};

const toggleSection = (id: SectionId): void => {
    const current = coerceSectionId(archive?.dataset.openSection);
    if (current === id) {
        void setOpenSection(undefined);
        return;
    }

    void setOpenSection(id);
};

for (const tab of tabs) {
    tab.addEventListener("click", () => {
        const sectionId = coerceSectionId(tab.dataset.section);
        if (!sectionId) {
            return;
        }
        toggleSection(sectionId);
    });

    tab.addEventListener("keydown", (event: KeyboardEvent) => {
        const currentId = coerceSectionId(tab.dataset.section);
        const currentIndex = currentId ? sectionIds.indexOf(currentId) : -1;
        if (currentIndex < 0) {
            return;
        }

        const keyOffset: Record<string, number> = {
            ArrowLeft: -1,
            ArrowUp: -1,
            ArrowRight: 1,
            ArrowDown: 1,
        };

        const offset = keyOffset[event.key];
        if (offset === undefined) {
            return;
        }

        event.preventDefault();
        const nextIndex = (currentIndex + offset + sectionIds.length) % sectionIds.length;
        toggleSection(sectionIds[nextIndex]!);
    });
}

type ProjectCategory = "technical" | "creative";

const projectCategoryIds: ProjectCategory[] = ["technical", "creative"];
const projectSwitcher = document.querySelector<HTMLElement>(".projects-switcher");
const projectCategoryButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-project-category]"),
);
const projectCategoryPanels = Array.from(
    document.querySelectorAll<HTMLElement>("[data-project-panel]"),
);
const projectFooterLabels = Array.from(
    document.querySelectorAll<HTMLElement>("[data-footer-for]"),
);
const projectsPanel = getPanel("projects");

const coerceProjectCategory = (value: string | undefined): ProjectCategory | undefined =>
    value === "technical" || value === "creative" ? value : undefined;

const refreshProjectsPanelHeight = async (): Promise<void> => {
    if (!projectsPanel?.classList.contains("is-open")) {
        return;
    }

    const collapse = getCollapse(projectsPanel);
    if (!collapse) {
        return;
    }

    const startHeight = collapse.scrollHeight;
    const targetHeight = measurePanelContentHeight(collapse);

    if (startHeight === targetHeight) {
        return;
    }

    prepareCollapse(collapse, projectsPanel, false);
    collapse.style.height = `${startHeight}px`;
    await nextFrame();
    collapse.style.height = `${targetHeight}px`;

    await waitForHeightTransition(collapse, getPanelTiming(projectsPanel, false).duration);

    if (!projectsPanel.classList.contains("is-open")) {
        finishCollapse(collapse);
        return;
    }

    collapse.style.height = "auto";
    collapse.style.overflow = "";
    finishCollapse(collapse);
};

const setProjectCategory = (category: ProjectCategory): void => {
    for (const button of projectCategoryButtons) {
        const isActive = button.dataset.projectCategory === category;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
    }

    for (const panel of projectCategoryPanels) {
        const show = panel.dataset.projectPanel === category;
        panel.classList.toggle("is-hidden", !show);
        panel.hidden = !show;
    }

    for (const label of projectFooterLabels) {
        const show = label.dataset.footerFor === category;
        label.classList.toggle("is-hidden", !show);
        label.hidden = !show;
    }

    void refreshProjectsPanelHeight();
};

projectSwitcher?.addEventListener("click", (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-project-category]");
    const category = coerceProjectCategory(button?.dataset.projectCategory);
    if (!category || button?.classList.contains("is-active")) {
        return;
    }

    setProjectCategory(category);
});

for (const button of projectCategoryButtons) {
    button.addEventListener("keydown", (event: KeyboardEvent) => {
        const currentCategory = coerceProjectCategory(button.dataset.projectCategory);
        const currentIndex = currentCategory ? projectCategoryIds.indexOf(currentCategory) : -1;
        if (currentIndex < 0) {
            return;
        }

        const keyOffset: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
        };

        const offset = keyOffset[event.key];
        if (offset === undefined) {
            return;
        }

        event.preventDefault();
        const nextIndex = (currentIndex + offset + projectCategoryIds.length) % projectCategoryIds.length;
        setProjectCategory(projectCategoryIds[nextIndex]!);
        projectCategoryButtons[nextIndex]?.focus();
    });
}

if (!prefersReducedMotion) {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".project-card"));

    for (const card of cards) {
        const image = card.querySelector<HTMLImageElement>("img");
        if (!image) {
            continue;
        }

        let frameId = 0;
        let offsetX = 0;
        let offsetY = 0;

        const applyParallax = (): void => {
            frameId = 0;
            image.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        };

        card.addEventListener(
            "pointermove",
            (event: PointerEvent) => {
                const rect = card.getBoundingClientRect();
                offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
                offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 5 - 3;

                if (!frameId) {
                    frameId = window.requestAnimationFrame(applyParallax);
                }
            },
            { passive: true },
        );

        card.addEventListener("pointerleave", () => {
            if (frameId) {
                window.cancelAnimationFrame(frameId);
                frameId = 0;
            }

            image.style.transform = "";
        });
    }
}

void syncUiState(coerceSectionId(archive?.dataset.openSection));

const INTRO_TEXT = "hi, i'm jessica!";
const INTRO_START_DELAY = 400;

const typingEl = document.querySelector<HTMLElement>(".hero__typing");

const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

const getTypingDelay = (char: string): number => {
    if (char === " ") {
        return 140;
    }

    if (char === "," || char === "!") {
        return 220;
    }

    if (char === "'") {
        return 110;
    }

    return 105;
};

const initPageIntro = async (): Promise<void> => {
    if (!typingEl) {
        return;
    }

    if (prefersReducedMotion) {
        typingEl.textContent = INTRO_TEXT;
        return;
    }

    await sleep(INTRO_START_DELAY);

    for (let i = 1; i <= INTRO_TEXT.length; i++) {
        typingEl.textContent = INTRO_TEXT.slice(0, i);
        await sleep(getTypingDelay(INTRO_TEXT.charAt(i - 1)));
    }
};

void initPageIntro();
