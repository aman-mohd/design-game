import {
  Smartphone,
  Server,
  Cog,
  TrendingUp,
  Network,
  Globe,
  DoorOpen,
  Compass,
  Database,
  Boxes,
  Zap,
  CopyPlus,
  Image,
  Search,
  ListOrdered,
  Radio,
  type LucideProps,
} from 'lucide-react';

// Explicit map keeps the bundle small and the icon set intentional.
const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Smartphone,
  Server,
  Cog,
  TrendingUp,
  Network,
  Globe,
  DoorOpen,
  Compass,
  Database,
  Boxes,
  Zap,
  CopyPlus,
  Image,
  Search,
  ListOrdered,
  Radio,
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = ICONS[name] ?? Server;
  return <Cmp {...props} />;
}
