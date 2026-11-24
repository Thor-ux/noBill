export const SITE_NAME = "noBill";
export const CONTACT_EMAIL = "searchuse92@gmail.com";
export const TELEGRAM_URL = "https://t.me/+RIs5-eBueX1kZTUy";

export const mailto = (subject) =>
  `mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
