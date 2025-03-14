import Image from 'next/image';

interface AptosLogoProps {
  variant?: 'mark' | 'primary';
  className?: string;
}

export default function AptosLogo({ variant = 'mark', className = 'h-8 w-8' }: AptosLogoProps) {
  const logoSrc = variant === 'mark' 
    ? '/static/Aptos_mark_WHT.svg'
    : '/static/Aptos_Primary_WHT.svg';

  return (
    <Image
      src={logoSrc}
      alt="Aptos"
      width={variant === 'mark' ? 32 : 120}
      height={variant === 'mark' ? 32 : 32}
      className={className}
    />
  );
} 