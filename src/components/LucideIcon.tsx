import * as LucideIcons from "lucide-react";

interface LucideIconProps {
  name: string | null | undefined;
  size?: number;
  className?: string;
}

const LucideIcon: React.FC<LucideIconProps> = ({ name, size = 16, className }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name!] || LucideIcons.HelpCircle;
  return <IconComponent size={size} className={className} />;
};

export default LucideIcon;
