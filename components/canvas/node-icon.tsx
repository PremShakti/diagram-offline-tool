"use client";

import {
  User,
  Users,
  Laptop,
  Monitor,
  Server,
  Database,
  Cloud,
  Globe,
  Shield,
  Lock,
  Wifi,
  Smartphone,
  HardDrive,
  Cpu,
  Mail,
  FileText,
  Folder,
  Settings,
  Zap,
  Activity,
} from "lucide-react";
import type { IconName } from "@/lib/store";

const iconMap: Record<IconName, React.ElementType> = {
  user: User,
  users: Users,
  laptop: Laptop,
  monitor: Monitor,
  server: Server,
  database: Database,
  cloud: Cloud,
  globe: Globe,
  shield: Shield,
  lock: Lock,
  wifi: Wifi,
  smartphone: Smartphone,
  "hard-drive": HardDrive,
  cpu: Cpu,
  mail: Mail,
  "file-text": FileText,
  folder: Folder,
  settings: Settings,
  zap: Zap,
  activity: Activity,
};

export function NodeIcon({
  name,
  size = 24,
  color,
  strokeWidth = 1.5,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const IconComp = iconMap[name];
  if (!IconComp) return null;
  return <IconComp size={size} color={color} strokeWidth={strokeWidth} />;
}

export { iconMap };
