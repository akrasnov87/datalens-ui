import type {Dataset} from 'shared';

import type {DatasetTab} from '../constants';
import {DATASET_TABS, TAB_DATASET, TAB_SOURCES} from '../constants';
import DatasetUtils, {isCreationProcess} from '../helpers/utils';

import type {DatasetReduxState} from './types';

const getDefaultDatasetContent = (): Partial<Dataset['dataset']> => ({
    avatar_relations: [],
    component_errors: {items: []},
    obligatory_filters: [],
    result_schema: [],
    result_schema_aux: {inter_dependencies: {deps: []}},
    source_avatars: [],
    source_features: {},
    sources: [],
    load_preview_by_default: true,
    rls: {},
});

const isDatasetTab = (value: unknown): value is DatasetTab => {
    return typeof value === 'string' && DATASET_TABS.includes(value);
};

export const getCurrentTab = (): DatasetTab => {
    const defaultTab = isCreationProcess(location.pathname) ? TAB_SOURCES : TAB_DATASET;
    const queryTab = DatasetUtils.getQueryParam('tab');

    if (isDatasetTab(queryTab)) {
        return queryTab;
    }

    return defaultTab;
};

export const initialPreview: DatasetReduxState['preview'] = {
    previewEnabled: true,
    readyPreview: 'loading',
    isVisible: true,
    isLoading: true,
    amountPreviewRows: 10,
    view: 'bottom',
    data: [],
    error: null,
    isQueued: false,
};

export const initialState: DatasetReduxState = {
    isLoading: true,
    isFavorite: false,
    isDatasetRevisionMismatch: false,
    id: '',
    key: '',
    workbookId: null,
    connection: null,
    // current content of the dataset
    content: getDefaultDatasetContent(),
    // the previous contents of the dataset, necessary for the validation handle
    prevContent: getDefaultDatasetContent(),
    options: {},
    preview: initialPreview,
    errors: {
        previewError: null,
        savingError: null,
        sourceLoadingError: null,
        validationError: null,
    },
    validation: {
        isLoading: false,
        isPending: false,
        error: null,
    },
    savingDataset: {
        disabled: true,
        isProcessingSavingDataset: false,
        error: null,
    },
    types: {
        data: [],
        error: null,
    },
    ui: {
        selectedConnectionId: null,
        isDatasetChanged: false,
        isFieldEditorModuleLoading: false,
        isSourcesLoading: false,
    },
    editor: {
        filter: '',
        itemsToDisplay: ['hiddenFields'],
    },
    updates: [],
    freeformSources: [],
    selectedConnections: [],
    sourcePrototypes: [],
    sourceTemplate: null,
    error: null,
    currentTab: getCurrentTab(),
};

export const getInitialState = (extra?: Partial<DatasetReduxState>): DatasetReduxState => ({
    ...initialState,
    ...extra,
});

export const EDIT_HISTORY_OPTIONS_KEY = '__editHistoryOptions__';
