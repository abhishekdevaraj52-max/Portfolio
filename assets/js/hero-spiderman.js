document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('#hero');
    const visual = document.querySelector('.spiderman-visual');
    const image = document.querySelector('.spiderman-image');
    if (!hero || !visual || !image) return;
    const markMissing = () => { image.classList.add('is-missing'); visual.classList.add('is-missing'); };
    image.addEventListener('error', markMissing, { once: true });
    if (image.complete && image.naturalWidth === 0) markMissing();
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scrollOffset = 0;
    let frameRequested = false;
    const update = () => {
        currentX += (targetX - currentX) * .08;
        currentY += (targetY - currentY) * .08;
        visual.style.setProperty('--spider-parallax-x', `${currentX}px`);
        visual.style.setProperty('--spider-parallax-y', `${currentY + scrollOffset}px`);
        frameRequested = false;
    };
    const requestUpdate = () => { if (!frameRequested) { frameRequested = true; requestAnimationFrame(update); } };
    hero.addEventListener('pointermove', event => { const bounds = hero.getBoundingClientRect(); targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 14; targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 10; requestUpdate(); });
    hero.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; requestUpdate(); });
    window.addEventListener('scroll', () => { if (window.scrollY < window.innerHeight) { scrollOffset = window.scrollY * -.035; requestUpdate(); } }, { passive: true });
});
