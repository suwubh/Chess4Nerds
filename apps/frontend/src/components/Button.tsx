import { useThemeContext } from '@/hooks/useThemes';


export const Button = ({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const { theme } = useThemeContext(); // Get current theme

  return (
    <button
      onClick={onClick}
      className={`px-8 py-4 text-2xl ${theme === 'pink' ? 'bg-pink-300' : 'bg-[#9A9484]'} text-white font-bold rounded ${className}`}
    >
      {children}
    </button>
  );
};
