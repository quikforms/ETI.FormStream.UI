import { ComponentRef, Injectable, Injector, Type, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DialogRef } from './dialog-ref';

/** One dialog on the stack: the ref handed to callers, and the view backing it. */
interface OpenDialog {
  ref: DialogRef<any>;
  componentRef: ComponentRef<any>;
  /** What had focus when this dialog opened, so it can be given back on close. */
  previouslyFocused: Element | null;
  /**
   * Pending deferred focus, cancelled if the dialog closes before it runs. Typed as the browser's
   * handle rather than ReturnType<typeof setTimeout>, which resolves to Node's Timeout here.
   */
  focusTimer: number;
}

/**
 * Stops the host page scrolling behind an open dialog.
 *
 * ngx-bootstrap did this by putting `modal-open` on `document.body`, which Bootstrap's
 * `.modal-open { overflow: hidden }` picked up. That rule now lives inside the shadow root, where
 * it can never match an element in the host's document, so the class would do nothing — the style
 * has to be set directly.
 *
 * Counted at module scope on purpose. This service is per element, but `document.body` is shared
 * by every <quik-formstream> on the page: with a dialog open in two of them, the first to close
 * must not hand the page its scroll back while the other is still covering it. The previous value
 * is captured rather than assumed, so a host that was already `overflow: hidden` keeps it.
 *
 * NOT VERIFIED, and worth saying so rather than letting the next reader assume it was. That the
 * style is applied and reverted is measured; that it actually stops a host page scrolling is not.
 * It cannot be shown in the Quik! app, which does not scroll at the document level at all — both
 * html and body compute to `overflow: auto hidden` there, so this is inert — and attempts to
 * measure it on a plain scrolling page gave results that contradicted each other between runs.
 *
 * Kept because it restores what ngx-bootstrap's `modal-open` class did by the same mechanism, so
 * it cannot behave worse than what shipped before. If it turns out to be insufficient, the usual
 * reason is that `body { overflow: hidden }` only reaches the viewport while `html` computes to
 * `overflow: visible`, and the fix is to lock whatever `document.scrollingElement` really is.
 */
let bodyScrollLocks = 0;
let overflowBeforeLock = '';

function lockBodyScroll(): void {
  if (bodyScrollLocks++ === 0) {
    overflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}

function unlockBodyScroll(): void {
  if (bodyScrollLocks > 0 && --bodyScrollLocks === 0) {
    document.body.style.overflow = overflowBeforeLock;
  }
}

/**
 * Opens dialogs inside the element's shadow root.
 *
 * ngx-bootstrap's modal service appends its container to `document.body` and its backdrop to
 * `'body'`, both hardcoded, with no container option to point elsewhere. Anything it renders
 * therefore lands outside the shadow boundary, where the element's stylesheet does not reach — and
 * where it is sitting in the host's document rather than ours.
 *
 * This renders through a `ViewContainerRef` that lives in the element's own template instead, so a
 * dialog is part of the shadow tree like everything else. The chrome around it (backdrop, the
 * `.modal` positioning container) is `DialogOutletComponent`, which reuses Bootstrap's class names
 * so the stylesheet already inside the root styles it without a new rule.
 */
@Injectable()
export class FormStreamDialogService {

  private outlet: ViewContainerRef | null = null;
  private container: HTMLElement | null = null;
  private readonly _open = new BehaviorSubject<OpenDialog[]>([]);

  /** The open stack, for the outlet to know whether to draw its chrome. */
  readonly open$: Observable<OpenDialog[]> = this._open.asObservable();

  /**
   * Registered by the outlet once its view exists. Until then there is nowhere to render, which is
   * why nothing opens a dialog before the element has rendered.
   *
   * `container` is the `.modal` element, which is where focus goes when a dialog opens — see
   * `focusContainer`.
   */
  registerOutlet(outlet: ViewContainerRef, container: HTMLElement): void {
    this.outlet = outlet;
    this.container = container;
  }

  /**
   * Opens `component`, seeded with `initialState`.
   *
   * The seed is assigned onto the instance rather than passed to a constructor, matching what
   * ngx-bootstrap's `initialState` did — the dialog components read their inputs as plain
   * properties, so changing that would mean rewriting all three.
   */
  show<T extends object, R = unknown>(component: Type<T>, initialState?: Partial<T>): DialogRef<R> {
    if (!this.outlet) {
      throw new Error('FormStream dialog outlet is not available yet.');
    }

    const ref = new DialogRef<R>(handle => this.dispose(handle));
    const componentRef = this.outlet.createComponent(component, {
      // A child injector per dialog, so each one receives the ref that closes itself and nothing
      // else about the surrounding tree changes.
      injector: Injector.create({
        providers: [{ provide: DialogRef, useValue: ref }],
        parent: this.outlet.injector
      })
    });

    Object.assign(componentRef.instance, initialState ?? {});
    componentRef.changeDetectorRef.detectChanges();

    const previouslyFocused = this.activeElement();

    // Deferred on purpose. The outlet's container is still `display: none` at this point — the
    // binding that reveals it reacts to the push below and has not been rendered yet — and a node
    // inside a hidden subtree cannot take focus, so focusing here silently does nothing. Kept on
    // the record so `dispose` can cancel it: a dialog that closes within the same tick would
    // otherwise pull focus onto a container whose dialog is already gone.
    const focusTimer = window.setTimeout(() => this.focusContainer());

    if (!this._open.value.length) { lockBodyScroll(); }

    this._open.next([
      ...this._open.value,
      { ref, componentRef, previouslyFocused, focusTimer }
    ]);

    return ref;
  }

  /**
   * Closes every open dialog.
   *
   * Called when the element is destroyed. Under ngx-bootstrap this mattered because the dialogs
   * lived on `document.body` and outlived the element; now they are inside the shadow root and go
   * with it. It stays because closing is what runs a dialog's teardown — the ref settles, the
   * stack drops it, focus goes back — and a caller can still want them all gone.
   *
   * Not for the sake of `closed` subscribers: there are none in this codebase today. Callers that
   * need a result wire it through the dialog's own callbacks instead (see promptForPackageName),
   * and those do NOT run on `hide()`.
   */
  closeAll(): void {
    [...this._open.value].reverse().forEach(dialog => dialog.ref.hide());
  }

  private dispose(ref: DialogRef<any>): void {
    const stack = this._open.value;
    const dialog = stack.find(d => d.ref === ref);
    if (!dialog) { return; }

    window.clearTimeout(dialog.focusTimer);
    dialog.componentRef.destroy();

    const remaining = stack.filter(d => d !== dialog);
    this._open.next(remaining);
    if (!remaining.length) { unlockBodyScroll(); }

    // Give focus back to whatever had it, so closing a dialog does not drop the caret on the page.
    // Only if that node is still in a document: a dialog opened from another dialog's button
    // records that button, and it is destroyed moments later — focusing it then would do nothing
    // visible while leaving focus on <body>, outside the element entirely. Falling back to the
    // container keeps the user inside the tab order they were in.
    const previous = dialog.previouslyFocused as HTMLElement | null;
    if (previous?.isConnected && typeof previous.focus === 'function') {
      previous.focus();
    } else if (remaining.length) {
      this.focusContainer();
    }
  }

  /**
   * Reads the focused node, following into shadow roots.
   *
   * `document.activeElement` stops at the host element for anything focused inside a shadow tree,
   * so without walking down it we would restore focus to the element as a whole rather than to the
   * control the user was on.
   */
  private activeElement(): Element | null {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) { active = active.shadowRoot.activeElement; }
    return active;
  }

  /**
   * Moves focus to the `.modal` container, so tabbing continues from inside the dialog rather than
   * from wherever the user was on the page behind it.
   *
   * The container and not a control inside it, which is what ngx-bootstrap also did. Focusing the
   * first focusable descendant sounds friendlier and is not: for the confirm dialog opened before
   * sending an incomplete form, the first one in document order is the "Send Anyway" button, so
   * the dialog would open with the destructive choice armed and a stray Space or Enter would take
   * it. And the element's own `*:focus { outline: 0 !important }` reaches inside the shadow root
   * now, while its `:focus-visible` replacement does not match after a mouse click — so there
   * would be nothing on screen saying where focus had landed.
   *
   * The container is focusable only because the outlet gives it `tabindex="-1"`. From here the
   * focus trap takes over and keeps Tab inside.
   */
  private focusContainer(): void {
    this.container?.focus?.();
  }
}
