"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-[#293241] px-6 py-4 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white">
            Investmate
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/startup/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Startup Login
            </Link>
            <Link
              href="/investor/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Investor Login
            </Link>
            <Link
              href="/startup/register"
              className="px-5 py-2 bg-[#9e2a2b] text-white rounded hover:bg-[#7d2122] transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white text-2xl p-2"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-600 flex flex-col gap-3">
            <Link
              href="/startup/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Startup Login
            </Link>
            <Link
              href="/investor/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Investor Login
            </Link>
            <Link
              href="/startup/register"
              className="mx-4 mb-2 px-5 py-2 bg-[#9e2a2b] text-white rounded text-center hover:bg-[#7d2122] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header
        className="h-screen flex flex-col items-center justify-center text-center relative bg-cover bg-center text-white px-4"
        style={{
          backgroundImage:
            "url('https://media.istockphoto.com/id/1503371245/photo/percentage-sign-on-top-of-coin-stacks-before-blue-financial-graph.jpg?b=1&s=612x612&w=0&k=20&c=7A_2QwhEcxkciMxlpLL22UXAUbEIUE2nrdVTrWgsrbM=')",
        }}
      >
        <div className="absolute inset-0 bg-[#293241]/60"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">InvestMate</h1>
          <p className="text-lg md:text-xl mb-8 drop-shadow-md max-w-xl mx-auto">
            Connecting Startups with Investors
          </p>
          <Link
            href="/startup/register"
            className="px-8 py-3 bg-[#9e2a2b] text-white rounded text-lg hover:bg-[#7d2122] transition-colors"
          >
            Apply for Funding
          </Link>
        </div>
      </header>

      {/* Scrolling Text */}
      <div className="bg-[#335c67] py-4 overflow-hidden">
        <div className="animate-scroll whitespace-nowrap text-white text-lg">
          🚀 Transforming Ideas into Reality | 🤝 Join Hands with Visionary
          Investors | 🌐 India&apos;s Fastest Growing Startup Network | 💡
          Innovation Starts Here | 💰 Funding Opportunities | 📈 Scale Your
          Business | 🎯 Pitch. Connect. Grow. | 📞 Get in Touch Today!
        </div>
      </div>

      {/* For Startups Section */}
      <section
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://media.istockphoto.com/id/1200038382/photo/start-up-business-of-creative-people-concept.jpg?b=1&s=612x612&w=0&k=20&c=wT2Kwr3EZRVT4fvpP7LQvqMaFyWk8nvtca125CWBU3Y=')",
        }}
      >
        <div className="text-center text-white drop-shadow-lg p-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">For Startups</h2>
          <p className="text-lg md:text-xl mb-6 max-w-2xl">
            Looking for funding? Pitch your startup to our network of active
            investors and mentors.
          </p>
          <Link
            href="/startup/register"
            className="px-8 py-3 bg-[#9e2a2b] text-white rounded text-lg hover:bg-[#7d2122] transition-colors"
          >
            Apply Now
          </Link>
        </div>
      </section>

      {/* For Investors Section */}
      <section
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://media.istockphoto.com/id/1311598658/photo/businessman-trading-online-stock-market-on-teblet-screen-digital-investment-concept.jpg?b=1&s=612x612&w=0&k=20&c=bpQMsH07ziELXla0SZJt84-w0JkxsVXs05c7T2Iygks=')",
        }}
      >
        <div className="text-center text-white drop-shadow-lg p-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">For Investors</h2>
          <p className="text-lg md:text-xl mb-6 max-w-2xl">
            Discover high-growth opportunities and innovative solutions from
            emerging founders. Access complete pitch decks, due diligence data,
            and more — all in one place.
          </p>
          <Link
            href="/investor/register"
            className="px-8 py-3 bg-[#9e2a2b] text-white rounded text-lg hover:bg-[#7d2122] transition-colors"
          >
            Join as Investor
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-6 md:px-8 bg-[#f7f7f7] text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#293241]">About Us</h2>
        <p className="text-lg max-w-4xl mx-auto text-gray-700">
          At <strong>Startup Connect</strong>, we bridge the gap between
          emerging startups and strategic investors. Our platform enables
          early-stage ventures to showcase their innovation, connect with
          potential backers, and accelerate their growth journey. For investors,
          we offer a curated pipeline of high-potential startups across diverse
          sectors.
        </p>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-6 md:px-8 bg-[#335c67]/10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#293241]">Why Choose Us</h2>
        <ul className="max-w-3xl mx-auto text-left space-y-4 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-[#9e2a2b] font-bold">•</span>
            <span>
              <strong>Curated Startups:</strong> Only high-quality,
              investor-ready businesses
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#9e2a2b] font-bold">•</span>
            <span>
              <strong>Verified Founders:</strong> Background-checked and
              pitch-ready
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#9e2a2b] font-bold">•</span>
            <span>
              <strong>Insightful Analytics:</strong> Real-time performance and
              growth indicators
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#9e2a2b] font-bold">•</span>
            <span>
              <strong>Global Investor Network:</strong> Connect beyond borders
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#9e2a2b] font-bold">•</span>
            <span>
              <strong>Personalized Support:</strong> From pitch decks to funding
              rounds
            </span>
          </li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 bg-[#293241] text-gray-300">
        &copy; 2026 Investmate. All rights reserved.
      </footer>
    </div>
  );
}
