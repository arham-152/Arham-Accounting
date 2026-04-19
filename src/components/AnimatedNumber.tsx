import React, { useEffect, useState } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  prefix = "", 
  suffix = "",
  className 
}) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  const displayValue = useTransform(springValue, (latest) => {
    return prefix + Math.floor(latest).toLocaleString('en-PK') + suffix;
  });

  return <motion.span className={className}>{displayValue}</motion.span>;
};
