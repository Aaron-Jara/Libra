import { BookMarked, Brain, Zap } from "lucide-react";

import { Container } from "@/components/layout/container";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/stagger-container";
import { FadeIn } from "@/components/motion/fade-in";

const features = [
  {
    icon: Brain,
    title: "Taste-aware AI",
    description:
      "Understands your reading preferences beyond genre labels — tone, pacing, and narrative style.",
  },
  {
    icon: Zap,
    title: "Instant verdicts",
    description:
      "Get a clear match score and concise critique in seconds, not hours of research.",
  },
  {
    icon: BookMarked,
    title: "Curated discovery",
    description:
      "Surface hidden gems aligned with your literary palate, not generic bestseller lists.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <Container>
        <FadeIn className="mb-10 text-center sm:mb-14">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            Intelligence, refined
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Every feature designed for readers who demand clarity and taste.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <article className="surface-glass group h-full rounded-2xl p-6 transition-colors hover:border-white/[0.1] sm:p-7">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-base font-medium tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </section>
  );
}
