"use client";

import React from "react";
import { Gauge } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturesSection() {
  const features = [
    {
      title: "Instant Access",
      description:
        "No more waiting in lines. Your reports are uploaded instantly upon verification by ur pathologists.",
      icon: Gauge,
    },
    {
      title: "Secure Storage",
      description:
        "Your medical data is encrypted and stored securely. Only you and authorized personnel can access it.",
      icon: Gauge,
    },
    {
      title: "Easy Sharing",
      description:
        "Share your reports directly with other doctors or specialists securely from the portal.",
      icon: Gauge,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="bg-black py-20 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center text-4xl font-bold tracking-tight text-white md:text-5xl"
        >
          Why Use This Portal?
        </motion.h2>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-start rounded-none bg-white p-8 transition-transform hover:scale-[1.02]"
            >
              {/* Icon Container */}
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-none border border-gray-200 text-gray-900">
                <feature.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>

              {/* Text Content */}
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
