import { motion } from "framer-motion";
import { ReactNode } from "react";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] as any },
  },
};

export const StaggerContainer = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={container}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-60px" }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div className={className} variants={item}>
    {children}
  </motion.div>
);
