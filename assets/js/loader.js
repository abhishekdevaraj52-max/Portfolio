(() => {
  const screen = document.querySelector("#portfolio-loader");
  const fill = screen?.querySelector("[data-portfolio-loader-fill]");
  const percentLabels = screen?.querySelectorAll("[data-portfolio-loader-percent]");
  const progressBar = screen?.querySelector('[role="progressbar"]');

  if (!screen || !fill || !percentLabels?.length) return;

  const duration = 3200;
  const startTime = performance.now();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let completed = false;

  function updateProgress(percent) {
    const value = Math.min(100, Math.max(0, Math.round(percent)));
    fill.style.width = `${value}%`;
    percentLabels.forEach((label) => {
      label.textContent = `${value}%`;
    });
    progressBar?.setAttribute("aria-valuenow", String(value));
  }

  function dismiss() {
    if (completed) return;
    completed = true;
    updateProgress(100);
    screen.classList.add("is-complete");
    window.dispatchEvent(new CustomEvent("loaderComplete"));

    window.setTimeout(() => {
      screen.classList.add("is-dismissed");
      screen.setAttribute("aria-hidden", "true");
      window.setTimeout(() => screen.remove(), 700);
    }, reducedMotion ? 0 : 700);
  }

  function animate(now) {
    const progress = reducedMotion ? 1 : Math.min((now - startTime) / duration, 1);
    updateProgress(progress * 100);

    if (progress < 1) {
      window.requestAnimationFrame(animate);
    } else {
      window.setTimeout(dismiss, reducedMotion ? 0 : 250);
    }
  }

  updateProgress(0);
  window.requestAnimationFrame(animate);

  window.setTimeout(() => {
    if (!completed) dismiss();
  }, duration + 2200);
})();
