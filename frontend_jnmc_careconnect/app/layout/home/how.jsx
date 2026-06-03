"use client";

import React from "react";
import { Microscope, FlaskConical, Download, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    phase: "Phase 01",
    title: "Sample Collection",
    description:
      "Visit JNMC labs or any authorized collection point. Receive your unique UHID on your registration receipt.",
    icon: <Microscope className="h-6 w-6" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    phase: "Phase 02",
    title: "Expert Analysis",
    description:
      "Our pathologists utilize advanced diagnostic equipment to process and verify your results with precision.",
    icon: <FlaskConical className="h-6 w-6" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    phase: "Phase 03",
    title: "Instant Retrieval",
    description:
      "Enter your credentials in the portal above to view and download your digital PDF report immediately.",
    icon: <Download className="h-6 w-6" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    isPrimary: true,
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#05080c] py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Seamless Experience
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            How It Works
          </h2>
        </motion.div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Central Vertical Line (Desktop) / Left Line (Mobile) */}
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute left-6 top-0 bottom-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2"
          />

          <div className="space-y-20">
            {steps.map((step, index) => {
              const isEven = index % 2 === 1;
              return (
                <motion.div
                  key={step.phase}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: index * 0.2 }}
                  className={`relative flex flex-col md:flex-row ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content Side */}
                  <div
                    className={`md:w-1/2 ${isEven ? "md:pl-16" : "md:pr-16 md:text-right"}`}
                  >
                    <div className="relative flex flex-col">
                      {/* Mobile Badge */}
                      <div className="mb-4 flex items-center gap-4 md:hidden">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-none border border-white/10 ${step.bgColor} ${step.color}`}
                        >
                          {step.icon}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {step.phase}
                        </span>
                      </div>

                      <h3 className="text-2xl font-semibold tracking-tight text-white">
                        {step.title}
                      </h3>
                      <p className="mt-4 text-lg font-light leading-relaxed text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Icon/Center Point */}
                  <div className="absolute left-6 top-0 hidden -translate-x-1/2 items-center justify-center md:flex md:left-1/2">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                        delay: 0.2 + index * 0.2,
                      }}
                      className={`z-10 flex h-14 w-14 items-center justify-center rounded-none border-4 border-[#05080c] shadow-2xl transition-transform hover:scale-110
                        ${
                          step.isPrimary
                            ? "bg-blue-500 text-white shadow-blue-500/30"
                            : "bg-[#05080c] border-white/10 text-blue-400"
                        }`}
                    >
                      {step.icon}
                    </motion.div>
                  </div>

                  {/* Desktop Badge Side */}
                  <div
                    className={`hidden md:block md:w-1/2 ${isEven ? "md:pr-16 md:text-right" : "md:pl-16"}`}
                  >
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-slate-500 mt-4">
                      {step.phase}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA for the section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-24 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-none border border-white/5 bg-white/5 px-6 py-3 text-sm text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Reliable results within 24-48 hours
          </div>
        </motion.div>
      </div>
    </section>
  );
}
