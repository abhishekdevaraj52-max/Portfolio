document.addEventListener('DOMContentLoaded', () => {
	const form = document.querySelector('#contact-form');
	const errorMessage = document.querySelector('#form-error');
	const successMessage = document.querySelector('#form-success');
	if (!form || !errorMessage || !successMessage) return;

	const fields = [...form.querySelectorAll('input, select, textarea')];
	const setFieldError = (field, message) => {
		const error = form.querySelector(`[data-error-for="${field.id}"]`);
		field.setAttribute('aria-invalid', String(Boolean(message)));
		if (error) error.textContent = message;
	};

	const validate = () => {
		let valid = true;
		const name = form.elements.name;
		const email = form.elements.email;
		const reason = form.elements.reason;
		const confirmEmail = form.elements.confirmEmail;
		const subject = form.elements.subject;
		const message = form.elements.message;
		const rules = [
			[name, name.value.trim().length >= 2 && name.value.trim().length <= 40 ? '' : 'Enter 2 to 40 characters.'],
			[email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Enter a valid email address.'],
			[reason, reason.value ? '' : 'Choose a reason for contact.'],
			[confirmEmail, confirmEmail.value.trim() === email.value.trim() && confirmEmail.value.trim() ? '' : 'Email addresses must match.'],
			[subject, subject.value.trim().length >= 5 && subject.value.trim().length <= 100 ? '' : 'Enter 5 to 100 characters.'],
			[message, message.value.trim().length >= 100 && message.value.trim().length <= 1000 ? '' : 'Enter 100 to 1000 characters.']
		];
		rules.forEach(([field, error]) => { setFieldError(field, error); valid = valid && !error; });
		return valid;
	};

	fields.forEach(field => field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(); }));
	form.addEventListener('submit', event => {
		event.preventDefault();
		errorMessage.hidden = true;
		successMessage.hidden = true;
		if (!validate()) { errorMessage.textContent = 'Please correct the highlighted fields.'; errorMessage.hidden = false; return; }
		successMessage.textContent = 'Contact service is not configured yet. Please use the email address provided in the portfolio.';
		successMessage.hidden = false;
	});
});
