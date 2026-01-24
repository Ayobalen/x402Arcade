/**
 * Footer Component Types
 */

export interface FooterProps {
  /**
   * Optional className for custom styling
   */
  className?: string;

  /**
   * Whether to show social media links (default: true)
   */
  showSocial?: boolean;

  /**
   * Whether to show navigation links (default: true)
   */
  showNavigation?: boolean;

  /**
   * Whether to show copyright text (default: true)
   */
  showCopyright?: boolean;
}
