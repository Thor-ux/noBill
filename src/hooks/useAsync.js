import { useEffect, useState } from "react";

export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: null });

    asyncFn()
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch((err) => active && setState({ loading: false, data: null, error: err.message }));

    return () => {
      active = false;
    };
  }, deps);

  return state;
}
