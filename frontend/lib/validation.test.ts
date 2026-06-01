import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatCardExpiry,
  formatCardNumber,
  formatRussianPhone,
  isValidCardExpiry,
  isValidCardNumber,
  isValidCardholderName,
  isValidCvv,
  isValidEmail,
  isValidRussianAddress,
  isValidRussianFullName,
  isValidRussianLocation,
  isValidRussianPersonalName,
  isValidRussianPhone,
  isValidRussianPostalCode,
  normalizeEmail,
  normalizeRussianAddress,
  normalizeRussianLocation,
  normalizeRussianName,
  normalizeRussianPhone,
  sanitizeCardholderNameInput,
  sanitizeRussianNameInput,
} from "./validation";

describe("frontend validation helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("normalizes email before validation", () => {
    expect(normalizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
    expect(isValidEmail("  USER@Example.COM  ")).toBe(true);
  });

  it("rejects malformed email values", () => {
    expect(isValidEmail("client.example.com")).toBe(false);
    expect(isValidEmail("client@")).toBe(false);
  });

  it("sanitizes Russian name input and keeps hyphenated names", () => {
    expect(sanitizeRussianNameInput("  Анна-Мария123!! ")).toBe("Анна-Мария ");
    expect(normalizeRussianName("  Анна   Мария  ")).toBe("Анна Мария");
  });

  it("validates Russian personal names with capitalized parts", () => {
    expect(isValidRussianPersonalName("Анна-Мария")).toBe(true);
    expect(isValidRussianPersonalName("анна")).toBe(false);
  });

  it("validates Russian full names with two or three words", () => {
    expect(isValidRussianFullName("Иванов Иван")).toBe(true);
    expect(isValidRussianFullName("Иванов Иван Иванович")).toBe(true);
    expect(isValidRussianFullName("Иванов")).toBe(false);
  });

  it("normalizes and validates Russian city names", () => {
    expect(normalizeRussianLocation("  Санкт-Петербург  ")).toBe("Санкт-Петербург");
    expect(isValidRussianLocation("Москва")).toBe(true);
    expect(isValidRussianLocation("Moscow")).toBe(false);
  });

  it("normalizes and validates Russian addresses with letters and digits", () => {
    expect(normalizeRussianAddress("  ул. Ленина,   д. 10, кв. 5  ")).toBe("ул. Ленина, д. 10, кв. 5");
    expect(isValidRussianAddress("ул. Ленина, д. 10")).toBe(true);
    expect(isValidRussianAddress("улица без номера")).toBe(false);
  });

  it("normalizes and formats Russian phone numbers", () => {
    expect(normalizeRussianPhone("8 (999) 123-45-67")).toBe("79991234567");
    expect(formatRussianPhone("9991234567")).toBe("+7 999 123 45 67");
  });

  it("validates Russian phone and postal code values", () => {
    expect(isValidRussianPhone("+7 999 123 45 67")).toBe(true);
    expect(isValidRussianPhone("+7 999 123 45")).toBe(false);
    expect(isValidRussianPostalCode("101000")).toBe(true);
    expect(isValidRussianPostalCode("10100")).toBe(false);
  });

  it("sanitizes and validates cardholder names", () => {
    expect(sanitizeCardholderNameInput(" ivan  petrov123 ")).toBe("IVAN PETROV ");
    expect(isValidCardholderName("IVAN PETROV")).toBe(true);
    expect(isValidCardholderName("IVAN")).toBe(false);
  });

  it("formats and validates bank card numbers with Luhn check", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(isValidCardNumber("4111 1111 1111 1111")).toBe(true);
    expect(isValidCardNumber("4111 1111 1111 1112")).toBe(false);
  });

  it("formats and validates card expiry against the current month", () => {
    expect(formatCardExpiry("1228")).toBe("12 / 28");
    expect(isValidCardExpiry("06 / 26")).toBe(true);
    expect(isValidCardExpiry("05 / 26")).toBe(false);
    expect(isValidCardExpiry("13 / 28")).toBe(false);
  });

  it("validates cvv values with three or four digits", () => {
    expect(isValidCvv("123")).toBe(true);
    expect(isValidCvv("1234")).toBe(true);
    expect(isValidCvv("12")).toBe(false);
  });
});
