import type {RenderParams} from '@gravity-ui/app-layout';

import type {AppEnvironment, AppInstallation, DLGlobalData, DLUser} from '../../../shared';
import {FALLBACK_LANGUAGES, Language, USER_SETTINGS_KEY} from '../../../shared';
import type {AppLayoutSettings, GetLayoutConfig} from '../../types/app-layout';
import {addTranslationsScript} from '../../utils/language';
import {getUserInfo} from '../zitadel/utils';

import {getChartkitLayoutSettings, getPlatform} from './utils';

export const getOpensourceLayoutConfig: GetLayoutConfig = async (args) => {
    const {req, res, settingsId} = args;

    const config = req.ctx.config;
    const requestId = req.id || '';

    const getAppLayoutSettings = req.ctx.get('getAppLayoutSettings');

    const appLayoutSettings: AppLayoutSettings = getAppLayoutSettings(req, res, settingsId);

    const regionalEnvConfig = req.ctx.config.regionalEnvConfig;

    const allowLanguages = (regionalEnvConfig?.allowLanguages || FALLBACK_LANGUAGES) as Language[];

    const cookie = req.cookies[USER_SETTINGS_KEY];
    let lang = Language.Ru;
    let theme;
    try {
        const preparedCookie = JSON.parse(cookie);
        lang = preparedCookie.language;
        theme = preparedCookie.theme;
    } catch {
        console.warn('no userSettings in cookie');
    }

    const isAllowed = allowLanguages.includes(lang || '');
    if (!isAllowed) {
        lang = Language.Ru;
    }

    const isZitadelEnabled = req.ctx.config.isZitadelEnabled;
    const isAuthEnabled = req.ctx.config.isAuthEnabled;

    // TODO: check and remove optional props;
    let user: DLUser = {lang} as DLUser;
    const userSettings = {};
    let iamUserId = '';
    const {scripts: chartkitScripts, inlineScripts: chartkitInlineScripts} =
        getChartkitLayoutSettings(config.chartkitSettings);

    if (isZitadelEnabled) {
        const userInfo = getUserInfo(req, res);
        iamUserId = userInfo.uid as string;
        user = {...user, ...userInfo};
    }

    if (isAuthEnabled) {
        const authUser = req.ctx.get('user');
        iamUserId = authUser?.userId as string;
        const profile = authUser?.profile;
        user = {
            ...user,
            uid: iamUserId,
            roles: authUser?.roles,
            ...profile,
        };
    }

    const DL: DLGlobalData = {
        user,
        userSettings,
        iamUserId,
        deviceType: getPlatform(req.headers['user-agent']),
        requestId,
        env: config.appEnv as AppEnvironment,
        installationType: config.appInstallation as AppInstallation,
        serviceName: config.serviceName,
        endpoints: config.endpoints.ui,
        features: config.features,
        meta: req.ctx.getMetadata(),
        chartkitSettings: config.chartkitSettings,
        allowLanguages,
        headersMap: req.ctx.config.headersMap,
        isZitadelEnabled,
        oidc: req.ctx.config.oidc,
        oidc_name: req.ctx.config.oidc_name,
        oidc_base_url: req.ctx.config.oidc_base_url,
        oidc_2: req.ctx.config.oidc_2,
        oidc_name_2: req.ctx.config.oidc_name_2,
        oidc_base_url_2: req.ctx.config.oidc_base_url_2,
        oidc_3: req.ctx.config.oidc_3,
        oidc_name_3: req.ctx.config.oidc_name_3,
        oidc_base_url_3: req.ctx.config.oidc_base_url_3,
        oidc_4: req.ctx.config.oidc_4,
        oidc_name_4: req.ctx.config.oidc_name_4,
        oidc_base_url_4: req.ctx.config.oidc_base_url_4,
        isAuthEnabled,
        ymapApiKey: config.chartkitSettings?.yandexMap?.token,
        connectorIcons: res.locals.connectorIcons,
        apiPrefix: config.apiPrefix,
        releaseVersion: config.releaseVersion,
        exportDashExcel: req.ctx.config.exportDashExcel,
        orderedAuthRoles: config.orderedAuthRoles,
        ...appLayoutSettings.DL,
    };
    const renderConfig: RenderParams<{DL: DLGlobalData}> = {
        nonce: req.nonce,
        data: {DL},
        lang,
        icon: {
            type: 'image/ico',
            href: config.faviconUrl,
            sizes: '32x32',
        },
        inlineScripts: ['window.DL = window.__DATA__.DL', ...chartkitInlineScripts],
        scripts: [addTranslationsScript({allowLanguages, lang}), ...chartkitScripts],
        links: [
            {
                href: 'fonts.css',
                rel: 'stylesheet',
            }
        ],
        pluginsOptions: {
            layout: {name: appLayoutSettings.bundleName},
            ...(theme ? {uikit: {theme}} : {}),
        },
        ...appLayoutSettings.renderConfig,
    };

    return renderConfig;
};
