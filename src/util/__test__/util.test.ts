import { MXHostType } from "../../types/mx-host";
import { isValidEmail, normalizeEmailAddress, splitEmailDomain } from "../helpers";
import { checkPort } from "../mx";
import { getDaysBetween, getDaysRemaining } from "../ssl-checker";
describe("Util", () => {
  it("should be true", () => {
    expect(true).toBe(true);
  });
  describe("helpers", () => {
    describe("isValidEmail", () => {
      it("should be true", () => {
        const email = "test@gmail.com";
        const isValid = isValidEmail(email);
        expect(isValid).toBe(true);
      });
      it("should be false", () => {
        const email = "test";
        const isValid = isValidEmail(email);
        expect(isValid).toBe(false);
      });
    });
    describe("normalizeEmailAddress", () => {
      it("Should return dan@gmail.com", () => {
        const email = "dan+test@gmail.com";
        const provider = MXHostType.GOOGLE;
        const normalized = normalizeEmailAddress(email, provider);
        expect(normalized).toBe("dan@gmail.com");
      });
      it("Should return dan.test@outlook.com", () => {
        const email = "Dan.test@outlook.com";
        const provider = MXHostType.OUTLOOK;
        const normalized = normalizeEmailAddress(email, provider);
        expect(normalized).toBe("dan.test@outlook.com");
      });
    });
    describe("splitEmailDomain", () => {
      it("Should return { subdomain: '', domain: 'gmail', tld: 'com' }", () => {
        const email = "dan@gmail.com";
        const domain = "gmail.com";
        const split = splitEmailDomain(email);
        expect(split).toEqual({ domain, sub: "", tld: "com" });
      });
      it("Should return false", () => {
        const email = "dan@@#gmail.com";
        const split = splitEmailDomain(email);
        expect(split).toBe(false);
      });
    });
  });
  describe("domain-expiry", () => {
    it("should be true", () => {
      expect(true).toBe(true);
    });
  });
  describe("mx", () => {
    describe("checkPort", () => {
      it("should be true for port 9999", () => {
        const port = "9999";
        const isValid = checkPort(port);
        expect(isValid).toBe(true);
      });
      it("should be false for port 0", () => {
        const port = "0";
        const isValid = checkPort(port);
        expect(isValid).toBe(false);
      });
      it("should be false for port -1", () => {
        const port = "-1";
        const isValid = checkPort(port);
        expect(isValid).toBe(false);
      });
      it("should be false for port 0.1", () => {
        const port = "0.1";
        const isValid = checkPort(port);
        expect(isValid).toBe(false);
      });
      it("should be false for port string", () => {
        const port = "string";
        const isValid = checkPort(port);
        expect(isValid).toBe(false);
      });
    });
  });
  describe("ssl", () => {
    describe("getDaysBetween", () => {
      it("should be 1", () => {
        const validFrom = new Date("2021-01-01");
        const validTo = new Date("2021-01-02");
        const days = getDaysBetween(validFrom, validTo);
        expect(days).toBe(1);
      });
      it("should be 0", () => {
        const validFrom = new Date("2021-01-01");
        const validTo = new Date("2021-01-01");
        const days = getDaysBetween(validFrom, validTo);
        expect(days).toBe(0);
      });
    });
    describe("getDaysRemaining", () => {
      beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date("2021-01-01T01:00:00Z").getTime());
      });
      it("should be 1", () => {
        const validFrom = new Date("2021-01-01");
        const validTo = new Date("2021-01-02");
        const days = getDaysRemaining(validFrom, validTo);
        expect(days).toBe(1);
      });
      it("should be 0", () => {
        const validFrom = new Date("2021-01-01");
        const validTo = new Date("2021-01-01");
        const days = getDaysRemaining(validFrom, validTo);
        //weirdness because of -0
        expect(0 === days).toEqual(true);
      });
      it("should be -1", () => {
        const validFrom = new Date("2021-01-01");
        const validTo = new Date("2020-12-31");
        const days = getDaysRemaining(validFrom, validTo);
        expect(days).toBe(-1);
      });
    });
    describe("sslChecker", () => {
      //   it("Should return valid: true", async () => {
      //     const host = "google.com";
      //     const resolved = await sslChecker(host);
      //     expect(resolved.valid).toBe(true);
      //   });
    });
  });
});
