/* Theme: puts the chosen colour theme on the page. "system" follows the device setting. */
export function applyTheme(theme) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
