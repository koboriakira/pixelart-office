import { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";

export function useOfficePixiRuntime(containerRef: React.RefObject<HTMLDivElement | null>) {
  const appRef = useRef<Application | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new Application();
    appRef.current = app;

    let cancelled = false;

    app
      .init({
        background: 0x1a1a2e,
        resizeTo: container,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        if (cancelled) {
          app.destroy(true);
          return;
        }
        container.appendChild(app.canvas as HTMLCanvasElement);
        setReady(true);
      });

    return () => {
      cancelled = true;
      setReady(false);
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [containerRef]);

  return { app: appRef.current, ready };
}
