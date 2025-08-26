import type { SVGProps } from 'react';

export const WaterDropIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0L12 2.69z" />
  </svg>
);

export const FuturisticGlassIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg 
        viewBox="0 0 120 210" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        {...props}
    >
        <path 
            d="M10 10 H110 L95 200 A10 10 0 0 1 85 210 H35 A10 10 0 0 1 25 200 Z" 
            strokeWidth="5" 
            stroke="hsl(var(--primary))" 
            fill="hsl(var(--primary) / 0.1)"
        />
    </svg>
);
