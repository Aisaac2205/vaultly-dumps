import type { CSSProperties } from "react";

type Status = "pending" | "running" | "completed" | "failed";

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { color: string; bg: string; label: string }> = {
  pending: {
    color: "var(--color-warning)",
    bg: "var(--color-warning-bg)",
    label: "Pending",
  },
  running: {
    color: "var(--color-info)",
    bg: "var(--color-info-bg)",
    label: "Running",
  },
  completed: {
    color: "var(--color-success)",
    bg: "var(--color-success-bg)",
    label: "Completed",
  },
  failed: {
    color: "var(--color-error)",
    bg: "var(--color-error-bg)",
    label: "Failed",
  },
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "2px 10px",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  fontWeight: 500,
  lineHeight: 1.4,
};

const dotStyle: CSSProperties = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  flexShrink: 0,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      style={{
        ...badgeStyle,
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      <span style={{ ...dotStyle, backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
