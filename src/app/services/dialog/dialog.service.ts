import { ComponentRef, Injectable, Injector, Type, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DialogRef } from './dialog-ref';

/** One dialog on the stack: the ref handed to callers, and the view backing it. */
interface OpenDialog {
  ref: DialogRef<any>;
  componentRef: ComponentRef<any>;
  /** What had focus when this dialog opened, so it can be given back on close. */
  previouslyFocused: Element | null;
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
  private readonly _open = new BehaviorSubject<OpenDialog[]>([]);

  /** The open stack, for the outlet to know whether to draw its chrome. */
  readonly open$: Observable<OpenDialog[]> = this._open.asObservable();

  get openCount(): number { return this._open.value.length; }

  /**
   * Registered by the outlet once its view exists. Until then there is nowhere to render, which is
   * why nothing opens a dialog before the element has rendered.
   */
  registerOutlet(outlet: ViewContainerRef): void {
    this.outlet = outlet;
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

    this._open.next([
      ...this._open.value,
      { ref, componentRef, previouslyFocused: this.activeElement() }
    ]);

    // Deferred on purpose. The outlet's container is still `display: none` at this point — the
    // binding that reveals it reacts to the push above and has not been rendered yet — and a node
    // inside a hidden subtree cannot take focus, so focusing here silently does nothing.
    setTimeout(() => this.focusFirstIn(componentRef));

    return ref;
  }

  /** Closes the topmost dialog, which is what a click on the backdrop means. */
  hideTop(): void {
    const stack = this._open.value;
    if (stack.length) { stack[stack.length - 1].ref.hide(); }
  }

  /**
   * Closes every open dialog.
   *
   * Called when the element is destroyed. Under ngx-bootstrap this mattered because the dialogs
   * lived on `document.body` and outlived the element; now they are inside the shadow root and go
   * with it. It stays because a caller can still want them all gone — and because a dialog's
   * `closed` subscribers should hear about it rather than be dropped silently.
   */
  closeAll(): void {
    [...this._open.value].reverse().forEach(dialog => dialog.ref.hide());
  }

  private dispose(ref: DialogRef<any>): void {
    const stack = this._open.value;
    const dialog = stack.find(d => d.ref === ref);
    if (!dialog) { return; }

    dialog.componentRef.destroy();
    this._open.next(stack.filter(d => d !== dialog));

    // Give focus back to whatever had it, so closing a dialog does not drop the caret on the page.
    const previous = dialog.previouslyFocused as HTMLElement | null;
    if (previous && typeof previous.focus === 'function') { previous.focus(); }
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

  /** Moves focus into the dialog, so Escape and tabbing land where the user is looking. */
  private focusFirstIn(componentRef: ComponentRef<any>): void {
    const host: HTMLElement = componentRef.location.nativeElement;
    const focusable = host.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? host).focus?.();
  }
}
