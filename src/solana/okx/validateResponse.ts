import * as Yup from "yup";

/* ================================================================
 * 1) Schema cho Token
 * ================================================================= */
export const tokenSchema = Yup.object({
  decimal: Yup.string().required(),
  // isHoneyPot: Yup.boolean().required(),
  // taxRate: Yup.string().required(),
  tokenContractAddress: Yup.string().required(),
  tokenSymbol: Yup.string().required(),
  tokenUnitPrice: Yup.string().required(),
}).required();

/* ================================================================
 * 2) Schema cho DexProtocol
 * ================================================================= */
export const dexProtocolSchema = Yup.object({
  dexName: Yup.string().required(),
  percent: Yup.string().required(),
}).required();

/* ================================================================
 * 3) Schema cho SubRouter (gồm DexProtocol + token from/to)
 * ================================================================= */
export const subRouterSchema = Yup.object({
  dexProtocol: Yup.array(dexProtocolSchema).required(),
  fromToken: tokenSchema,
  toToken: tokenSchema,
}).required();

/* ================================================================
 * 4) Schema cho DexRouter
 * ================================================================= */
export const dexRouterSchema = Yup.object({
  router: Yup.string().required(),
  routerPercent: Yup.string().required(),
  subRouterList: Yup.array(subRouterSchema).required(),
}).required();

/* ================================================================
 * 5) Schema cho QuoteCompare
 * ================================================================= */
export const quoteCompareSchema = Yup.object({
  amountOut: Yup.string().required(),
  dexLogo: Yup.string().required(),
  dexName: Yup.string().required(),
  tradeFee: Yup.string().required(),
}).required();

/* ================================================================
 * 6) Schema cho RouterResult
 * ================================================================= */
export const routerResultSchema = Yup.object({
  chainId: Yup.string().required(),
  chainIndex: Yup.string().required(),
  dexRouterList: Yup.array(dexRouterSchema).required(),
  estimateGasFee: Yup.string().required(),

  fromToken: tokenSchema,
  fromTokenAmount: Yup.string().required(),

  priceImpactPercentage: Yup.string().required(),
  // quoteCompareList: Yup.array(quoteCompareSchema).required(),

  toToken: tokenSchema,
  toTokenAmount: Yup.string().required(),

  // tradeFee: Yup.string().required(),
}).required();

/* ================================================================
 * 7) Schema cho Tx
 * ================================================================= */
export const txSchema = Yup.object({
  data: Yup.string().required(),
  from: Yup.string().required(),
  // gas: Yup.string().required(),
  // gasPrice: Yup.string().required(),
  minReceiveAmount: Yup.string().required(),
  to: Yup.string().required(),
  value: Yup.string().required(),
}).required();

/* ================================================================
 * 8) Schema cho phần tử trong mảng `data`
 * ================================================================= */
export const swapItemSchema = Yup.object({
  routerResult: routerResultSchema,
  tx: txSchema,
}).required();

/* ================================================================
 * 9) Schema phản hồi hoàn chỉnh (OKX Swap Response)
 * ================================================================= */
export const swapResponseSchema = Yup.object({
  code: Yup.string().required(),
  data: Yup.array(swapItemSchema).required(),
  msg: Yup.string().nullable(),
}).required();
