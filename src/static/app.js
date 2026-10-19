document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details], index) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" aria-label="Unregister ${email}">Remove</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <button class="register-toggle" type="button" aria-expanded="false" aria-controls="signup-form-${index}">Register student</button>
          <form class="signup-form hidden" id="signup-form-${index}" data-activity="${encodeURIComponent(name)}">
            <div class="form-group">
              <label for="student-email-${index}">Student email</label>
              <input type="email" id="student-email-${index}" name="email" required placeholder="your-email@mergington.edu" />
            </div>
            <button type="submit">Sign up</button>
          </form>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
      document.querySelectorAll(".register-toggle").forEach((button) => {
        button.addEventListener("click", () => {
          const form = document.getElementById(button.getAttribute("aria-controls"));
          const isOpening = form.classList.contains("hidden");
          form.classList.toggle("hidden", !isOpening);
          button.setAttribute("aria-expanded", String(isOpening));
          if (isOpening) {
            form.querySelector("input").focus();
          }
        });
      });
      document.querySelectorAll(".signup-form").forEach((form) => {
        form.addEventListener("submit", handleSignup);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = decodeURIComponent(button.getAttribute("data-activity"));
    const email = decodeURIComponent(button.getAttribute("data-email"));

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.email.value;
    const activity = decodeURIComponent(form.getAttribute("data-activity"));

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        form.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  }

  // Initialize app
  fetchActivities();
});
