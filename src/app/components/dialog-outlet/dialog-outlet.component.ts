import { AfterViewInit, Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormStreamDialogService } from '../../services/dialog/dialog.service';

/**
 * Where dialogs are rendered — inside the element's shadow root, not on `document.body`.
 *
 * The markup reproduces the structure ngx-bootstrap produced — `.modal-backdrop`, then a `.modal`
 * positioning container holding a `.modal-dialog` > `.modal-content` wrapper — and reuses its class
 * names on purpose: Bootstrap's modal rules already travelled into the shadow root with the rest of
 * the stylesheet, so the dialogs keep the look they had without a single new rule.
 *
 * The wrapper is load-bearing, not decoration. Every dialog component's own root is itself a
 * `.modal-dialog`, and formstream.styles.less sizes it through `.modal-dialog .modal-dialog`,
 * which only matches when it is nested inside another one. Drop the wrapper and that rule — plus
 * the `.sm`/`.xs`/`.reg`/`.lg` width variants and `.modal-dialog .modal-dialog .close` — stops
 * matching, and each dialog falls back to the outer rule written for the wrapper: measured at
 * 1400x800 flush against the top of the viewport, instead of 640x55 centred.
 *
 * `display: block` is set inline for the same reason ngx-bootstrap set it: Bootstrap ships `.modal`
 * as `display: none` and expects whoever opens it to override that.
 *
 * There is deliberately no click-to-dismiss handler. It looks like an oversight and is not: the
 * app's own `.modal-content { height: 100% }` makes the wrapper cover the whole overlay, so a click
 * in the dimmed area lands on `.modal-content` and never on `.modal` or on the backdrop underneath
 * — measured both here and against the ngx-bootstrap markup, where it never fired either. A handler
 * on either of those two elements is dead code, which is what was here before.
 *
 * Giving the element real click-to-dismiss means hit-testing against the dialog's own box, and it
 * has a prerequisite: `DialogRef.hide()` does not run a dialog's `onCancel`, so dismissing the
 * package-name prompt that way would leave `promptForPackageName`'s subject hanging and the save
 * would never happen, silently. Both belong together, in their own change.
 *
 * The backdrop element stays even though nothing can click it: `.modal` paints 80% black over it,
 * so removing it would visibly lighten the overlay.
 *
 * `tabindex="-1"`, `aria-modal` and `focusTrap` are the accessibility ngx-bootstrap's container
 * carried and this replacement has to carry too. The tabindex is what makes `.modal` focusable at
 * all, so the service has somewhere to put focus that is not a control the user did not ask to
 * activate. `aria-modal` is bound rather than fixed so the attribute is absent when nothing is
 * open — announcing a modal over an empty overlay would be worse than saying nothing. The trap is
 * enabled the same way: its anchors are focusable, so leaving it armed around a `display: none`
 * container would put two stops in the host page's tab order for a dialog that is not there.
 */
@Component({
  selector: 'fs-dialog-outlet',
  // The anchor is never inside the *ngIf: a ViewContainerRef that only exists once a dialog is open
  // could not be used to open the first one. The container is always in the tree and hidden instead,
  // which is also how Bootstrap expects `.modal` to be driven.
  template: `
    <div class="modal-backdrop fade in" *ngIf="hasOpenDialogs$ | async"></div>
    <div class="modal fade in"
         #container
         role="dialog"
         tabindex="-1"
         [attr.aria-modal]="(hasOpenDialogs$ | async) ? 'true' : null"
         [style.display]="(hasOpenDialogs$ | async) ? 'block' : 'none'">
      <!-- focusTrap selects the directive; cdkTrapFocus is what its "is it on" input is aliased
           to, a leftover from the CDK code it was lifted from. -->
      <div class="modal-dialog" role="document" focusTrap [cdkTrapFocus]="!!(hasOpenDialogs$ | async)">
        <div class="modal-content">
          <ng-container #host></ng-container>
        </div>
      </div>
    </div>
  `
})
export class DialogOutletComponent implements AfterViewInit {

  @ViewChild('host', { read: ViewContainerRef }) private host!: ViewContainerRef;
  @ViewChild('container') private container!: ElementRef<HTMLElement>;

  readonly hasOpenDialogs$: Observable<boolean>;

  constructor(private readonly dialogs: FormStreamDialogService) {
    this.hasOpenDialogs$ = this.dialogs.open$.pipe(map(open => open.length > 0));
  }

  ngAfterViewInit(): void {
    this.dialogs.registerOutlet(this.host, this.container.nativeElement);
  }

}
