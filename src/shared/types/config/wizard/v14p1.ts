import type {
    OverrideTitleSettings,
    V14ChartsConfigDatasetField,
    V14ClientOnlyFields,
    V14Color,
    V14ColorsConfig,
    V14CommonSharedExtraSettings,
    V14Filter,
    V14Formatting,
    V14HierarchyField,
    V14Label,
    V14Layer,
    V14Link,
    V14PlaceholderSettings,
    V14PointSizeConfig,
    V14Shape,
    V14ShapesConfig,
    V14Sort,
    V14Tooltip,
    V14TooltipConfig,
    V14Update,
    V14Visualization,
} from '../../..';
import type {DatasetFieldCalcMode, ParameterDefaultValue} from '../../dataset';
import type {
    ChartsConfigVersion,
    ColumnSettings,
    HintSettings,
    TableBarsSettings,
    TableFieldBackgroundSettings,
    TableSubTotalsSettings,
} from '../../wizard';

export type V14p1ChartsConfig = {
    title?: string;
    colors: V14Color[];
    colorsConfig?: V14ColorsConfig;
    extraSettings: V14CommonSharedExtraSettings | undefined;
    filters: V14Filter[];
    geopointsConfig?: V14PointSizeConfig;
    hierarchies: V14HierarchyField[];
    labels: V14Label[];
    links: V14Link[];
    sort: V14Sort[];
    tooltips: V14Tooltip[];
    tooltipConfig?: V14TooltipConfig;
    type: 'datalens';
    updates: V14Update[];
    visualization: V14Visualization;
    shapes: V14Shape[];
    shapesConfig?: V14ShapesConfig;
    version: ChartsConfigVersion.V14;
    datasetsIds: string[];
    datasetsPartialFields: V14ChartsConfigDatasetField[][];
    segments: V14p1Field[];
    chartType?: string;
};

export type V14p1Visualization = {
    id: string;
    highchartsId?: string;
    selectedLayerId?: string;
    layers?: V14Layer[];
    placeholders: V14p1Placeholder[];
};

export type V14p1Placeholder = {
    id: string;
    settings?: V14PlaceholderSettings;
    required?: boolean;
    capacity?: number;
    items: V14p1Field[];
};

export type V14p1HierarchyField = {
    data_type: string;
    fields: V14p1Field[];
    type: string;
};

export type V14p1Field = {
    data_type: string;
    fields?: V14p1Field[];
    type: string;
    title: string;
    guid: string;
    formatting?: V14Formatting;
    format?: string;
    datasetId: string;
    source?: string;
    datasetName?: string;
    hideLabelMode?: string;
    calc_mode: DatasetFieldCalcMode;
    default_value?: ParameterDefaultValue;
    barsSettings?: TableBarsSettings;
    subTotalsSettings?: TableSubTotalsSettings;
    backgroundSettings?: TableFieldBackgroundSettings;
    columnSettings?: ColumnSettings;
    hintSettings?: HintSettings;
    overrideTitleSettings?: OverrideTitleSettings;
    ui_settings?: string;
} & V14ClientOnlyFields;
