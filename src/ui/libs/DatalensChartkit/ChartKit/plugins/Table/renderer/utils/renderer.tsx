import React from 'react';

import {dateTime} from '@gravity-ui/date-utils';
import {CaretLeft, CaretRight} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import get from 'lodash/get';
import type {
    BarTableCell,
    BarViewOptions,
    NumberViewOptions,
    TableCommonCell,
    TableHead,
} from 'shared';
import {ChartKitTableQa, isMarkupItem} from 'shared';

import {MarkdownHelpPopover} from '../../../../../../../components/MarkdownHelpPopover/MarkdownHelpPopover';
import type {THead} from '../../../../../../../components/Table/types';
import {numberFormatter} from '../../../../components/Widget/components/Table/utils/misc';
import {BarCell} from '../components/BarCell/BarCell';
import {MarkupCell} from '../components/MarkupCell/MarkupCell';
import {TreeCell} from '../components/TreeCell/TreeCell';

import {calculateNumericProperty} from './math';

const b = block('chartkit-table-widget');

export type HeadCell = THead & {
    name: string;
    formattedName?: string;
    fieldId?: string;
    custom?: unknown;
};

export function mapHeadCell(
    th: TableHead,
    tableWidth: number | undefined,
    head: TableHead[] | undefined,
): HeadCell {
    const columnType: TableCommonCell['type'] = get(th, 'type');
    const hint = get(th, 'hint');
    const cellWidth = calculateNumericProperty({value: th.width, base: tableWidth});

    return {
        ...th,
        width: cellWidth,
        id: String(th.id),
        header: () => {
            const cell = {
                value: th.markup ?? th.name,
                formattedValue: th.formattedName,
                type: th.markup ? 'markup' : columnType,
            };
            return (
                <span data-qa={ChartKitTableQa.HeadCellContent}>
                    {renderCellContent({cell, column: th, header: true})}
                    {hint && <MarkdownHelpPopover markdown={hint} />}
                </span>
            );
        },
        enableSorting: get(th, 'sortable', true),
        sortingFn: columnType === 'number' ? 'alphanumeric' : 'auto',
        enableRowGrouping: get(th, 'group', false),
        cell: (cellData) => {
            const cell = cellData as TableCommonCell;
            const contentStyles = getCellContentStyles({
                cell,
                column: th,
                columns: head || [],
            });
            return (
                <div data-qa={ChartKitTableQa.CellContent} style={{...contentStyles}}>
                    {renderCellContent({cell, column: th})}
                    {cell.sortDirection && (
                        <Icon
                            className={b('sort-icon')}
                            data={cell.sortDirection === 'asc' ? CaretLeft : CaretRight}
                        />
                    )}
                </div>
            );
        },
        columns: get(th, 'sub', []).map(mapHeadCell),
        pinned: get(th, 'pinned', false),
    };
}

export function getCellContentStyles(args: {
    cell: TableCommonCell;
    column: TableHead;
    columns: TableHead[];
}) {
    const {cell, column, columns} = args;
    const cellType = cell.type ?? get(column, 'type');
    const contentStyles: React.CSSProperties = {};
    if (cellType === 'number') {
        contentStyles.textAlign = 'right';
    }

    // Width of the table should take 100%, so we cannot use the width settings when they are set for all cells
    const canUseCellWidth = columns.some((col) => !col.width);
    if (canUseCellWidth) {
        const cellWidth = get(cell, 'width', get(column, 'width'));
        const isPercentWidth = String(cellWidth).slice(-1) === '%';
        if (!isPercentWidth) {
            contentStyles.width = cellWidth;
        }
    }

    return contentStyles;
}

export function renderCellContent(args: {
    cell: TableCommonCell;
    column: TableHead;
    header?: boolean;
}) {
    const {cell, column, header} = args;
    const cellView = get(cell, 'view', get(column, 'view'));
    const cellType = cell.type ?? get(column, 'type');

    if (cellView === 'bar' && !header) {
        return <BarCell cell={cell as BarTableCell} column={column as BarViewOptions} />;
    }

    if (cellType === 'markup' || isMarkupItem(cell.value)) {
        return <MarkupCell cell={cell} />;
    }

    if (cell?.treeNodeState && !header) {
        return <TreeCell cell={cell} />;
    }

    let formattedValue: string | undefined = cell.formattedValue;
    if (typeof formattedValue === 'undefined') {
        if (cellType === 'date') {
            const dateTimeValue = dateTime({
                input: cell.value as number,
                timeZone: 'UTC',
            });
            const dateTimeFormat = get(column, 'format');
            formattedValue = dateTimeValue?.isValid()
                ? dateTimeValue.format(dateTimeFormat)
                : String(cell.value);
        } else if (cellType === 'number') {
            formattedValue = numberFormatter(cell.value as number, column as NumberViewOptions);
        } else {
            formattedValue = String(cell.value);
        }
    }

    return formattedValue;
}
