import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Removed framer-motion animations to ensure instant page display
// Pages now appear immediately without opacity fade-in
export const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <div className="w-full h-full">
      {children}
    </div>
  );
};
