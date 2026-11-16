/**
 * Form validation helpers.
 *
 * The email/password helpers are used by Login and Sign Up; the listing helpers
 * are used by the Post Listing form.
 */

/** Official DOrSU student email domain. */
export const DORSU_EMAIL_DOMAIN = '@dorsu.edu.ph';

/** Basic email shape check (something@something.something). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * UniSell only accepts official DOrSU school emails.
 * Example: juan.dela.cruz@dorsu.edu.ph
 */
export function isDorsuEmail(email: string): boolean {
  return isValidEmail(email) && email.trim().toLowerCase().endsWith(DORSU_EMAIL_DOMAIN);
}

/** Friendly error message for the email field, or `null` when valid. */
export function validateSchoolEmail(email: string): string | null {
  if (!email.trim()) return 'Please enter your school email.';
  if (!isValidEmail(email)) return 'That does not look like a valid email address.';
  if (!isDorsuEmail(email)) return 'Use your official @dorsu.edu.ph email.';
  return null;
}

/** Minimum 8 characters. Keep the rule simple and explainable. */
export function validatePassword(password: string): string | null {
  if (!password) return 'Please enter a password.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

/** Profile names must be 2–60 characters after trimming. */
export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter your full name.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 60) return 'Keep your name under 60 characters.';
  return null;
}

/** New password rules for the optional Change password section. */
export function validateNewPassword(
  password: string,
  currentPassword: string,
): string | null {
  const basic = validatePassword(password);
  if (basic) return basic;
  if (currentPassword && password === currentPassword) {
    return 'New password must be different from your current password.';
  }
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}

export function validatePrice(value: number): string | null {
  if (!Number.isFinite(value)) return 'Enter a valid price.';
  if (value <= 0) return 'Price must be greater than zero.';
  return null;
}

export function validateTitle(value: string): string | null {
  if (!value.trim()) return 'Title is required.';
  if (value.trim().length < 4) return 'Title must be at least 4 characters.';
  if (value.trim().length > 80) return 'Keep the title under 80 characters.';
  return null;
}

export function validateDescription(value: string): string | null {
  if (!value.trim()) return 'Description is required.';
  if (value.trim().length < 10) return 'Add a little more detail (at least 10 characters).';
  return null;
}
