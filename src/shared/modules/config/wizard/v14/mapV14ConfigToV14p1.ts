import cloneDeep from 'lodash/cloneDeep';

import {ChartsConfigVersion} from '../../../../types';
import type {V14ChartsConfig} from '../../../../types/config/wizard/v14';
import type {V14p1ChartsConfig} from '../../../../types/config/wizard/v14p1';

export const mapV14ConfigToV14p1 = (config: V14ChartsConfig): V14p1ChartsConfig => {
    const newConfig = cloneDeep(config);

    return {
        ...newConfig,
        version: ChartsConfigVersion.V14p1,
    };
};
