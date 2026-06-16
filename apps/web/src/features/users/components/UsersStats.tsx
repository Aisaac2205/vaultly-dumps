import { useMemo } from "react";
import { StatCard } from "@/shared/ui/stat-card";
import { Stagger, StaggerItem } from "@/shared/ui/motion/Stagger";
import { Users, ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import type { User } from "../types";

interface UsersStatsProps {
  users: User[];
  loading?: boolean;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function UsersStats({ users, loading = false }: UsersStatsProps) {
  const total = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const active = users.filter((u) => !u.banned).length;
  const recent = useMemo(() => {
    const threshold = Date.now() - SEVEN_DAYS_MS;
    return users.filter(
      (u) => new Date(u.createdAt).getTime() > threshold,
    ).length;
  }, [users]);

  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StaggerItem>
        <StatCard
          variant="outlined"
          label="Total usuarios"
          value={total}
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          variant="outlined"
          label="Administradores"
          value={admins}
          icon={<ShieldCheck className="h-4 w-4" />}
          loading={loading}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          variant="outlined"
          label="Activos"
          value={active}
          icon={<UserCheck className="h-4 w-4" />}
          loading={loading}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          variant="outlined"
          label="Nuevos (7 días)"
          value={recent}
          icon={<UserPlus className="h-4 w-4" />}
          loading={loading}
        />
      </StaggerItem>
    </Stagger>
  );
}
