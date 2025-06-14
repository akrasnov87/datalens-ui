import {transformParamsToActionParams} from '@gravity-ui/dashkit/helpers';
import {type AppContext, REQUEST_ID_PARAM_NAME} from '@gravity-ui/nodekit';
import {AxiosError} from 'axios';
import JSONfn from 'json-fn';
import {isNumber, isObject, isString, merge, mergeWith} from 'lodash';
import get from 'lodash/get';

import type {ChartsEngine} from '../..';
import type {
    ControlType,
    DashWidgetConfig,
    EDITOR_TYPE_CONFIG_TABS,
    EntryPublicAuthor,
    StringParams,
    WorkbookId,
} from '../../../../../shared';
import {DL_CONTEXT_HEADER, Feature} from '../../../../../shared';
import {renderHTML} from '../../../../../shared/modules/markdown/markdown';
import {registry} from '../../../../registry';
import type {CacheClient} from '../../../cache-client';
import {config as configConstants} from '../../constants';
import type {AdapterContext, HooksContext, Source, TelemetryCallbacks} from '../../types';
import type {ResolvedConfig} from '../storage/types';
import {getDuration, normalizeParams, resolveParams} from '../utils';

import type {CommentsFetcherPrepareCommentsParams} from './comments-fetcher';
import {CommentsFetcher} from './comments-fetcher';
import type {LogItem} from './console';
import type {
    AuthParams,
    DataFetcherOriginalReqHeaders,
    DataFetcherResult,
    ZitadelParams,
} from './data-fetcher';
import {DataFetcher} from './data-fetcher';
import {ProcessorHooks} from './hooks';
import {updateActionParams, updateParams} from './paramsUtils';
import {StackTracePreparer} from './stack-trace-prepaper';
import type {
    ChartBuilder,
    ChartBuilderResult,
    ProcessorErrorResponse,
    ProcessorFiles,
    ProcessorLogs,
    ProcessorSuccessResponse,
    UiTabExports,
    UserConfig,
} from './types';
import {cleanJSONFn, getMessageFromUnknownError, isChartWithJSAndHtmlAllowed} from './utils';

const {
    CONFIG_LOADING_ERROR,
    CONFIG_TYPE,
    DATA_FETCHING_ERROR,
    DEFAULT_OVERSIZE_ERROR_STATUS,
    DEFAULT_RUNTIME_ERROR_STATUS,
    DEFAULT_RUNTIME_TIMEOUT_STATUS,
    DEFAULT_SOURCE_FETCHING_ERROR_STATUS_400,
    DEFAULT_SOURCE_FETCHING_ERROR_STATUS_500,
    DEFAULT_SOURCE_FETCHING_LIMIT_EXCEEDED_STATUS,
    DEPS_RESOLVE_ERROR,
    HOOKS_ERROR,
    ROWS_NUMBER_OVERSIZE,
    RUNTIME_ERROR,
    RUNTIME_TIMEOUT_ERROR,
    SEGMENTS_OVERSIZE,
    TABLE_OVERSIZE,
    REQUEST_SIZE_LIMIT_EXCEEDED,
    ALL_REQUESTS_SIZE_LIMIT_EXCEEDED,
} = configConstants;

export class SandboxError extends Error {
    code:
        | typeof RUNTIME_ERROR
        | typeof RUNTIME_TIMEOUT_ERROR
        | typeof CONFIG_LOADING_ERROR
        | typeof DEPS_RESOLVE_ERROR
        | typeof ROWS_NUMBER_OVERSIZE
        | typeof DATA_FETCHING_ERROR
        | typeof SEGMENTS_OVERSIZE
        | typeof TABLE_OVERSIZE = RUNTIME_ERROR;
    executionResult?: {
        executionTiming: [number, number];
        filename: string;
        logs: {type: string; value: string}[][];
        stackTrace?: string;
    };
    details?: Record<string, string | number>;
    stackTrace?: string;
}

function collectModulesLogs({
    processedModules,
    logsStorage,
}: {
    processedModules?: Record<string, ChartBuilderResult>;
    logsStorage: ProcessorLogs;
}) {
    if (!processedModules) {
        return;
    }

    Object.keys(processedModules).forEach((moduleName) => {
        const module = processedModules[moduleName];
        module.logs?.forEach((logLine) => {
            logLine.unshift({type: 'string', value: `[${moduleName}]`});
        });
        logsStorage.modules = logsStorage.modules.concat(module.logs || []);
    });
}

function mergeArrayWithObject(a: [], b: {}) {
    // for example, for xAxis/yAxis, when there is one axis on one side and several on the other
    // typeof === 'object' check in case there is, for example, a string
    if (Array.isArray(a) && b && typeof b === 'object' && !Array.isArray(b)) {
        return a.map((value) => merge(value, b));
    }
    return;
}

function logSandboxDuration(duration: [number, number], filename: string, ctx: AppContext) {
    ctx.log(
        `EditorEngineSandbox::Execution[${filename}]: ${duration[0]}s ${duration[1] / 1000000}ms`,
    );
}

function logFetchingError(ctx: AppContext, error: unknown) {
    const errMessage = 'Error fetching sources';
    if (error instanceof Error) {
        ctx.logError(errMessage, error);
    } else if (isString(error)) {
        ctx.logError(errMessage, Error(error));
    } else if (isObject(error) && 'code' in error && isString(error.code)) {
        ctx.logError(errMessage, Error(error.code));
    } else {
        ctx.logError(errMessage);
    }
}

export type ProcessorParams = {
    ctx: AppContext;
    builder: ChartBuilder;
    telemetryCallbacks: TelemetryCallbacks;
    cacheClient: CacheClient;
    hooks: ProcessorHooks;
    sourcesConfig: ChartsEngine['sources'];
} & SerializableProcessorParams;

export type SerializableProcessorParams = {
    secureConfig?: {privateParams?: string[]};
    subrequestHeaders: Record<string, string>;
    paramsOverride: Record<string, string | string[]>;
    actionParamsOverride: Record<string, string | string[]>;
    widgetConfig?: DashWidgetConfig['widgetConfig'];
    configOverride: {
        data: Record<string, string>;
        key?: string;
        entryId?: string;
        type?: string;
        meta: {stype: keyof typeof EDITOR_TYPE_CONFIG_TABS | ControlType.Dash};
        publicAuthor?: EntryPublicAuthor;
    };
    userLogin: string | null;
    userLang: string | null;
    userId: string | null;
    iamToken: string | null;
    responseOptions?: Record<string, string | boolean>;
    uiOnly?: boolean;
    isEditMode: boolean;
    configResolving: number;
    cacheToken: string | string[] | null;
    workbookId?: WorkbookId;
    forbiddenFields?: (keyof ProcessorSuccessResponse)[];
    disableJSONFnByCookie: boolean;
    configName: string;
    configId: string;
    revId?: string;
    isEmbed: boolean;
    zitadelParams: ZitadelParams | undefined;
    authParams: AuthParams | undefined;
    originalReqHeaders: DataFetcherOriginalReqHeaders;
    adapterContext: AdapterContext;
    hooksContext: HooksContext;
};

export class Processor {
    // eslint-disable-next-line complexity
    static async process({
        subrequestHeaders,
        paramsOverride = {},
        widgetConfig = {},
        configOverride,
        userLang,
        userLogin,
        userId = null,
        iamToken = null,
        responseOptions = {},
        uiOnly = false,
        isEditMode,
        configResolving,
        ctx,
        workbookId,
        builder,
        forbiddenFields,
        disableJSONFnByCookie,
        configName,
        configId,
        revId,
        isEmbed,
        zitadelParams,
        authParams,
        originalReqHeaders,
        adapterContext,
        hooksContext,
        telemetryCallbacks,
        cacheClient,
        hooks,
        sourcesConfig,
        secureConfig,
    }: ProcessorParams): Promise<
        ProcessorSuccessResponse | ProcessorErrorResponse | {error: string}
    > {
        const requestId = ctx.get(REQUEST_ID_PARAM_NAME) || '';
        const logs: ProcessorLogs = {
            modules: [],
        };
        let processedModules: Record<string, ChartBuilderResult> = {};
        let modulesLogsCollected = false;
        let resolvedSources: Record<string, DataFetcherResult> | undefined;
        const config: ResolvedConfig = configOverride as ResolvedConfig;
        let params: Record<string, string | string[]> | StringParams;
        let actionParams: Record<string, string | string[]>;
        let usedParams: Record<string, string | string[]>;

        const timings: {
            configResolving: number;
            dataFetching: null | number;
            jsExecution: null | number;
        } = {
            configResolving,
            dataFetching: null,
            jsExecution: null,
        };

        const onCodeExecuted = telemetryCallbacks.onCodeExecuted || (() => {});
        const onTabsExecuted = telemetryCallbacks.onTabsExecuted || (() => {});

        function injectConfigAndParams({target}: {target: ProcessorSuccessResponse}) {
            let responseConfig;
            const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
            const useChartsEngineResponseConfig = Boolean(
                isEnabledServerFeature(Feature.UseChartsEngineResponseConfig),
            );

            if (useChartsEngineResponseConfig && responseOptions.includeConfig && config) {
                responseConfig = config;
            } else {
                responseConfig = {
                    type: config.type,
                    meta: config.meta,
                    entryId: config.entryId,
                    key: config.key,
                    revId: config.revId,
                };
            }
            responseConfig.key = config.key || configName;
            responseConfig.entryId = config.entryId || configId;
            responseConfig.revId = config.revId || revId;

            target._confStorageConfig = responseConfig;

            target.key = responseConfig.key;
            target.id = responseConfig.entryId;
            target.type = responseConfig.type;
            target.revId = responseConfig.revId;

            if (params) {
                target.params = params;
            }
            if (actionParams) {
                target.actionParams = actionParams;
            }

            return target;
        }

        function stringifyLogs(localLogs: ProcessorLogs, localHooks: ProcessorHooks) {
            try {
                const formatter = localHooks.getLogsFormatter();
                return JSON.stringify(localLogs, (_, value: string | number) => {
                    if (typeof value === 'number' && isNaN(value)) {
                        return '__special_value__NaN';
                    }
                    if (value === Infinity) {
                        return '__special_value__Infinity';
                    }
                    if (value === -Infinity) {
                        return '__special_value__-Infinity';
                    }
                    return formatter ? formatter(value) : value;
                });
            } catch (e) {
                ctx.logError('Error during formatting logs', e);

                return '';
            }
        }

        function injectLogs({
            target,
        }: {
            target: ProcessorSuccessResponse | Partial<ProcessorErrorResponse>;
        }) {
            if (responseOptions.includeLogs) {
                target.logs_v2 = stringifyLogs(logs, hooks);
            }
        }

        try {
            let hrStart = process.hrtime();

            const type = config.meta.stype;

            config.type = type;
            ctx.log('EditorEngine::ConfigResolved', {duration: getDuration(hrStart)});

            const resultHooksInit = await hooks.init({
                config: {
                    ...config,
                    entryId: config.entryId || configId,
                },
                isEditMode,
                ctx,
                hooksContext,
            });

            if (resultHooksInit.status === ProcessorHooks.STATUS.FAILED) {
                const {hookError, error} = resultHooksInit;
                if (hookError) {
                    return {
                        error: {
                            code: HOOKS_ERROR,
                            ...hookError,
                        },
                    };
                } else {
                    return {
                        error: {
                            code: HOOKS_ERROR,
                            message: 'Unhandled error init hooks',
                            debug: {
                                message: getMessageFromUnknownError(error),
                            },
                        },
                    };
                }
            }

            hrStart = process.hrtime();
            try {
                processedModules = await builder.buildModules({
                    ctx,
                    subrequestHeaders,
                    onModuleBuild: ({executionTiming, filename}) => {
                        logSandboxDuration(executionTiming, filename, ctx);
                    },
                });
            } catch (error) {
                ctx.logError('DEPS_RESOLVE_ERROR', error);

                if (!isObject(error)) {
                    return {
                        error: {
                            code: DEPS_RESOLVE_ERROR,
                            details: {
                                stackTrace: 'Error resolving required modules: internal error',
                            },
                            debug: {},
                        },
                    };
                }

                let reason = ('stackTrace' in error && error.stackTrace) || 'internal error';

                if ('status' in error) {
                    if (error.status === 403) {
                        reason = 'access denied';
                    } else if (error.status === 404) {
                        reason = 'not found';
                    }
                }

                const sandboxErrorFilename =
                    'executionResult' in error &&
                    isObject(error.executionResult) &&
                    'filename' in error.executionResult
                        ? error.executionResult?.filename
                        : null;
                const axiosErrorFileName =
                    error instanceof AxiosError && 'description' in error
                        ? error.description
                        : null;

                const filename = sandboxErrorFilename || axiosErrorFileName || 'required modules';

                const stackTraceText =
                    'description' in error ? error.description : `module (${filename}): ${reason}`;

                return {
                    error: {
                        code: DEPS_RESOLVE_ERROR,
                        details: {
                            stackTrace: `Error resolving ${stackTraceText}`,
                        },
                        statusCode:
                            'status' in error && isNumber(error.status) ? error.status : undefined,
                        debug: {
                            message: getMessageFromUnknownError(error),
                        },
                    },
                };
            }

            ctx.log('EditorEngine::DepsResolved', {duration: getDuration(hrStart)});

            hrStart = process.hrtime();
            ctx.log('EditorEngine::DepsProcessed', {duration: getDuration(hrStart)});

            try {
                await builder.buildShared();
            } catch (error) {
                ctx.logError('Error during shared tab parsing', error);

                logs.Shared = [[{type: 'string', value: 'Invalid JSON in Shared tab'}]];

                const failedResponse = {
                    error: {
                        code: RUNTIME_ERROR,
                        details: {
                            description: 'Invalid JSON in Shared tab',
                        },
                        debug: {
                            message: getMessageFromUnknownError(error),
                        },
                    },
                };

                injectLogs({target: failedResponse});

                return failedResponse;
            }

            const {params: normalizedParamsOverride, actionParams: normalizedActionParamsOverride} =
                normalizeParams(paramsOverride);

            hrStart = process.hrtime();
            usedParams = {};
            const paramsTabResults = await builder.buildParams({
                params: normalizedParamsOverride,
                usedParams: usedParams,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });
            logSandboxDuration(paramsTabResults.executionTiming, paramsTabResults.name, ctx);
            const paramsTabError = paramsTabResults.runtimeMetadata.error;
            if (paramsTabError) {
                throw paramsTabError;
            }

            ctx.log('EditorEngine::Params', {duration: getDuration(hrStart)});

            usedParams = {
                ...(paramsTabResults.exports as Record<string, string | string[]>),
                ...usedParams,
            };

            // Merge used to be here. Merge in this situation does not work as it should for arrays, so assign.
            params = Object.assign({}, usedParams, normalizedParamsOverride);
            actionParams = Object.assign({}, {}, normalizedActionParamsOverride);

            Object.keys(params).forEach((paramName) => {
                const param = params[paramName];
                if (!Array.isArray(param)) {
                    params[paramName] = [param];
                }
            });

            // take values from params in usedParams there are always only defaults exported from the Params tab
            // and in params new passed parameters
            Object.keys(usedParams).forEach((paramName) => {
                usedParams[paramName] = params[paramName];
            });

            // Editor.updateParams() has the highest priority,
            // therefore, now we take the parameters set through this method
            updateParams({
                userParamsOverride: paramsTabResults.runtimeMetadata.userParamsOverride,
                params,
                usedParams,
            });
            actionParams = updateActionParams({
                userActionParamsOverride: paramsTabResults.runtimeMetadata.userActionParamsOverride,
                actionParams,
            });

            if (paramsTabResults.logs) {
                logs.Params = paramsTabResults.logs;
            }

            resolveParams(params as Record<string, string[]>);

            hrStart = process.hrtime();

            const sourcesTabResults = await builder.buildUrls({
                params,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });

            logSandboxDuration(sourcesTabResults.executionTiming, sourcesTabResults.name, ctx);
            ctx.log('EditorEngine::Sources', {duration: getDuration(hrStart)});
            logs.Sources = sourcesTabResults.logs;

            try {
                hrStart = process.hrtime();

                const sourcesTabError = sourcesTabResults.runtimeMetadata.error;
                if (sourcesTabError) {
                    throw sourcesTabError;
                }

                let sources = sourcesTabResults.exports as Record<string, Source>;
                if (uiOnly) {
                    const filteredSources: Record<string, Source> = {};
                    Object.keys(sources).forEach((key) => {
                        const source = sources[key];
                        if (isObject(source) && source.ui) {
                            filteredSources[key] = source;
                        }
                    });
                    sources = filteredSources;
                }

                if (config?.entryId || configId) {
                    let dlContext: Record<string, string> = {};
                    if (subrequestHeaders[DL_CONTEXT_HEADER]) {
                        const dlContextHeader = subrequestHeaders[DL_CONTEXT_HEADER];
                        dlContext = JSON.parse(
                            dlContextHeader && !Array.isArray(dlContextHeader)
                                ? dlContextHeader
                                : '',
                        );
                    }

                    dlContext.chartId = config?.entryId || configId;

                    if (subrequestHeaders['x-chart-kind']) {
                        dlContext.chartKind = subrequestHeaders['x-chart-kind'];
                    }

                    subrequestHeaders[DL_CONTEXT_HEADER] = JSON.stringify(dlContext);
                }

                resolvedSources = await DataFetcher.fetch({
                    sources,
                    ctx,
                    iamToken,
                    subrequestHeaders,
                    userId,
                    userLogin,
                    workbookId,
                    isEmbed,
                    zitadelParams,
                    authParams,
                    originalReqHeaders,
                    adapterContext,
                    telemetryCallbacks,
                    cacheClient,
                    sourcesConfig,
                });

                if (Object.keys(resolvedSources).length) {
                    timings.dataFetching = getDuration(hrStart);
                }

                ctx.log('EditorEngine::DataFetched', {duration: getDuration(hrStart)});
            } catch (error) {
                logFetchingError(ctx, error);

                if (!modulesLogsCollected) {
                    collectModulesLogs({logsStorage: logs, processedModules});
                }

                if (!isObject(error)) {
                    return {error: 'Internal fetching error'};
                }

                const response: ProcessorErrorResponse = {
                    error: {
                        code: DATA_FETCHING_ERROR,
                        debug: {
                            message: getMessageFromUnknownError(error),
                            ...('debug' in error && error.debug ? error.debug : {}),
                        },
                    },
                };

                if ('status' in error) {
                    if (error.status === 403) {
                        response.error.code = 'ENTRY_FORBIDDEN';
                    } else if (error.status === 404) {
                        response.error.code = 'ENTRY_NOT_FOUND';
                    }
                }

                injectLogs({target: response});

                if (error instanceof Error) {
                    return {error: 'Internal fetching error'};
                } else if (!response.error.details) {
                    response.error.details = {
                        sources: error,
                    };

                    let maybe400 = false;
                    let maybe500 = false;
                    let requestSizeLimitExceeded = false;
                    Object.values(error).forEach((sourceResult) => {
                        const possibleStatus = sourceResult && sourceResult.status;

                        if (399 < possibleStatus && possibleStatus < 500) {
                            maybe400 = true;
                        } else {
                            maybe500 = true;
                        }

                        if (
                            sourceResult.code === REQUEST_SIZE_LIMIT_EXCEEDED ||
                            sourceResult.code === ALL_REQUESTS_SIZE_LIMIT_EXCEEDED
                        ) {
                            requestSizeLimitExceeded = true;
                        }
                    });

                    if (maybe400 && !maybe500) {
                        response.error.statusCode = DEFAULT_SOURCE_FETCHING_ERROR_STATUS_400;
                    } else if (requestSizeLimitExceeded) {
                        response.error.statusCode = DEFAULT_SOURCE_FETCHING_LIMIT_EXCEEDED_STATUS;
                    } else {
                        response.error.statusCode = DEFAULT_SOURCE_FETCHING_ERROR_STATUS_500;
                    }
                }

                return response;
            }

            const data = Object.keys(resolvedSources).reduce<
                Record<string, DataFetcherResult['body']>
            >((acc, sourceName) => {
                if (resolvedSources) {
                    acc[sourceName] = resolvedSources[sourceName].body;
                    // @ts-ignore body not optional;
                    delete resolvedSources[sourceName].body;
                }
                return acc;
            }, {});

            hrStart = process.hrtime();
            const libraryTabResult = await builder.buildChartLibraryConfig({
                data,
                params,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });

            ctx.log('EditorEngine::HighCharts', {duration: getDuration(hrStart)});

            let libraryConfig;
            if (libraryTabResult) {
                logSandboxDuration(libraryTabResult.executionTiming, libraryTabResult.name, ctx);
                libraryConfig = libraryTabResult.exports || {};
                logs.Highcharts = libraryTabResult.logs;

                const libraryError = libraryTabResult.runtimeMetadata.error;
                if (libraryError) {
                    throw libraryTabResult.runtimeMetadata.error;
                }
            } else {
                libraryConfig = {};
            }

            let userConfig: UserConfig = {};
            let processedData;
            let jsTabResults;
            if (!uiOnly) {
                hrStart = process.hrtime();
                const configTabResults = await builder.buildChartConfig({
                    data,
                    params,
                    actionParams: normalizedActionParamsOverride,
                    hooks,
                });

                logSandboxDuration(configTabResults.executionTiming, configTabResults.name, ctx);
                ctx.log('EditorEngine::Config', {duration: getDuration(hrStart)});

                logs.Config = configTabResults.logs;
                userConfig = configTabResults.exports as UserConfig;

                hrStart = process.hrtime();
                jsTabResults = await builder.buildChart({
                    data,
                    sources: resolvedSources,
                    params,
                    usedParams,
                    actionParams: normalizedActionParamsOverride,
                    hooks,
                });
                logSandboxDuration(jsTabResults.executionTiming, jsTabResults.name, ctx);

                timings.jsExecution = getDuration(hrStart);

                const hrEnd = process.hrtime();
                const hrDuration = [hrEnd[0] - hrStart[0], hrEnd[1] - hrStart[1]];

                onCodeExecuted({
                    id: `${config.entryId || configId}:${config.key || configName}`,
                    requestId,
                    latency: (hrDuration[0] * 1e9 + hrDuration[1]) / 1e6,
                });

                ctx.log('EditorEngine::Prepare', {duration: getDuration(hrStart)});

                processedData = jsTabResults.exports;
                logs.Prepare = jsTabResults.logs;

                const jsError = jsTabResults.runtimeMetadata.error;
                if (jsError) {
                    throw jsError;
                }

                // Editor.updateParams() has the highest priority,
                // so now we take the parameters set through this method
                updateParams({
                    userParamsOverride: jsTabResults.runtimeMetadata.userParamsOverride,
                    params,
                    usedParams,
                });
            }

            const uiTabResults = await builder.buildUI({
                data,
                params,
                usedParams,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });
            logSandboxDuration(uiTabResults.executionTiming, uiTabResults.name, ctx);

            const uiTabExports = uiTabResults.exports;
            let uiScheme: UiTabExports | null = null;

            if (
                uiTabExports &&
                (Array.isArray(uiTabExports) ||
                    (isObject(uiTabExports) &&
                        'controls' in uiTabExports &&
                        Array.isArray(uiTabExports.controls)))
            ) {
                uiScheme = uiTabExports as UiTabExports;

                if (secureConfig?.privateParams) {
                    const controls = Array.isArray(uiScheme) ? uiScheme : uiScheme.controls;

                    controls.forEach((control) => {
                        if (secureConfig.privateParams?.includes(control.param)) {
                            control.disabled = true;
                        }
                    });
                }
            }

            logs.Controls = uiTabResults.logs;
            ctx.log('EditorEngine::Controls', {duration: getDuration(hrStart)});

            // Editor.updateParams() has the highest priority,
            // so now we take the parameters set through this method
            updateParams({
                userParamsOverride: uiTabResults.runtimeMetadata.userParamsOverride,
                params,
                usedParams,
            });

            if (uiScheme && userConfig && !userConfig.overlayControls) {
                userConfig.notOverlayControls = true;
            }

            collectModulesLogs({processedModules, logsStorage: logs});
            modulesLogsCollected = true;

            const normalizedDefaultParams = normalizeParams(
                paramsTabResults.exports as ProcessorSuccessResponse['defaultParams'],
            );
            const result: ProcessorSuccessResponse = {
                sources: resolvedSources,
                uiScheme,
                params: {...params, ...transformParamsToActionParams(actionParams)},
                usedParams,
                actionParams,
                widgetConfig,
                defaultParams: normalizedDefaultParams.params,
                extra: {},
                timings,
            };

            injectLogs({target: result});

            if (!uiOnly && jsTabResults) {
                result.data = processedData as ProcessorSuccessResponse['data'];
                let resultConfig = merge(
                    {},
                    userConfig,
                    jsTabResults.runtimeMetadata.userConfigOverride,
                );

                let resultLibraryConfig = mergeWith(
                    {},
                    libraryConfig,
                    jsTabResults.runtimeMetadata.libraryConfigOverride,
                    (a, b) => {
                        return mergeArrayWithObject(a, b) || mergeArrayWithObject(b, a);
                    },
                );

                onTabsExecuted({
                    result: {
                        config: resultConfig,
                        highchartsConfig: resultLibraryConfig,
                        processedData,
                        sources: resolvedSources,
                        sourceData: data,
                    },
                    entryId: config.entryId || configId,
                });

                const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
                const disableFnAndHtml = isEnabledServerFeature(Feature.DisableFnAndHtml);
                if (
                    disableFnAndHtml ||
                    !isChartWithJSAndHtmlAllowed({createdAt: config.createdAt})
                ) {
                    resultConfig.enableJsAndHtml = false;
                }
                const enableJsAndHtml = get(resultConfig, 'enableJsAndHtml', false);
                const disableJSONFn =
                    isEnabledServerFeature(Feature.NoJsonFn) ||
                    disableJSONFnByCookie ||
                    enableJsAndHtml === false;
                const stringify = disableJSONFn ? JSON.stringify : JSONfn.stringify;

                if (builder.type === 'CHART_EDITOR' && disableJSONFn) {
                    resultConfig = cleanJSONFn(resultConfig);
                    resultLibraryConfig = cleanJSONFn(resultLibraryConfig);
                }

                result.config = stringify(resultConfig);
                result.publicAuthor = config.publicAuthor;
                result.highchartsConfig = stringify(resultLibraryConfig);
                result.extra = jsTabResults.runtimeMetadata.extra || {};
                result.extra.chartsInsights = jsTabResults.runtimeMetadata.chartsInsights;
                result.extra.sideMarkdown = jsTabResults.runtimeMetadata.sideMarkdown;

                result.sources = merge(
                    resolvedSources,
                    jsTabResults.runtimeMetadata.dataSourcesInfos,
                );

                if (jsTabResults.runtimeMetadata.exportFilename) {
                    result.extra.exportFilename = jsTabResults.runtimeMetadata.exportFilename;
                }

                ctx.log('EditorEngine::Postprocessing', {duration: getDuration(hrStart)});

                if (
                    ctx.config.chartsEngineConfig.flags?.chartComments &&
                    (type === CONFIG_TYPE.GRAPH_NODE ||
                        type === CONFIG_TYPE.GRAPH_WIZARD_NODE ||
                        type === CONFIG_TYPE.GRAPH_QL_NODE)
                ) {
                    try {
                        const chartName =
                            type === CONFIG_TYPE.GRAPH_NODE || type === CONFIG_TYPE.GRAPH_QL_NODE
                                ? configName
                                : configId;

                        hrStart = process.hrtime();

                        result.comments = await CommentsFetcher.prepareComments(
                            {
                                chartName,
                                config: resultConfig.comments,
                                data: result.data as CommentsFetcherPrepareCommentsParams['data'],
                                params,
                            },
                            subrequestHeaders,
                            ctx,
                        );

                        ctx.log('EditorEngine::Comments', {duration: getDuration(hrStart)});
                    } catch (error) {
                        ctx.logError('Error preparing comments', error);
                    }
                }

                if (type === CONFIG_TYPE.MARKDOWN_NODE) {
                    try {
                        if (!(result.data?.markdown || result.data?.html)) {
                            throw Error('Empty markdown or html');
                        }
                        const markdown = result.data.markdown || result.data.html;
                        const html = renderHTML({
                            text: markdown || '',
                            lang: userLang || '',
                            plugins: registry.getYfmPlugins(),
                        });
                        delete result.data.markdown;
                        result.data.html = html.result;
                        result.data.meta = html.meta;
                    } catch (error) {
                        ctx.logError('Error render markdown', error);
                    }
                }
            }

            injectConfigAndParams({target: result});

            if (forbiddenFields) {
                forbiddenFields.forEach((field) => {
                    if (result[field]) {
                        delete result[field];
                    }
                });
            }

            return result;
        } catch (error) {
            ctx.logError('Run failed', error);

            const isError = (error: unknown): error is SandboxError => {
                return isObject(error);
            };

            if (!isError(error)) {
                throw error;
            }

            const executionResult: {
                filename?: string;
                logs?: LogItem[][];
                stackTrace?: string;
                stack?: string;
                executionTiming?: [number, number];
            } = error.executionResult || {};
            if (!modulesLogsCollected) {
                collectModulesLogs({logsStorage: logs, processedModules});
            }

            const failedLogs = executionResult.logs;
            if (failedLogs) {
                logs[(executionResult.filename as ProcessorFiles) || 'failed'] = failedLogs;
            }

            const result: Partial<ProcessorErrorResponse> = {};

            injectLogs({target: result});

            switch (error.code) {
                case CONFIG_LOADING_ERROR:
                case DEPS_RESOLVE_ERROR:
                case DATA_FETCHING_ERROR:
                    result.error = error;
                    break;

                case ROWS_NUMBER_OVERSIZE:
                case SEGMENTS_OVERSIZE:
                case TABLE_OVERSIZE:
                    result.error = {
                        code: error.code,
                        details: error.details,
                        statusCode: DEFAULT_OVERSIZE_ERROR_STATUS,
                    };
                    break;

                case RUNTIME_ERROR:
                    executionResult.stackTrace =
                        executionResult.stackTrace || executionResult.stack;

                    if (resolvedSources) {
                        result.sources = resolvedSources;
                    }

                    result.error = {
                        code: RUNTIME_ERROR,
                        details: {
                            stackTrace: executionResult.stackTrace
                                ? StackTracePreparer.prepare(executionResult.stackTrace)
                                : '',
                            tabName: error.executionResult ? error.executionResult.filename : '',
                        },
                        statusCode: DEFAULT_RUNTIME_ERROR_STATUS,
                    };

                    break;
                case RUNTIME_TIMEOUT_ERROR:
                    result.error = {
                        code: RUNTIME_TIMEOUT_ERROR,
                        statusCode: DEFAULT_RUNTIME_TIMEOUT_STATUS,
                    };

                    onCodeExecuted({
                        id: `${configId}:${configName}`,
                        requestId,
                        latency: executionResult.executionTiming
                            ? (executionResult.executionTiming[0] * 1e9 +
                                  executionResult.executionTiming[1]) /
                              1e6
                            : 0,
                    });

                    break;
                default:
                    throw error;
            }

            const tabName = (error.executionResult && error.executionResult.filename) || 'script';
            const message = `EXECUTION_ERROR Error processing ${tabName}\n${error.stackTrace}`;

            ctx.log(message, {
                stackTrace: error.stackTrace,
                tabName,
            });

            return {
                error: result.error,
                logs_v2: result.logs_v2,
                sources: result.sources,
            };
        } finally {
            builder.dispose();
        }
    }
}
