import z from 'zod';

import {createTypedAction} from '../../../gateway-utils';
import {workbookSchema} from '../../schemas/workbooks';

const updateWorkbookArgsSchema = z.object({
    workbookId: z.string(),
    project: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
});

export const updateWorkbookResultSchema = workbookSchema;

export const updateWorkbook = createTypedAction(
    {
        paramsSchema: updateWorkbookArgsSchema,
        resultSchema: updateWorkbookResultSchema,
    },
    {
        method: 'POST',
        path: ({workbookId}) => `/v2/workbooks/${workbookId}/update`,
        params: ({title, project, description}, headers) => ({body: {title, project, description}, headers}),
    },
);
