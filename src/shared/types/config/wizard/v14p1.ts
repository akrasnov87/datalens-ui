import type {
    BandTitleSettings,
    GradientNullMode,
    MapCenterModes,
    MarkupType,
    MetricFontSettings,
    OverrideTitleSettings,
    WidgetSizeType,
    ZoomModes,
} from '../../..';
import type {ColorMode} from '../../../constants';
import type {DatasetFieldCalcMode, ParameterDefaultValue} from '../../dataset';
import type {NumberFormatType, NumberFormatUnit} from '../../formatting';
import type {
    AxisLabelFormatMode,
    AxisMode,
    AxisNullsMode,
    ChartsConfigVersion,
    ColumnSettings,
    HintSettings,
    IndicatorTitleMode,
    LabelsPositions,
    TableBarsSettings,
    TableFieldBackgroundSettings,
    TableSubTotalsSettings,
} from '../../wizard';

export type V14p1ChartsConfig = {
    title?: string;
    colors: V14p1Color[];
    colorsConfig?: V14p1ColorsConfig;
    extraSettings: V14p1CommonSharedExtraSettings | undefined;
    filters: V14p1Filter[];
    geopointsConfig?: V14p1PointSizeConfig;
    hierarchies: V14p1HierarchyField[];
    labels: V14p1Label[];
    links: V14p1Link[];
    sort: V14p1Sort[];
    tooltips: V14p1Tooltip[];
    tooltipConfig?: V14p1TooltipConfig;
    type: 'datalens';
    updates: V14p1Update[];
    visualization: V14p1Visualization;
    shapes: V14p1Shape[];
    shapesConfig?: V14p1ShapesConfig;
    version: ChartsConfigVersion.V14p1;
    datasetsIds: string[];
    datasetsPartialFields: V14p1ChartsConfigDatasetField[][];
    segments: V14p1Field[];
    chartType?: string;
};

export type V14p1Update = {
    action: 'add_field' | 'add' | 'update_field' | 'update' | 'delete' | 'delete_field';
    field: any;
    debug_info?: string;
};

export type V14p1CommonSharedExtraSettings = {
    title?: string;
    titleMode?: 'show' | 'hide';
    indicatorTitleMode?: IndicatorTitleMode;
    legendMode?: 'show' | 'hide';
    tooltip?: 'show' | 'hide';
    tooltipSum?: 'on' | 'off';
    limit?: number;
    pagination?: 'on' | 'off';
    navigatorMode?: string;
    navigatorSeriesName?: string;
    totals?: 'on' | 'off';
    pivotFallback?: 'on' | 'off';
    pivotInlineSort?: 'on' | 'off';
    stacking?: 'on' | 'off';
    overlap?: 'on' | 'off';
    feed?: string;
    navigatorSettings?: V14p1NavigatorSettings;
    enableGPTInsights?: boolean;
    labelsPosition?: LabelsPositions;
    pinnedColumns?: number;
    size?: WidgetSizeType;
    zoomMode?: ZoomModes;
    zoomValue?: number | null;
    mapCenterMode?: MapCenterModes;
    mapCenterValue?: string | null;
    preserveWhiteSpace?: boolean;
} & MetricFontSettings;

export type V14p1NavigatorSettings = {
    navigatorMode: string;
    isNavigatorAvailable: boolean;
    selectedLines: string[];
    linesMode: string;
    periodSettings: {
        type: string;
        value: string;
        period: string;
    };
};

export type V14p1Filter = {
    guid: string;
    datasetId: string;
    disabled?: string;
    filter: {
        operation: {
            code: string;
        };
        value?: string | string[];
    };
    type: string;
    title: string;
    calc_mode: DatasetFieldCalcMode;
} & V14p1ClientOnlyFields;

export type V14p1Sort = {
    guid: string;
    title: string;
    source?: string;
    datasetId: string;
    direction: string;
    data_type: string;
    format?: string;
    type: string;
    default_value?: ParameterDefaultValue;
} & V14p1ClientOnlyFields;

export type V14p1Link = {
    id: string;
    fields: Record<string, V14p1LinkField>;
};

export type V14p1LinkField = {
    field: {
        title: string;
        guid: string;
    };
    dataset: {
        id: string;
        realName: string;
    };
};

export type V14p1Visualization = {
    id: string;
    highchartsId?: string;
    selectedLayerId?: string;
    layers?: V14p1Layer[];
    placeholders: V14p1Placeholder[];
};

export type V14p1LayerSettings = {
    id: string;
    name: string;
    type: string;
    alpha: number;
    valid: boolean;
};

export type V14p1CommonPlaceholders = {
    colors: V14p1Color[];
    labels: V14p1Label[];
    tooltips: V14p1Tooltip[];
    filters: V14p1Filter[];
    sort: V14p1Sort[];
    shapes?: V14p1Shape[];
    colorsConfig?: V14p1ColorsConfig;
    geopointsConfig?: V14p1PointSizeConfig;
    shapesConfig?: V14p1ShapesConfig;
    tooltipConfig?: V14p1TooltipConfig;
};

export type V14p1Layer = {
    id: string;
    commonPlaceholders: V14p1CommonPlaceholders;
    layerSettings: V14p1LayerSettings;
    placeholders: V14p1Placeholder[];
};

export type V14p1PlaceholderSettings = {
    groupping?: 'disabled' | 'off';
    autoscale?: boolean;
    scale?: 'auto' | 'manual';
    scaleValue?: '0-max' | [string, string];
    title?: 'auto' | 'manual' | 'off';
    titleValue?: 'string';
    type?: 'logarithmic';
    grid?: 'on' | 'off';
    gridStep?: 'manual';
    gridStepValue?: number;
    hideLabels?: 'yes' | 'no';
    labelsView?: 'horizontal' | 'vertical' | 'angle';
    nulls?: AxisNullsMode;
    holidays?: 'on' | 'off';
    axisLabelFormating?: V14p1Formatting;
    axisLabelDateFormat?: string;
    axisFormatMode?: AxisLabelFormatMode;
    axisModeMap?: Record<string, AxisMode>;
    disableAxisMode?: boolean;
    /* Whether axis, including axis title, line, ticks and labels, should be visible
     * @default 'show'
     **/
    axisVisibility?: 'show' | 'hide';
};

export type V14p1Placeholder = {
    id: string;
    settings?: V14p1PlaceholderSettings;
    required?: boolean;
    capacity?: number;
    items: V14p1Field[];
};

export type V14p1Color = {
    datasetId: string;
    guid: string;
    title: string;
    type: string;
    data_type: string;
    formatting?: V14p1Formatting;
    calc_mode: DatasetFieldCalcMode;
} & V14p1ClientOnlyFields;

export type V14p1Shape = {
    datasetId: string;
    guid: string;
    title: string;
    originalTitle?: string;
    type: string;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
} & V14p1ClientOnlyFields;

export type V14p1Tooltip = {
    datasetId: string;
    guid: string;
    title: string;
    formatting?: V14p1Formatting;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
} & V14p1ClientOnlyFields;

export type V14p1Formatting = {
    format?: NumberFormatType;
    showRankDelimiter?: boolean;
    prefix?: string;
    postfix?: string;
    unit?: NumberFormatUnit;
    precision?: number;
    labelMode?: string;
};

export type V14p1Label = {
    datasetId: string;
    type: string;
    title: string;
    guid: string;
    formatting?: V14p1Formatting;
    format?: string;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
};

export type V14p1HierarchyField = {
    data_type: string;
    fields: V14p1Field[];
    type: string;
};

export type V14p1PointSizeConfig = {
    radius: number;
    minRadius: number;
    maxRadius: number;
};

export type V14p1ColorsConfig = {
    thresholdsMode?: string;
    leftThreshold?: string;
    middleThreshold?: string;
    rightThreshold?: string;
    gradientPalette?: string;
    gradientMode?: string;
    polygonBorders?: string;
    reversed?: boolean;
    fieldGuid?: string;
    mountedColors?: Record<string, string>;
    coloredByMeasure?: boolean;
    palette?: string;
    colorMode?: ColorMode;
    nullMode?: GradientNullMode;
};

export type V14p1ShapesConfig = {
    mountedShapes?: Record<string, string>;
    fieldGuid?: string;
};

export type V14p1TooltipConfig = {
    color?: 'on' | 'off';
    fieldTitle?: 'on' | 'off';
};

export type V14p1ChartsConfigDatasetField = {
    guid: string;
    title: string;
    calc_mode?: DatasetFieldCalcMode;
};

export type V14p1ClientOnlyFields = {
    fakeTitle?: string;
    originalTitle?: string;
    markupType?: MarkupType;
};

export type V14p1Field = {
    data_type: string;
    fields?: V14p1Field[];
    type: string;
    title: string;
    guid: string;
    formatting?: V14p1Formatting;
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
    bandTitleSettings?: BandTitleSettings;
    ui_settings?: string;
} & V14p1ClientOnlyFields;
