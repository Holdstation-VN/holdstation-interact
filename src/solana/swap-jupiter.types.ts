export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number | null;
  platformFee: {
    amount: string;
    feeBps: number;
  } | null;
  priceImpactPct: string | null;
  routePlan: RoutePlan[];

  // TODO: declare type
  scoreReport: unknown | null;

  contextSlot: number | null;
  timeTaken: number | null;
  swapUsdValue: string;
  simplerRouteUsed: boolean | null;
  mostReliableAmmsQuoteReport: MostReliableAmmsQuoteReport | null;
}

export interface RoutePlan {
  swapInfo: SwapInfo;
  percent: number;
}

export interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

export interface MostReliableAmmsQuoteReport {
  info: Record<string, string>;
}

export interface SwapInfoResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
  computeUnitLimit: number;
  prioritizationType: PrioritizationType;
  simulationSlot: number | null;
  simulationError: {
    errorCode: string;
    error: string;
  } | null;

  // TODO: declare type
  addressesByLookupTableAddress: unknown | null;
  dynamicSlippageReport: unknown | null;
}

export interface PrioritizationType {
  computeBudget: ComputeBudget;
}

export interface ComputeBudget {
  microLamports: number;
  estimatedMicroLamports: number;
}
