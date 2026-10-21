document.addEventListener('DOMContentLoaded', () => {
    const projects = [
        {
            title: 'Water Body Detection & GIS Mapping',
            category: 'Machine Learning',
            description: 'An AI-powered system that detects water bodies from satellite imagery, estimates water area, and generates GIS-ready vector outputs for selected locations.',
            features: [
                'Select a location on an interactive map.',
                'Fetch and segment satellite imagery.',
                'Estimate water area and export GIS-ready vector data.',
                'Support manual satellite image upload mode.'
            ],
            technologies: ['Python', 'Machine Learning', 'GIS'],
            gallery: [
                {
                    image: 'assets/images/projects/project-1.jpg',
                    alt: 'Water body detection project map',
                    label: 'Overview'
                },
                
            ]
        }
    ];
    const slides = document.querySelector('#projectSlides');
    const previous = document.querySelector('#prevProject');
    const next = document.querySelector('#nextProject');
    const counter = document.querySelector('#projectCounter');
    const dotNav = document.querySelector('#projectDotNav');
    if (!slides || !previous || !next || !counter || !dotNav) return;
    let currentIndex = 0;

    const createLink = (link, label, icon) => {
        if (!link) return '';
        return `<a class="project-action" href="${link}" target="_blank" rel="noopener noreferrer"><i class="bi ${icon}" aria-hidden="true"></i>${label}</a>`;
    };

    const render = () => {
        slides.replaceChildren();
        projects.forEach((project, projectIndex) => {
            const slide = document.createElement('article');
            slide.className = `project-slide${projectIndex === currentIndex ? ' active' : ''}`;
            slide.setAttribute('aria-hidden', String(projectIndex !== currentIndex));
            const galleryMarkup = project.gallery.length ? `<img data-project-main-image src="${project.gallery[0].image}" alt="${project.gallery[0].alt}" loading="lazy">` : '';
            const tabsMarkup = project.gallery.map((image, imageIndex) => `<button type="button" role="tab" class="project-image-tab${imageIndex === 0 ? ' active' : ''}" aria-pressed="${imageIndex === 0}" data-project-image="${image.image}" data-project-alt="${image.alt}">${image.label}</button>`).join('');
            slide.innerHTML = `<div class="project-gallery" data-project-gallery><div class="project-main-image-wrap">${galleryMarkup}<span class="project-image-fallback"${project.gallery.length ? ' hidden' : ''}>Project image unavailable</span></div><div class="project-image-tabs" role="tablist" aria-label="${project.title} images">${tabsMarkup}</div></div><div class="project-info"><p class="project-label">PROJECT ${String(projectIndex + 1).padStart(2, '0')} // ${project.category}</p><h3>${project.title}</h3><p class="project-description">${project.description}</p><ul class="project-features">${project.features.map(feature => `<li><i class="bi bi-check2-circle" aria-hidden="true"></i>${feature}</li>`).join('')}</ul><div class="project-technologies">${project.technologies.map(technology => `<span>${technology}</span>`).join('')}</div><div class="project-actions">${createLink(project.repositoryUrl, 'View Repository', 'bi-github')}${createLink(project.liveUrl, 'View Project', 'bi-box-arrow-up-right')}</div></div>`;
            slides.append(slide);
        });
        bindGalleryControls();
        renderDots();
        updateStatus();
    };

    const bindGalleryControls = () => {
        document.querySelectorAll('[data-project-gallery]').forEach(gallery => {
            const image = gallery.querySelector('[data-project-main-image]');
            const fallback = gallery.querySelector('.project-image-fallback');
            if (!image) return;
            image.onerror = () => { image.hidden = true; fallback.hidden = false; };
            gallery.querySelectorAll('[data-project-image]').forEach(tab => tab.addEventListener('click', () => {
                image.classList.add('is-changing');
                image.src = tab.dataset.projectImage;
                image.alt = tab.dataset.projectAlt;
                image.hidden = false;
                fallback.hidden = true;
                gallery.querySelectorAll('[data-project-image]').forEach(item => { const selected = item === tab; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
                window.setTimeout(() => image.classList.remove('is-changing'), 350);
            }));
        });
    };

    const renderDots = () => {
        dotNav.replaceChildren();
        projects.forEach((project, index) => {
            const dot = document.createElement('button');
            dot.type = 'button'; dot.className = `project-dot${index === currentIndex ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Show ${project.title}`); dot.setAttribute('aria-pressed', String(index === currentIndex));
            dot.addEventListener('click', () => showProject(index)); dotNav.append(dot);
        });
    };

    const updateStatus = () => { counter.textContent = `${currentIndex + 1} / ${projects.length}`; previous.disabled = projects.length < 2; next.disabled = projects.length < 2; };
    const showProject = index => { currentIndex = (index + projects.length) % projects.length; render(); };
    previous.addEventListener('click', () => showProject(currentIndex - 1));
    next.addEventListener('click', () => showProject(currentIndex + 1));
    document.querySelector('#projectCarousel').addEventListener('keydown', event => { if (event.target.matches('input, textarea, select')) return; if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return; event.stopPropagation(); if (event.key === 'ArrowLeft') previous.click(); if (event.key === 'ArrowRight') next.click(); }, true);
    let touchStartX = 0;
    slides.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
    slides.addEventListener('touchend', event => { const distance = event.changedTouches[0].screenX - touchStartX; if (Math.abs(distance) > 45) showProject(currentIndex + (distance < 0 ? 1 : -1)); }, { passive: true });
    document.querySelector('#projectFeaturedCount').textContent = projects.length;
    document.querySelector('#projectLiveCount').textContent = projects.filter(project => project.liveUrl).length;
    document.querySelector('#projectTechnologyCount').textContent = new Set(projects.flatMap(project => project.technologies)).size;
    render();
});