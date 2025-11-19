import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

export default function Pricing() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Find the Plan That Gets You Hired</h1>
                    <p className="text-muted-foreground">Start for free to find the problems. Upgrade to get the exact solution. No subscriptions, no hidden fees.</p>
                </div>

                {/* Updated to a 2-column, centered grid */}
                <div className="mt-8 grid gap-6 [--color-card:var(--color-muted)] *:border-none *:shadow-none md:mt-20 md:grid-cols-2 max-w-4xl mx-auto dark:[--color-muted:var(--color-zinc-900)]">
                    
                    {/* --- FREE PLAN --- */}
                    <Card className="bg-muted flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">Free Scan</CardTitle>
                            <span className="my-3 block text-2xl font-semibold">$0</span>
                            <CardDescription className="text-sm">(Forever Free)</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {[
                                    'Instant ATS Match Score',
                                    'Keyword Gap Count',
                                    'Formatting & Readability Check',
                                    'Number of "Weak" Phrases Found'
                                ].map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto">
                            <Button
                                asChild
                                variant="outline"
                                className="w-full">
                                <a href="">Start Free Scan</a>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* --- PREMIUM PLAN --- */}
                    <Card className="bg-muted relative">
                        <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">Popular</span>

                        <div className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-medium">Premium Report</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">$14.99</span>
                                <CardDescription className="text-sm">One-time payment</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <hr className="border-dashed" />
                                <ul className="list-outside space-y-3 text-sm">
                                    {[
                                        'Everything in Free Scan, plus:',
                                        'View All Missing Keywords',
                                        'AI "Magic Edit" Rewrites',
                                        'Side-by-Side Resume/Job Comparison',
                                        'Unlimited Re-scans for 24 Hours',
                                        'Export to PDF & DOCX'
                                    ].map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    asChild
                                    className="w-full">
                                    <a href="">Get Premium Report</a>
                                </Button>
                            </CardFooter>
                        </div>
                    </Card>

                    {/* Third column removed */}
                </div>
            </div>
        </section>
    )
}