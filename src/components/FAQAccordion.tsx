'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItemProps {
    question: string
    answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border-b border-gray-100/80 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left focus:outline-none"
            >
                <span className="text-lg font-semibold text-gray-900">{question}</span>
                <ChevronDown className={`w-5 h-5 transition-all duration-300 ${isOpen ? 'rotate-180 text-[#0B3D2E]' : 'text-gray-400'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                <p className="text-gray-600 leading-relaxed">{answer}</p>
            </div>
        </div>
    )
}

export default function FAQAccordion() {
    const faqs = [
        {
            question: "What is Impactis?",
            answer: "Impactis is a premium fintech platform designed to connect startups with investors and consultants, streamlining deal flow and verification."
        },
        {
            question: "How do I get started?",
            answer: "Simply click 'Get Started' and choose your role. Complete the onboarding wizard and you'll be ready to explore our ecosystem."
        },
        {
            question: "Is there a free trial?",
            answer: "Yes, we offer a free tier for all users to explore the platform basics. Premium features require a Pro subscription."
        },
        {
            question: "How secure is my data?",
            answer: "We use enterprise-grade encryption and secure authentication via Supabase to ensure your sensitive financial data remains protected."
        }
    ]

    return (
        <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.06)] p-10 md:p-12">
            {faqs.map((faq, index) => (
                <FAQItem key={index} {...faq} />
            ))}
        </div>
    )
}
