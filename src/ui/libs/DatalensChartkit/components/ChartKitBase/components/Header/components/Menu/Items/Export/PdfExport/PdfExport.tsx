import React from 'react';

import type {MenuActionComponent, MenuItemModalProps} from 'ui/libs/DatalensChartkit/menu/Menu';

import {DownloadPdf} from '../../DownloadPdf/DownloadPdf';
import type {ExportActionArgs} from '../types';

export type PdfExportAction = () => (chartData: ExportActionArgs) => void | MenuActionComponent;

export const pdfExportAction: PdfExportAction = () => {
    return (chartData: ExportActionArgs): void | MenuActionComponent => {
        return function DownloadPdfModalRenderer(props: MenuItemModalProps) {
            return <DownloadPdf onClose={props.onClose} entryId={chartData?.propsData?.id || ''} />;
        };
    };
};
