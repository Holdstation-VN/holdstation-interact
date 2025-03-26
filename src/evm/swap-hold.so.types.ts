export interface HoldSoSwapRequestParams {
  src: string;
  dst: string;
  amount: string;
  receiver: string;
  slippage?: number;
  protocols?: string;
  minReceive?: string;
}

export type SwapsItem = {
  amount: string;
  from: string;
  pool: string;
  protocol: string;
  to: string;
};

export type ProtocolsItem = {
  amount: string;
  swaps: SwapsItem[];
};

export type SwapData = {
  amount: string;
  amountUsd: string;
  dst: string;
  feePercent: string;
  feeUsd: string;
  minReceive: string;
  protocols: ProtocolsItem[];
  src: string;
  toAmount: string;
  toAmountUsd: string;
};

export interface HoldSoSwapResponse {
  quote: SwapData;
  tx: {
    data: string;
  };
}

export const HOLDSO_ROUTER_ADDRESSES: { [chainId: number]: string } = {
  [324]: "0xD1f1bA4BF2aDe4F47472D0B73ba0f5DC30E225DF",
  [80094]: "0x7d55D31adFde09f48d35cfcA13c08A31EBc790CB",
};

export const HOLDSO_URL: { [chainId: number]: string } = {
  [324]: "https://swap.hold.so/api",
  [80094]: "https://swap.hold.so/berachain/api",
};
