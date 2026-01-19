import { Variants, Transition } from "framer-motion"

// Shared spring transitions
export const springTransition: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 300
}

export const gentleSpring: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 200
}

export const bouncySpring: Transition = {
  type: "spring",
  damping: 15,
  stiffness: 400
}

// Fade variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

// Scale fade variants (for modals/panels)
export const scaleFadeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
}

// Slide variants
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.15 }
  }
}

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.15 }
  }
}

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -300 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    x: -300,
    transition: { duration: 0.2 }
  }
}

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 300 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    x: 300,
    transition: { duration: 0.2 }
  }
}

// Message bubble variants with stagger
export const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: gentleSpring
  }
}

// Button interaction variants
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

export const iconButtonVariants: Variants = {
  idle: { scale: 1, rotate: 0 },
  hover: { scale: 1.1 },
  tap: { scale: 0.9 }
}

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: gentleSpring
  }
}

// Pulse animation for typing indicator
export const pulseVariants: Variants = {
  idle: { scale: 1, opacity: 0.5 },
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Success checkmark animation
export const checkmarkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.1 }
    }
  }
}

// Shimmer effect for loading states
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: "-200% 0"
  },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

// Tooltip animation
export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 5,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: 5,
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
}

// Focus ring animation
export const focusRingStyle = {
  boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.5)",
  transition: "box-shadow 0.15s ease"
}

// Hover glow effect
export const hoverGlowStyle = {
  boxShadow: "0 4px 20px -4px rgba(99, 102, 241, 0.3)",
  transition: "box-shadow 0.2s ease"
}
