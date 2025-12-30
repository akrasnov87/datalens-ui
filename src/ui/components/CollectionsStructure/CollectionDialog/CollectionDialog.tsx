import React from 'react';

import {Dialog, TextArea, TextInput, Select} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';

import './CollectionDialog.scss';
import Utils from 'ui/utils';

const i18n = I18n.keyset('component.collections-structure');

const b = block('dl-collection-dialog');

export type CollectionDialogValues = {
    title: string;
    project: string | undefined;
    description: string;
};

type CollectionDialogErrors = Partial<Record<keyof CollectionDialogValues, string>>;

export type Props = {
    values: CollectionDialogValues;
    errors?: CollectionDialogErrors;
    title: string;
    textButtonApply: string;
    open: boolean;
    isLoading: boolean;
    titleAutoFocus?: boolean;
    onChange: (values: CollectionDialogValues) => void;
    onApply: (values: CollectionDialogValues, onClose: () => void) => Promise<unknown>;
    onClose: () => void;
};

export const CollectionDialog = React.memo<Props>(
    ({
        values,
        errors,
        title,
        textButtonApply,
        open,
        isLoading,
        titleAutoFocus = false,
        onApply,
        onChange,
        onClose,
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

        return (
            <Dialog
                className={b()}
                size="s"
                open={open}
                onClose={onClose}
                onEnterKeyDown={handleApply}
            >
                <Dialog.Header caption={title} />
                <Dialog.Body>
                    <div className={b('field')}>
                        <div className={b('title')}>{i18n('label_title')}</div>
                        <TextInput
                            name="title"
                            value={values.title}
                            error={errors?.title}
                            onChange={handleChange}
                            autoFocus={titleAutoFocus}
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
                    <div className={b('field')}>
                        <div className={b('title')}>{i18n('label_description')}</div>
                        <TextArea
                            name="description"
                            value={values.description}
                            error={errors?.description}
                            onChange={handleChange}
                            minRows={2}
                        />
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={onClose}
                    onClickButtonApply={handleApply}
                    textButtonApply={textButtonApply}
                    propsButtonApply={{
                        disabled: !values.title,
                    }}
                    textButtonCancel={i18n('action_cancel')}
                    loading={isLoading}
                />
            </Dialog>
        );
    },
);

CollectionDialog.displayName = 'CollectionDialog';
