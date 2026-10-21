(() => {
	const root = document.documentElement;
	const storedTheme = localStorage.getItem('portfolio-theme');
	const initialTheme = storedTheme === 'light' ? 'light' : 'dark';
	root.dataset.theme = initialTheme;
	root.classList.toggle('dark', initialTheme === 'dark');

	document.addEventListener('DOMContentLoaded', () => {
		const toggle = document.querySelector('#themeToggle');
		if (!toggle) return;

		const updateToggle = theme => {
			const lightMode = theme === 'light';
			const icon = toggle.querySelector('i');
			toggle.setAttribute('aria-pressed', String(lightMode));
			toggle.setAttribute('aria-label', lightMode ? 'Switch to dark mode' : 'Switch to light mode');
			toggle.title = lightMode ? 'Switch to dark mode' : 'Switch to light mode';
			icon.className = lightMode ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
		};

		updateToggle(root.dataset.theme);
		toggle.addEventListener('click', () => {
			const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
			root.classList.add('theme-transition');
			root.dataset.theme = nextTheme;
			root.classList.toggle('dark', nextTheme === 'dark');
			localStorage.setItem('portfolio-theme', nextTheme);
			updateToggle(nextTheme);
			window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: nextTheme } }));
			window.setTimeout(() => root.classList.remove('theme-transition'), 420);
		});
	});
})();
