/**
 * LocalStorage utility for safely storing and retrieving user data
 */

const STORAGE_KEYS = {
  EMAIL: 'zk-email-pay-email',
  WALLET_ADDRESS: 'zk-email-pay-wallet-address',
} as const;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const test = 'localStorage-test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save email address to localStorage
 */
export function saveEmail(email: string): void {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.EMAIL, email);
  } catch (error) {
    console.warn('Failed to save email to localStorage:', error);
  }
}

/**
 * Get saved email address from localStorage
 */
export function getSavedEmail(): string {
  if (!isLocalStorageAvailable()) return '';
  
  try {
    return localStorage.getItem(STORAGE_KEYS.EMAIL) || '';
  } catch (error) {
    console.warn('Failed to get email from localStorage:', error);
    return '';
  }
}

/**
 * Save wallet address to localStorage
 */
export function saveWalletAddress(address: string): void {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
    console.log('Wallet address saved to localStorage:', address);
  } catch (error) {
    console.warn('Failed to save wallet address to localStorage:', error);
  }
}

/**
 * Get saved wallet address from localStorage
 */
export function getSavedWalletAddress(): string {
  if (!isLocalStorageAvailable()) return '';
  
  try {
    const address = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) || '';
    console.log('Wallet address retrieved from localStorage:', address);
    return address;
  } catch (error) {
    console.warn('Failed to get wallet address from localStorage:', error);
    return '';
  }
}

/**
 * Clear all saved data from localStorage
 */
export function clearSavedData(): void {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.EMAIL);
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
  } catch (error) {
    console.warn('Failed to clear saved data from localStorage:', error);
  }
}

/**
 * Hook for using email with localStorage persistence
 */
export function useEmailStorage() {
  if (typeof window === 'undefined') {
    return {
      savedEmail: '',
      saveEmail: () => {},
    };
  }

  return {
    savedEmail: getSavedEmail(),
    saveEmail,
  };
}

/**
 * Hook for using wallet address with localStorage persistence
 */
export function useWalletAddressStorage() {
  if (typeof window === 'undefined') {
    return {
      savedWalletAddress: '',
      saveWalletAddress: () => {},
    };
  }

  return {
    savedWalletAddress: getSavedWalletAddress(),
    saveWalletAddress,
  };
}