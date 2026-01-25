import { MailValidatorResponse, MailBoxCanReceiveStatus } from "@/types";

/**
 * Risk level classification for email validation results
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Reasons why an email might be rejected
 */
export type RejectionReason =
  | "invalid_syntax"
  | "disposable_domain"
  | "cannot_receive"
  | "high_risk"
  | "randomly_generated";

/**
 * Result interpretation helpers for email validation responses.
 * These helpers make it easier to understand and act on validation results.
 *
 * @module result-helpers
 *
 * @example
 * ```typescript
 * import { isValid, getRiskLevel, getScore } from '@launchfirstagency/happy-mail';
 *
 * const result = await client.validateEmail('test@example.com');
 *
 * if (isValid(result)) {
 *   console.log(`Risk: ${getRiskLevel(result)}`);
 *   console.log(`Score: ${getScore(result)}/100`);
 * }
 * ```
 */

/**
 * Check if an email validation result indicates a valid email.
 *
 * An email is considered valid if it meets the following criteria:
 * - Has valid syntax
 * - Can potentially receive emails (not UNSAFE)
 * - Is not from a disposable domain
 *
 * @param result - The email validation response to check
 * @returns `true` if the email is valid, `false` otherwise
 *
 * @example
 * ```typescript
 * const result = await client.validateEmail('user@example.com');
 * if (isValid(result)) {
 *   console.log('Email is valid!');
 * }
 * ```
 */
export function isValid(result: MailValidatorResponse): boolean {
  return (
    result.risks.validSyntax &&
    result.risks.canReceive !== MailBoxCanReceiveStatus.UNSAFE &&
    !result.risks.disposableDomain
  );
}

/**
 * Check if an email is safe to send to.
 *
 * This is a stricter check than `isValid()`, requiring:
 * - Valid syntax
 * - SAFE receive status (not UNKNOWN, UNSAFE, or HIGH_RISK)
 * - Not a disposable domain
 * - Not likely randomly generated
 *
 * Use this for high-value email campaigns where deliverability is critical.
 *
 * @param result - The email validation response to check
 * @returns `true` if the email is completely safe to send to, `false` otherwise
 *
 * @example
 * ```typescript
 * const result = await client.validateEmail('user@example.com');
 * if (isSafeToSend(result)) {
 *   await sendMarketingEmail(result.email);
 * }
 * ```
 */
export function isSafeToSend(result: MailValidatorResponse): boolean {
  return (
    result.risks.validSyntax &&
    result.risks.canReceive === MailBoxCanReceiveStatus.SAFE &&
    !result.risks.disposableDomain &&
    !result.risks.likelyRandomlyGenerated
  );
}

/**
 * Check if an email should be rejected based on validation results.
 *
 * This is the inverse of `isValid()`. An email should be rejected if:
 * - It has invalid syntax
 * - It's from a disposable domain
 * - It cannot receive emails
 *
 * @param result - The email validation response to check
 * @returns `true` if the email should be rejected, `false` otherwise
 *
 * @example
 * ```typescript
 * const result = await client.validateEmail('test@tempmail.com');
 * if (shouldReject(result)) {
 *   return res.status(400).json({ error: 'Invalid email address' });
 * }
 * ```
 */
export function shouldReject(result: MailValidatorResponse): boolean {
  return !isValid(result);
}

/**
 * Get the risk level classification of an email based on validation results.
 *
 * Risk levels:
 * - **low**: Valid syntax, safe to receive, not disposable, not random
 * - **medium**: Valid syntax but has concerns (unknown status, disposable, or random)
 * - **high**: Invalid syntax or cannot receive emails
 *
 * @param result - The email validation response to evaluate
 * @returns The risk level: 'low', 'medium', or 'high'
 *
 * @example
 * ```typescript
 * const result = await client.validateEmail('user@example.com');
 * const risk = getRiskLevel(result);
 *
 * switch (risk) {
 *   case 'low':
 *     console.log('Safe to use');
 *     break;
 *   case 'medium':
 *     console.log('Use with caution');
 *     break;
 *   case 'high':
 *     console.log('Do not use');
 *     break;
 * }
 * ```
 */
export function getRiskLevel(result: MailValidatorResponse): RiskLevel {
  // High risk: invalid syntax or cannot receive
  if (
    !result.risks.validSyntax ||
    result.risks.canReceive === MailBoxCanReceiveStatus.UNSAFE ||
    result.risks.canReceive === MailBoxCanReceiveStatus.HIGH_RISK
  ) {
    return "high";
  }

  // Medium risk: disposable, random, or unknown receive status
  if (
    result.risks.disposableDomain ||
    result.risks.likelyRandomlyGenerated ||
    result.risks.canReceive === MailBoxCanReceiveStatus.UNKNOWN
  ) {
    return "medium";
  }

  // Low risk: all checks passed
  return "low";
}

/**
 * Get specific reasons why an email might be rejected
 * Returns an array of rejection reasons based on the validation results
 */
export function getRejectionReasons(result: MailValidatorResponse): RejectionReason[] {
  const reasons: RejectionReason[] = [];

  if (!result.risks.validSyntax) {
    reasons.push("invalid_syntax");
  }

  if (result.risks.disposableDomain) {
    reasons.push("disposable_domain");
  }

  if (
    result.risks.canReceive === MailBoxCanReceiveStatus.UNSAFE ||
    result.risks.canReceive === MailBoxCanReceiveStatus.HIGH_RISK
  ) {
    reasons.push("cannot_receive");
  }

  if (result.risks.canReceive === MailBoxCanReceiveStatus.HIGH_RISK) {
    reasons.push("high_risk");
  }

  if (result.risks.likelyRandomlyGenerated) {
    reasons.push("randomly_generated");
  }

  return reasons;
}

/**
 * Get human-readable recommendations based on validation results
 * Returns an array of actionable recommendations for handling the email
 */
export function getRecommendations(result: MailValidatorResponse): string[] {
  const recommendations: string[] = [];
  const riskLevel = getRiskLevel(result);

  if (riskLevel === "high") {
    recommendations.push("Do not send emails to this address");
    if (!result.risks.validSyntax) {
      recommendations.push("Email has invalid syntax - ask user to correct it");
    }
    if (result.risks.canReceive === MailBoxCanReceiveStatus.UNSAFE) {
      recommendations.push("Mailbox cannot receive emails - verify with recipient");
    }
    return recommendations;
  }

  if (riskLevel === "medium") {
    if (result.risks.disposableDomain) {
      recommendations.push("This is a disposable/temporary email address");
      recommendations.push("Consider requiring a permanent email address");
    }
    if (result.risks.likelyRandomlyGenerated) {
      recommendations.push("Email appears randomly generated - may be fake");
      recommendations.push("Consider additional verification steps");
    }
    if (result.risks.canReceive === MailBoxCanReceiveStatus.UNKNOWN) {
      recommendations.push("Cannot verify if mailbox can receive emails");
      recommendations.push("Proceed with caution or use additional verification");
    }
    return recommendations;
  }

  // Low risk
  recommendations.push("Email appears valid and safe to use");
  return recommendations;
}

/**
 * Get a numeric quality score from 0-100 representing email quality.
 *
 * Score ranges:
 * - **100**: Perfect (all checks passed)
 * - **75-99**: Good (valid but minor concerns)
 * - **50-74**: Risky (multiple concerns)
 * - **0-49**: Bad (should reject)
 *
 * The score is calculated by starting at 100 and deducting points for each risk factor:
 * - Invalid syntax: automatic 0
 * - Cannot receive (UNSAFE): -50 points
 * - High risk status: -40 points
 * - Disposable domain: -20 points
 * - Randomly generated: -15 points
 * - Unknown receive status: -10 points
 *
 * @param result - The email validation response to score
 * @returns A score from 0-100, where 100 is perfect and 0 is completely invalid
 *
 * @example
 * ```typescript
 * const result = await client.validateEmail('user@example.com');
 * const score = getScore(result);
 *
 * if (score >= 80) {
 *   console.log('High quality email');
 * } else if (score >= 50) {
 *   console.log('Medium quality email');
 * } else {
 *   console.log('Low quality email');
 * }
 * ```
 */
export function getScore(result: MailValidatorResponse): number {
  let score = 100;

  // Invalid syntax is a critical failure
  if (!result.risks.validSyntax) {
    return 0;
  }

  // Severe penalties
  if (result.risks.canReceive === MailBoxCanReceiveStatus.UNSAFE) {
    score -= 50;
  }
  if (result.risks.canReceive === MailBoxCanReceiveStatus.HIGH_RISK) {
    score -= 40;
  }

  // Moderate penalties
  if (result.risks.disposableDomain) {
    score -= 20;
  }
  if (result.risks.likelyRandomlyGenerated) {
    score -= 15;
  }
  if (result.risks.canReceive === MailBoxCanReceiveStatus.UNKNOWN) {
    score -= 10;
  }

  return Math.max(0, score);
}

/**
 * Enhanced result object with helper methods.
 *
 * This class wraps a `MailValidatorResponse` and provides a fluent API
 * for accessing all result interpretation helpers as methods.
 *
 * @example
 * ```typescript
 * import { HappyEmailClient, EmailValidationResult } from '@launchfirstagency/happy-mail';
 *
 * const client = new HappyEmailClient();
 * const rawResult = await client.validateEmail('user@example.com');
 *
 * // Wrap the result
 * const result = new EmailValidationResult(rawResult);
 *
 * // Use fluent API
 * if (result.isSafeToSend()) {
 *   console.log(`Score: ${result.getScore()}/100`);
 *   console.log(`Risk: ${result.getRiskLevel()}`);
 *   await sendEmail(result.raw.email);
 * }
 * ```
 */
export class EmailValidationResult {
  /**
   * Create a new EmailValidationResult wrapper.
   *
   * @param result - The raw validation response to wrap
   */
  constructor(private result: MailValidatorResponse) {}

  /**
   * Get the original validation response.
   *
   * @returns The raw MailValidatorResponse object
   */
  get raw(): MailValidatorResponse {
    return this.result;
  }

  /**
   * Check if the email is valid
   */
  isValid(): boolean {
    return isValid(this.result);
  }

  /**
   * Check if the email is safe to send to
   */
  isSafeToSend(): boolean {
    return isSafeToSend(this.result);
  }

  /**
   * Check if the email should be rejected
   */
  shouldReject(): boolean {
    return shouldReject(this.result);
  }

  /**
   * Get the risk level
   */
  getRiskLevel(): RiskLevel {
    return getRiskLevel(this.result);
  }

  /**
   * Get rejection reasons
   */
  getRejectionReasons(): RejectionReason[] {
    return getRejectionReasons(this.result);
  }

  /**
   * Get recommendations
   */
  getRecommendations(): string[] {
    return getRecommendations(this.result);
  }

  /**
   * Get quality score (0-100)
   */
  getScore(): number {
    return getScore(this.result);
  }
}
