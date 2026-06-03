"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Truck } from "lucide-react";
import PatientAccessPortal from "../layout/aadhar-enter";
import FeaturesSection from "../layout/home/why";
import HowItWorks from "../layout/home/how";
import Footer from "../layout/footer";
import { motion } from "framer-motion";

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2, // Wait for image to load/settle slightly
      },
    },
  };

  return (
    <main className="font-sans">
      {/* Hero Section */}
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/jnmc.png"
            alt="JNMC Medical College"
            fill
            priority
            className="object-cover"
          />
          {/* Flat dark overlay to match the image precisely */}
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <motion.div
            className="max-w-4xl space-y-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Main Heading */}
            <motion.h1
              className="text-5xl font-bold tracking-tight text-white md:text-7xl"
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              Download Your <br />
              <span className="text-[#B5E4A3]">Test Reports Online</span>
            </motion.h1>

            {/* Description Block */}
            <motion.div
              className="space-y-1"
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <p className="text-lg font-medium text-gray-100 md:text-xl">
                Access your medical diagnostics securely and conveniently from
                anywhere.
              </p>
              <p className="text-base text-gray-200 md:text-lg">
                JNMC brings you a seamless digital experience for all your
                medical report needs.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Primary Button: Pale Green/Mint */}
              <Link href="/tests" className="w-full sm:w-auto">
                <Button className="h-12 w-full rounded-full bg-[#D4F1C5] px-8 text-sm font-medium text-black hover:bg-[#c4e1b5] sm:w-auto">
                  <Eye className="mr-2 h-4 w-4" />
                  Explore Services
                </Button>
              </Link>

              {/* Secondary Button: Outlined / Semi-transparent */}
              <Link href="/emergency" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-full border-white/40 bg-white/10 px-8 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Contact Emergency
                </Button>
              </Link>
            </motion.div>

            {/* Patient Report Access Portal Form */}
            <motion.div
              className="mt-16 px-4"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <PatientAccessPortal />
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Vignette effect for depth as seen in image */}
        <div className="pointer-events-none absolute bottom-0 h-32 w-full bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Added Sections */}
      <FeaturesSection />
      <HowItWorks />
      <Footer />
    </main>
  );
}
