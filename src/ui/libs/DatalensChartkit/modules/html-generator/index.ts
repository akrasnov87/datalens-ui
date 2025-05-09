import escape from 'lodash/escape';

import type {ChartKitHtmlItem} from '../../../../../shared';
import {ChartKitCustomError} from '../../ChartKit/modules/chartkit-custom-error/chartkit-custom-error';
import {getRandomCKId, getRandomKey} from '../../helpers/helpers';

import {
    ALLOWED_ATTRIBUTES,
    ALLOWED_TAGS,
    ATTR_DATA_CE_THEME,
    ATTR_DATA_ELEMENT_ID,
    ATTR_DATA_TOOLTIP_ANCHOR_ID,
    ATTR_DATA_TOOLTIP_CONTENT,
    ATTR_DATA_TOOLTIP_PLACEMENT,
    TAG_DL_TOOLTIP,
} from './constants';
import {getThemeStyle, validateUrl} from './utils';

const ATTRS_WITH_REF_VALIDATION = ['background', 'href', 'xlink:href', 'src'];
const TOOLTIP_ATTRS = [ATTR_DATA_TOOLTIP_CONTENT, ATTR_DATA_TOOLTIP_PLACEMENT];

type GenerateHtmlOptions = {
    tooltipId?: string;
    ignoreInvalidValues?: boolean;
    /** Add an id in a special attribute to all elements - useful for further work with items in events, for example */
    addElementId?: boolean;
};

export function generateHtml(
    item?: ChartKitHtmlItem | ChartKitHtmlItem[] | string,
    options: GenerateHtmlOptions = {},
): string {
    if (item) {
        if (Array.isArray(item)) {
            return item.map((it) => generateHtml(it, options)).join('');
        }

        if (typeof item === 'string') {
            return escape(item);
        }

        const {tag, attributes = {}, style = {}, content, theme} = item;

        if (!ALLOWED_TAGS.includes(tag?.toLocaleLowerCase())) {
            const msg = `Tag '${tag}' is not allowed`;
            if (options?.ignoreInvalidValues) {
                console.warn(msg);
                return '';
            }

            const error = new ChartKitCustomError(null, {
                details: msg,
            });
            delete error.stack;
            throw error;
        }

        const isDLTooltip = tag === TAG_DL_TOOLTIP;
        const elem = document.createElement(isDLTooltip ? 'div' : tag);
        Object.assign(elem.style, isDLTooltip ? {display: 'inline-block'} : {}, style);

        if (style) {
            const additionalCssProperties: string[] = [];

            Object.entries(style).forEach(([key, value]) => {
                if (!elem.style[key as keyof CSSStyleDeclaration]) {
                    additionalCssProperties.push(`${key}: ${escape(String(value))};`);
                }
            });

            if (additionalCssProperties.length) {
                const additionalCssText = additionalCssProperties.join(' ');
                const elemCssText = elem.style.cssText ? `${elem.style.cssText} ` : '';
                elem.setAttribute('style', `${elemCssText}${additionalCssText}`);
            }
        }

        Object.entries(attributes).forEach(([key, value]) => {
            if (!ALLOWED_ATTRIBUTES.includes(key?.toLowerCase())) {
                const msg = `Attribute '${key}' is not allowed`;
                if (options?.ignoreInvalidValues) {
                    console.warn(msg);
                    return;
                }

                const error = new ChartKitCustomError(null, {
                    details: msg,
                });
                delete error.stack;
                throw error;
            }

            if (ATTRS_WITH_REF_VALIDATION.includes(key)) {
                validateUrl(String(value), `Attribute '${key}' is not valid`);
            }

            const preparedValue = TOOLTIP_ATTRS.includes(key)
                ? JSON.stringify(value)
                : String(value);

            elem.setAttribute(key, preparedValue);
        });

        if (!isDLTooltip && options?.tooltipId) {
            elem.setAttribute(ATTR_DATA_TOOLTIP_ANCHOR_ID, options.tooltipId);
        }

        if (options?.addElementId) {
            elem.setAttribute(ATTR_DATA_ELEMENT_ID, getRandomKey());
        }

        const nextOptions = {...options};

        if (isDLTooltip) {
            const tooltipId = getRandomCKId();
            elem.setAttribute('id', tooltipId);
            nextOptions.tooltipId = tooltipId;
        }

        let themeStyle = '';

        if (theme) {
            const dataThemeId = getRandomCKId();
            elem.setAttribute(ATTR_DATA_CE_THEME, dataThemeId);
            themeStyle = getThemeStyle(theme, dataThemeId);
        }

        elem.innerHTML = `${themeStyle}${generateHtml(content, nextOptions)}`;

        return elem.outerHTML;
    }

    return '';
}
