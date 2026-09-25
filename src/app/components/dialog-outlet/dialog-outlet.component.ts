import { AfterViewInit, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormStreamDialogService } from '../../services/dialog/dialog.service';

/**
 * Where dialogs are rendered — inside the element's shadow root, not on `document.body`.
 *
 * The markup mirrors the structure ngx-bootstrap produced (`.modal-backdrop`, then a `.modal`
 * positioning container holding the dialog) and reuses its class names on purpose: Bootstrap's
 * modal rules already travelled into the shadow root with the rest of the stylesheet, so the
 * dialogs keep the look they had without a single new rule.
 *
 * `display: block` is set inline for the same reason ngx-bootstrap set it: Bootstrap ships `.modal`
 * as `display: none` and expects whoever opens it to override that.
 */
@Component({
  selector: 'fs-dialog-outlet',
  // The anchor is never inside the *ngIf: a ViewContainerRef that only exists once a dialog is open
  // could not be used to open the first one. The container is always in the tree and hidden instead,
  // which is also how Bootstrap expects `.modal` to be driven.
  template: `
    <div class="modal-backdrop fade in" *ngIf="hasOpenDialogs$ | async" (click)="onBackdropClick()"></div>
    <div class="modal fade in"
         role="dialog"
         [style.display]="(hasOpenDialogs$ | async) ? 'block' : 'none'"
         (click)="onContainerClick($event)">
      <ng-container #host></ng-container>
    </div>
  `
})
export class DialogOutletComponent implements AfterViewInit {

  @ViewChild('host', { read: ViewContainerRef }) private host!: ViewContainerRef;

  readonly hasOpenDialogs$: Observable<boolean>;

  constructor(private readonly dialogs: FormStreamDialogService) {
    this.hasOpenDialogs$ = this.dialogs.open$.pipe(map(open => open.length > 0));
  }

  ngAfterViewInit(): void {
    this.dialogs.registerOutlet(this.host);
  }

  /** The backdrop closes the topmost dialog — the behaviour ngx-bootstrap's own backdrop had. */
  onBackdropClick(): void {
    this.dialogs.hideTop();
  }

  /**
   * Bootstrap's `.modal` container fills the viewport, so the space around the dialog is part of
   * it rather than the backdrop underneath. A click that lands there is a click outside the dialog
   * and closes it; a click that came from within the dialog is left alone.
   */
  onContainerClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) { this.dialogs.hideTop(); }
  }
}
