/* ============================================================
   script.js — minimal vanilla JS for the contact form demo.
   The site is static: there is no backend, so nothing is sent
   or stored. JS only confirms validation and explains that to
   the visitor. All other behaviour (navigation, layout) is
   pure HTML/CSS.
   ============================================================ */

(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");

  if (!form || !status) {
    return;
  }

  form.addEventListener("submit", function (event) {
    // This static site has no backend: prevent any real submission.
    event.preventDefault();

    // Native constraint validation already passed (submit only fires
    // when the form is valid), so re-checking is a safety net.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    status.textContent =
      "Form is valid — this is a frontend demonstration only, so your message was not sent or stored.";
    status.classList.add("is-success");
    form.reset();
  });
})();
