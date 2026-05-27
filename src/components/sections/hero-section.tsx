"use client";

import { ArrowRight, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <Container size="narrow" className="text-center">
        <FadeIn delay={0}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>AI-powered literary intelligence</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <span className="text-gradient">Know before you read.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            {APP_NAME} is your personal literary critic — instantly matching
            books to your taste with cinematic precision.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto">
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              See how it works
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.45}>
          <p className="mt-8 text-xs tracking-wide text-muted-foreground/60 uppercase">
            {APP_TAGLINE}
          </p>
        </FadeIn>
      </Container>

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px] animate-glow-pulse sm:size-[700px]"
      />
    </section>
  );
}
