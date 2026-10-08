import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { errorMessage } from "./ui";

export function useBusinessQuery<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError("");
    try { const value = await load(); if (request === generation.current) setData(value); }
    catch (cause) { if (request === generation.current) setError(errorMessage(cause)); }
    finally { if (request === generation.current) setLoading(false); }
  }, [load]);
  useFocusEffect(useCallback(() => { void reload(); return () => { generation.current += 1; }; }, [reload]));
  return { data, loading, error, reload, setError };
}
