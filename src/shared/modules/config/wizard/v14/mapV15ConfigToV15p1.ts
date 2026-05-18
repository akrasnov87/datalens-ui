import cloneDeep from 'lodash/cloneDeep';

import {ChartsConfigVersion} from '../../../../types';
import type {V15ChartsConfig} from '../../../../types/config/wizard/v15';
import type {V15p1ChartsConfig} from '../../../../types/config/wizard/v15p1';

export const mapV15ConfigToV15p1 = (config: V15ChartsConfig): V15p1ChartsConfig => {
    const newConfig = cloneDeep(config);

    return {
        ...newConfig,
        version: ChartsConfigVersion.V15p1,
    };
};