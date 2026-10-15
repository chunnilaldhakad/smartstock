import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from './index';

// ───────────── Accessibility: Reduced Motion Hook ─────────────
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    } else {
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);

  return reducedMotion;
}

// ───────────── Scroll Reveal Component ─────────────
type RevealVariant = 'up' | 'fade' | 'scale';

export interface ScrollRevealProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  variant?: RevealVariant;
  delay?: number; // in milliseconds
  threshold?: number;
  once?: boolean;
}

const variantClasses: Record<RevealVariant, string> = {
  up: 'animate-reveal-up',
  fade: 'animate-reveal-fade',
  scale: 'animate-reveal-scale',
};

export function ScrollReveal({
  children,
  className,
  as: Component = 'div',
  variant = 'up',
  delay = 0,
  threshold = 0.08,
  once = true,
  style,
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [isRevealed, setIsRevealed] = useState<boolean>(() => reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setIsRevealed(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    // Safety timeout: Ensure content is visible even if observer fails or element is outside viewport calculation
    const fallbackTimer = setTimeout(() => {
      setIsRevealed(true);
    }, 450);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          clearTimeout(fallbackTimer);
          setIsRevealed(true);
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setIsRevealed(false);
        }
      },
      { threshold, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(node);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [reducedMotion, threshold, once]);

  const animationStyle: CSSProperties = {
    ...style,
    ...(delay > 0 && isRevealed && !reducedMotion ? { animationDelay: `${delay}ms` } : {}),
  };

  return (
    <Component
      ref={ref}
      style={animationStyle}
      className={cn(
        reducedMotion
          ? ''
          : isRevealed
            ? variantClasses[variant]
            : 'opacity-0 [transform:translateY(12px)] motion-reduce:opacity-100 motion-reduce:transform-none',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

// ───────────── Stagger Context & Container ─────────────
interface StaggerContextValue {
  staggerMs: number;
  initialDelayMs: number;
  reducedMotion: boolean;
}

const StaggerContext = createContext<StaggerContextValue>({
  staggerMs: 45,
  initialDelayMs: 0,
  reducedMotion: false,
});

export interface StaggerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  staggerMs?: number;
  initialDelayMs?: number;
  as?: ElementType;
  className?: string;
}

export function Stagger({
  children,
  staggerMs = 45,
  initialDelayMs = 0,
  as: Component = 'div',
  className,
  ...rest
}: StaggerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <StaggerContext.Provider value={{ staggerMs, initialDelayMs, reducedMotion }}>
      <Component className={className} {...rest}>
        {children}
      </Component>
    </StaggerContext.Provider>
  );
}

export interface StaggerItemProps extends HTMLAttributes<HTMLElement> {
  index: number;
  children: ReactNode;
  className?: string;
  as?: ElementType;
  variant?: RevealVariant;
  delayOffsetMs?: number;
}

export function StaggerItem({
  index,
  children,
  className,
  as: Component = 'div',
  variant = 'up',
  delayOffsetMs = 0,
  style,
  ...rest
}: StaggerItemProps) {
  const { staggerMs, initialDelayMs, reducedMotion } = useContext(StaggerContext);
  const totalDelay = reducedMotion ? 0 : initialDelayMs + index * staggerMs + delayOffsetMs;

  const animationStyle: CSSProperties = {
    ...style,
    ...(totalDelay > 0 && !reducedMotion ? { animationDelay: `${totalDelay}ms` } : {}),
  };

  return (
    <Component
      style={animationStyle}
      className={cn(
        reducedMotion ? '' : `${variantClasses[variant]} both`,
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

// ───────────── Page Transition Wrapper ─────────────
// Does NOT unmount children, preserve state and avoiding duplicate requests
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const loc = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 280);
    return () => clearTimeout(timer);
  }, [loc.pathname, reducedMotion]);

  return (
    <div className={cn(isTransitioning && !reducedMotion ? 'animate-page-enter' : '', className)}>
      {children}
    </div>
  );
}
