import {
  Coffee,
  Cpu,
  GitBranch,
  Brain,
  Monitor,
  Code2,
  Database,
  Boxes,
  Workflow,
  Globe,
  Cloud,
  Terminal,
  FileCode,
  Palette,
  Braces,
  Shield,
  Container,
  Server,
  Rocket,
  Smartphone,
  Webhook,
  Binary,
  Lock,
  Cable,
  Layers,
  BookOpen,
  Clock,
  Map,
  Landmark,
  TrendingUp,
  Atom,
  Calculator,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Coffee,
  Cpu,
  GitBranch,
  Brain,
  Monitor,
  Code2,
  Database,
  Boxes,
  Workflow,
  Globe,
  Cloud,
  Terminal,
  FileCode,
  Palette,
  Braces,
  Shield,
  Container,
  Server,
  Rocket,
  Smartphone,
  Webhook,
  Binary,
  Lock,
  Cable,
  Layers,
  BookOpen,
  Clock,
  Map,
  Landmark,
  TrendingUp,
  Atom,
  Calculator,
};

interface TopicIconProps {
  icon: string;
  className?: string;
}

export default function TopicIcon({ icon, className = 'w-6 h-6' }: TopicIconProps) {
  const IconComponent = iconMap[icon] || Code2;
  return <IconComponent className={className} />;
}
