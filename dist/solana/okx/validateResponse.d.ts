import * as Yup from "yup";
export declare const tokenSchema: Yup.ObjectSchema<{
    decimal: {};
    isHoneyPot: Yup.Maybe<boolean | undefined>;
    taxRate: Yup.Maybe<{} | undefined>;
    tokenContractAddress: string;
    tokenSymbol: string;
    tokenUnitPrice: {};
}, Yup.AnyObject, {
    decimal: undefined;
    isHoneyPot: undefined;
    taxRate: undefined;
    tokenContractAddress: undefined;
    tokenSymbol: undefined;
    tokenUnitPrice: undefined;
}, "">;
export declare const dexProtocolSchema: Yup.ObjectSchema<{
    dexName: string;
    percent: {};
}, Yup.AnyObject, {
    dexName: undefined;
    percent: undefined;
}, "">;
export declare const routeLegSchema: Yup.ObjectSchema<{
    dexProtocol: {
        dexName: string;
        percent: {};
    };
    fromToken: {
        isHoneyPot?: Yup.Maybe<boolean | undefined>;
        taxRate?: Yup.Maybe<{} | undefined>;
        decimal: {};
        tokenContractAddress: string;
        tokenSymbol: string;
        tokenUnitPrice: {};
    };
    fromTokenIndex: Yup.Maybe<{} | undefined>;
    toToken: {
        isHoneyPot?: Yup.Maybe<boolean | undefined>;
        taxRate?: Yup.Maybe<{} | undefined>;
        decimal: {};
        tokenContractAddress: string;
        tokenSymbol: string;
        tokenUnitPrice: {};
    };
    toTokenIndex: Yup.Maybe<{} | undefined>;
    subRouterList: Yup.Maybe<any[] | undefined>;
}, Yup.AnyObject, {
    dexProtocol: {
        dexName: undefined;
        percent: undefined;
    };
    fromToken: {
        decimal: undefined;
        isHoneyPot: undefined;
        taxRate: undefined;
        tokenContractAddress: undefined;
        tokenSymbol: undefined;
        tokenUnitPrice: undefined;
    };
    fromTokenIndex: undefined;
    toToken: {
        decimal: undefined;
        isHoneyPot: undefined;
        taxRate: undefined;
        tokenContractAddress: undefined;
        tokenSymbol: undefined;
        tokenUnitPrice: undefined;
    };
    toTokenIndex: undefined;
    subRouterList: undefined;
}, "">;
export declare const dexRouterSchema: Yup.ObjectSchema<{
    router: Yup.Maybe<string | undefined>;
    routerPercent: Yup.Maybe<{} | undefined>;
    subRouterList: Yup.Maybe<{
        fromTokenIndex?: Yup.Maybe<{} | undefined>;
        toTokenIndex?: Yup.Maybe<{} | undefined>;
        subRouterList?: Yup.Maybe<any[] | undefined>;
        dexProtocol: {
            dexName: string;
            percent: {};
        };
        fromToken: {
            isHoneyPot?: Yup.Maybe<boolean | undefined>;
            taxRate?: Yup.Maybe<{} | undefined>;
            decimal: {};
            tokenContractAddress: string;
            tokenSymbol: string;
            tokenUnitPrice: {};
        };
        toToken: {
            isHoneyPot?: Yup.Maybe<boolean | undefined>;
            taxRate?: Yup.Maybe<{} | undefined>;
            decimal: {};
            tokenContractAddress: string;
            tokenSymbol: string;
            tokenUnitPrice: {};
        };
    }[] | undefined>;
}, Yup.AnyObject, {
    router: undefined;
    routerPercent: undefined;
    subRouterList: undefined;
}, "">;
export declare const quoteCompareSchema: Yup.ObjectSchema<{
    amountOut: {} | undefined;
    dexLogo: string;
    dexName: string;
    tradeFee: {} | undefined;
}, Yup.AnyObject, {
    amountOut: undefined;
    dexLogo: undefined;
    dexName: undefined;
    tradeFee: undefined;
}, "">;
export declare const routerResultSchema: Yup.ObjectSchema<{
    chainId: Yup.Maybe<{} | undefined>;
    chainIndex: {};
    contextSlot: Yup.Maybe<{} | undefined>;
    dexRouterList: ({
        fromTokenIndex?: Yup.Maybe<{} | undefined>;
        toTokenIndex?: Yup.Maybe<{} | undefined>;
        subRouterList?: Yup.Maybe<any[] | undefined>;
        dexProtocol: {
            dexName: string;
            percent: {};
        };
        fromToken: {
            isHoneyPot?: Yup.Maybe<boolean | undefined>;
            taxRate?: Yup.Maybe<{} | undefined>;
            decimal: {};
            tokenContractAddress: string;
            tokenSymbol: string;
            tokenUnitPrice: {};
        };
        toToken: {
            isHoneyPot?: Yup.Maybe<boolean | undefined>;
            taxRate?: Yup.Maybe<{} | undefined>;
            decimal: {};
            tokenContractAddress: string;
            tokenSymbol: string;
            tokenUnitPrice: {};
        };
    } | {
        subRouterList?: Yup.Maybe<{
            fromTokenIndex?: Yup.Maybe<{} | undefined>;
            toTokenIndex?: Yup.Maybe<{} | undefined>;
            subRouterList?: Yup.Maybe<any[] | undefined>;
            dexProtocol: {
                dexName: string;
                percent: {};
            };
            fromToken: {
                isHoneyPot?: Yup.Maybe<boolean | undefined>;
                taxRate?: Yup.Maybe<{} | undefined>;
                decimal: {};
                tokenContractAddress: string;
                tokenSymbol: string;
                tokenUnitPrice: {};
            };
            toToken: {
                isHoneyPot?: Yup.Maybe<boolean | undefined>;
                taxRate?: Yup.Maybe<{} | undefined>;
                decimal: {};
                tokenContractAddress: string;
                tokenSymbol: string;
                tokenUnitPrice: {};
            };
        }[] | undefined>;
        router?: Yup.Maybe<string | undefined>;
        routerPercent?: Yup.Maybe<{} | undefined>;
    })[];
    estimateGasFee: {};
    fromToken: {
        isHoneyPot?: Yup.Maybe<boolean | undefined>;
        taxRate?: Yup.Maybe<{} | undefined>;
        decimal: {};
        tokenContractAddress: string;
        tokenSymbol: string;
        tokenUnitPrice: {};
    };
    fromTokenAmount: {};
    priceImpactPercent: Yup.Maybe<{} | undefined>;
    priceImpactPercentage: Yup.Maybe<{} | undefined>;
    router: Yup.Maybe<string | undefined>;
    swapMode: Yup.Maybe<string | undefined>;
    toToken: {
        isHoneyPot?: Yup.Maybe<boolean | undefined>;
        taxRate?: Yup.Maybe<{} | undefined>;
        decimal: {};
        tokenContractAddress: string;
        tokenSymbol: string;
        tokenUnitPrice: {};
    };
    toTokenAmount: {};
    tradeFee: Yup.Maybe<{} | undefined>;
}, Yup.AnyObject, {
    chainId: undefined;
    chainIndex: undefined;
    contextSlot: undefined;
    dexRouterList: undefined;
    estimateGasFee: undefined;
    fromToken: {
        decimal: undefined;
        isHoneyPot: undefined;
        taxRate: undefined;
        tokenContractAddress: undefined;
        tokenSymbol: undefined;
        tokenUnitPrice: undefined;
    };
    fromTokenAmount: undefined;
    priceImpactPercent: undefined;
    priceImpactPercentage: undefined;
    router: undefined;
    swapMode: undefined;
    toToken: {
        decimal: undefined;
        isHoneyPot: undefined;
        taxRate: undefined;
        tokenContractAddress: undefined;
        tokenSymbol: undefined;
        tokenUnitPrice: undefined;
    };
    toTokenAmount: undefined;
    tradeFee: undefined;
}, "">;
export declare const txSchema: Yup.ObjectSchema<{
    data: string;
    from: string;
    gas: Yup.Maybe<{} | undefined>;
    gasPrice: Yup.Maybe<{} | undefined>;
    maxPriorityFeePerGas: Yup.Maybe<{} | undefined>;
    maxSpendAmount: Yup.Maybe<{} | undefined>;
    minReceiveAmount: {};
    signatureData: Yup.Maybe<(string | undefined)[] | undefined>;
    slippagePercent: Yup.Maybe<{} | undefined>;
    to: string;
    value: {};
}, Yup.AnyObject, {
    data: undefined;
    from: undefined;
    gas: undefined;
    gasPrice: undefined;
    maxPriorityFeePerGas: undefined;
    maxSpendAmount: undefined;
    minReceiveAmount: undefined;
    signatureData: "";
    slippagePercent: undefined;
    to: undefined;
    value: undefined;
}, "">;
export declare const swapItemSchema: Yup.ObjectSchema<{
    routerResult: {
        router?: Yup.Maybe<string | undefined>;
        tradeFee?: Yup.Maybe<{} | undefined>;
        chainId?: Yup.Maybe<{} | undefined>;
        contextSlot?: Yup.Maybe<{} | undefined>;
        priceImpactPercent?: Yup.Maybe<{} | undefined>;
        priceImpactPercentage?: Yup.Maybe<{} | undefined>;
        swapMode?: Yup.Maybe<string | undefined>;
        fromToken: {
            isHoneyPot?: Yup.Maybe<boolean | undefined>;
            taxRate?: Yup.Maybe<{} | undefined>;
            decimal: {};
            tokenContractAddress: string;
            tokenSymbol: string;
            tokenUnitPrice: {};
        };
        toToken: {
            isHoneyPot?: Yup.Maybe<boolean | undefined>;
            taxRate?: Yup.Maybe<{} | undefined>;
            decimal: {};
            tokenContractAddress: string;
            tokenSymbol: string;
            tokenUnitPrice: {};
        };
        dexRouterList: ({
            fromTokenIndex?: Yup.Maybe<{} | undefined>;
            toTokenIndex?: Yup.Maybe<{} | undefined>;
            subRouterList?: Yup.Maybe<any[] | undefined>;
            dexProtocol: {
                dexName: string;
                percent: {};
            };
            fromToken: {
                isHoneyPot?: Yup.Maybe<boolean | undefined>;
                taxRate?: Yup.Maybe<{} | undefined>;
                decimal: {};
                tokenContractAddress: string;
                tokenSymbol: string;
                tokenUnitPrice: {};
            };
            toToken: {
                isHoneyPot?: Yup.Maybe<boolean | undefined>;
                taxRate?: Yup.Maybe<{} | undefined>;
                decimal: {};
                tokenContractAddress: string;
                tokenSymbol: string;
                tokenUnitPrice: {};
            };
        } | {
            subRouterList?: Yup.Maybe<{
                fromTokenIndex?: Yup.Maybe<{} | undefined>;
                toTokenIndex?: Yup.Maybe<{} | undefined>;
                subRouterList?: Yup.Maybe<any[] | undefined>;
                dexProtocol: {
                    dexName: string;
                    percent: {};
                };
                fromToken: {
                    isHoneyPot?: Yup.Maybe<boolean | undefined>;
                    taxRate?: Yup.Maybe<{} | undefined>;
                    decimal: {};
                    tokenContractAddress: string;
                    tokenSymbol: string;
                    tokenUnitPrice: {};
                };
                toToken: {
                    isHoneyPot?: Yup.Maybe<boolean | undefined>;
                    taxRate?: Yup.Maybe<{} | undefined>;
                    decimal: {};
                    tokenContractAddress: string;
                    tokenSymbol: string;
                    tokenUnitPrice: {};
                };
            }[] | undefined>;
            router?: Yup.Maybe<string | undefined>;
            routerPercent?: Yup.Maybe<{} | undefined>;
        })[];
        chainIndex: {};
        estimateGasFee: {};
        fromTokenAmount: {};
        toTokenAmount: {};
    };
    tx: {
        gas?: Yup.Maybe<{} | undefined>;
        gasPrice?: Yup.Maybe<{} | undefined>;
        maxPriorityFeePerGas?: Yup.Maybe<{} | undefined>;
        maxSpendAmount?: Yup.Maybe<{} | undefined>;
        signatureData?: Yup.Maybe<(string | undefined)[] | undefined>;
        slippagePercent?: Yup.Maybe<{} | undefined>;
        value: {};
        data: string;
        from: string;
        minReceiveAmount: {};
        to: string;
    };
}, Yup.AnyObject, {
    routerResult: {
        chainId: undefined;
        chainIndex: undefined;
        contextSlot: undefined;
        dexRouterList: undefined;
        estimateGasFee: undefined;
        fromToken: {
            decimal: undefined;
            isHoneyPot: undefined;
            taxRate: undefined;
            tokenContractAddress: undefined;
            tokenSymbol: undefined;
            tokenUnitPrice: undefined;
        };
        fromTokenAmount: undefined;
        priceImpactPercent: undefined;
        priceImpactPercentage: undefined;
        router: undefined;
        swapMode: undefined;
        toToken: {
            decimal: undefined;
            isHoneyPot: undefined;
            taxRate: undefined;
            tokenContractAddress: undefined;
            tokenSymbol: undefined;
            tokenUnitPrice: undefined;
        };
        toTokenAmount: undefined;
        tradeFee: undefined;
    };
    tx: {
        data: undefined;
        from: undefined;
        gas: undefined;
        gasPrice: undefined;
        maxPriorityFeePerGas: undefined;
        maxSpendAmount: undefined;
        minReceiveAmount: undefined;
        signatureData: "";
        slippagePercent: undefined;
        to: undefined;
        value: undefined;
    };
}, "">;
export declare const swapResponseSchema: Yup.ObjectSchema<{
    code: {};
    data: {
        routerResult: {
            router?: Yup.Maybe<string | undefined>;
            tradeFee?: Yup.Maybe<{} | undefined>;
            chainId?: Yup.Maybe<{} | undefined>;
            contextSlot?: Yup.Maybe<{} | undefined>;
            priceImpactPercent?: Yup.Maybe<{} | undefined>;
            priceImpactPercentage?: Yup.Maybe<{} | undefined>;
            swapMode?: Yup.Maybe<string | undefined>;
            fromToken: {
                isHoneyPot?: Yup.Maybe<boolean | undefined>;
                taxRate?: Yup.Maybe<{} | undefined>;
                decimal: {};
                tokenContractAddress: string;
                tokenSymbol: string;
                tokenUnitPrice: {};
            };
            toToken: {
                isHoneyPot?: Yup.Maybe<boolean | undefined>;
                taxRate?: Yup.Maybe<{} | undefined>;
                decimal: {};
                tokenContractAddress: string;
                tokenSymbol: string;
                tokenUnitPrice: {};
            };
            dexRouterList: ({
                fromTokenIndex?: Yup.Maybe<{} | undefined>;
                toTokenIndex?: Yup.Maybe<{} | undefined>;
                subRouterList?: Yup.Maybe<any[] | undefined>;
                dexProtocol: {
                    dexName: string;
                    percent: {};
                };
                fromToken: {
                    isHoneyPot?: Yup.Maybe<boolean | undefined>;
                    taxRate?: Yup.Maybe<{} | undefined>;
                    decimal: {};
                    tokenContractAddress: string;
                    tokenSymbol: string;
                    tokenUnitPrice: {};
                };
                toToken: {
                    isHoneyPot?: Yup.Maybe<boolean | undefined>;
                    taxRate?: Yup.Maybe<{} | undefined>;
                    decimal: {};
                    tokenContractAddress: string;
                    tokenSymbol: string;
                    tokenUnitPrice: {};
                };
            } | {
                subRouterList?: Yup.Maybe<{
                    fromTokenIndex?: Yup.Maybe<{} | undefined>;
                    toTokenIndex?: Yup.Maybe<{} | undefined>;
                    subRouterList?: Yup.Maybe<any[] | undefined>;
                    dexProtocol: {
                        dexName: string;
                        percent: {};
                    };
                    fromToken: {
                        isHoneyPot?: Yup.Maybe<boolean | undefined>;
                        taxRate?: Yup.Maybe<{} | undefined>;
                        decimal: {};
                        tokenContractAddress: string;
                        tokenSymbol: string;
                        tokenUnitPrice: {};
                    };
                    toToken: {
                        isHoneyPot?: Yup.Maybe<boolean | undefined>;
                        taxRate?: Yup.Maybe<{} | undefined>;
                        decimal: {};
                        tokenContractAddress: string;
                        tokenSymbol: string;
                        tokenUnitPrice: {};
                    };
                }[] | undefined>;
                router?: Yup.Maybe<string | undefined>;
                routerPercent?: Yup.Maybe<{} | undefined>;
            })[];
            chainIndex: {};
            estimateGasFee: {};
            fromTokenAmount: {};
            toTokenAmount: {};
        };
        tx: {
            gas?: Yup.Maybe<{} | undefined>;
            gasPrice?: Yup.Maybe<{} | undefined>;
            maxPriorityFeePerGas?: Yup.Maybe<{} | undefined>;
            maxSpendAmount?: Yup.Maybe<{} | undefined>;
            signatureData?: Yup.Maybe<(string | undefined)[] | undefined>;
            slippagePercent?: Yup.Maybe<{} | undefined>;
            value: {};
            data: string;
            from: string;
            minReceiveAmount: {};
            to: string;
        };
    }[];
    msg: string | null | undefined;
}, Yup.AnyObject, {
    code: undefined;
    data: undefined;
    msg: undefined;
}, "">;
export type SwapResponse = Yup.InferType<typeof swapResponseSchema>;
export type SwapResponseItem = Yup.InferType<typeof swapItemSchema>;
