import type {Shared, SharedData} from '../../index';

import type {V10ChartsConfig} from './v10';
import type {V11ChartsConfig} from './v11';
import type {V12ChartsConfig} from './v12';
import type {V13ChartsConfig} from './v13';
import type {V14ChartsConfig} from './v14';
import type {
    V14p1ChartsConfig,
    V14p1ChartsConfigDatasetField,
    V14p1ColorsConfig,
    V14p1CommonPlaceholders,
    V14p1CommonSharedExtraSettings,
    V14p1Field,
    V14p1Filter,
    V14p1Formatting,
    V14p1HierarchyField,
    V14p1Layer,
    V14p1PlaceholderSettings,
    V14p1TooltipConfig,
    V14p1Update,
} from './v14p1';
import type {V2ChartsConfig} from './v2';
import type {V3ChartsConfig} from './v3';
import type {V4ChartsConfig} from './v4';
import type {V5ChartsConfig} from './v5';
import type {V6ChartsConfig} from './v6';
import type {V7ChartsConfig} from './v7';
import type {V8ChartsConfig} from './v8';
import type {V9ChartsConfig} from './v9';

export * from './v2';
export * from './v3';
export * from './v4';
export * from './v5';
export * from './v6';
export * from './v7';
export * from './v8';
export * from './v9';
export * from './v10';
export * from './v11';
export * from './v12';
export * from './v13';
export * from './v14';
export * from './v14p1';

export type ChartsConfig = V14p1ChartsConfig;
export type PreviousChartsConfigs =
    | Shared
    | V2ChartsConfig
    | V3ChartsConfig
    | V4ChartsConfig
    | V5ChartsConfig
    | V6ChartsConfig
    | V7ChartsConfig
    | V8ChartsConfig
    | V9ChartsConfig
    | V10ChartsConfig
    | V11ChartsConfig
    | V12ChartsConfig
    | V13ChartsConfig
    | V14ChartsConfig;
export type CommonPlaceholders = V14p1CommonPlaceholders;

export type ExtendedChartsConfig = ChartsConfig | PreviousChartsConfigs;

export type ServerChartsConfig = ChartsConfig & {
    sharedData: SharedData;
};

export type ServerPlaceholder = ChartsConfig['visualization']['placeholders'][0];

export type ServerVisualization = ChartsConfig['visualization'];

export type ServerColor = ChartsConfig['colors'][0];

export type ServerSort = ChartsConfig['sort'][0];

export type ServerTooltip = ChartsConfig['tooltips'][0];

export type ServerLabel = ChartsConfig['labels'][0];

export type ServerShape = ChartsConfig['shapes'][0];

export type ServerLayerSettings = NonNullable<
    ChartsConfig['visualization']['layers']
>[0]['layerSettings'];

export type ServerFieldFormatting = V14p1Formatting;

export type ServerShapesConfig = ChartsConfig['shapesConfig'];

export type ServerColorsConfig = V14p1ColorsConfig;

export type ServerPointSizeConfig = NonNullable<ChartsConfig['geopointsConfig']>;

export type ServerField = V14p1Field;

export type ServerFieldUpdate = V14p1Update;

export type ServerFilter = V14p1Filter;

export type ServerDatasetField = V14p1ChartsConfigDatasetField;

export type ServerVisualizationLayer = V14p1Layer;

export type ServerLink = ChartsConfig['links'][0];

export type ServerHierarchy = V14p1HierarchyField;

export type ServerCommonSharedExtraSettings = V14p1CommonSharedExtraSettings;

export type ServerPlaceholderSettings = V14p1PlaceholderSettings;

export type ServerTooltipConfig = V14p1TooltipConfig;
