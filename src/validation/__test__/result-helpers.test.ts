import { describe, it, expect } from '@jest/globals';
import {
  isValid,
  isSafeToSend,
  shouldReject,
  getRiskLevel,
  getRejectionReasons,
  getRecommendations,
  getScore,
  EmailValidationResult,
} from '../result-helpers';
import { MailValidatorResponse, MailBoxCanReceiveStatus, EmailType, MXHostType } from '../../types';

// Helper to create a mock validation response
function createMockResponse(overrides: Partial<MailValidatorResponse> = {}): MailValidatorResponse {
  return {
    email: 'test@example.com',
    normalizedEmail: 'test@example.com',
    domain: { domain: 'example', sub: '', tld: 'com' },
    provider: MXHostType.OTHER,
    type: EmailType.PERSONAL,
    risks: {
      validSyntax: true,
      disposableDomain: false,
      canReceive: MailBoxCanReceiveStatus.SAFE,
      likelyRandomlyGenerated: false,
    },
    ...overrides,
  };
}

describe('Result Helpers', () => {
  describe('isValid', () => {
    it('should return true for valid email with SAFE status', () => {
      const result = createMockResponse();
      expect(isValid(result)).toBe(true);
    });

    it('should return true for valid email with UNKNOWN status', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.UNKNOWN,
          likelyRandomlyGenerated: false,
        },
      });
      expect(isValid(result)).toBe(true);
    });

    it('should return false for invalid syntax', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(isValid(result)).toBe(false);
    });

    it('should return false for UNSAFE status', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.UNSAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(isValid(result)).toBe(false);
    });

    it('should return false for disposable domain', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(isValid(result)).toBe(false);
    });
  });

  describe('isSafeToSend', () => {
    it('should return true for completely safe email', () => {
      const result = createMockResponse();
      expect(isSafeToSend(result)).toBe(true);
    });

    it('should return false for randomly generated email', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: true,
        },
      });
      expect(isSafeToSend(result)).toBe(false);
    });

    it('should return false for UNKNOWN status', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.UNKNOWN,
          likelyRandomlyGenerated: false,
        },
      });
      expect(isSafeToSend(result)).toBe(false);
    });

    it('should return false for any risk flag', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(isSafeToSend(result)).toBe(false);
    });
  });

  describe('shouldReject', () => {
    it('should return false for valid email', () => {
      const result = createMockResponse();
      expect(shouldReject(result)).toBe(false);
    });

    it('should return true for invalid email', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(shouldReject(result)).toBe(true);
    });
  });

  describe('getRiskLevel', () => {
    it("should return 'low' for completely safe email", () => {
      const result = createMockResponse();
      expect(getRiskLevel(result)).toBe('low');
    });

    it("should return 'high' for invalid syntax", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRiskLevel(result)).toBe('high');
    });

    it("should return 'high' for UNSAFE status", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.UNSAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRiskLevel(result)).toBe('high');
    });

    it("should return 'high' for HIGH_RISK status", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.HIGH_RISK,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRiskLevel(result)).toBe('high');
    });

    it("should return 'medium' for disposable domain", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRiskLevel(result)).toBe('medium');
    });

    it("should return 'medium' for randomly generated", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: true,
        },
      });
      expect(getRiskLevel(result)).toBe('medium');
    });

    it("should return 'medium' for UNKNOWN status", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.UNKNOWN,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRiskLevel(result)).toBe('medium');
    });
  });

  describe('getRejectionReasons', () => {
    it('should return empty array for safe email', () => {
      const result = createMockResponse();
      expect(getRejectionReasons(result)).toEqual([]);
    });

    it("should return 'invalid_syntax' for invalid syntax", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRejectionReasons(result)).toContain('invalid_syntax');
    });

    it("should return 'disposable_domain' for disposable email", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRejectionReasons(result)).toContain('disposable_domain');
    });

    it("should return 'cannot_receive' for UNSAFE status", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.UNSAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRejectionReasons(result)).toContain('cannot_receive');
    });

    it("should return 'high_risk' for HIGH_RISK status", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.HIGH_RISK,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getRejectionReasons(result)).toContain('high_risk');
    });

    it("should return 'randomly_generated' for random email", () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: true,
        },
      });
      expect(getRejectionReasons(result)).toContain('randomly_generated');
    });

    it('should return multiple reasons when applicable', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.HIGH_RISK,
          likelyRandomlyGenerated: true,
        },
      });
      const reasons = getRejectionReasons(result);
      expect(reasons).toContain('invalid_syntax');
      expect(reasons).toContain('disposable_domain');
      expect(reasons).toContain('cannot_receive');
      expect(reasons).toContain('high_risk');
      expect(reasons).toContain('randomly_generated');
    });
  });

  describe('getRecommendations', () => {
    it('should provide positive recommendation for safe email', () => {
      const result = createMockResponse();
      const recommendations = getRecommendations(result);
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toContain('valid and safe');
    });

    it('should provide rejection recommendations for high risk', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      const recommendations = getRecommendations(result);
      expect(recommendations.some((r) => r.includes('Do not send'))).toBe(true);
    });

    it('should provide specific recommendations for disposable domain', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      const recommendations = getRecommendations(result);
      expect(recommendations.some((r) => r.includes('disposable'))).toBe(true);
    });
  });

  describe('getScore', () => {
    it('should return 100 for perfect email', () => {
      const result = createMockResponse();
      expect(getScore(result)).toBe(100);
    });

    it('should return 0 for invalid syntax', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.SAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getScore(result)).toBe(0);
    });

    it('should return 50 for UNSAFE status', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: false,
          canReceive: MailBoxCanReceiveStatus.UNSAFE,
          likelyRandomlyGenerated: false,
        },
      });
      expect(getScore(result)).toBe(50);
    });

    it('should deduct points for each risk factor', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.UNKNOWN,
          likelyRandomlyGenerated: true,
        },
      });
      // 100 - 20 (disposable) - 15 (random) - 10 (unknown) = 55
      expect(getScore(result)).toBe(55);
    });

    it('should never return negative scores', () => {
      const result = createMockResponse({
        risks: {
          validSyntax: true,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.HIGH_RISK,
          likelyRandomlyGenerated: true,
        },
      });
      const score = getScore(result);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('EmailValidationResult', () => {
    it('should wrap a response and provide helper methods', () => {
      const response = createMockResponse();
      const result = new EmailValidationResult(response);

      expect(result.isValid()).toBe(true);
      expect(result.isSafeToSend()).toBe(true);
      expect(result.shouldReject()).toBe(false);
      expect(result.getRiskLevel()).toBe('low');
      expect(result.getScore()).toBe(100);
      expect(result.getRejectionReasons()).toEqual([]);
      expect(result.getRecommendations()).toHaveLength(1);
    });

    it('should provide access to raw response', () => {
      const response = createMockResponse();
      const result = new EmailValidationResult(response);

      expect(result.raw).toBe(response);
    });

    it('should handle high-risk emails correctly', () => {
      const response = createMockResponse({
        risks: {
          validSyntax: false,
          disposableDomain: true,
          canReceive: MailBoxCanReceiveStatus.UNSAFE,
          likelyRandomlyGenerated: true,
        },
      });
      const result = new EmailValidationResult(response);

      expect(result.isValid()).toBe(false);
      expect(result.isSafeToSend()).toBe(false);
      expect(result.shouldReject()).toBe(true);
      expect(result.getRiskLevel()).toBe('high');
      expect(result.getScore()).toBe(0);
      expect(result.getRejectionReasons().length).toBeGreaterThan(0);
    });
  });
});
