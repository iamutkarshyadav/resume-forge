import { Logo } from '@/components/logo'
import Link from 'next/link'

// 1. Updated links array for your SaaS
const links = [
    {
        title: 'Features',
        href: '#features', // Link to your features section
    },
    {
        title: 'Pricing',
        href: '#pricing', // Link to your pricing section
    },
    {
        title: 'Testimonials',
        href: '#testimonials', // Link to your solution/testimonials
    },
    {
        title: 'FAQ',
        href: '#faq', // Link to your about/FAQ section
    },
    {
        title: 'Terms of Service',
        href: '/terms', // Page for your legal terms
    },
    {
        title: 'Privacy Policy',
        href: '/privacy', // Page for your privacy policy
    },
]

export default function FooterSection() {
    return (
        <footer className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
                    <Logo />
                </Link>

                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            className="text-muted-foreground hover:text-primary block duration-150">
                            <span>{link.title}</span>
                        </Link>
                    ))}
                </div>

                {/* 2. Simplified social links (Kept X and LinkedIn) */}
                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    <Link
                        href="#" // <-- Add your X/Twitter link here
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X/Twitter"
                        className="text-muted-foreground hover:text-primary block">
                        <svg
                            className="size-6"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"></path>
                        </svg>
                    </Link>
                    <Link
                        href="#" // <-- Add your LinkedIn link here
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        className="text-muted-foreground hover:text-primary block">
                        <svg
                            className="size-6"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"></path>
                        </svg>
                    </Link>
                    {/* Removed Facebook, Threads, Instagram, and TikTok */}
                </div>
                
                {/* 3. Updated copyright */}
                <span className="text-muted-foreground block text-center text-sm"> © {new Date().getFullYear()} Resunate, All rights reserved</span>
                {/* ^ Replace "Resunate" with your actual site name */}
            </div>
        </footer>
    )
}