import { Cpu, Lock, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'

export default function CoreFeature2() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-semibold">Your All-in-One Resume Dashboard</h2>
                    <p className="max-w-sm sm:ml-auto">We don't just give you a score; we give you the tools to fix it. See keyword gaps, get AI-powered rewrites, and track your optimization—all in one place.</p>
                </div>
                <div className="px-3 pt-3 md:-mx-8">
                    <div className="aspect-88/36 mask-b-from-75% mask-b-to-95% relative">
                        <Image
                            src="/mail-upper.png"
                            className="absolute inset-0 z-10"
                            alt="payments illustration dark"
                            width={2797}
                            height={1137}
                        />
                        <Image
                            src="/mail2.png"
                            className="hidden dark:block"
                            alt="payments illustration dark"
                            width={2797}
                            height={1137}
                        />
                        <Image
                            src="/mail2.png"
                            className="dark:hidden"
                            alt="payments illustration light"
                            width={2797}
                            height={1137}
                        />
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4" />
                            <h3 className="text-sm font-medium">Instant Match Score</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Get an immediate, data-driven score on how well your resume matches any job description.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="size-4" />
                            <h3 className="text-sm font-medium">Side-by-Side Analysis</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Visually compare your resume against the job, with all missing keywords clearly highlighted.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Lock className="size-4" />
                            <h3 className="text-sm font-medium">ATS-Friendly Templates</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Ensure your formatting is clean, professional, and easily readable by all recruiting software.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4" />

                            <h3 className="text-sm font-medium">AI "Magic Edits"</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Instantly rewrite weak bullet points into high-impact statements that impress recruiters.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
