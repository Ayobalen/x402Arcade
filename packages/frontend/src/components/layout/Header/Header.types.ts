/**
 * Header Component Types
 */

export interface HeaderProps {
  /**
   * Optional className for custom styling
   */
  className?: string;

  /**
   * Whether to show navigation links (default: true)
   */
  showNavigation?: boolean;

  /**
   * Whether to show wallet connection (default: true)
   */
  showWallet?: boolean;

  /**
   * Whether to show balance in header (default: false)
   */
  showBalance?: boolean;
}
