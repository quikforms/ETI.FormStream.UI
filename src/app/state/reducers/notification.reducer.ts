import { createFeatureSelector } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Notification } from '../models/notification.model';
import { ApiError } from '../models/apiError.model';
import { HIDE_NOTIFICATION, NotificationActions, SET_API_ERROR_NOTIFICATION, SET_ERROR_NOTIFICATION, SET_SUCCESS_NOTIFICATION } from '../actions/notification.actions';

export const NOTIFICATION_SUCCESS_TYPE = "SUCCESS";
export const NOTIFICATION_ERROR_TYPE = "ERROR";
export const NOTIFICATION_API_ERROR_TYPE = "API_ERROR";

export const NotificationAdapter = createEntityAdapter<Notification>();
/**
 * `nextId` is part of the state, not a module counter: a reducer has to be a pure function of what it
 * is given, or the same action replayed produces a different store.
 */
export interface NotificationState extends EntityState<Notification> { nextId: number; }

export const initialNotificationState: NotificationState = NotificationAdapter.getInitialState({ nextId: 1 });

export const selectNotificationFeature = createFeatureSelector<NotificationState>('notificationReducer');

export const NotificationSelectors = {
    selectNotificationFeature: selectNotificationFeature,
    ...NotificationAdapter.getSelectors(selectNotificationFeature),
};

export const errorClassType = 'error';
export const errorClassPos = 'bottom';
export const errorText = 'Error';
export const errorTime = 20000;
export const successTime = 5000;

/**
 * The state a notification is added to, with the next id already taken.
 *
 * Ids have to be distinct, not merely time-ordered: `addOne` ignores an id the collection already
 * holds, so two notifications raised close together used to leave one of them unshown with nothing
 * anywhere to say so. Nothing orders on the value — the adapter is created without a sort comparer, so
 * the collection is already in insertion order — which is why a plain counter is enough.
 */
function taking(state: NotificationState): NotificationState {
    return { ...state, nextId: state.nextId + 1 };
}

export function NotificationReducer (
    state: NotificationState = initialNotificationState,
    action: NotificationActions
    ) {
        switch (action.type) {
            case SET_SUCCESS_NOTIFICATION:
                return NotificationAdapter.addOne({
                    id: state.nextId,
                    cssType: 'success',
                    cssPos: 'bottom',
                    displayHeadText: 'Success',
                    text: action.text,
                    display: true,
                    timer: successTime,
                    hideAfterTimer: action.hideAfterTimer,
                    type: NOTIFICATION_SUCCESS_TYPE
                }, taking(state));
            case HIDE_NOTIFICATION:
                return NotificationAdapter.updateOne({
                    id: action.id,
                    changes: {
                        display: false
                    }
                }, state);
            case SET_ERROR_NOTIFICATION:
                return NotificationAdapter.addOne({
                    id: state.nextId,
                    cssType: errorClassType,
                    cssPos: errorClassPos,
                    displayHeadText: errorText,
                    text: action.text,
                    display: true,
                    timer: errorTime,
                    hideAfterTimer: true,
                    type: NOTIFICATION_ERROR_TYPE,
                }, taking(state));
            case SET_API_ERROR_NOTIFICATION:
                let entities = state.entities;
                let apiErrorNotificationAlreadyAdded = false;
                let id;

                for (const entityId in entities) {
                    let type = entities[entityId].type;
                    let text = entities[entityId].text;

                    if(type === NOTIFICATION_API_ERROR_TYPE  && text == action.apiError.message) {

                        apiErrorNotificationAlreadyAdded = true;
                        id = entityId;
                        break;
                    }
                }

                if(apiErrorNotificationAlreadyAdded) {
                    return NotificationAdapter.updateOne({
                        id: id,
                        changes: {
                            display: true
                        }
                    }, state);
                }
                else {
                    return NotificationAdapter.addOne(mapNotification(state.nextId, action.apiError, action.title, action.cssType, action.cssPos, action.doNotHideAfterTimer, NOTIFICATION_API_ERROR_TYPE), taking(state));
                }
            default:
                return state;
        }
}

const genericErrorMessage = 'Oops! There are some issues. Please try again. If the problem persists contact support.';

function mapNotification (newId: number, apiError: ApiError, title: string, cssType: string = errorClassType, cssPos: string = errorClassPos, doNotHideAfterTimer: boolean, type: string) {
    let errorMessage = apiError.message || '';

    if (!errorMessage || errorMessage === '') {
        errorMessage = genericErrorMessage;
    }

    let notification =  new Notification(true, cssPos, cssType, errorMessage, title || errorText, errorTime, !doNotHideAfterTimer, type);
    notification.id = newId;
    return notification;
}
