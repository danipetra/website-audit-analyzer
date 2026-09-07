export function pageLabel(url: string): string {
  try {
    const { pathname } = new URL(url);
    if (pathname === "/" || pathname === "") return "home";
    return pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}
