export default function FAQs() {
    return (
        <section id="faq" className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-y-12 px-2 lg:grid-cols-[1fr_auto]">
                    <div className="text-center lg:text-left">
                        <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
                            Frequently <br className="hidden lg:block" /> Asked <br className="hidden lg:block" />
                            Questions
                        </h2>
                        {/* --- MODIFIED SUB-HEADING --- */}
                        <p className="text-muted-foreground">
                            Got questions? We've got answers. Here's everything you need to know about getting your report.
                        </p>
                    </div>

                    <div className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
                        {/* --- MODIFIED Q&A 1 --- */}
                        <div className="pb-6">
                            <h3 className="font-medium">How do you calculate my ATS score?</h3>
                            <p className="text-muted-foreground mt-4">
                                Our AI reads the job description to find the most important keywords, skills, and requirements. It then scans your resume to see how well you match, giving you a score based on keyword density, relevant experience, and ATS-friendly formatting.
                            </p>
                        </div>

                        {/* --- MODIFIED Q&A 2 --- */}
                        <div className="py-6">
                            <h3 className="font-medium">Is my resume and personal data secure?</h3>
                            <p className="text-muted-foreground mt-4">
                                Absolutely. We take your privacy seriously. Your resume and any data you provide are encrypted, never shared or sold, and are only used to generate your report. All uploaded files are automatically deleted from our servers after 24 hours.
                            </p>
                        </div>

                        {/* --- MODIFIED Q&A 3 --- */}
                        <div className="py-6">
                            <h3 className="font-medium">What if I'm not happy with my Premium Report?</h3>
                            <p className="text-muted-foreground my-4">
                                We offer a 7-day, no-questions-asked money-back guarantee. If you're not satisfied that our report gave you actionable, valuable insights, just send us an email and we'll process a full refund.
                            </p>
                        </div>

                        {/* --- MODIFIED Q&A 4 --- */}
                        <div className="py-6">
                            <h3 className="font-medium">How is this different from a free resume builder?</h3>
                            <p className="text-muted-foreground mt-4">
                                Free builders give you a template. We give you *intelligence*. Our tool doesn't just make your resume *look* good; it analyzes it against a *specific job* to ensure it gets past the automated filters and onto a recruiter's desk.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}