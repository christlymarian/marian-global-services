document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form.contact-form");
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn ? submitBtn.textContent : null;

      if (submitBtn) {
        submitBtn.textContent = "SENDING...";
        submitBtn.disabled = true;
      }

      const formData = new FormData(form);

      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbzGxdy27RS-96OOwhH4KGC3O8lt2kWR_Lx1njWjStRzg1vALP-_qF87d81hSORk5O1n/exec",
          {
            method: "POST",
            body: formData
          }
        );

        const result = await response.json();

        if (result.status === "success") {
          alert("Thank you! Your request has been submitted.");
          form.reset();
        } else {
          alert("Submission failed. Please try again.");
        }
      } catch (err) {
        console.error("Google Sheets submit error:", err);
        alert("Server error — please try again later.");
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText || "Request a Custom Quote";
          submitBtn.disabled = false;
        }
      }
    });
  });
});
