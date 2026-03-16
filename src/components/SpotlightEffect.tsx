"use client";

import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

export const SpotlightEffect = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check for reduced motion preference
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion) return;

        const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
            mouseX.set(clientX);
            mouseY.set(clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY, prefersReducedMotion]);

    if (prefersReducedMotion) return null;

    return (
        <>
            {/* Ambient Top Glow - Optimized blur */}
            <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/8 to-transparent pointer-events-none z-0 opacity-40 blur-[60px]" />

            {/* Mouse Follower Spotlight - Reduced size and blur for performance */}
            <motion.div
                className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/4 pointer-events-none z-0 blur-[80px]"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
        </>
    );
};
