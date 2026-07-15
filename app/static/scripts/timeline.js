const timelineForm = document.getElementById("timeline-form");
const timelinePosts = document.getElementById("timeline-posts");
const timelineRail = document.getElementById("timeline-rail");
const formMessage = document.getElementById("form-message");
const prevButton = document.getElementById("timeline-prev");
const nextButton = document.getElementById("timeline-next");

const SCROLL_STEP = 320;

function formatPostDate(date) {
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function updateNavButtons() {
    if (!timelineRail || !prevButton || !nextButton) {
        return;
    }

    const maxScroll = timelineRail.scrollWidth - timelineRail.clientWidth;
    const atStart = timelineRail.scrollLeft <= 4;
    const atEnd = timelineRail.scrollLeft >= maxScroll - 4;

    prevButton.disabled = atStart || maxScroll <= 0;
    nextButton.disabled = atEnd || maxScroll <= 0;
}

function scrollTimeline(direction) {
    timelineRail.scrollBy({
        left: direction * SCROLL_STEP,
        behavior: "smooth"
    });
}

function createTimelineNode(post) {
    const postElement = document.createElement("article");
    postElement.classList.add("timeline-node");
    postElement.tabIndex = 0;

    const body = document.createElement("div");
    body.classList.add("timeline-node__body");

    const dateElement = document.createElement("p");
    dateElement.classList.add("timeline-node__date");
    dateElement.textContent = formatPostDate(new Date(post.created_at));

    const nameElement = document.createElement("h3");
    nameElement.textContent = post.name;

    const emailElement = document.createElement("p");
    emailElement.classList.add("post-email");
    emailElement.textContent = post.email;

    const contentElement = document.createElement("p");
    contentElement.classList.add("post-content");
    contentElement.textContent = post.content;

    body.appendChild(dateElement);
    body.appendChild(nameElement);
    body.appendChild(emailElement);
    body.appendChild(contentElement);

    const marker = document.createElement("span");
    marker.classList.add("timeline-node__marker");
    marker.setAttribute("aria-hidden", "true");

    // Odd posts sit above the rail, even posts below (CSS nth-child).
    // Marker stays on the center row for every node.
    postElement.appendChild(body);
    postElement.appendChild(marker);

    return postElement;
}

async function loadTimelinePosts() {
    try {
        const response = await fetch("/api/timeline_post");

        if (!response.ok) {
            throw new Error("Could not retrieve timeline posts.");
        }

        const data = await response.json();

        timelinePosts.innerHTML = "";
        timelinePosts.classList.remove("is-empty", "is-status");

        if (data.timeline_posts.length === 0) {
            timelinePosts.classList.add("is-empty", "is-status");
            timelinePosts.innerHTML =
                '<p class="timeline-status">no timeline posts yet — be the first.</p>';
            updateNavButtons();
            return;
        }

        data.timeline_posts.forEach((post) => {
            timelinePosts.appendChild(createTimelineNode(post));
        });

        updateNavButtons();
    } catch (error) {
        console.error(error);
        timelinePosts.classList.add("is-status");
        timelinePosts.innerHTML =
            '<p class="timeline-status">there was an error loading the timeline posts.</p>';
        updateNavButtons();
    }
}

function setupRailInteractions() {
    if (!timelineRail) {
        return;
    }

    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let moved = false;

    timelineRail.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }

        isDragging = true;
        moved = false;
        startX = event.clientX;
        scrollStart = timelineRail.scrollLeft;
        timelineRail.classList.add("is-dragging");
        timelineRail.setPointerCapture(event.pointerId);
    });

    timelineRail.addEventListener("pointermove", (event) => {
        if (!isDragging) {
            return;
        }

        const delta = event.clientX - startX;
        if (Math.abs(delta) > 4) {
            moved = true;
        }

        timelineRail.scrollLeft = scrollStart - delta;
        updateNavButtons();
    });

    const endDrag = (event) => {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        timelineRail.classList.remove("is-dragging");

        if (timelineRail.hasPointerCapture(event.pointerId)) {
            timelineRail.releasePointerCapture(event.pointerId);
        }
    };

    timelineRail.addEventListener("pointerup", endDrag);
    timelineRail.addEventListener("pointercancel", endDrag);

    timelineRail.addEventListener("click", (event) => {
        if (moved) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    timelineRail.addEventListener(
        "wheel",
        (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                return;
            }

            if (timelineRail.scrollWidth <= timelineRail.clientWidth) {
                return;
            }

            event.preventDefault();
            timelineRail.scrollLeft += event.deltaY;
            updateNavButtons();
        },
        { passive: false }
    );

    timelineRail.addEventListener("scroll", updateNavButtons, { passive: true });

    timelineRail.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollTimeline(-1);
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollTimeline(1);
        }
    });

    prevButton.addEventListener("click", () => scrollTimeline(-1));
    nextButton.addEventListener("click", () => scrollTimeline(1));

    window.addEventListener("resize", updateNavButtons);
}

timelineForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    formMessage.textContent = "posting message...";

    const formData = new FormData(timelineForm);

    try {
        const response = await fetch("/api/timeline_post", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Could not create the timeline post.");
        }

        timelineForm.reset();
        formMessage.textContent = "message posted successfully!";

        await loadTimelinePosts();
        timelineRail.scrollTo({ left: 0, behavior: "smooth" });
    } catch (error) {
        console.error(error);
        formMessage.textContent =
            "there was an error posting your message.";
    }
});

setupRailInteractions();
loadTimelinePosts();
