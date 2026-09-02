import bcrypt from 'bcryptjs';

/**
 * Hash a PIN for secure storage
 */
export const hashPin = async (pin: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
};

/**
 * Verify a PIN against its hash
 */
export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(pin, hash);
};

/**
 * Validate PIN format (4-6 digits)
 */
export const validatePinFormat = (pin: string): boolean => {
  // PIN should be 4-6 digits
  return /^\d{4,6}$/.test(pin);
};
