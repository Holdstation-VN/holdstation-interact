import * as Yup from "yup";

const stringOrNumber = () =>
  Yup.mixed()
    .transform((_, originalValue) => originalValue)
    .test("string-or-number", "value must be string or number", (value) => value === undefined || typeof value === "string" || typeof value === "number");

/* ================================================================
 * 1) Schema cho Token
 * ================================================================= */
export const tokenSchema = Yup.object({
  decimal: stringOrNumber().required(),
  isHoneyPot: Yup.boolean().notRequired(),
  taxRate: stringOrNumber().notRequired(),
  tokenContractAddress: Yup.string().required(),
  tokenSymbol: Yup.string().required(),
  tokenUnitPrice: stringOrNumber().required(),
}).required();

/* ================================================================
 * 2) Schema cho DexProtocol
 * ================================================================= */
export const dexProtocolSchema = Yup.object({
  dexName: Yup.string().required(),
  percent: stringOrNumber().required(),
}).required();

/* ================================================================
 * 3) Schema cho SubRouter (gồm DexProtocol + token from/to)
 * ================================================================= */
export const routeLegSchema = Yup.object({
  dexProtocol: dexProtocolSchema,
  fromToken: tokenSchema,
  fromTokenIndex: stringOrNumber().notRequired(),
  toToken: tokenSchema,
  toTokenIndex: stringOrNumber().notRequired(),
  subRouterList: Yup.array().notRequired(),
}).required();

/* ================================================================
 * 4) Schema cho DexRouter
 * ================================================================= */
export const dexRouterSchema = Yup.object({
  router: Yup.string().notRequired(),
  routerPercent: stringOrNumber().notRequired(),
  subRouterList: Yup.array(routeLegSchema).notRequired(),
}).required();

/* ================================================================
 * 5) Schema cho QuoteCompare
 * ================================================================= */
export const quoteCompareSchema = Yup.object({
  amountOut: stringOrNumber(),
  dexLogo: Yup.string().required(),
  dexName: Yup.string().required(),
  tradeFee: stringOrNumber(),
}).required();

/* ================================================================
 * 6) Schema cho RouterResult
 * ================================================================= */
const dexRouterListSchema = Yup.array(Yup.lazy((value) => (value && value.subRouterList ? dexRouterSchema : routeLegSchema))).required();

export const routerResultSchema = Yup.object({
  chainId: stringOrNumber().notRequired(),
  chainIndex: stringOrNumber().required(),
  contextSlot: stringOrNumber().notRequired(),
  dexRouterList: dexRouterListSchema,
  estimateGasFee: stringOrNumber().required(),

  fromToken: tokenSchema,
  fromTokenAmount: stringOrNumber().required(),

  priceImpactPercent: stringOrNumber().notRequired(),
  priceImpactPercentage: stringOrNumber().notRequired(),
  router: Yup.string().notRequired(),
  swapMode: Yup.string().notRequired(),
  // quoteCompareList: Yup.array(quoteCompareSchema).required(),

  toToken: tokenSchema,
  toTokenAmount: stringOrNumber().required(),

  tradeFee: stringOrNumber().notRequired(),
}).required();

/* ================================================================
 * 7) Schema cho Tx
 * ================================================================= */
export const txSchema = Yup.object({
  data: Yup.string().required(),
  from: Yup.string().required(),
  gas: stringOrNumber().notRequired(),
  gasPrice: stringOrNumber().notRequired(),
  maxPriorityFeePerGas: stringOrNumber().notRequired(),
  maxSpendAmount: stringOrNumber().notRequired(),
  minReceiveAmount: stringOrNumber().required(),
  signatureData: Yup.array().of(Yup.string()).notRequired(),
  slippagePercent: stringOrNumber().notRequired(),
  to: Yup.string().required(),
  value: stringOrNumber().required(),
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
  code: Yup.mixed()
    .test("code-type", "code must be string or number", (value) => typeof value === "string" || typeof value === "number")
    .required(),
  data: Yup.array(swapItemSchema).required(),
  msg: Yup.string().nullable(),
}).required();
