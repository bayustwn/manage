import { authClient } from "$lib/auth-client";
import { goto } from "$app/navigation";
import { addToast } from "$lib/stores/toast";

export interface OAuthOptions {
  provider: "google";
  callbackURL?: string;
  onSuccess?: (redirectUrl: string) => void;
  onError?: (error: string) => void;
}

export async function openOAuthPopup(options: OAuthOptions): Promise<void> {
  const { provider, callbackURL = "/dashboard", onSuccess, onError } = options;

  const { data, error } = await authClient.signIn.social({
    provider,
    callbackURL,
    disableRedirect: true,
  });

  if (error) {
    onError?.(error.message || `${provider} sign-in failed`);
    return;
  }

  if (!data?.url) {
    onError?.("Unable to start Google sign-in. Please try again.");
    return;
  }

  const popup = window.open(data.url, `${provider}-signin`, "width=500,height=600");

  if (!popup) {
    onError?.("Popup blocked. Please allow popups for this site.");
    return;
  }

  const messageHandler = (event: MessageEvent): void => {
    if (event.origin !== window.origin) return;
    if (event.data?.type !== "oauth-result") return;

    window.removeEventListener("message", messageHandler);

    const { payload } = event.data;

    if (payload.success) {
      onSuccess?.(payload.redirectUrl || "/dashboard");
    } else {
      onError?.(payload.error || `${provider} sign-in failed`);
    }
  };

  window.addEventListener("message", messageHandler);

  const checkClosed = setInterval(() => {
    try {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageHandler);
      }
    } catch {
      clearInterval(checkClosed);
    }
  }, 500);
}