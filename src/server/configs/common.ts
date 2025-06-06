import {DEFAULT_PROXY_HEADERS} from '@gravity-ui/gateway/build/constants';
import type {AppConfig} from '@gravity-ui/nodekit';

import {
    AuthHeader,
    CSRF_TOKEN_HEADER,
    DL_COMPONENT_HEADER,
    DL_EMBED_TOKEN_HEADER,
    PROJECT_ID_HEADER,
    SERVICE_USER_ACCESS_TOKEN_HEADER,
    SuperuserHeader,
    TENANT_ID_HEADER,
    RPC_AUTHORIZATION
} from '../../shared';
import {releaseVersion} from '../app-env';
import {SERVICE_NAME_DATALENS} from '../components';

export default {
    appName: `datalens-${process.env.APP_MODE}`,
    appSocket: 'dist/run/server.sock',
    expressBodyParserJSONConfig: {
        limit: '50mb',
    },
    expressBodyParserURLEncodedConfig: {
        limit: '50mb',
        extended: false,
    },
    expressTrustProxyNumber: 2,
    workers: (process.env.WORKERS && parseInt(process.env.WORKERS)) || 1,
    python: process.env.PYTHON || 'python3',
    fetchingTimeout: ((process.env.FETCHING_TIMEOUT_SEC && parseInt(process.env.FETCHING_TIMEOUT_SEC)) || 95) * 1000,
    singleFetchingTimeout: ((process.env.FETCHING_TIMEOUT_SEC && parseInt(process.env.FETCHING_TIMEOUT_SEC)) || 95) * 1000,
    flatTableRowsLimit: ((process.env.FLAT_TABLE_ROWS_LIMIT && parseInt(process.env.FLAT_TABLE_ROWS_LIMIT)) || 100000),
    faviconUrl: '/favicon.ico',
    appMode: process.env.APP_MODE,
    serviceName: SERVICE_NAME_DATALENS,
    gatewayProxyHeaders: [
        ...DEFAULT_PROXY_HEADERS,
        PROJECT_ID_HEADER,
        TENANT_ID_HEADER,
        RPC_AUTHORIZATION,
        SuperuserHeader.XDlAllowSuperuser,
        SuperuserHeader.XDlSudo,
        AuthHeader.Authorization,
        SERVICE_USER_ACCESS_TOKEN_HEADER,
        CSRF_TOKEN_HEADER,
        DL_COMPONENT_HEADER,
        DL_EMBED_TOKEN_HEADER,
    ],
    headersMap: {},
    requestIdHeaderName: 'x-request-id',
    releaseVersion: releaseVersion,
} satisfies Partial<AppConfig>;
