import { EmailValidationService } from "../email-validation.service";
import { MailBoxCanReceiveStatus, MXHostType, EmailType } from "../../types";
import { EmailVerificationInfoCodes } from "../email-verification";
import { Logger, calculateStringEntropy } from "../../util";

// Mock dependencies
jest.mock("../../util", () => ({
  isValidEmail: jest.fn(),
  normalizeEmailAddress: jest.fn(),
  splitEmailDomain: jest.fn(),
  lowestPriorityMxRecord: jest.fn(),
  resolveMxRecords: jest.fn(),
  Logger: {
    setEnabled: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  calculateStringEntropy: jest.fn(),
}));

// Mock data imports
jest.mock("../data/disposable-email-domains.json", () => ["tempemail.com", "disposable.com"], { virtual: true });
jest.mock("../data/personal-email-domains.json", () => ["gmail.com", "outlook.com"], { virtual: true });

// Import the mocked utilities to set their implementation
import {
  isValidEmail,
  normalizeEmailAddress,
  splitEmailDomain,
  lowestPriorityMxRecord,
  resolveMxRecords,
} from "../../util";

describe("EmailValidationService", () => {
  let service: EmailValidationService;

  // Mock the verification service
  const mockVerificationService = {
    verify: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Disable logger output during tests
    Logger.setEnabled(false);

    // Setup service with mocked verification service using dependency injection
    service = new EmailValidationService(mockVerificationService);

    // Default mock implementations
    (isValidEmail as jest.Mock).mockImplementation((email) => email.includes("@"));
    (normalizeEmailAddress as jest.Mock).mockImplementation((email) => email.toLowerCase());
    (splitEmailDomain as jest.Mock).mockImplementation((email) => {
      if (!email.includes("@")) return false;
      const domain = email.split("@")[1];
      return {
        domain,
        sub: "",
        tld: domain.split(".").pop(),
      };
    });
    (lowestPriorityMxRecord as jest.Mock).mockReturnValue({ exchange: "mx.example.com" });
    (resolveMxRecords as jest.Mock).mockResolvedValue([{ exchange: "mx.example.com", priority: 10 }]);
    (calculateStringEntropy as jest.Mock).mockImplementation((str) => {
      // Simple mock implementation - the more unique chars, the higher the entropy
      const uniqueChars = new Set(str).size;
      return (uniqueChars / str.length) * 5; // Scale to similar range as actual implementation
    });
  });

  describe("validate", () => {
    it("should validate a legitimate email address", async () => {
      const email = "test@example.com";
      (splitEmailDomain as jest.Mock).mockReturnValue({ domain: "example.com", sub: "", tld: "com" });
      mockVerificationService.verify.mockResolvedValue({
        success: true,
        info: "",
        result: "valid",
        addr: email,
        code: EmailVerificationInfoCodes.FinishedVerification,
      });

      const result = await service.validate(email);

      expect(result.email).toBe(email);
      expect(result.risks.validSyntax).toBe(true);
      expect(result.risks.canReceive).toBe(MailBoxCanReceiveStatus.SAFE);
    });

    it("should handle invalid email syntax", async () => {
      const email = "invalid-email";
      (isValidEmail as jest.Mock).mockReturnValue(false);
      (splitEmailDomain as jest.Mock).mockReturnValue(false);

      const result = await service.validate(email);

      expect(result.risks.validSyntax).toBe(false);
      expect(result.provider).toBe(MXHostType.UNKNOWN);
      expect(result.type).toBe(EmailType.UNKNOWN);
    });

    it("should skip bounce check when specified", async () => {
      const email = "test@example.com";

      const result = await service.validate(email, true);

      expect(result.risks.canReceive).toBe(MailBoxCanReceiveStatus.UNKNOWN);
      expect(mockVerificationService.verify).not.toHaveBeenCalled();
    });
  });

  describe("getMXHostByDomain", () => {
    it("should return UNKNOWN when domain is false", async () => {
      const result = await service.getMXHostByDomain(false);

      expect(result).toBe(MXHostType.UNKNOWN);
    });

    it("should return GOOGLE for Google MX records", async () => {
      (lowestPriorityMxRecord as jest.Mock).mockReturnValue({ exchange: "aspmx.l.google.com" });

      const result = await service.getMXHostByDomain({ domain: "example.com", sub: "", tld: "com" });

      expect(result).toBe(MXHostType.GOOGLE);
    });

    it("should return OUTLOOK for Microsoft MX records", async () => {
      (lowestPriorityMxRecord as jest.Mock).mockReturnValue({ exchange: "outlook.com" });

      const result = await service.getMXHostByDomain({ domain: "example.com", sub: "", tld: "com" });

      expect(result).toBe(MXHostType.OUTLOOK);
    });

    it("should return OTHER for non-specific MX records", async () => {
      (lowestPriorityMxRecord as jest.Mock).mockReturnValue({ exchange: "mx.example.com" });

      const result = await service.getMXHostByDomain({ domain: "example.com", sub: "", tld: "com" });

      expect(result).toBe(MXHostType.OTHER);
    });

    it("should return UNKNOWN when MX lookup fails", async () => {
      (resolveMxRecords as jest.Mock).mockResolvedValue(null);

      const result = await service.getMXHostByDomain({ domain: "example.com", sub: "", tld: "com" });

      expect(result).toBe(MXHostType.UNKNOWN);
    });

    it("should handle errors and return UNKNOWN", async () => {
      (resolveMxRecords as jest.Mock).mockRejectedValue(new Error("DNS error"));

      const result = await service.getMXHostByDomain({ domain: "example.com", sub: "", tld: "com" });

      expect(result).toBe(MXHostType.UNKNOWN);
    });
  });

  describe("isDomainAllowed", () => {
    it("should return false for disposable domains", () => {
      const result = service.isDomainAllowed("test@disposable.com");

      expect(result).toBe(false);
    });

    it("should return true for non-disposable domains", () => {
      const result = service.isDomainAllowed("test@example.com");

      expect(result).toBe(true);
    });

    it("should return false for invalid email format", () => {
      // With our improved implementation, invalid emails should return false
      (isValidEmail as jest.Mock).mockReturnValue(false);
      const result = service.isDomainAllowed("invalid-email");

      expect(result).toBe(false);
    });
  });

  describe("bounceCheck", () => {
    it("should return SAFE for verified emails", async () => {
      const email = "test@example.com";
      mockVerificationService.verify.mockResolvedValue({
        success: true,
        info: "",
        result: "valid",
        addr: email,
        code: EmailVerificationInfoCodes.FinishedVerification,
      });

      const result = await service.bounceCheck(email);

      expect(result).toBe(MailBoxCanReceiveStatus.SAFE);
    });

    it("should return HIGH_RISK for spamtrap emails", async () => {
      const email = "trap@example.com";
      mockVerificationService.verify.mockResolvedValue({
        success: true,
        info: "spamtrap_network",
        result: "valid",
        addr: email,
        code: EmailVerificationInfoCodes.FinishedVerification,
      });

      const result = await service.bounceCheck(email);

      expect(result).toBe(MailBoxCanReceiveStatus.HIGH_RISK);
    });

    it("should return UNSAFE for verification failures", async () => {
      const email = "bad@example.com";
      mockVerificationService.verify.mockResolvedValue({
        success: false,
        info: "Failed verification",
        result: "invalid",
        addr: email,
        code: EmailVerificationInfoCodes.InvalidEmailStructure,
      });

      const result = await service.bounceCheck(email);

      expect(result).toBe(MailBoxCanReceiveStatus.UNSAFE);
    });
  });

  describe("getEmailType", () => {
    it("should return PERSONAL for personal domains", () => {
      const result = service.getEmailType("test@gmail.com", { domain: "gmail.com", sub: "", tld: "com" });

      expect(result).toBe(EmailType.PERSONAL);
    });

    it("should return BUSINESS for non-personal domains", () => {
      const result = service.getEmailType("test@company.com", { domain: "company.com", sub: "", tld: "com" });

      expect(result).toBe(EmailType.BUSINESS);
    });
  });

  describe("isLikelyRandomEmail", () => {
    it("should identify high entropy emails (when they meet length threshold)", () => {
      (calculateStringEntropy as jest.Mock).mockReturnValue(5.0); // Above threshold

      const result = service.isLikelyRandomEmail("j8f72hd9a3sdkjfh@example.com");

      expect(result).toBe(true);
    });

    it("should respect configurable entropy threshold", () => {
      // Set up the mocked entropy to return 4.0
      (calculateStringEntropy as jest.Mock).mockReturnValue(4.0);

      // First with default threshold (4.5)
      let result = service.isLikelyRandomEmail("test1234@example.com");
      expect(result).toBe(false); // Should be false because 4.0 < 4.5

      // Now with a lower threshold
      service.entropyThreshold = 3.5;
      result = service.isLikelyRandomEmail("test1234@example.com");
      expect(result).toBe(true); // Should be true because 4.0 > 3.5
    });

    it("should respect configurable minimum length", () => {
      // Set entropy high enough to pass that check
      (calculateStringEntropy as jest.Mock).mockReturnValue(5.0);

      // Short email with default min length (8)
      let result = service.isLikelyRandomEmail("abc@example.com");
      expect(result).toBe(false); // Too short with default settings

      // Change min length setting
      service.minLengthForRandomCheck = 3;
      result = service.isLikelyRandomEmail("abc@example.com");
      expect(result).toBe(true); // Now passes because length requirement lowered
    });

    it("should return true for emails with excessive numbers", () => {
      const result = service.isLikelyRandomEmail("john12345678@example.com");

      expect(result).toBe(true);
    });

    it("should return true for emails with long consonant strings", () => {
      const result = service.isLikelyRandomEmail("jhgnmpqrst@example.com");

      expect(result).toBe(true);
    });

    it("should return false for normal-looking emails", () => {
      const result = service.isLikelyRandomEmail("john.doe@example.com");

      expect(result).toBe(false);
    });
  });
});
