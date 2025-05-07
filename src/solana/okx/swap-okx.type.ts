export type OxkApiConfig = {
  api_key: string;
  secret_key: string;
  passphrase: string;
  project: string;
};

// https://web3.okx.com/build/dev-docs/dex-api/dex-swap#request-parameters
export type OkxSolanaParams = {
  amount: string;
  slippage: string;
  feePercent: string;
  chainIndex: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  userWalletAddress: string;

  fromTokenReferrerWalletAddress?: string;
  toTokenReferrerWalletAddress?: string;
  computeUnitPrice?: string;
  computeUnitLimit?: string;
  // directRoute: true | false
  directRoute?: string;
  priceImpactProtectionPercentage?: string;
  autoSlippage?: string;
  maxAutoSlippage?: string;
};
