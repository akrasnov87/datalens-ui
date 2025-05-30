import React from 'react';

import type {LabelProps} from '@gravity-ui/uikit';
import {Label} from '@gravity-ui/uikit';
import {UserRole} from 'shared/components/auth/constants/role';

import {getRoleByKey} from '../../utils/userProfile';

const labelThemeByUserRole: Record<`${UserRole}`, LabelProps['theme']> = {
    [UserRole.Editor]: 'info',
    [UserRole.Admin]: 'utility',
    [UserRole.Viewer]: 'warning',
    [UserRole.Visitor]: 'danger',
    [UserRole.Creator]: 'success',
};

interface UserRoleLabelProps {
    role: `${UserRole}`;
}

export function UserRoleLabel({role}: UserRoleLabelProps) {
    return <Label theme={labelThemeByUserRole[role]}>{getRoleByKey(role)}</Label>;
}
