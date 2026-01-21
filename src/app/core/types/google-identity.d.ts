/**
 * Type definitions for Google Identity Services
 * https://developers.google.com/identity/gsi/web/reference/js-reference
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: (notification?: (notification: PromptMomentNotification) => void) => void;
          disableAutoSelect: () => void;
          storeCredential: (credentials: { id: string; password: string }) => void;
          cancel: () => void;
          onGoogleLibraryLoad: () => void;
          revoke: (accessToken: string, done: () => void) => void;
        };
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
        };
      };
    };
  }
}

export interface GoogleIdConfiguration {
  client_id: string;
  auto_select?: boolean;
  callback: (response: CredentialResponse) => void;
  login_uri?: string;
  native_callback?: (response: { credential: string }) => void;
  cancel_on_tap_outside?: boolean;
  hosted_domain?: string;
  itp_support?: boolean;
  state_cookie_domain?: string;
  ux_mode?: 'popup' | 'redirect';
  allowed_parent_origin?: string | string[];
  intermediate_iframe_close_callback?: () => void;
}

export interface CredentialResponse {
  credential: string; // JWT idToken
  select_by: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'brn_add_session' | 'btn_confirm_add_session';
}

export interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => 'browser_not_supported' | 'invalid_client' | 'missing_client_id' | 'opt_out_or_no_session' | 'secure_http_required' | 'suppressed_by_user' | 'unregistered_origin' | 'unknown_reason';
  isSkippedMoment: () => boolean;
  getSkippedReason: () => 'auto_cancel' | 'user_cancel' | 'tap_outside' | 'issuing_failed';
  isDismissedMoment: () => boolean;
  getDismissedReason: () => 'credential_returned' | 'cancel_called' | 'flow_restarted';
  getMomentType: () => 'display' | 'skipped' | 'dismissed';
}

export interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: string) => void;
  state?: string;
  enable_granular_consent?: boolean;
  hosted_domain?: string;
  hint?: string;
  prompt?: '' | 'none' | 'consent' | 'select_account';
}

export interface TokenResponse {
  access_token: string;
  authuser: string;
  expires_in: number;
  hd?: string;
  prompt: string;
  token_type: string;
  scope: string;
  state?: string;
}

export interface TokenClient {
  requestAccessToken: (overrideConfig?: TokenClientConfig) => void;
}

export {};
