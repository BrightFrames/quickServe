"use client";

import { motion, useInView } from "framer-motion";
import { createElement, RefObject, useRef } from "react";
import { cn } from "../../lib/utils";

interface TimelineContentProps {
  children: React.ReactNode;
  animationNum: number;
  timelineRef?: RefObject<HTMLElement>;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  customVariants?: {
    visible: (i: number) => any;
    hidden: any;
  };
}

export const TimelineContent = ({
  children,
  animationNum,
  className,
  as = "div",
  customVariants,
}: TimelineContentProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  const defaultVariants = {
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    hidden: {
      opacity: 0,
      y: 20,
    },
  };

  const variants = customVariants || defaultVariants;

  return createElement(
    motion[as as keyof typeof motion] as any,
    {
      ref,
      initial: "hidden",
      animate: isInView ? "visible" : "hidden",
      custom: animationNum,
      variants,
      className: cn(className),
    },
    children
  );
};
