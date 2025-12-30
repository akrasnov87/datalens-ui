import React from 'react';

import {Dialog, TextArea, TextInput, Select} from '@gravity-ui/uikit';
import type {QAProps} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {WorkbookDialogQA} from 'shared/constants/qa';

import type {GetDialogFooterPropsOverride} from './types';

import './WorkbookDialog.scss';
import Utils from 'ui/utils';

const i18n = I18n.keyset('component.collections-structure');

const b = block('dl-workbook-dialog');

export type WorkbookDialogValues = {
    title: string;
    project: string;
    description: string;
};

type WorkbookDialogErrors = Partial<Record<keyof WorkbookDialogValues, string>>;

export type Props = {
    values: WorkbookDialogValues;
    errors?: WorkbookDialogErrors;
    title: string;
    project: string | undefined;
    description: string;
    textButtonApply: string;
    open: boolean;
    isLoading: boolean;
    isHiddenDescription?: boolean;
    titleAutoFocus?: boolean;
    onChange: (values: WorkbookDialogValues) => void;
    onApply: (values: WorkbookDialogValues, onClose: () => void) => void;
    onClose: () => void;
    customActions?: React.ReactNode;
    customBody?: React.ReactNode;
    getDialogFooterPropsOverride?: GetDialogFooterPropsOverride;
} & QAProps;

export const WorkbookDialog = React.memo<Props>(
    ({
        values,
        errors,
        title,
        textButtonApply,
        open,
        isLoading,
        isHiddenDescription = false,
        titleAutoFocus = false,
        onChange,
        onApply,
        onClose,
        customActions,
        customBody,
        getDialogFooterPropsOverride,
        qa,
    }) => {
        var [projects, setProjects] = React.useState([]);
        var [projectDefault, setProjectDefault] = React.useState("");

        React.useEffect(() => {
            Utils.projects({}).then((values)=>{
                var results: any = [];
                for(var idx in values) {
                    var value = values[idx];
                    var item = {"content": value.name, "value": value.name };
                    results.push(item);

                    if(value.isbase) {
                        setProjectDefault(value.name);
                    }
                }
                setProjects(results);
            })
        }, []);

        const handleChange = React.useCallback(
            (params) => {
                const {target} = params;

                onChange({
                    ...values,
                    [target.name]: target.value,
                });
            },
            [onChange, values],
        );

        const handleApply = React.useCallback(() => {
            onApply(values, onClose);
        }, [onApply, values, onClose]);

        const dialogFooterProps = React.useMemo(() => {
            const defaultDialogFooterProps = {
                onClickButtonCancel: onClose,
                onClickButtonApply: handleApply,
                textButtonApply: textButtonApply,
                propsButtonApply: {
                    disabled: !values.title,
                    qa: WorkbookDialogQA.APPLY_BUTTON,
                },
                textButtonCancel: i18n('action_cancel'),
                loading: isLoading,
                qaApplyButton: WorkbookDialogQA.APPLY_BUTTON,
            };
            return getDialogFooterPropsOverride
                ? getDialogFooterPropsOverride(defaultDialogFooterProps)
                : defaultDialogFooterProps;
        }, [
            getDialogFooterPropsOverride,
            handleApply,
            isLoading,
            onClose,
            textButtonApply,
            values.title,
        ]);

        const renderBody = () => {
            if (customBody) {
                return customBody;
            }

            return (
                <React.Fragment>
                    <div className={b('field')}>
                        <div className={b('title')}>{i18n('label_title')}</div>
                        <TextInput
                            name="title"
                            error={errors?.title}
                            value={values.title}
                            onChange={handleChange}
                            autoFocus={titleAutoFocus}
                            qa={WorkbookDialogQA.TITLE_INPUT}
                        />
                    </div>
                    <div className={b('field')}>
                        <div className={b('title')}>{i18n('label_project')}</div>

                        <Select 
                            width={'max'}
                            defaultValue={[values.project || projectDefault]} 
                            options={projects} 
                            onUpdate={
                                (value: any) => handleChange({
                                    target: {
                                        name: "project",
                                        value: value[0]
                                    }
                                })
                            } 
                        />
                    </div>
                    {!isHiddenDescription && (
                        <div className={b('field')}>
                            <div className={b('title')}>{i18n('label_description')}</div>
                            <TextArea
                                name="description"
                                error={errors?.description}
                                value={values.description}
                                onChange={handleChange}
                                minRows={2}
                            />
                        </div>
                    )}
                    {customActions}
                </React.Fragment>
            );
        };

        return (
            <Dialog
                className={b()}
                size="s"
                open={open}
                onClose={onClose}
                onEnterKeyDown={handleApply}
                qa={qa}
            >
                <Dialog.Header caption={title} />
                <Dialog.Body>{renderBody()}</Dialog.Body>
                <Dialog.Footer {...dialogFooterProps} loading={isLoading} />
            </Dialog>
        );
    },
);

WorkbookDialog.displayName = 'WorkbookDialog';
