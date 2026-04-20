"use client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RUSSIAN_PHONE_PATTERN = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;
const RUSSIAN_POSTAL_CODE_PATTERN = /^\d{6}$/;
const RUSSIAN_NAME_PART_PATTERN = /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)*$/u;
const RUSSIAN_LOCATION_PATTERN = /^[А-ЯЁа-яё\s.-]+$/u;
const RUSSIAN_ADDRESS_PATTERN = /^[А-ЯЁа-яё0-9\s,./\-№()]+$/u;
const CARDHOLDER_PART_PATTERN = /^[A-ZА-ЯЁ][A-ZА-ЯЁa-zа-яё]+(?:-[A-ZА-ЯЁ][A-ZА-ЯЁa-zа-яё]+)*$/u;

export function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function sanitizeRussianNameInput(value: string) {
  return value.replace(/[^А-Яа-яЁё\s-]/g, "").replace(/\s+/g, " ").replace(/--+/g, "-").trimStart();
}

export function normalizeRussianName(value: string) {
  return normalizeWhitespace(sanitizeRussianNameInput(value));
}

export function isValidRussianPersonalName(value: string) {
  const normalized = normalizeRussianName(value);
  return RUSSIAN_NAME_PART_PATTERN.test(normalized);
}

export function isValidRussianFullName(value: string) {
  const normalized = normalizeRussianName(value);
  const parts = normalized.split(" ").filter(Boolean);

  if (parts.length < 2 || parts.length > 3) {
    return false;
  }

  return parts.every((part) => RUSSIAN_NAME_PART_PATTERN.test(part));
}

export function sanitizeRussianLocationInput(value: string) {
  return value.replace(/[^А-Яа-яЁё\s.-]/g, "").replace(/\s+/g, " ").trimStart();
}

export function normalizeRussianLocation(value: string) {
  return normalizeWhitespace(sanitizeRussianLocationInput(value));
}

export function isValidRussianLocation(value: string) {
  const normalized = normalizeRussianLocation(value);
  return normalized.length >= 2 && normalized.length <= 60 && RUSSIAN_LOCATION_PATTERN.test(normalized);
}

export function sanitizeRussianAddressInput(value: string) {
  return value.replace(/[^А-Яа-яЁё0-9\s,./\-№()]/g, "").replace(/\s+/g, " ").trimStart();
}

export function normalizeRussianAddress(value: string) {
  return normalizeWhitespace(sanitizeRussianAddressInput(value));
}

export function isValidRussianAddress(value: string) {
  const normalized = normalizeRussianAddress(value);

  return (
    normalized.length >= 8 &&
    normalized.length <= 160 &&
    RUSSIAN_ADDRESS_PATTERN.test(normalized) &&
    /[А-Яа-яЁё]/u.test(normalized) &&
    /\d/.test(normalized)
  );
}

export function normalizeRussianPhone(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  let normalized = digitsOnly;

  if (normalized[0] === "8") {
    normalized = `7${normalized.slice(1)}`;
  } else if (normalized[0] !== "7") {
    normalized = normalized.length <= 10 ? `7${normalized}` : `7${normalized.slice(1)}`;
  }

  return normalized.slice(0, 11);
}

export function formatRussianPhone(value: string) {
  const normalized = normalizeRussianPhone(value);

  if (!normalized) {
    return "";
  }

  const part1 = normalized.slice(1, 4);
  const part2 = normalized.slice(4, 7);
  const part3 = normalized.slice(7, 9);
  const part4 = normalized.slice(9, 11);

  return ["+7", part1, part2, part3, part4].filter(Boolean).join(" ");
}

export function isValidRussianPhone(value: string) {
  return RUSSIAN_PHONE_PATTERN.test(formatRussianPhone(value));
}

export function normalizeRussianPostalCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isValidRussianPostalCode(value: string) {
  return RUSSIAN_POSTAL_CODE_PATTERN.test(normalizeRussianPostalCode(value));
}

export function sanitizeCardholderNameInput(value: string) {
  return value
    .replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/--+/g, "-")
    .toUpperCase()
    .trimStart();
}

export function normalizeCardholderName(value: string) {
  return normalizeWhitespace(sanitizeCardholderNameInput(value));
}

export function isValidCardholderName(value: string) {
  const normalized = normalizeCardholderName(value);
  const parts = normalized.split(" ").filter(Boolean);

  if (parts.length < 2) {
    return false;
  }

  return parts.every((part) => CARDHOLDER_PART_PATTERN.test(part));
}

export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function isValidCardNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{16}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function formatCardExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function isValidCardExpiry(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{4}$/.test(digits)) {
    return false;
  }

  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2, 4));

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function normalizeCvv(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function isValidCvv(value: string) {
  return /^\d{3,4}$/.test(normalizeCvv(value));
}
