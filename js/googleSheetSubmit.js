document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form.contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.textContent = "SENDING...";

    const formData = new FormData(form);

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbzGxdy27RS-96OOwhH4KGC3O8lt2kWR_Lx1njWjStRzg1vALP-_qF87d81hSORk5O1n/exec", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Thank you! Your request has been submitted.");
        form.reset();
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error — please try again later.");
    } finally {
      if (submitBtn) submitBtn.textContent = "Request a Custom Quote";
    }
  });
});
