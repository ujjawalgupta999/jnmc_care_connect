"use client";

import React from "react";
import { MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16 px-6 md:px-12 border-t border-white/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">JNMC Hospital</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Delivering world-class diagnostic excellence at Jawaharlal Nehru
              Medical College, Aligarh Muslim University. Leading the way in
              medical innovation.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <nav className="flex flex-col space-y-3">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                About Institute
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Our Specialists
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Clinical Trials
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Health Packages
              </a>
            </nav>
          </div>

          {/* Support/Legal Column */}
          <div className="space-y-4">
            <nav className="flex flex-col space-y-3">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Feedback Portal
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Terms of Use
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Contact Support
              </a>
            </nav>
          </div>

          {/* Contact Column */}
          <div className="space-y-4 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-500 shrink-0" />
              <p>
                JawharLal Nehru
                <br />
                AMU Campus, Aligarh,
                <br />
                UP 202002
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Phone className="h-5 w-5 text-gray-400 shrink-0" />
              <a
                href="tel:+915712700920"
                className="hover:text-white transition-colors"
              >
                +91 571 2700 920
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5">
          <p className="text-xs text-gray-500">
            © 2026 JNMC, Aligarh Muslim University.
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
