import { Observable, Subject } from 'rxjs';

/**
 * A handle on one open dialog.
 *
 * Replaces ngx-bootstrap's `BsModalRef`, which came with a modal implementation that could only
 * mount on `document.body` — outside the shadow boundary, where the element's styles do not reach
 * and the host page's do.
 *
 * `hide()` keeps the name the dialog components already call, so nothing in them changes but the
 * type they ask for in their constructor.
 */
export class DialogRef<R = unknown> {

  private readonly _closed = new Subject<R | undefined>();

  /** Emits once, with whatever the dialog was closed with, and then completes. */
  readonly closed: Observable<R | undefined> = this._closed.asObservable();

  /**
   * @param onHide Runs the close itself — the service owns the stack, so the ref only asks.
   */
  constructor(private readonly onHide: (ref: DialogRef<R>) => void) {}

  private settled = false;

  /**
   * Closes the dialog.
   *
   * Safe to call more than once: a dialog that closes itself and is then torn down by
   * `closeAll()` would otherwise emit twice to a caller that is already gone.
   */
  hide(result?: R): void {
    if (this.settled) { return; }
    this.settled = true;

    this.onHide(this);
    this._closed.next(result);
    this._closed.complete();
  }
}
