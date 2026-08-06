import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';

/**
 * Scroll-links a secondary panel (the track) to its host scroll container so both reach
 * their end at the same time: the panel is translated proportionally to the host's scroll
 * progress. When the main column is twice as tall, the panel moves at half the speed.
 *
 * Layout contract:
 *   - The host element (selector target) is the scroll container.
 *   - The bound `track` is the panel's content; its parent is the panel itself, which this
 *     directive pins and clips (via the `is-synced` class) so the track can be translated
 *     within it.
 *
 * Three layout modes, chosen per size (re-evaluated on resize/content change):
 *   - pinned:  the panel fits the viewport -> pin it (sticky), always visible; only the
 *              main column scrolls.
 *   - synced:  the panel overflows AND the main column is the longer scroller -> proportional
 *              scroll-linking (the parallax-style effect).
 *   - natural: the panel is taller than the main column's scroll range -> normal document
 *              flow, so no panel content is ever trapped off-screen.
 *
 * Progressive enhancement / accessibility:
 *   - Without JS the panel keeps its natural document flow (fully reachable via page scroll).
 *   - `prefers-reduced-motion` disables only the parallax-style *synced* mode (an overflowing
 *     panel then uses natural flow); pinning a short panel is not motion, so it still applies.
 *
 * Performance: scroll handling runs outside Angular, is throttled with requestAnimationFrame,
 * and only mutates a GPU-friendly `transform`.
 */
@Directive({ selector: '[fsProportionalScroll]' })
export class ProportionalScrollDirective implements AfterViewInit, OnDestroy {
  /** The panel content to translate. Its parent element is pinned and clipped. */
  @Input('fsProportionalScroll') track: HTMLElement | null = null;

  private readonly host: HTMLElement;
  private clip: HTMLElement | null = null;
  private synced = false;
  private scrollRaf = 0;
  private layoutRaf = 0;
  private resizeObserver?: ResizeObserver;
  private readonly reducedMotion: MediaQueryList | null =
    typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  private readonly onScroll = (): void => this.scheduleTransform();

  constructor(hostRef: ElementRef<HTMLElement>, private readonly zone: NgZone) {
    this.host = hostRef.nativeElement;
  }

  ngAfterViewInit(): void {
    if (!this.track || !this.track.parentElement) { return; }
    this.clip = this.track.parentElement;

    this.zone.runOutsideAngular(() => {
      this.host.addEventListener('scroll', this.onScroll, { passive: true });
      this.resizeObserver = new ResizeObserver(() => this.scheduleLayout());
      this.resizeObserver.observe(this.host);
      this.resizeObserver.observe(this.track as HTMLElement);
      this.evaluateLayout();
    });
  }

  ngOnDestroy(): void {
    this.host.removeEventListener('scroll', this.onScroll);
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.scrollRaf);
    cancelAnimationFrame(this.layoutRaf);
  }

  /** Pick the layout mode (pinned / synced / natural) for the current sizes. */
  private evaluateLayout(): void {
    const clip = this.clip;
    const track = this.track;
    if (!clip || !track) { return; }

    // Pin + clip first so the panel's real overflow can be measured against the pinned
    // viewport height (an unpinned panel has no clipped height to measure against).
    clip.classList.add('is-pinned', 'is-synced');
    const mainScrollable = this.host.scrollHeight - this.host.clientHeight;
    const panelScrollable = track.scrollHeight - clip.clientHeight;

    if (panelScrollable <= 0) {
      // pinned: the panel fits the viewport -> keep it pinned (always visible), no transform.
      this.synced = false;
      clip.classList.remove('is-synced');
      track.style.transform = '';
    } else if (mainScrollable >= panelScrollable && !this.prefersReducedMotion()) {
      // synced: the panel overflows and the main column is the longer scroller.
      this.synced = true;
      this.applyTransform();
    } else {
      // natural: panel taller than the main scroll range, or reduced motion -> normal flow.
      this.synced = false;
      clip.classList.remove('is-pinned', 'is-synced');
      track.style.transform = '';
    }
  }

  /** Translate the panel to match the host's scroll progress (on scroll). */
  private applyTransform(): void {
    const clip = this.clip;
    const track = this.track;
    if (!this.synced || !clip || !track) { return; }

    const mainScrollable = this.host.scrollHeight - this.host.clientHeight;
    const panelScrollable = Math.max(0, track.scrollHeight - clip.clientHeight);
    const progress = mainScrollable > 0 ? Math.min(1, this.host.scrollTop / mainScrollable) : 0;
    track.style.transform = `translateY(${-(progress * panelScrollable)}px)`;
  }

  private scheduleTransform(): void {
    if (this.scrollRaf) { return; }
    this.scrollRaf = requestAnimationFrame(() => { this.scrollRaf = 0; this.applyTransform(); });
  }

  private scheduleLayout(): void {
    if (this.layoutRaf) { return; }
    this.layoutRaf = requestAnimationFrame(() => { this.layoutRaf = 0; this.evaluateLayout(); });
  }

  private prefersReducedMotion(): boolean {
    return this.reducedMotion?.matches ?? false;
  }
}
