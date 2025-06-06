import type {ThunkDispatch} from 'redux-thunk';
import type {DatalensGlobalState} from 'ui';
import type {
    AddSelectorToGroupAction,
    SetActiveSelectorIndexAction,
    SetSelectorDialogItemAction,
    UpdateSelectorsGroupAction,
} from 'ui/store/actions/controlDialog';
import type {EditHistoryAction} from 'ui/store/actions/editHistory';

import type {EntryContentAction} from '../../../../store/actions/entryContent';

import type {SaveDashErrorAction, SaveDashSuccessAction} from './dash';
import type {
    ChangeNavigationPathAction,
    SetAccessDescriptionAction,
    SetDashKeyAction,
    SetDashKitRefAction,
    SetDashOpenedDescKeyAction,
    SetDashUpdateStatusAction,
    SetDescViewModeAction,
    SetDescriptionAction,
    SetErrorModeAction,
    SetHashStateAction,
    SetHistoryStateAction,
    SetInitialPageTabsItemsAction,
    SetItemDataAction,
    SetLoadingEditModeAction,
    SetPageDefaultTabItemsAction,
    SetPageTabAction,
    SetPageTabsItemsAction,
    SetSettingsAction,
    SetSkipReloadAction,
    SetStateAction,
    SetStateHashIdAction,
    SetSupportDescriptionAction,
    SetTabHashStateAction,
    SetViewModeAction,
    SetWidgetCurrentTabAction,
    ToggleTableOfContentAction,
} from './dashTyped';
import type {CloseDialogAction, OpenDialogAction, OpenItemDialogAction} from './dialogs/actions';
import type {SetNewRelationsAction} from './relations/actions';

export type DashAction<T = unknown> =
    | SetStateAction<T>
    | SetPageTabAction
    | SetPageTabsItemsAction
    | SetInitialPageTabsItemsAction
    | SetPageDefaultTabItemsAction
    | ChangeNavigationPathAction
    | SetDashKitRefAction
    | SetHashStateAction
    | SetTabHashStateAction
    | SetStateHashIdAction
    | SetErrorModeAction
    | ToggleTableOfContentAction
    | SetSelectorDialogItemAction
    | AddSelectorToGroupAction
    | UpdateSelectorsGroupAction
    | SetViewModeAction
    | SetDescViewModeAction
    | SetDescriptionAction
    | SetAccessDescriptionAction
    | SetSupportDescriptionAction
    | SetDashOpenedDescKeyAction
    | SetLoadingEditModeAction
    | EntryContentAction
    | SetDashUpdateStatusAction
    | SetNewRelationsAction
    | SetItemDataAction
    | SetDashKeyAction
    | SetActiveSelectorIndexAction
    | SetSkipReloadAction
    | SetWidgetCurrentTabAction
    | OpenDialogAction
    | OpenItemDialogAction
    | CloseDialogAction
    | SaveDashSuccessAction
    | SaveDashErrorAction
    | SetSettingsAction
    | SetHistoryStateAction
    | EditHistoryAction;

export type DashDispatch = ThunkDispatch<DatalensGlobalState, void, DashAction>;
