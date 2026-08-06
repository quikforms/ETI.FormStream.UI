import { createFeatureSelector } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Notification } from '../models/notification.model';
import { ApiError } from '../models/apiError.model';
import { HIDE_NOTIFICATION, NotificationActions, SET_API_ERROR_NOTIFICATION, SET_ERROR_NOTIFICATION, SET_SUCCESS_NOTIFICATION } from '../actions/notification.actions';

export const NOTIFICATION_SUCCESS_TYPE = "SUCCESS";
export const NOTIFICATION_ERROR_TYPE = "ERROR";
export const NOTIFICATION_API_ERROR_TYPE = "API_ERROR";

export const NotificationAdapter = createEntityAdapter<Notification>();
export interface NotificationState extends EntityState<Notification> {}

export const initialNotificationState: NotificationState = NotificationAdapter.getInitialState({});

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

export function NotificationReducer (
    state: NotificationState = initialNotificationState,
    action: NotificationActions
    ) {
        let newId = new Date().getTime();
        switch (action.type) {
            case SET_SUCCESS_NOTIFICATION:
                return NotificationAdapter.addOne({
                    id: newId,
                    cssType: 'success',
                    cssPos: 'bottom',
                    displayHeadText: 'Success',
                    text: action.text,
                    display: true,
                    timer: successTime,
                    hideAfterTimer: action.hideAfterTimer,
                    type: NOTIFICATION_SUCCESS_TYPE
                }, state);
            case HIDE_NOTIFICATION:
                return NotificationAdapter.updateOne({
                    id: action.id,
                    changes: {
                        display: false
                    }
                }, state);
            case SET_ERROR_NOTIFICATION:
                return NotificationAdapter.addOne({
                    id: newId,
                    cssType: errorClassType,
                    cssPos: errorClassPos,
                    displayHeadText: errorText,
                    text: action.text,
                    display: true,
                    timer: errorTime,
                    hideAfterTimer: true,
                    type: NOTIFICATION_ERROR_TYPE,
                }, state);
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
                    return NotificationAdapter.addOne(mapNotification(newId, action.apiError, action.title, action.cssType, action.cssPos, action.doNotHideAfterTimer, NOTIFICATION_API_ERROR_TYPE), state);
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
