export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  scoreReport: any;
  contextSlot: number;
  timeTaken: number;
  swapUsdValue: string;
  simplerRouteUsed: boolean;
  mostReliableAmmsQuoteReport: MostReliableAmmsQuoteReport;
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
  simulationSlot: number;
  dynamicSlippageReport: any;
  simulationError: any;
  addressesByLookupTableAddress: any;
}

export interface PrioritizationType {
  computeBudget: ComputeBudget;
}

export interface ComputeBudget {
  microLamports: number;
  estimatedMicroLamports: number;
}
