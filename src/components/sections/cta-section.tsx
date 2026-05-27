import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section id="about" className="py-16 sm:py-24">
      <Container size="narrow">
        <FadeIn>
          <div className="surface-glass relative overflow-hidden rounded-2xl px-6 py-10 text-center sm:px-10 sm:py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
            />
            <div className="relative">
              <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
                Your next great read awaits
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
                Stop guessing. Start reading with confidence.
              </p>
              <Button size="lg" className="mt-8">
                Join the waitlist
              </Button>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
