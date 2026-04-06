import type {IconData} from '@gravity-ui/uikit';
import type {LogoTextProps} from 'ui/components/AsideHeaderAdapter/LogoText/LogoText';

export type MobileHeaderComponentProps = {
    renderContent?: () => React.ReactNode;
    superUser?: any;
    logoIcon?: IconData;
    logoTextProps?: LogoTextProps;
};
