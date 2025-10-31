
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  onClick,
  disabled = false
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center';
  
  const variants = {
    primary: 'bg-pink-600 hover:bg-pink-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline: 'border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
