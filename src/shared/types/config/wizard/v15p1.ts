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
import { LineShapeSettings } from './v15';

export type V15p1ChartsConfig = {
    title?: string;
    colors: V15p1Color[];
    colorsConfig?: V15p1ColorsConfig;
    extraSettings: V15p1CommonSharedExtraSettings | undefined;
    filters: V15p1Filter[];
    geopointsConfig?: V15p1PointSizeConfig;
    hierarchies: V15p1HierarchyField[];
    labels: V15p1Label[];
    links: V15p1Link[];
    sort: V15p1Sort[];
    tooltips: V15p1Tooltip[];
    tooltipConfig?: V15p1TooltipConfig;
    type: 'datalens';
    updates: V15p1Update[];
    visualization: V15p1Visualization;
    shapes: V15p1Shape[];
    shapesConfig?: V15p1ShapesConfig;
    version: ChartsConfigVersion.V15p1;
    datasetsIds: string[];
    datasetsPartialFields: V15p1ChartsConfigDatasetField[][];
    segments: V15p1Field[];
    chartType?: string;
};

export type V15p1Update = {
    action: 'add_field' | 'add' | 'update_field' | 'update' | 'delete' | 'delete_field';
    field: any;
    debug_info?: string;
};

export type V15p1CommonSharedExtraSettings = {
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
    navigatorSettings?: V15p1NavigatorSettings;
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

export type V15p1NavigatorSettings = {
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

export type V15p1Filter = {
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
} & V15p1ClientOnlyFields;

export type V15p1Sort = {
    guid: string;
    title: string;
    source?: string;
    datasetId: string;
    direction: string;
    data_type: string;
    format?: string;
    type: string;
    default_value?: ParameterDefaultValue;
} & V15p1ClientOnlyFields;

export type V15p1Link = {
    id: string;
    fields: Record<string, V15p1LinkField>;
};

export type V15p1LinkField = {
    field: {
        title: string;
        guid: string;
    };
    dataset: {
        id: string;
        realName: string;
    };
};

export type V15p1Visualization = {
    id: string;
    highchartsId?: string;
    selectedLayerId?: string;
    layers?: V15p1Layer[];
    placeholders: V15p1Placeholder[];
};

export type V15p1LayerSettings = {
    id: string;
    name: string;
    type: string;
    alpha: number;
    valid: boolean;
};

export type V15p1CommonPlaceholders = {
    colors: V15p1Color[];
    labels: V15p1Label[];
    tooltips: V15p1Tooltip[];
    filters: V15p1Filter[];
    sort: V15p1Sort[];
    shapes?: V15p1Shape[];
    colorsConfig?: V15p1ColorsConfig;
    geopointsConfig?: V15p1PointSizeConfig;
    shapesConfig?: V15p1ShapesConfig;
    tooltipConfig?: V15p1TooltipConfig;
};

export type V15p1Layer = {
    id: string;
    commonPlaceholders: V15p1CommonPlaceholders;
    layerSettings: V15p1LayerSettings;
    placeholders: V15p1Placeholder[];
};

export type V15p1PlaceholderSettings = {
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
    axisLabelFormating?: V15p1Formatting;
    axisLabelDateFormat?: string;
    axisFormatMode?: AxisLabelFormatMode;
    axisModeMap?: Record<string, AxisMode>;
    disableAxisMode?: boolean;
    /* Whether axis, including axis title, line, ticks and labels, should be visible
     * @default 'show'
     **/
    axisVisibility?: 'show' | 'hide';
};

export type V15p1Placeholder = {
    id: string;
    settings?: V15p1PlaceholderSettings;
    required?: boolean;
    capacity?: number;
    items: V15p1Field[];
};

export type V15p1Color = {
    datasetId: string;
    guid: string;
    title: string;
    type: string;
    data_type: string;
    formatting?: V15p1Formatting;
    calc_mode: DatasetFieldCalcMode;
} & V15p1ClientOnlyFields;

export type V15p1Shape = {
    datasetId: string;
    guid: string;
    title: string;
    originalTitle?: string;
    type: string;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
} & V15p1ClientOnlyFields;

export type V15p1Tooltip = {
    datasetId: string;
    guid: string;
    title: string;
    formatting?: V15p1Formatting;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
} & V15p1ClientOnlyFields;

export type V15p1Formatting = {
    format?: NumberFormatType;
    showRankDelimiter?: boolean;
    prefix?: string;
    postfix?: string;
    unit?: NumberFormatUnit;
    precision?: number;
    labelMode?: string;
};

export type V15p1Label = {
    datasetId: string;
    type: string;
    title: string;
    guid: string;
    formatting?: V15p1Formatting;
    format?: string;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
};

export type V15p1HierarchyField = {
    data_type: string;
    fields: V15p1Field[];
    type: string;
};

export type V15p1PointSizeConfig = {
    radius: number;
    minRadius: number;
    maxRadius: number;
};

export type V15p1ColorsConfig = {
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

export type V15p1ShapesConfig = {
    mountedShapes?: Record<string, string>;
    fieldGuid?: string;
    lineSettings?: Record<string, LineShapeSettings>;
    commonLineSettings?: LineShapeSettings;
};

export type V15p1TooltipConfig = {
    color?: 'on' | 'off';
    fieldTitle?: 'on' | 'off';
};

export type V15p1ChartsConfigDatasetField = {
    guid: string;
    title: string;
    calc_mode?: DatasetFieldCalcMode;
};

export type V15p1ClientOnlyFields = {
    fakeTitle?: string;
    originalTitle?: string;
    markupType?: MarkupType;
};

export type V15p1Field = {
    data_type: string;
    fields?: V15p1Field[];
    type: string;
    title: string;
    guid: string;
    formatting?: V15p1Formatting;
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
} & V15p1ClientOnlyFields;
