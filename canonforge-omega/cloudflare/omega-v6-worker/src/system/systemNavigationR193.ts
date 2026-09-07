export const SYSTEM_NAVIGATION_RELEASE_R193 = "r193-drive-corpus-one-system";

export async function enhanceSystemNavigationR193(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes('id="omegaUniversalNavR192"') || html.includes('data-r193-system-link="true"')) {
    return new Response(html, { status: response.status, headers: response.headers });
  }
  const active = pathname === "/system" || pathname.startsWith("/system/") ? " active" : "";
  const systemLink = `<a data-r193-system-link="true" class="r192Link${active}" href="/system">ONE SYSTEM</a>`;
  html = html.replace('<div class="r192Links">', `<div class="r192Links">${systemLink}`);
  html = html.replace('<div class="r192Menu">', '<div class="r192Menu"><a data-r193-system-menu="true" href="/system">ONE SYSTEM<small>Drive corpus · calculus · execution · proof</small></a>');
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-system-navigation", SYSTEM_NAVIGATION_RELEASE_R193);
  return new Response(html, { status: response.status, headers });
}
