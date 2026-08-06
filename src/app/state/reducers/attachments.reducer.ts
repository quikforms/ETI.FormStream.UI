import { createEntityAdapter } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import { AttachedFile, SelectedFile } from "../models/attached-file.model";
import { AttachmentsActions, CLEAR_SELECTED_FILES, LOAD_ATTACHMENTS_FAIL, LOAD_ATTACHMENTS_SUCCESS, REMOVE_UPLOADED_FILE_FAIL, REMOVE_UPLOADED_FILE_SUCCESS, SELECT_FILES_FAIL, SELECT_FILES_SUCCESS, TRY_LOAD_ATTACHMENTS, TRY_REMOVE_UPLOADED_FILE, TRY_REMOVE_SELECTED_FILE, TRY_SELECT_FILES, TRY_UPLOAD_FILES, UPLOAD_FILES_FAIL, UPLOAD_FILES_SUCCESS, REMOVE_SELECTED_FILE_SUCCESS, REMOVE_SELECTED_FILE_FAIL, SET_ATTACHMENTS } from "../actions/attachments.actions";

export const AttachmentsAdapter = createEntityAdapter<AttachedFile>();

const selectFeature = createFeatureSelector<AttachmentsState>('attachmentsReducer');

export interface AttachmentsState {
    attachedFiles: AttachedFile [],
    loading: boolean,
    selectedFiles: SelectedFile [],
    removeFileLoading: boolean,
}

export const AttachmentsSelectors = {    
    getAttachedFiles: createSelector(selectFeature, (state: AttachmentsState) => state && state.attachedFiles),
    isLoading: createSelector(selectFeature, (state: AttachmentsState) => state && state.loading),
    getSelectedFiles: createSelector(selectFeature, (state: AttachmentsState) => state && state.selectedFiles),
    isRemoveFileLoading: createSelector(selectFeature, (state: AttachmentsState) => state && state.removeFileLoading),
}

const initialState: AttachmentsState = AttachmentsAdapter.getInitialState({    
    attachedFiles: [],
    loading: false,
    selectedFiles: [],
    removeFileLoading: false
});

export function AttachmentsReducer(
    state: AttachmentsState = initialState, 
    action: AttachmentsActions)     
{
    switch (action.type) {
        case TRY_UPLOAD_FILES:
            return {
                ...state,
                loading: true
            };
        case UPLOAD_FILES_SUCCESS:
            return {
                ...state,
                loading: false,
                attachedFiles: [...state.attachedFiles, ...action.attachedFiles]
            };
        case UPLOAD_FILES_FAIL:
            return {
                ...state,
                loading: false
            };
        case TRY_REMOVE_UPLOADED_FILE:
            return {
                ...state,
                removeFileLoading: true
            };
        case REMOVE_UPLOADED_FILE_SUCCESS:
            return {
                ...state,
                removeFileLoading: false,
                attachedFiles: state.attachedFiles.filter(file => file.id !== action.fileId)
            };
        case REMOVE_UPLOADED_FILE_FAIL:
            return {
                ...state,
                removeFileLoading: false
            };
        case TRY_LOAD_ATTACHMENTS:
            return {
                ...state,
                loading: true
            };
        case LOAD_ATTACHMENTS_SUCCESS:
            return {
                ...state,
                loading: false,
                attachedFiles: action.attachedFiles
            };
        case LOAD_ATTACHMENTS_FAIL:
            return {
                ...state,
                loading: false
            };
        case TRY_SELECT_FILES:
            return {
                ...state,
                loading: true,
                selectedFiles: [...state.selectedFiles, ...action.files] 
            };
        case SELECT_FILES_SUCCESS:
        case SELECT_FILES_FAIL:            
            return {
                ...state,
                loading: false                
            };        
        case TRY_REMOVE_SELECTED_FILE:
            return {
                ...state,                
                selectedFiles: state.selectedFiles.filter(selectedFile => selectedFile.id !== action.selectedFileId)
            };
        case REMOVE_SELECTED_FILE_SUCCESS:
        case REMOVE_SELECTED_FILE_FAIL:
            return {
                ...state,
                loading: false                
            };        
        case CLEAR_SELECTED_FILES:
            return {
                ...state,
                selectedFiles: []
            };
        case SET_ATTACHMENTS:
            return {
                ...state,
                attachedFiles: action.attachedFiles
            };
        default:
            return state;
    }
}