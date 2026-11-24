import { useEffect } from "react";

const SITE = "noBill";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} · Watch Movies & TV Shows`;
  }, [title]);
}
