import React from 'react';

import block from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {ControlQA, TitlePlacementOption} from 'shared';
import {DL} from 'ui/constants';

import {MarkdownHelpPopover} from '../../../../../components/MarkdownHelpPopover/MarkdownHelpPopover';
import {CONTROL_TYPE} from '../../../modules/constants/constants';

const b = block('chartkit-control-item');

function withWrapForControls(WrappedComponent) {
    function WithWrapForControls(props) {
        const {
            type,
            width,
            hidden,
            label,
            labelInside,
            className,
            style,
            renderOverlay,
            labelClassName,
            hint,
            labelPlacement,
        } = props;

        if (hidden) {
            return null;
        }

        const showLabel =
            label &&
            !labelInside &&
            type !== CONTROL_TYPE.BUTTON &&
            type !== CONTROL_TYPE.CHECKBOX &&
            type !== CONTROL_TYPE.TEXTAREA;

        const customStyle = style || {width};
        const controlStyle = DL.IS_MOBILE ? {width: '100%'} : customStyle;

        const vertical = showLabel && labelPlacement === TitlePlacementOption.Top;

        return (
            <div
                className={b(
                    'control',
                    {mobile: DL.IS_MOBILE, 'without-label': !showLabel, vertical},
                    className,
                )}
                style={controlStyle}
                data-qa={ControlQA.chartkitControl}
            >
                {renderOverlay?.()}
                {showLabel && (
                    <div
                        className={b('title', {vertical}, labelClassName)}
                        data-qa={ControlQA.controlLabel}
                    >
                        <span title={label} className={b('title-text')}>
                            {label}
                        </span>
                        {hint && <MarkdownHelpPopover markdown={hint} />}
                    </div>
                )}
                <WrappedComponent {...props} />
                {hint && !showLabel && <MarkdownHelpPopover markdown={hint} />}
            </div>
        );
    }

    WithWrapForControls.propTypes = {
        ...WrappedComponent.propTypes,
        type: PropTypes.oneOf(Object.values(CONTROL_TYPE)).isRequired,
        label: PropTypes.string,
        labelInside: PropTypes.bool,
        innerLabel: PropTypes.string,
        className: PropTypes.string,
        hidden: PropTypes.bool,
        width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    };

    return WithWrapForControls;
}

export default withWrapForControls;
