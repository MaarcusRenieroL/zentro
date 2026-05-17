export type WorkspaceSessionBridgeInput = {
  redirectTo: string;
  sessionToken?: string | null;
};

function getRedirectPath(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}

export function submitWorkspaceSessionBridge({
  redirectTo,
  sessionToken,
}: WorkspaceSessionBridgeInput) {
  if (!sessionToken) {
    window.location.assign(redirectTo);
    return;
  }

  let destination: URL;

  try {
    destination = new URL(redirectTo);
  } catch {
    window.location.assign(redirectTo);
    return;
  }

  const bridgeUrl = new URL("/api/session-bridge", destination.origin);
  const form = document.createElement("form");
  const tokenInput = document.createElement("input");
  const redirectInput = document.createElement("input");

  form.method = "POST";
  form.action = bridgeUrl.toString();
  form.style.display = "none";

  tokenInput.type = "hidden";
  tokenInput.name = "token";
  tokenInput.value = sessionToken;

  redirectInput.type = "hidden";
  redirectInput.name = "redirectTo";
  redirectInput.value = getRedirectPath(destination);

  form.append(tokenInput, redirectInput);
  document.body.append(form);
  form.submit();
}
