const HOLD_SO_NATIVE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isNativeToken(contractAddress: string) {
  if (contractAddress.toLowerCase() === HOLD_SO_NATIVE_ADDRESS.toLowerCase()) {
    return true;
  }

  return false;
}
