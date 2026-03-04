import { useRef } from "react";
import { useOfficePixiRuntime } from "../../hooks/useOfficePixiRuntime";

export function OfficeView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ready } = useOfficePixiRuntime(containerRef);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "calc(100vh - 60px)",
        position: "relative",
      }}
    >
      {!ready && (
        <p style={{ padding: 16, color: "#888" }}>Loading office...</p>
      )}
    </div>
  );
}
