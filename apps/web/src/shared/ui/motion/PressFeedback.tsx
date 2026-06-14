import {
  type ReactNode,
  type ReactElement,
  Children,
  cloneElement,
} from "react";
import { motion, useReducedMotion } from "motion/react";

interface MotionPressProps {
  whileTap?: { scale: number };
  transition?: { type: string; stiffness: number; damping: number };
}

interface PressFeedbackProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  disabled?: boolean;
}

export function PressFeedback({
  children,
  className,
  asChild,
  disabled,
}: PressFeedbackProps) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = !disabled && !reducedMotion;

  if (asChild) {
    const child = Children.only(children) as ReactElement<MotionPressProps>;

    if (!shouldAnimate) {
      return child;
    }

    return cloneElement(child, {
      whileTap: { scale: 0.97 },
      transition: { type: "spring", stiffness: 400, damping: 17 },
    });
  }

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
}
