import { useCallback, useEffect, useRef, useState } from "react";

export function usePagedList(loadPage, getKey) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const page = useRef(0);
  const seen = useRef(new Set());
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const batch = await loadPage(page.current);
      page.current += 1;
      if (batch === null) {
        setDone(true);
      } else {
        const fresh = batch.filter((item) => {
          const key = getKey(item);
          if (seen.current.has(key)) return false;
          seen.current.add(key);
          return true;
        });
        setItems((prev) => [...prev, ...fresh]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  return { items, loading, error, done, loadMore };
}
