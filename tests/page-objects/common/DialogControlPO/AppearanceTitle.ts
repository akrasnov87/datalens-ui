import {Page} from '@playwright/test';
import {slct} from '../../../utils';

import {ControlQA, DialogControlQa} from '../../../../src/shared/constants/qa/control';
import {CheckboxElementPO} from '../abstract/CheckboxElementPO';
import {ElementPO} from '../abstract/ElementPO';
import {TextInputElementPO} from '../abstract/TextInputElementPO';

export class AppearanceTitle extends ElementPO {
    textInput: TextInputElementPO;
    checkbox: CheckboxElementPO;

    constructor(page: Page) {
        super({page, selectors: {root: slct(DialogControlQa.appearanceTitle)}});
        this.textInput = new TextInputElementPO({
            page,
            selectors: {root: slct(ControlQA.inputNameControl)},
        });
        this.checkbox = new CheckboxElementPO({
            page,
            selectors: {root: slct(ControlQA.showLabelCheckbox)},
        });
    }
}
