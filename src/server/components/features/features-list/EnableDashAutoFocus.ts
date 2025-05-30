import {Feature} from '../../../../shared';
import {createFeatureConfig} from '../utils';

export default createFeatureConfig({
    name: Feature.EnableDashAutoFocus,
    state: {
        development: true,
        production: false,
    },
});
