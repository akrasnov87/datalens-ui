import React from 'react';

import {Persons, ListCheck, Tags} from '@gravity-ui/icons';
import type {MobileHeaderProps, MobileMenuItem} from '@gravity-ui/navigation';
import {MobileHeader, getMobileHeaderCustomEvent} from '@gravity-ui/navigation';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useLocation} from 'react-router-dom';
import {PRODUCT_NAME} from 'ui/constants';
import type {MobileHeaderComponentProps} from 'ui/registry/units/common/types/components/MobileHeaderComponent';

import {DL} from '../../../constants/common';
import {UserAvatar} from '../../UserMenu/UserAvatar';

import {BurgerMenuFooter} from './BurgerMenuFooter/BurgerMenuFooter';
import {UserPanel} from './UserPanel/UserPanel';

import defaultLogoIcon from 'ui/assets/icons/logo.svg';
import iconCollection from 'ui/assets/icons/mono-collection.svg';

import '../MobileHeader.scss';

const i18n = I18n.keyset('component.aside-header.view');

const b = block('mobile-header');

const COLLECTIONS_PATH = '/collections';
const PROJECTS_PATH = '/admin/projects';
const ROLES_PATH = '/admin/roles';
const USERS_PATH = '/admin/users';

export const ITEMS_NAVIGATION_DEFAULT_SIZE = 18;

enum Panel {
    User = 'user',
}

export const MobileHeaderComponent = ({renderContent, superUser, logoIcon}: MobileHeaderComponentProps) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const {pathname} = useLocation();

    const sideItem = (
        <div
            onClick={() => {
                ref.current?.dispatchEvent(
                    getMobileHeaderCustomEvent('MOBILE_PANEL_TOGGLE', {panelName: Panel.User}),
                );
            }}
        >
            <UserAvatar className={b('user-avatar')} />
        </div>
    );

    const panelItems: MobileHeaderProps['panelItems'] = DL.ZITADEL_ENABLED
        ? [
              {
                  id: Panel.User,
                  content: <UserPanel />,
                  direction: 'right',
              },
          ]
        : undefined;

    const menuItems: MobileMenuItem[] = React.useMemo(
        ()=> [
            {
                id: 'collections',
                title: i18n('switch_collections'),
                icon: iconCollection,
                iconSize: ITEMS_NAVIGATION_DEFAULT_SIZE,
                current: pathname.includes(COLLECTIONS_PATH),
                closeMenuOnClick: true,
            },
            ...(superUser?.isMaster ? [
                {
                    id: 'users',
                    title: i18n('switch_service-users'),
                    icon: Persons,
                    iconSize: ITEMS_NAVIGATION_DEFAULT_SIZE,
                    current: pathname.includes(USERS_PATH),
                    closeMenuOnClick: true,
                },
                {
                    id: 'projects',
                    title: i18n('switch_service-projects'),
                    icon: ListCheck,
                    iconSize: ITEMS_NAVIGATION_DEFAULT_SIZE,
                    current: pathname.includes(PROJECTS_PATH),
                    closeMenuOnClick: true,
                },
                {
                    id: 'roles',
                    title: i18n('switch_service-roles'),
                    icon: Tags,
                    iconSize: ITEMS_NAVIGATION_DEFAULT_SIZE,
                    current: pathname.includes(ROLES_PATH),
                    closeMenuOnClick: true,
                }
            ] : [])
        ],
        [pathname],
    );

    return (
        <MobileHeader
            ref={ref}
            logo={{
                icon: logoIcon ?? defaultLogoIcon,
                text: PRODUCT_NAME,
                iconClassName: b('logo-icon'),
            }}
            burgerMenu={{items: menuItems, renderFooter: () => <BurgerMenuFooter />}}
            contentClassName={b('content')}
            className={b('container')}
            renderContent={renderContent}
            sideItemRenderContent={() => sideItem}
            panelItems={panelItems}
        />
    );
};
