import type {CSSProperties} from 'react';

import type {DashTabItemControlData} from 'shared';

export const getControlWidthStyle = (
    placementMode: DashTabItemControlData['placementMode'],
    width: DashTabItemControlData['width'],
): CSSProperties => {
    if (placementMode === 'auto') {
        return {flex: '1 1 auto'};
    }

    return {width: `${width}${placementMode}`};
};

export const clearLoaderTimer = (timer?: NodeJS.Timeout) => {
    if (timer) {
        clearTimeout(timer);
    }
};
