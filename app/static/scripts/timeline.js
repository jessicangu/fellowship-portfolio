const timelineForm = document.getElementById("timeline-form");
const timelinePosts = document.getElementById("timeline-posts");
const formMessage = document.getElementById("form-message");

async function loadTimelinePosts() {
    try {
        const response = await fetch("/api/timeline_post");

        if (!response.ok) {
            throw new Error("Could not retrieve timeline posts.");
        }

        const data = await response.json();

        timelinePosts.innerHTML = "";

        if (data.timeline_posts.length === 0) {
            timelinePosts.innerHTML = "<p>No timeline posts yet.</p>";
            return;
        }

        data.timeline_posts.forEach((post) => {
            const postElement = document.createElement("article");
            postElement.classList.add("timeline-post");

            const postDate = new Date(post.created_at);

            const nameElement = document.createElement("h3");
            nameElement.textContent = post.name;

            const emailElement = document.createElement("p");
            emailElement.classList.add("post-email");
            emailElement.textContent = post.email;

            const contentElement = document.createElement("p");
            contentElement.classList.add("post-content");
            contentElement.textContent = post.content;

            const dateElement = document.createElement("p");
            dateElement.classList.add("post-date");
            dateElement.textContent = postDate.toLocaleString();

            postElement.appendChild(nameElement);
            postElement.appendChild(emailElement);
            postElement.appendChild(contentElement);
            postElement.appendChild(dateElement);

            timelinePosts.appendChild(postElement);
        });
    } catch (error) {
        console.error(error);
        timelinePosts.innerHTML =
            "<p>There was an error loading the timeline posts.</p>";
    }
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
    } catch (error) {
        console.error(error);
        formMessage.textContent =
            "there was an error posting your message.";
    }
});

loadTimelinePosts();

