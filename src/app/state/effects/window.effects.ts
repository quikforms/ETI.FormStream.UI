import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { WindowOpen, WINDOW_OPEN } from '../actions/window.actions';
import { WindowRef } from '../../services/window-ref.service';

@Injectable()
export class WindowEffects {

  constructor(
    private _actions: Actions,
    private _winRef: WindowRef
  ) { }

  openWindow = createEffect(() => this._actions
    .pipe(
      ofType<WindowOpen>(WINDOW_OPEN),
      tap((action) => {
        if (action.isUrl) {
          this._winRef.getNativeWindow().open(action.displayedContent);
          return;
        }

        const isMicrosoftBrowser = /msie\s|trident\/|edge\//i.test(this._winRef.getNativeWindow().navigator.userAgent);
        const wrapper = this._winRef.getNativeWindow().open();
        const content = action.displayedContent.split('&nbsp;').join('');
        const finalContent = !isMicrosoftBrowser ? content : `<!doctype html>${content}`;

        if (wrapper) {
          wrapper.document.write(finalContent);
          wrapper.focus();
          wrapper.document.close();
        }
      })
    ), { dispatch: false });
}
