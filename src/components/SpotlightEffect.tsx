"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

export const SpotlightEffect = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
            mouseX.set(clientX);
            mouseY.set(clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <>
            {/* Ambient Top Glow */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0 opacity-50 blur-[100px]" />

            {/* Mouse Follower Spotlight (Subtle) */}
            <motion.div
                className="fixed top-0 left-0 w-[800px] h-[800px] rounded-full bg-primary/5 pointer-events-none z-0 blur-[120px]"
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
