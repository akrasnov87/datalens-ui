import z from 'zod';

import {createTypedAction} from '../../../gateway-utils';
import {datalensOperationSchema} from '../../schemas/operation';
import {workbookSchema} from '../../schemas/workbooks';

const createWorkbookArgsSchema = z.object({
    collectionId: z.string().nullable().optional(),
    project: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
});

export const createWorkbookResultSchema = workbookSchema.extend({
    operation: datalensOperationSchema,
});

export const createWorkbook = createTypedAction(
    {
        paramsSchema: createWorkbookArgsSchema,
        resultSchema: createWorkbookResultSchema,
    },
    {
        method: 'POST',
        path: () => '/v2/workbooks',
        params: ({collectionId, project, title, description}, headers) => ({
            body: {collectionId, project, title, description},
            headers,
        }),
    },
);
