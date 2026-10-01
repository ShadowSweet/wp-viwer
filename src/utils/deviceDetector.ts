/**
 * Robust device detection utility
 * Distinguishes between desktop / PC, tablet, and mobile phone.
 * Prevents treating a desktop with a narrow window as a mobile phone.
 */

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // 1. Explicit mobile phones (iPhone, iPod, Android Phone, Windows Phone)
  const isMobileUA = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (isMobileUA) {
    return 'mobile';
  }

  // 2. Tablets (iPad, Android Tablet, Kindle, PlayBook)
  const isTabletUA = /iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(ua);
  if (isTabletUA) {
    return 'tablet';
  }

  // 3. iPad on iOS 13+ (reports as Macintosh in UA, but has multi-touch)
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) {
    return 'tablet';
  }

  // 4. Check for touch-only coarse pointer devices without fine mouse
  try {
    const isCoarseTouchOnly =
      window.matchMedia &&
      window.matchMedia('(pointer: coarse) and (hover: none)').matches;
    if (isCoarseTouchOnly) {
      const minDim = Math.min(window.screen.width || 0, window.screen.height || 0);
      if (minDim > 0 && minDim < 600) {
        return 'mobile';
      } else if (minDim >= 600) {
        return 'tablet';
      }
    }
  } catch {
    // Media query fallback
  }

  // 5. Default is desktop/PC (Windows, macOS, Linux, ChromeOS)
  return 'desktop';
}

/**
 * Determines whether two columns (Chats + Conversation) should be displayed
 * based on device type and available screen geometry.
 */
export function shouldShowTwoColumns(
  deviceType: DeviceType,
  windowWidth: number
): boolean {
  if (deviceType === 'desktop') {
    // On desktop / PC, ALWAYS keep two columns while physically possible (>= 420px)
    return windowWidth >= 420;
  }

  if (deviceType === 'tablet') {
    // On tablet, allow two columns in landscape or when width is sufficient (>= 768px)
    return windowWidth >= 768;
  }

  // On phone / mobile: single column (list -> conversation)
  return false;
}
