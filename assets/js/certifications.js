document.addEventListener('DOMContentLoaded', () => {
    const assetPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
    const certificates = [
        { title: 'Security Operation Centre', issuer: 'GM University / SDTCD Cell', category: 'gm-university', date: '19 Aug 2026', image: `${assetPrefix}assets/images/certificates/certificate-1.png`, description: '2-credit course completed in semester 6 during academic year 2025-26 with B+ grade. Certificate code: SOC-U23E01CS001-C06.' },
        { title: 'Udemy', issuer: 'GM University / SDTCD Cell', category: 'gm-university', date: '20 Jul 2026', image: `${assetPrefix}assets/images/certificates/certificate-2.jpg`, description: '2-credit course completed in semester 5 during academic year 2025-26 with B+ grade. Certificate code: U-U23E01CS001-DA1.' },
        { title: 'Full Stack Development - Frontend Essentials (Stage-2)', issuer: 'GM University / SDTCD Cell', category: 'gm-university', date: '09 Jul 2025', image: `${assetPrefix}assets/images/certificates/certificate-3.jpg`, description: '2-credit course completed in semester 4 during academic year 2024-25 with C grade. Certificate code: FSDFE-(U23E01CS001-SD2).' },
    ];
    const filters = [...document.querySelectorAll('.cert-filter')];
    const cover = document.querySelector('#certCover');
    const page = document.querySelector('#certPage');
    const image = document.querySelector('#certImage');
    const fallback = document.querySelector('.cert-image-fallback');
    const title = document.querySelector('#certTitle');
    const issuer = document.querySelector('#certIssuer');
    const date = document.querySelector('#certDate');
    const category = document.querySelector('#certCategory');
    const credentialLink = document.querySelector('#certCredentialLink');
    const counter = document.querySelector('#certCounter');
    const progressBar = document.querySelector('#certProgressBar');
    const dotNav = document.querySelector('#certDotNav');
    const previous = document.querySelector('#certPrevBtn');
    const next = document.querySelector('#certNextBtn');
    if (!cover || !page || !filters.length) return;

    let visibleCertificates = certificates;
    let currentIndex = -1;

    const countFor = categoryName => categoryName === 'all' ? certificates.length : certificates.filter(cert => cert.category === categoryName).length;
    const formatCategory = value => value === 'certificates' ? 'certificates' : value.charAt(0).toUpperCase() + value.slice(1);

    const renderDots = () => {
        dotNav.replaceChildren();
        visibleCertificates.forEach((cert, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'cert-dot';
            dot.setAttribute('aria-label', `Show ${cert.title}`);
            dot.setAttribute('aria-pressed', String(index === currentIndex));
            dot.addEventListener('click', () => showCertificate(index));
            dotNav.append(dot);
        });
    };

    const showCover = () => {
        currentIndex = -1;
        cover.hidden = false;
        page.hidden = true;
        counter.textContent = 'Cover';
        progressBar.style.width = '0%';
        previous.disabled = true;
        next.disabled = visibleCertificates.length === 0;
        renderDots();
    };

    const showCertificate = index => {
        if (!visibleCertificates.length) return showCover();
        currentIndex = (index + visibleCertificates.length) % visibleCertificates.length;
        const certificate = visibleCertificates[currentIndex];
        cover.hidden = true;
        page.hidden = false;
        page.classList.remove('is-turning');
        void page.offsetWidth;
        page.classList.add('is-turning');
        image.hidden = false;
        fallback.hidden = true;
        image.src = certificate.image;
        image.alt = certificate.title;
        image.onerror = () => { image.hidden = true; fallback.hidden = false; };
        title.textContent = certificate.title;
        issuer.textContent = certificate.issuer;
        date.textContent = certificate.date;
        category.textContent = formatCategory(certificate.category);
        credentialLink.hidden = !certificate.credentialUrl;
        if (certificate.credentialUrl) credentialLink.href = certificate.credentialUrl;
        counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(visibleCertificates.length).padStart(2, '0')}`;
        progressBar.style.width = `${((currentIndex + 1) / visibleCertificates.length) * 100}%`;
        previous.disabled = false;
        next.disabled = false;
        renderDots();
    };

    const setFilter = selectedCategory => {
        visibleCertificates = selectedCategory === 'all' ? certificates : certificates.filter(cert => cert.category === selectedCategory);
        filters.forEach(filter => {
            const selected = filter.dataset.category === selectedCategory;
            filter.classList.toggle('is-active', selected);
            filter.setAttribute('aria-selected', String(selected));
            filter.setAttribute('aria-pressed', String(selected));
            filter.querySelector('b').textContent = countFor(filter.dataset.category);
        });
        showCover();
    };

    filters.forEach(filter => filter.addEventListener('click', () => setFilter(filter.dataset.category)));
    previous.addEventListener('click', () => currentIndex < 0 ? showCertificate(visibleCertificates.length - 1) : showCertificate(currentIndex - 1));
    next.addEventListener('click', () => currentIndex < 0 ? showCertificate(0) : showCertificate(currentIndex + 1));
    document.addEventListener('keydown', event => {
        if (event.target.matches('input, textarea, select')) return;
        if (event.key === 'ArrowLeft') previous.click();
        if (event.key === 'ArrowRight') next.click();
    });
    setFilter('all');
});