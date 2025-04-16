import { QuoteResponse } from "./swap-jupiter";

export interface BodyObject {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  dynamicSlippage: boolean;
  dynamicComputeUnitLimit: boolean;
  prioritizationFeeLamports?: {
    priorityLevelWithMaxLamports: {
      maxLamports: number;
      priorityLevel: string;
    };
  };
  feeAccount?: string; // hoặc Address, v.v.
  computeUnitPriceMicroLamports?: number;
}
