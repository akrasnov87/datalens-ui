
/**
 * Обработчик запроса POST /export-entries 
 * 
 * headers: 
 *  x-rpc-authorization: [Токен авторизации]
 * 
 * body:
 * 
{
    "links": ["3rf68dw1mhxoq", "zhdlnkugen7yn"],
    "host": "http://localhost:3030",
    "formSettings": {
        "delNumbers": null,
        "delValues": null,
        "encoding": null,
        "format": "csv"
    },
    "lang": "ru",
    "outputFormat": "xlsx",
    "exportFilename": "Опросный лист",
    "params": {
        "_d_date_start": "2024-07-01"
    }
}
 *
 * где,
 * - links: string[] - массив идентификатор chart'ов
 * - host: string - текущий хост
 * - formSettings: any - настройки, можно не менять
 * - lang: string - язык, можно не менять
 * - outputFormat: string - можно не менять
 * - exportFilename: string - суффикс имени выходного файла
 * - params: any - параметры для чартов
 */


import {Request, Response} from '@gravity-ui/expresskit';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { isMarkupItem, markupToRawString } from '../../shared';
import moment from 'moment';
import * as path from 'node:path';
import * as child_process from 'child_process';
import * as fs from 'node:fs';

const TABLE_DATE_FORMAT_BY_SCALE: any = {
    d: 'DD.MM.YYYY',
    w: 'DD.MM.YYYY',
    m: 'MMMM YYYY',
    h: 'DD.MM.YYYY HH:mm',
    i: 'DD.MM.YYYY HH:mm',
    s: 'DD.MM.YYYY HH:mm:ss',
    q: 'YYYY',
    y: 'YYYY',
};

const tableHeadToGraphs = (head: any, prefix?: any) => {
    return head.reduce((result: any, column: any) => {
        const title = column.name ?? column.id ?? column.type ?? '';

        if (column.sub) {
            result = result.concat(
                tableHeadToGraphs(column.sub, prefix ? `${prefix} – ${title}` : title),
            );
        } else {
            result.push({
                ...column,
                title: (prefix ? `${prefix} - ` : '') + title,
                type: column.type,
                // TODO: in theory, you need if column.type === 'date'
                scale: column.scale || 'd',
                data: [],
            });
        }
        return result;
    }, []);
}

const prepareCellValue = (cell: any) => {
    return Array.isArray(cell) ? prepareRowHeadersForGrid(cell) : [cell.value];
}

const prepareRowHeadersForGrid = (grid: any) => {
    let result: any[] = [];
    grid.forEach((level: any) => {
        let levelResult: any[] = [];
        level.forEach((cell: any) => {
            levelResult = levelResult.concat(prepareCellValue(cell));
        });

        if (result.length === 0) {
            result = levelResult;
        } else {
            const realResult: any[] = [];
            result.forEach((resultValue) => {
                levelResult.forEach((levelResultValue) => {
                    realResult.push(`${resultValue} — ${levelResultValue}`);
                });
            });

            result = realResult;
        }
    });

    return result;
}

const getChartData = async (host: string, token: string, links: string[], params: any) => {
    let data: any = {};
    for(let i = 0; i < links.length; i++) {
        const link = links[i];

        const axiosInstance = axios.create();
        axiosRetry(axiosInstance, {retries: 3});

        const response = await axiosInstance({
            method: 'post',
            url: `${host}/api/run`,
            headers: {
                'x-rpc-authorization': token
            },
            data: {
                "id": link,
                "params": params || {},
                "responseOptions": {
                    "includeConfig": true,
                    "includeLogs": false
                },
                "workbookId": null
            }
        });

        data[link] = response.data;
    }

    return data;
}

const prepareValues = (chartData: any) => {
    const {head} = chartData.data;
    const rows = chartData.data.rows || [];
    const footer = chartData.data.footer || [];

    const graphs = tableHeadToGraphs(head);
    const allTableRows = [...rows, ...footer];

    allTableRows.forEach((row, rowIndex) => {
        const cells = row.values?.map((value: any) => ({value})) || row.cells;
        cells.forEach((cell: any, index: any) => {
            const value = cell.grid || cell.value;
            const graph = graphs[index];

            if (typeof graph === 'undefined') {
                return;
            }

            if (isMarkupItem(value)) {
                graph.data.push(markupToRawString(value));
            } else if (graph.type === 'date') {
                const dateFormat = graph.format
                    ? graph.format
                    : TABLE_DATE_FORMAT_BY_SCALE[graph.scale];
                graph.data[rowIndex] = value ? moment.utc(value).format(dateFormat) : value;
            } else if (graph.type === 'grid') {
                if (index === 0) {
                    const prepared = prepareRowHeadersForGrid(value);
                    graph.data = graph.data.concat(prepared);
                } else {
                    const prepared = value.map((cell: any) => cell.value);
                    graph.data = graph.data.concat(prepared);
                }
            } else {
                graph.data[rowIndex] = value;
            }
        });
    });

    return {graphs};
}

const stringifyData = async (host: string, chartData: any, token: string, settings: any) => {
    const params = {
        chartUrl: `/preview/editor/${chartData.id}`,
        formSettings: settings.formSettings,
        lang: settings.lang,
        // downloadConfig: props.downloadConfig,
        chartData: prepareValues(chartData),
        fullHost: "",
    };

    const stringifyData = encodeURIComponent(JSON.stringify(params));

    const request: any = {
        url: `${host}/api/export`,
        method: 'post',
        data: { 
            data: stringifyData, 
            //exportFilename: `${settings.exportFilename}` 
        },
        responseType: 'blob',
        headers: {
            'x-rpc-authorization': token
        },
    };

    const axiosInstance = axios.create();
    axiosRetry(axiosInstance, {retries: 3});

    const response = await axiosInstance(request);
    
    return response;
}

export async function exportEntries(req: Request, res: Response) {
    var r: any = req;
    var host = r.body['host'];

    const context:any = req.ctx;

    if(r.body['links']) {
        const links = r.body['links'];
        const chartData = await getChartData(host, req.headers['x-rpc-authorization'] as string, links, r.body['params']);

        const exportPath = path.join(__dirname, '../', '../', '../', 'export');
        const pythonScript = path.join(exportPath, 'dash2sheets.py');

        const publicOutputPath = path.join(exportPath, `${r.body['exportFilename'] +'-' + Date.now()}.${r.body['outputFormat']}`);

        let files = [];

        const filteredLinks = Object.keys(chartData);
        for(let i = 0; i < filteredLinks.length; i++) {
            let sheetName = (chartData[filteredLinks[i]].key.split('/').length > 1 ? chartData[filteredLinks[i]].key.split('/')[1] : filteredLinks[i]) + '-' + Date.now();
            const publicOutputCSVPath = path.join(exportPath, `${sheetName}.${r.body['formSettings'].format}`);
            files.push(publicOutputCSVPath);
            const response = await stringifyData(host, chartData[filteredLinks[i]], req.headers['x-rpc-authorization'] as string, r.body);

            await fs.promises.writeFile(publicOutputCSVPath, response.data);
        }

        const destroy = async () => {
            if(fs.existsSync(publicOutputPath)) {
                await fs.promises.unlink(publicOutputPath);
            }

            for(let i = 0; i < files.length; i++) {
                if(fs.existsSync(files[i])) {
                    await fs.promises.unlink(files[i]);
                }
            }
        }

        if (filteredLinks.length == 0) {
            res.status(404).send('Output file is empty');
            return;
        } 

        // тут нужно вызвать скрипт python
        var resSpawn = child_process.spawnSync(context.config.python || 'python3', [pythonScript, `OUTPUT_NAME="${publicOutputPath}"`, `SEP=;`, ...files]);
        if (resSpawn != null && resSpawn.stderr.byteLength > 0) {
            context.logError(`EXPORT_ODS_DATA_WRITE_ERROR`, {
                outputPath: publicOutputPath,
                message: `Ошибка при вызове python скрипта: ${resSpawn.stderr.toString()}`
            });
            res.sendStatus(500);

            await destroy();
            return;
        }

        if(fs.existsSync(publicOutputPath)) {
            res.status(200).send(await fs.promises.readFile(publicOutputPath));
        } else {
            res.status(404).send('Output file not found');
        }

        await destroy();
    } else {
        res.status(404).send('Dash ID not found');
    }
}

