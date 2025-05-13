import * as Yup from "yup";

// 1) Schema cho MostReliableAmmsQuoteReport
const mostReliableAmmsQuoteReportSchema = Yup.object({
  info: Yup.object().test("is-record-string-string", "info must be an object Record<string, string>", (value) => {
    // Kiểm tra value có phải là object hay không
    if (typeof value !== "object" || value === null) return false;
    // Kiểm tra tất cả key => value phải là string
    return Object.values(value).every((item) => typeof item === "string");
  }),
}).required();

// 2) Schema cho SwapInfo
const swapInfoSchema = Yup.object({
  ammKey: Yup.string().required(),
  label: Yup.string().required(),
  inputMint: Yup.string().required(),
  outputMint: Yup.string().required(),
  inAmount: Yup.string().required(),
  outAmount: Yup.string().required(),
  feeAmount: Yup.string().required(),
  feeMint: Yup.string().required(),
}).required();

// 3) Schema cho RoutePlan (chứa SwapInfo)
const routePlanSchema = Yup.object({
  swapInfo: swapInfoSchema,
  percent: Yup.number().required(),
}).required();

// 4) Schema cho platformFee
//    platformFee có thể là null hoặc object
const platformFeeSchema = Yup.object({
  amount: Yup.string().required(),
  feeBps: Yup.number().required(),
}).nullable();

// 5) Cuối cùng, schema cho QuoteResponse (toàn bộ dữ liệu)
export const quoteResponseSchema = Yup.object({
  inputMint: Yup.string().required(),
  inAmount: Yup.string().required(),
  outputMint: Yup.string().required(),
  outAmount: Yup.string().required(),
  swapMode: Yup.string().required(),
  slippageBps: Yup.number().required().nullable(),

  platformFee: platformFeeSchema,

  priceImpactPct: Yup.string().required().nullable(),
  routePlan: Yup.array(routePlanSchema).required(),

  swapUsdValue: Yup.string().required(),
  mostReliableAmmsQuoteReport: mostReliableAmmsQuoteReportSchema.nullable(),
});

const computeBudgetSchema = Yup.object({
  microLamports: Yup.number().required(),
  estimatedMicroLamports: Yup.number().required(),
}).required();

// Schema cho phần `PrioritizationType`
const prioritizationTypeSchema = Yup.object({
  computeBudget: computeBudgetSchema,
}).required();

// Schema cho phần `simulationError` (có thể null)
const simulationErrorSchema = Yup.object({
  errorCode: Yup.string().required(),
  error: Yup.string().required(),
}).nullable();

// Schema chính cho SwapInfoResponse
export const swapInfoResponseSchema = Yup.object({
  swapTransaction: Yup.string().required(),
  lastValidBlockHeight: Yup.number().required(),
  prioritizationFeeLamports: Yup.number().required(),
  computeUnitLimit: Yup.number().required(),
  prioritizationType: prioritizationTypeSchema,
  simulationSlot: Yup.number().required().nullable(),
  simulationError: simulationErrorSchema,

  addressesByLookupTableAddress: Yup.mixed().required().nullable(),
  dynamicSlippageReport: Yup.mixed().required().nullable(),
});
