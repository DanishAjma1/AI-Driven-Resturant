import type { PaymentInput } from "@ember-grain/shared";

/**
 * ⚠️ Simulated payment verification for the DINE_IN "pay to hold your table"
 * flow. This performs format/checksum validation only — no processor is
 * called, no funds move, and nothing here is PCI-DSS compliant. In a real
 * deployment this module would be replaced with a call to an actual payment
 * gateway (Stripe, Adyen, a mobile-wallet API, etc.) and the raw card/OTP
 * fields would never touch our server in the first place (tokenize on the
 * client instead).
 */

const DEMO_OTP = "123456";

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]!, 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function isExpiryInFuture(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1]!, 10);
  const year = 2000 + parseInt(match[2]!, 10);
  const expiryEnd = new Date(year, month, 0, 23, 59, 59); // last day of that month
  return expiryEnd.getTime() > Date.now();
}

export interface PaymentVerificationResult {
  verified: boolean;
  reason?: string;
}

export function verifyPayment(payment: PaymentInput): PaymentVerificationResult {
  if (payment.method === "CARD") {
    if (!luhnCheck(payment.cardNumber)) {
      return { verified: false, reason: "Card number failed validation." };
    }
    if (!isExpiryInFuture(payment.expiry)) {
      return { verified: false, reason: "Card has expired." };
    }
    return { verified: true };
  }

  // MOBILE_WALLET — demo OTP, as there's no real telco/wallet gateway wired up.
  if (payment.otp !== DEMO_OTP) {
    return { verified: false, reason: `Incorrect OTP. (Demo OTP is ${DEMO_OTP}.)` };
  }
  return { verified: true };
}
