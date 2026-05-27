"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
  duration?: number;
};

export function FadeIn({
  className,
  delay = 0,
  duration = 0.5,
  children,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] as const }}
      variants={fadeUpVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
