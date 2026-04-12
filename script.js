// @ts-check
'use strict';

const formUrl = 'https://forms.gle/dtpyCxn1w8fVhvzy5';
const navToggle = /** @type {HTMLButtonElement | null} */ (document.querySelector('.nav-toggle'));
const navLinks = /** @type {HTMLElement | null} */ (document.querySelector('.nav-links'));
const interestForm = /** @type {HTMLFormElement | null} */ (document.querySelector('#interestForm'));
const formFeedback = /** @type {HTMLElement | null} */ (document.querySelector('#formFeedback'));

/**
 * Opens or closes the mobile navigation menu and keeps its ARIA state in sync.
 *
 * @param {boolean} open - Whether the menu should be open.
 */
function setMenu(open) {
  navToggle?.setAttribute('aria-expanded', String(open));
  navLinks?.classList.toggle('is-open', open);
}

/**
 * Updates the interest form feedback message when the feedback element exists.
 *
 * @param {string} message - The message shown to the user.
 */
function setFeedback(message) {
  if (formFeedback) {
    formFeedback.textContent = message;
  }
}

/**
 * Toggles the navigation menu when the menu button is clicked.
 */
function handleMenuToggle() {
  if (!navToggle) return;

  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setMenu(!isOpen);
}

/**
 * Closes the navigation menu after a navigation link is selected.
 *
 * @param {MouseEvent} event - The click event fired inside the navigation links container.
 */
function handleNavLinkClick(event) {
  if (event.target instanceof HTMLAnchorElement) {
    setMenu(false);
  }
}

/**
 * Validates the interest form consent checkbox before opening the official form.
 *
 * @param {SubmitEvent} event - The form submission event.
 */
function handleInterestSubmit(event) {
  if (!interestForm) return;

  event.preventDefault();

  const consent = /** @type {HTMLInputElement | null} */ (
    interestForm.querySelector('input[name="consentimento"]')
  );
  const isValid = Boolean(consent?.checked);
  consent?.setAttribute('aria-invalid', String(!isValid));
  interestForm.querySelector('.checkbox-error')?.classList.toggle('is-visible', !isValid);

  if (!isValid) {
    setFeedback('Confirme o consentimento antes de continuar.');
    consent?.focus();
    return;
  }

  setFeedback('Tudo certo. Abrindo o cadastro oficial em uma nova aba.');
  window.open(formUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Clears or displays the consent validation message as the user edits the form.
 *
 * @param {Event} event - The input event fired by a form field.
 */
function handleInterestInput(event) {
  if (!interestForm) return;

  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;

  if (field.type === 'checkbox') {
    const isChecked = field.checked;
    field.setAttribute('aria-invalid', String(!isChecked));
    interestForm.querySelector('.checkbox-error')?.classList.toggle('is-visible', !isChecked);
    if (isChecked) setFeedback('');
  }
}

navToggle?.addEventListener('click', handleMenuToggle);
navLinks?.addEventListener('click', handleNavLinkClick);
interestForm?.addEventListener('submit', handleInterestSubmit);
interestForm?.addEventListener('input', handleInterestInput);
