"use client";

import { motion, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";

type StaggerContainerProps = {
  className?: string;
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
};

const containerVariants = {
  hidden: {},
  visible: (stagger: number) => ({
    transition: {
      staggerChildren: stagger,
    },
  }),
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export function StaggerContainer({
  className,
  children,
  stagger = 0.1,
  delay = 0,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      custom={stagger}
      variants={containerVariants}
      transition={{ delayChildren: delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={cn(className)}>
      {children}
    </motion.div>
  );
}
