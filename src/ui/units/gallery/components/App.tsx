import React from 'react';

import {Route, Switch} from 'react-router-dom';

import {UNIT_ROUTE} from '../constants/routes';

export function App() {
    return (
        <Switch>
            <Route path={UNIT_ROUTE.ROOT} render={() => <div>Root page</div>} />
            <Route path={UNIT_ROUTE.ALL} render={() => <div>All entries</div>} />
            <Route path={UNIT_ROUTE.ENTRY} render={() => <div>Entry or 404</div>} />
        </Switch>
    );
}
