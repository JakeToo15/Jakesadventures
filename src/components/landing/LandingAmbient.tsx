"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const particles = Array.from({ length: 22 }).map((_, index) => ({
  id: index,
  opacity: 0.18 + ((index * 13) % 10) / 40,
  x: ((index * 17) % 100),
  y: ((index * 31) % 100),
  duration: 6 + (index % 7),
}));

export function LandingAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hero-light-orb hero-light-a" />
      <div className="hero-light-orb hero-light-b" />
      <div className="hero-light-ray hero-light-ray-a" />
      <div className="hero-light-ray hero-light-ray-b" />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="ambient-dust"
          initial={{
            opacity: particle.opacity,
            x: `${particle.x}%`,
            y: `${particle.y}%`,
          }}
          animate={{
            y: ["0%", "-10%", "0%"],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="goblin-walker"
        initial={{ x: "-18vw" }}
        animate={{ x: "106vw" }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        <Image src="/goblin.svg" alt="walking goblin" width={42} height={42} />
      </motion.div>
    </div>
  );
}
