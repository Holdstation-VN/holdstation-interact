import * as Yup from "yup";
export declare const quoteResponseSchema: Yup.ObjectSchema<{
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    swapMode: string;
    slippageBps: number | null;
    platformFee: {
        amount: string;
        feeBps: number;
    } | null;
    priceImpactPct: string | null;
    routePlan: {
        percent: number;
        swapInfo: {
            ammKey: string;
            label: string;
            inputMint: string;
            outputMint: string;
            inAmount: string;
            outAmount: string;
            feeAmount: string;
            feeMint: string;
        };
    }[];
    swapUsdValue: string;
    mostReliableAmmsQuoteReport: {
        info: {};
    } | null;
}, Yup.AnyObject, {
    inputMint: undefined;
    inAmount: undefined;
    outputMint: undefined;
    outAmount: undefined;
    swapMode: undefined;
    slippageBps: undefined;
    platformFee: {
        amount: undefined;
        feeBps: undefined;
    };
    priceImpactPct: undefined;
    routePlan: undefined;
    swapUsdValue: undefined;
    mostReliableAmmsQuoteReport: {
        info: {};
    };
}, "">;
export declare const swapInfoResponseSchema: Yup.ObjectSchema<{
    swapTransaction: string;
    lastValidBlockHeight: number;
    prioritizationFeeLamports: number;
    computeUnitLimit: number;
    prioritizationType: {
        computeBudget: {
            microLamports: number;
            estimatedMicroLamports: number;
        };
    };
    simulationSlot: number | null;
    simulationError: {
        error: string;
        errorCode: string;
    } | null;
    addressesByLookupTableAddress: {} | null;
    dynamicSlippageReport: {} | null;
}, Yup.AnyObject, {
    swapTransaction: undefined;
    lastValidBlockHeight: undefined;
    prioritizationFeeLamports: undefined;
    computeUnitLimit: undefined;
    prioritizationType: {
        computeBudget: {
            microLamports: undefined;
            estimatedMicroLamports: undefined;
        };
    };
    simulationSlot: undefined;
    simulationError: {
        errorCode: undefined;
        error: undefined;
    };
    addressesByLookupTableAddress: undefined;
    dynamicSlippageReport: undefined;
}, "">;
