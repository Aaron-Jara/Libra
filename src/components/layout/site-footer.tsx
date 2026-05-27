import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.04] py-8 sm:py-10">
      <Container>
        <FadeIn className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-sm text-muted-foreground">
            {APP_NAME}
          </p>
          <p className="text-xs text-muted-foreground/70">{APP_TAGLINE}</p>
        </FadeIn>
      </Container>
    </footer>
  );
}
