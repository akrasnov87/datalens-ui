import type {
    InterruptHandler,
    QuickJSContext,
    QuickJSHandle,
    QuickJSRuntime,
    QuickJSWASMModule,
    VmCallResult,
} from 'quickjs-emscripten';

import {getRandomCKId} from '../../../ChartKit/helpers/getRandomCKId';
import Performance from '../../../ChartKit/modules/perfomance';
import {ATTR_DATA_ELEMENT_ID} from '../../html-generator/constants';

type UiSandboxRuntimeProps = {
    fn: string;
    fnArgs: unknown[];
    fnContext: unknown;
    globalApi: object;
    libs: string;
    name?: string;
};

export class UiSandboxRuntime {
    private runtime: QuickJSRuntime;
    private vm: QuickJSContext;
    private pending: QuickJSHandle[];
    private getInterruptAfterDeadlineHandler: (deadline: Date | number) => InterruptHandler;
    private timelimit: number;

    constructor(props: {
        sandbox: QuickJSWASMModule;
        timelimit: number;
        getInterruptAfterDeadlineHandler: (deadline: Date | number) => InterruptHandler;
    }) {
        const {sandbox, getInterruptAfterDeadlineHandler, timelimit} = props;

        this.runtime = sandbox.newRuntime();
        this.timelimit = timelimit;
        this.getInterruptAfterDeadlineHandler = getInterruptAfterDeadlineHandler;
        this.vm = this.runtime.newContext();

        this.pending = [];
    }

    checkCallResult(
        result: VmCallResult<QuickJSHandle>,
        options: {name?: string; startPoint?: number},
    ): result is {value: QuickJSHandle} {
        const {startPoint = 0, name} = options;
        if (result.error) {
            const errorMsg = this.vm.dump(result.error);
            errorMsg.stack = errorMsg.stack
                .replace('__fn', name)
                .split('\n')
                .map((s: string) =>
                    s.replace(/\d+(?=\D*$)/, (val) => String(parseInt(val) - startPoint)),
                )
                .filter((s: string) => Boolean(s.trim()))
                .slice(0, -2)
                .join('\n');
            result.error.dispose();
            throw errorMsg;
        }

        return true;
    }

    callFunction(props: UiSandboxRuntimeProps) {
        const {fn, fnContext = {}, fnArgs, globalApi, libs, name} = props;
        const filename = 'fn';

        const libsResult = this.vm.evalCode(libs, filename, {type: 'global'});
        this.checkCallResult(libsResult, {name});

        this.defineVmContext(fnContext);
        this.defineVmArguments(fnArgs);
        this.defineVmApi(globalApi);

        const code = `globalThis.__fn = ${fn};
            globalThis.__fn_args = args.length
                ? JSON.parse(args).map((arg) => {
                    if(typeof arg === "string" && arg.startsWith('function')) {
                        let fn;
                        eval('fn = ' + arg);
                        return fn;
                    }

                    if (arg?.target && '${ATTR_DATA_ELEMENT_ID}' in arg.target) {
                        arg.target = document.querySelector('[${ATTR_DATA_ELEMENT_ID}="' + arg.target['${ATTR_DATA_ELEMENT_ID}'] + '"]');
                    }
                    return arg;
                })
                : [];
            globalThis.__fn.call(JSON.parse(context), ...globalThis.__fn_args)`;
        this.runtime.setInterruptHandler(
            this.getInterruptAfterDeadlineHandler(Date.now() + this.timelimit),
        );
        const runId = getRandomCKId();
        Performance.mark(runId);
        const result = this.vm.evalCode(code, filename);
        const performance = Performance.getDuration(runId);
        const lines = code?.split('\n') ?? [];
        const startPoint = lines.findIndex((row) => row.trim().startsWith('const __fn')) + 1;

        if (this.checkCallResult(result, {name, startPoint})) {
            const value = this.vm.dump(result.value);
            result.value.dispose();
            this.dispose();

            return {result: value, execTime: performance};
        }

        return {result: null, execTime: performance};
    }

    private defineVmContext(context: unknown) {
        let stringifiedContext = '';
        try {
            stringifiedContext = JSON.stringify(context);
        } catch (e) {
            console.error(e, {context});
        }

        const vmFunctionContext = this.vm.newString(stringifiedContext);
        this.vm.setProp(this.vm.global, 'context', vmFunctionContext);
        vmFunctionContext.dispose();
    }

    private defineVmArguments(args: unknown[]) {
        let stringifiedArgs = '[]';
        try {
            stringifiedArgs = JSON.stringify(
                args.map((arg) => {
                    if (arg && typeof arg === 'function') {
                        return arg.toString();
                    }

                    return arg;
                }),
            );
        } catch (e) {
            console.error(e, {args});
        }

        const vmArgs = this.vm.newString(stringifiedArgs);
        this.vm.setProp(this.vm.global, 'args', vmArgs);

        vmArgs.dispose();
    }

    private defineVmApi(api: object) {
        if (!api) {
            return;
        }

        const items: QuickJSHandle[] = [];

        let timeoutId: number;
        const setItem = (item: object, parent: QuickJSHandle) => {
            Object.entries(item).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    const objHandle = this.vm.newObject();
                    this.vm.setProp(parent, String(key), objHandle);
                    items.push(objHandle);

                    setItem(value, objHandle);
                } else if (typeof value === 'function') {
                    const fnHandle = this.vm.newFunction(key, (...fnArgs) => {
                        let callEnded = false;
                        const nativeArgs = fnArgs.map((fnArg) => {
                            const result = this.vm.dump(fnArg);

                            if (isFunction(result)) {
                                const longLivedCallbackHandle = fnArg.dup();
                                this.pending.push(longLivedCallbackHandle);

                                return (...args: unknown[]) => {
                                    const fnContext = this.vm.newObject();
                                    const mappedArgs = args.map((a) => this.toHandle(a));
                                    const fnResult = this.vm.callFunction(
                                        longLivedCallbackHandle,
                                        fnContext,
                                        ...mappedArgs,
                                    );
                                    const fnResult2 = this.getFunctionResult(fnResult);
                                    fnContext.dispose();
                                    mappedArgs.forEach((arg) => arg.dispose());

                                    clearTimeout(timeoutId);
                                    timeoutId = window.setTimeout(() => {
                                        if (callEnded) {
                                            if (longLivedCallbackHandle.alive) {
                                                longLivedCallbackHandle.dispose();
                                            }
                                            this.dispose();
                                        }
                                    }, 0);

                                    return fnResult2;
                                };
                            }

                            return result;
                        });
                        const result = value(...nativeArgs);
                        callEnded = true;
                        return this.toHandle(result);
                    });
                    this.vm.setProp(parent, key, fnHandle);
                    items.push(fnHandle);
                }
            });
        };

        setItem(api, this.vm.global);

        items.forEach((item) => item.dispose());
    }

    private getFunctionResult(result: VmCallResult<QuickJSHandle>) {
        if (result.error) {
            const errorMsg = this.vm.dump(result.error);
            result.error.dispose();
            throw errorMsg;
        }

        const value = this.vm.dump(result.value);
        result.value.dispose();

        return value;
    }

    private toHandle(value: unknown): QuickJSHandle {
        if (typeof value === 'number') {
            return this.vm.newNumber(value);
        }

        if (typeof value === 'object') {
            const result = this.vm.evalCode('(' + JSON.stringify(value) + ')');
            return result.error ?? result.value;
        }

        return this.vm.newString(String(value));
    }

    private dispose() {
        if (!this.pending.some((handle) => handle.alive)) {
            this.vm.dispose();
            this.runtime.dispose();
        }
    }
}

function isFunction(value: unknown) {
    return typeof value === 'string' && (value.startsWith('function') || isArrowFunction(value));
}

function isArrowFunction(value: string) {
    const val = value.replace(' ', '');
    return val.startsWith('(') && val.includes(')=>');
}
