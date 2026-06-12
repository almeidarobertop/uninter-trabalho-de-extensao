// @ts-check
'use strict';

const formUrl = 'https://forms.gle/dtpyCxn1w8fVhvzy5';
const navToggle = /** @type {HTMLButtonElement | null} */ (document.querySelector('.nav-toggle'));
const navLinks = /** @type {HTMLElement | null} */ (document.querySelector('.nav-links'));
const interestForm = /** @type {HTMLFormElement | null} */ (document.querySelector('#interestForm'));
const formFeedback = /** @type {HTMLElement | null} */ (document.querySelector('#formFeedback'));
const campaignGallery = /** @type {HTMLElement | null} */ (document.querySelector('[data-gallery]'));
const galleryViewport = /** @type {HTMLElement | null} */ (
  document.querySelector('[data-gallery-viewport]')
);
const galleryTrack = /** @type {HTMLElement | null} */ (document.querySelector('[data-gallery-track]'));
const galleryStatus = /** @type {HTMLElement | null} */ (document.querySelector('[data-gallery-status]'));
const galleryPrevButton = /** @type {HTMLButtonElement | null} */ (
  document.querySelector('[data-gallery-prev]')
);
const galleryNextButton = /** @type {HTMLButtonElement | null} */ (
  document.querySelector('[data-gallery-next]')
);
const gallerySlides = Array.from(document.querySelectorAll('[data-gallery-slide]'));
const galleryImages = Array.from(document.querySelectorAll('.campaign-image'));
const lightbox = /** @type {HTMLElement | null} */ (document.querySelector('[data-lightbox]'));
const lightboxImage = /** @type {HTMLImageElement | null} */ (
  document.querySelector('[data-lightbox-image]')
);
const lightboxCloseButtons = Array.from(document.querySelectorAll('[data-lightbox-close]'));

let galleryIndex = 0;
let swipeStartX = 0;
let isSwipeActive = false;
let lastFocusedElement = /** @type {HTMLElement | null} */ (null);

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

/**
 * Returns whether a campaign expiration date is still valid for display today.
 *
 * @param {string} rawDate - Date stored in YYYY-MM-DD format.
 * @returns {boolean}
 */
function isCampaignActive(rawDate) {
  if (!rawDate) return true;

  const expirationDate = new Date(`${rawDate}T23:59:59`);
  return Number.isFinite(expirationDate.getTime()) && expirationDate.getTime() >= Date.now();
}

/**
 * Returns how many campaign cards should be visible per view.
 *
 * @returns {number}
 */
function getGalleryItemsPerView() {
  return window.innerWidth >= 760 ? 2 : 1;
}

/**
 * Returns the currently active campaign slides after filtering expired ones.
 *
 * @returns {HTMLElement[]}
 */
function getActiveGallerySlides() {
  return gallerySlides.filter((slide) => !slide.classList.contains('is-hidden'));
}

/**
 * Updates the carousel transform and button availability.
 */
function renderGallery() {
  if (!campaignGallery || !galleryTrack || !galleryViewport) return;

  const activeSlides = getActiveGallerySlides();
  const itemsPerView = getGalleryItemsPerView();
  const maxIndex = Math.max(0, activeSlides.length - itemsPerView);

  galleryIndex = Math.min(galleryIndex, maxIndex);

  const targetSlide = activeSlides[galleryIndex];
  const offset = targetSlide ? targetSlide.offsetLeft : 0;

  galleryTrack.style.transform = `translateX(-${offset}px)`;

  if (galleryPrevButton) {
    galleryPrevButton.disabled = galleryIndex <= 0 || activeSlides.length <= itemsPerView;
  }

  if (galleryNextButton) {
    galleryNextButton.disabled = galleryIndex >= maxIndex || activeSlides.length <= itemsPerView;
  }

  if (galleryStatus) {
    galleryStatus.textContent =
      activeSlides.length === 0
        ? 'Nenhuma campanha ativa no momento.'
        : 'Deslize para o lado ou use as setas para navegar entre as campanhas ativas.';
  }
}

/**
 * Moves the campaign carousel by one step in the chosen direction.
 *
 * @param {number} direction - Use -1 for previous and 1 for next.
 */
function moveGallery(direction) {
  const maxIndex = Math.max(0, getActiveGallerySlides().length - getGalleryItemsPerView());
  galleryIndex = Math.max(0, Math.min(galleryIndex + direction, maxIndex));
  renderGallery();
}

/**
 * Filters expired campaigns and prepares the carousel state.
 */
function initializeGallery() {
  if (!campaignGallery) return;

  for (const slide of gallerySlides) {
    const expirationDate = slide.getAttribute('data-expires-at') || '';
    slide.classList.toggle('is-hidden', !isCampaignActive(expirationDate));
  }

  const activeSlides = getActiveGallerySlides();
  campaignGallery.classList.toggle('is-empty', activeSlides.length === 0);

  renderGallery();
}

/**
 * Stores the horizontal starting point for swipe interactions.
 *
 * @param {PointerEvent} event
 */
function handleGalleryPointerStart(event) {
  swipeStartX = event.clientX;
  isSwipeActive = true;
}

/**
 * Moves the carousel when the swipe distance passes the threshold.
 *
 * @param {PointerEvent} event
 */
function handleGalleryPointerEnd(event) {
  if (!isSwipeActive) return;

  const distance = event.clientX - swipeStartX;
  isSwipeActive = false;

  if (Math.abs(distance) < 40) return;
  moveGallery(distance < 0 ? 1 : -1);
}

/**
 * Opens the campaign lightbox with the clicked image.
 *
 * @param {HTMLImageElement} image
 */
function openLightbox(image) {
  if (!lightbox || !lightboxImage) return;

  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  lightbox.querySelector('.campaign-lightbox-close')?.focus();
}

/**
 * Closes the campaign lightbox and restores page scrolling.
 */
function closeLightbox() {
  if (!lightbox || !lightboxImage) return;

  lightbox.hidden = true;
  lightboxImage.src = '';
  lightboxImage.alt = '';
  document.body.style.overflow = '';
  lastFocusedElement?.focus();
}

/**
 * Opens the lightbox when a campaign image is clicked.
 *
 * @param {MouseEvent} event
 */
function handleGalleryImageClick(event) {
  const image = event.currentTarget;
  if (!(image instanceof HTMLImageElement)) return;

  openLightbox(image);
}

/**
 * Closes the lightbox when the Escape key is pressed.
 *
 * @param {KeyboardEvent} event
 */
function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && lightbox && !lightbox.hidden) {
    closeLightbox();
  }
}

navToggle?.addEventListener('click', handleMenuToggle);
navLinks?.addEventListener('click', handleNavLinkClick);
interestForm?.addEventListener('submit', handleInterestSubmit);
interestForm?.addEventListener('input', handleInterestInput);
galleryPrevButton?.addEventListener('click', () => moveGallery(-1));
galleryNextButton?.addEventListener('click', () => moveGallery(1));
galleryViewport?.addEventListener('pointerdown', handleGalleryPointerStart);
galleryViewport?.addEventListener('pointerup', handleGalleryPointerEnd);
galleryImages.forEach((image) => image.addEventListener('click', handleGalleryImageClick));
lightboxCloseButtons.forEach((button) => button.addEventListener('click', closeLightbox));
document.addEventListener('keydown', handleDocumentKeydown);
window.addEventListener('resize', renderGallery);

initializeGallery();
