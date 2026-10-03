/**
 * Inline <head> scripts and their storage keys. Kept out of "use client" modules: a server component importing a
 * string from one gets a client reference, not the string.
 */
export const THEME_KEY = "sama_theme";
export const SIDEBAR_KEY = "sama_sidebar";

/** Runs before paint so a dark-mode user never sees a light flash, and a collapsed sidebar never flashes open. */
export const BOOT_SCRIPT =
  `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}` +
  `try{if(localStorage.getItem("${SIDEBAR_KEY}")==="collapsed")document.documentElement.dataset.sidebar="collapsed"}catch(e){}`;
