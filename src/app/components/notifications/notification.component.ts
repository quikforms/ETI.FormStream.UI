
import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
    trigger,
    style,
    animate,
    transition,
    query,
    stagger,
    keyframes
} from '@angular/animations';

import { Store } from '@ngrx/store';

import { timer as observableTimer } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { HideNotification } from '../../state/actions/notification.actions';
import { BaseComponent } from '../base.component';
import { NotificationSelectors } from '../../state/reducers/notification.reducer';

@Component({
    selector: 'notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.less'],
    animations: [
        trigger('transition', [
            transition('void => *', [
                query('*', style({ opacity: 0 }), { optional: true }),
                query('*', stagger('0ms', [
                    animate('0.8s ease-in', keyframes([
                        style({ opacity: 0, offset: 0 }),
                        style({ opacity: .5, offset: 0.3 }),
                        style({ opacity: 1, offset: 1.0 }),
                    ]))]), { optional: true }),
            ]),
            transition('* => void', [
                query('*', style({ opacity: 1 }), { optional: true }),
                query('*', stagger('0ms', [
                    animate('0.8s ease-in', keyframes([
                        style({ opacity: 1, offset: 0 }),
                        style({ opacity: .5, offset: 0.3 }),
                        style({ opacity: 0, offset: 1.0 })
                    ]))]), { optional: true }),
            ])
        ]),

    ]
})
export class NotificationComponent extends BaseComponent {
    notifications = this._store.select(NotificationSelectors.selectAll);
    isHomeActivated: boolean = true;

    constructor(
        private _store: Store<any>,
        private _router: Router
    ) { super(); }

    ngOnInit() {
        this._router
            .events.pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntil(this.destroyed$),)
            .subscribe((event: NavigationEnd) => {
                this.isHomeActivated = event.url === '/home';
            });


        this.notifications.pipe(
            takeUntil(this.destroyed$))
            .subscribe((notifications) =>
                notifications
                    .filter(n => n && n.display && n.timer > 0 && n.hideAfterTimer)
                    .forEach(n =>
                        observableTimer(n.timer).subscribe(() => {
                            this._store.dispatch(new HideNotification(n.id));
                        })
                    )
            );
    }

    onNotificationClose(key: number) {
        this._store.dispatch(new HideNotification(key));
    }

}
