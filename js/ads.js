/* Advertising presentation only: no provider, tracking, network or billable
   impressions. Approve eligibility, sizes, consent and refresh rules before
   integrating a real SDK. Audio/video toggles must not force refreshes. */
const AdSlot = {
  shouldShowAds() { return true; },
  isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '') ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },
  render(placementId, container, options = {}) {
    if (!container) return;
    container.classList.add('ad-slot'); container.dataset.placementId = placementId;
    container.removeAttribute('aria-hidden'); container.setAttribute('aria-label', 'Advertisement preview');
    if (!this.shouldShowAds()) {
      container.classList.add('ad-slot-inactive'); container.style.display = 'none'; container.replaceChildren(); return;
    }
    container.classList.remove('ad-slot-inactive'); container.style.display = '';
    if (container.dataset.adRendered === placementId && container.firstChild) return;
    container.dataset.adRendered = placementId;
    const compact = options.variant === 'thumbnail';
    container.classList.toggle('ad-thumbnail', compact);
    const content = `<span class="ad-slot-badge">Ad · Demo</span><span class="ad-slot-label">${compact ? 'Your brand here' : 'A little space for something good.'}</span>${compact ? '' : '<span class="ad-slot-id">Sponsored placement preview</span>'}`;
    container.innerHTML = options.bare ? content : `<div class="ad-slot-placeholder">${content}</div>`;
  },
  thumbnail(art, placementId) {
    if (!art || !this.shouldShowAds()) return;
    const slot = document.createElement('div');
    this.render(placementId, slot, {bare: true, variant: 'thumbnail'});
    slot.addEventListener('click', event => event.stopPropagation());
    slot.addEventListener('dblclick', event => event.stopPropagation());
    art.replaceChildren(slot); art.classList.add('has-ad-thumbnail');
  },
  init() { document.querySelectorAll('[data-ad-slot]').forEach(el => this.render(el.dataset.adSlot, el)); }
};
document.addEventListener('DOMContentLoaded', () => AdSlot.init());
