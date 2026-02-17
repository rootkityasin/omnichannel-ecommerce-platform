'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';


export default function ScrollyCrab() {
    const { scrollYProgress } = useScroll();

    // Smooth out the scroll progress
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // --- Animation Path ---
    // The crab starts at top-left, moves to center-right, then bottom-center

    // --- "Astronaut" Style Flight Path ---
    // The crab "flies" through the content like being in zero-g (or deep ocean)

    // --- "Astronaut" Weaving Flight Path ---
    // The crab weaves through the Zig-Zag content (Left -> Right -> Left -> Right)

    // X Position: Weaving Opposite to content
    // 0.2 (Hero Left) -> Crab Right (70%)
    // 0.4 (Stats Right) -> Crab Left (20%)
    // 0.7 (Gallery Left) -> Crab Right (80%)
    // 0.9 (Team Right) -> Crab Left (30%)
    const x = useTransform(smoothProgress,
        [0, 0.25, 0.5, 0.75, 1],
        ['70%', '70%', '20%', '80%', '30%']
    );

    // Y Position: Moves continuously down
    const y = useTransform(smoothProgress, [0, 1], ['15vh', '75vh']);

    // Rotation: Banking into the turns
    // Right -> Left turn needs negative rotation, Left -> Right needs positive
    const rotate = useTransform(smoothProgress,
        [0, 0.25, 0.5, 0.75, 1],
        [-10, 20, -20, 20, -10]
    );

    // Scale: Dynamic Depth
    const scale = useTransform(smoothProgress,
        [0, 0.25, 0.5, 0.75, 1],
        [0.8, 1.2, 0.8, 1.3, 1] // Pulses larger in open spaces
    );

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <motion.div
                style={{
                    left: 0, // Reset default left to use 'x' strictly for positioning relative to viewport width
                    x, // Using x transform for horizontal movement
                    top: y,
                    rotate,
                    scale
                }}
                className="absolute w-40 h-40 md:w-64 md:h-64 -ml-20 md:-ml-32" // Negative margin to center the origin
            >
                {/* Inner container for continuous "buoyancy" float animation independent of scroll */}
                <motion.div
                    animate={{
                        y: [0, -15, 0],
                        rotate: [0, 5, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <Image
                        src="/mascot-avatar.png"
                        alt="Floating Crab"
                        width={200}
                        height={200}
                        className="object-contain drop-shadow-2xl"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}
