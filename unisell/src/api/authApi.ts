import { apiClient, ApiError } from './apiClient';
import fallbackUsers from '../data/users.json';
import type {
  PasswordChangeInput,
  ProfileUpdateInput,
  User,
} from '../types';
import { updateUserListingsSellerFields } from './listingsApi';
import {
  NOT_SIGNED_IN_ERROR,
  PROFILE_OWNERSHIP_ERROR,
} from '../utils/permissions';
import { loadSession } from '../utils/storage';
import {
  isDorsuEmail,
  validateFullName,
  validateNewPassword,
  validatePassword,
} from '../utils/validators';

/**
 * Auth data access for the mock API.
 *
 * PROTOTYPE ONLY: the mock database stores a plain-text `password` field so the
 * demo can compare credentials without a backend. A real app must hash
 * passwords (for example with bcrypt or Argon2) and never store or return them
 * in plain text. The README and architecture notes repeat this warning.
 */

interface UserRecord extends User {
  password: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  course: string;
  yearLevel: string;
  studentId: string;
}

/** Read-only copy of the seeded users, used when json-server is unreachable. */
const FALLBACK_USERS = fallbackUsers as UserRecord[];

/** Remove the password before the user object reaches the UI. */
function toSafeUser(record: UserRecord): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    course: record.course,
    yearLevel: record.yearLevel,
    studentId: record.studentId,
    photo: record.photo ?? null,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Find a user by email.
 * If the mock server is down, fall back to the bundled demo users so the app
 * can still be demonstrated offline. HTTP errors (401, 500, ...) are rethrown.
 */
async function findUserRecords(email: string): Promise<UserRecord[]> {
  try {
    return await apiClient.get<UserRecord[]>(`/users?email=${encodeURIComponent(email)}`);
  } catch (error) {
    const isNetworkError = error instanceof ApiError && error.status === undefined;
    if (isNetworkError) {
      return FALLBACK_USERS.filter((user) => user.email === email);
    }
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const matches = await findUserRecords(normalizeEmail(email));
  const user = matches[0];

  if (!user || user.password !== password) {
    throw new ApiError('Incorrect email or password.', 401);
  }

  return toSafeUser(user);
}

export async function signUpWithEmail(input: SignUpInput): Promise<User> {
  const email = normalizeEmail(input.email);

  // Defence in depth: the screen validates too, but the API should never
  // accept a non-DOrSU address or a weak password.
  if (!isDorsuEmail(email)) {
    throw new ApiError('Use your official @dorsu.edu.ph email.', 400);
  }
  const passwordError = validatePassword(input.password);
  if (passwordError) {
    throw new ApiError(passwordError, 400);
  }

  const existing = await apiClient.get<UserRecord[]>(
    `/users?email=${encodeURIComponent(email)}`,
  );

  if (existing.length > 0) {
    throw new ApiError('An account with this school email already exists.', 409);
  }

  const created = await apiClient.post<UserRecord>('/users', {
    name: input.name.trim(),
    email,
    password: input.password,
    course: input.course,
    yearLevel: input.yearLevel,
    studentId: input.studentId.trim(),
  });

  return toSafeUser(created);
}

/**
 * Update the signed-in student's profile.
 *
 * The id is checked against the persisted session, so a screen cannot edit a
 * different student by passing another id. The denormalized seller snapshot on
 * every listing is refreshed so Home, Search and Listing Details show the new
 * name/course/year immediately without a join.
 */
export async function updateProfile(
  userId: number,
  input: ProfileUpdateInput,
): Promise<User> {
  const session = await loadSession();
  if (!session) throw new ApiError(NOT_SIGNED_IN_ERROR, 401);
  if (session.id !== userId) {
    throw new ApiError(PROFILE_OWNERSHIP_ERROR, 403);
  }

  const nameError = validateFullName(input.name);
  if (nameError) throw new ApiError(nameError, 400);
  if (!input.course.trim()) throw new ApiError('Choose your course.', 400);
  if (!input.yearLevel.trim()) throw new ApiError('Choose your year level.', 400);

  const updated = await apiClient.patch<UserRecord>(`/users/${userId}`, {
    name: input.name.trim(),
    course: input.course,
    yearLevel: input.yearLevel,
    photo: input.photo ?? null,
  });

  // Best effort: the profile is already saved, so a listing refresh failure
  // should not make the student think the whole save failed.
  try {
    await updateUserListingsSellerFields(userId, {
      sellerName: updated.name,
      sellerCourse: updated.course,
      sellerYearLevel: updated.yearLevel,
    });
  } catch (error) {
    console.warn(
      'UniSell: profile saved, but listing seller cards could not be refreshed.',
      error,
    );
  }

  return toSafeUser(updated);
}

/**
 * Change the signed-in student's password.
 *
 * Prototype only: the mock API compares and stores plain text. A real backend
 * must verify a hash and store only a new hash.
 */
export async function changePassword(
  userId: number,
  input: PasswordChangeInput,
): Promise<void> {
  const session = await loadSession();
  if (!session) throw new ApiError(NOT_SIGNED_IN_ERROR, 401);
  if (session.id !== userId) {
    throw new ApiError(PROFILE_OWNERSHIP_ERROR, 403);
  }

  const record = await apiClient.get<UserRecord>(`/users/${userId}`);

  if (record.password !== input.currentPassword) {
    throw new ApiError('Current password is incorrect.', 400);
  }

  const newPasswordError = validateNewPassword(
    input.newPassword,
    input.currentPassword,
  );
  if (newPasswordError) throw new ApiError(newPasswordError, 400);

  await apiClient.patch<UserRecord>(`/users/${userId}`, {
    password: input.newPassword,
  });
}
