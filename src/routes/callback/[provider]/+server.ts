import { auth } from "$lib/server/auth";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

type CallbackQuery = Record<string, string | string[]>;
type CallbackBody = Record<string, unknown>;

type CallbackOAuth = (input: {
  request: Request;
  method: "GET" | "POST";
  params: { id: string };
  query: Record<string, string | string[]>;
  body?: Record<string, unknown>;
  headers: Headers;
}) => Promise<Response>;

// Wrapper untuk better-auth internal callbackOAuth dengan typed interface
// Type assertion diperlukan karena better-auth tidak mengekspos tipe publik untuk method ini
const callbackOAuth: CallbackOAuth = (input) => {
  return (auth.api.callbackOAuth as (i: typeof input) => Promise<Response>)(input);
};
const allowedProviders = new Set(["google"]);

function assertAllowedProvider(provider: string) {
  if (!allowedProviders.has(provider)) error(404, "OAuth provider not found");
}

function getQuery(url: URL): CallbackQuery {
  const query: CallbackQuery = {};
  url.searchParams.forEach((value, key) => {
    const current = query[key];
    if (Array.isArray(current)) current.push(value);
    else if (current) query[key] = [current, value];
    else query[key] = value;
  });
  return query;
}

function produceHtmlResponse(redirectUrl: string, isError: boolean, errorMessage: string | null): Response {
  const success = !isError;
  const payloadJson = JSON.stringify(
    isError
      ? { success: false, error: errorMessage }
      : { success: true, redirectUrl }
  );

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isError ? "Sign-in failed" : "Signing in..."}</title>
  <style>
    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #6d28d9; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner" aria-label="Completing sign in..."></div>
  <script>
    (function() {
      var payload = ${payloadJson};

      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage({ type: "oauth-result", payload }, window.opener.origin);
          setTimeout(function() { window.close(); }, 100);
          return;
        }
      } catch(e) {}

      window.location.href = ${JSON.stringify(redirectUrl)};
    })();
  </script>
</body>
</html>`;

  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
  });

  return new Response(html, { headers });
}

async function getBody(request: Request): Promise<CallbackBody | undefined> {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > 16_384) error(413, "OAuth callback body is too large");

  const clonedRequest = request.clone();

  try {
    if (contentType.includes("application/json")) return (await clonedRequest.json()) as CallbackBody;
    if (contentType.includes("application/x-www-form-urlencoded")) return Object.fromEntries(await clonedRequest.formData());
  } catch {
    error(400, "Invalid OAuth callback body");
  }

  if (contentLength > 0) error(415, "Unsupported OAuth callback content type");
  return undefined;
}

function extractRedirectInfo(r: Response): { url: string; isError: boolean; errorMsg: string | null } {
  if (r.status !== 302) {
    return { url: "/login", isError: true, errorMsg: "Unexpected response from OAuth provider" };
  }

  const location = r.headers.get("location") ?? "";

  if (location.includes("/api/auth/error")) {
    const errorMatch = location.match(/[?&]error=([^&]*)/);
    const rawError = errorMatch ? decodeURIComponent(errorMatch[1]) : "sign-in failed";
    const message = translateError(rawError);
    return { url: "/login", isError: true, errorMsg: message };
  }

  return { url: location || "/dashboard", isError: false, errorMsg: null };
}

function translateError(raw: string): string {
  const map: Record<string, string> = {
    account_not_linked: "An account with this email already exists. Verify first, then try Google sign-in again.",
  };
  return map[raw] || raw.replace(/_/g, " ");
}

async function handleCallback(url: URL, request: Request, provider: string, body?: CallbackBody) {
  assertAllowedProvider(provider);

  const response = await callbackOAuth({
    request,
    method: request.method as "GET" | "POST",
    params: { id: provider },
    query: getQuery(url),
    body,
    headers: request.headers,
  });

  if (response.status !== 302) return response;

  const { url: redirectUrl, isError, errorMsg } = extractRedirectInfo(response);
  const htmlResponse = produceHtmlResponse(redirectUrl, isError, errorMsg);

  const setCookies = response.headers.getSetCookie();
  for (const cookie of setCookies) {
    htmlResponse.headers.append("Set-Cookie", cookie);
  }

  return htmlResponse;
}

export const GET: RequestHandler = async ({ url, request, params }) => {
  return handleCallback(url, request, params.provider);
};

export const POST: RequestHandler = async ({ url, request, params }) => {
  return handleCallback(url, request, params.provider, await getBody(request));
};