"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { ReaderProfileModal } from "@/components/onboarding/reader-profile-modal";
import { BookCameraUpload } from "@/components/upload/book-camera-upload";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { LIBRA_NAVIGATE_HOME_EVENT } from "@/lib/navigate-home";
import { useHasReaderProfile } from "@/lib/profile";

const glowOrbs = [
  {
    className:
      "left-1/2 top-[38%] size-72 -translate-x-1/2 bg-primary/20 blur-[100px] sm:size-96",
    duration: 9,
    delay: 0,
  },
  {
    className:
      "right-[-10%] top-[20%] size-56 bg-accent/15 blur-[90px] sm:size-72",
    duration: 11,
    delay: 1.5,
  },
  {
    className:
      "bottom-[12%] left-[-8%] size-48 bg-primary/10 blur-[80px] sm:size-64",
    duration: 10,
    delay: 0.8,
  },
] as const;

export function LandingScreen() {
  const [profileOpen, setProfileOpen] = useState(false);
  const { hydrated, hasProfile, refresh } = useHasReaderProfile();

  function handleProfileOpenChange(open: boolean) {
    setProfileOpen(open);
    if (!open) refresh();
  }

  useEffect(() => {
    function handleNavigateHome() {
      setProfileOpen(false);
    }

    window.addEventListener(LIBRA_NAVIGATE_HOME_EVENT, handleNavigateHome);
    return () => {
      window.removeEventListener(LIBRA_NAVIGATE_HOME_EVENT, handleNavigateHome);
    };
  }, []);

  return (
    <>
      <section className="relative flex min-h-[calc(100dvh-7rem)] items-center justify-center overflow-hidden px-4 py-10 sm:min-h-[calc(100dvh-8rem)] sm:py-14">
      {glowOrbs.map((orb) => (
        <motion.div
          key={orb.className}
          aria-hidden
          className={`pointer-events-none absolute rounded-full ${orb.className}`}
          animate={{
            opacity: [0.35, 0.6, 0.35],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <Container size="narrow" className="relative z-10 w-full">
        <FadeIn delay={0}>
          <div className="surface-glass mx-auto w-full max-w-sm rounded-[1.75rem] p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.55)] sm:max-w-md sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />

            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:size-16"
              >
                <span className="font-display text-2xl text-primary sm:text-3xl">
                  L
                </span>
              </motion.div>

              <FadeIn delay={0.12}>
                <h1 className="font-display text-4xl tracking-tight text-balance sm:text-5xl">
                  <span className="text-gradient">{APP_NAME}</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.22}>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
                  {APP_TAGLINE}
                </p>
              </FadeIn>

              {!hydrated ? (
                <FadeIn delay={0.34} className="mt-8 w-full sm:mt-10">
                  <div
                    className="h-12 w-full animate-pulse rounded-xl bg-white/5 sm:h-14"
                    aria-hidden
                  />
                </FadeIn>
              ) : hasProfile ? (
                <FadeIn delay={0.34} className="mt-8 w-full sm:mt-10">
                  <div className="space-y-3">
                    <BookCameraUpload />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full rounded-xl"
                      onClick={() => setProfileOpen(true)}
                    >
                      Edit Reader Profile
                    </Button>
                  </div>
                </FadeIn>
              ) : (
                <FadeIn delay={0.34} className="mt-8 w-full sm:mt-10">
                  <Button
                    size="lg"
                    className="group h-12 w-full rounded-xl text-[15px] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] sm:h-14"
                    onClick={() => setProfileOpen(true)}
                  >
                    Build Your Reader Profile
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </FadeIn>
              )}
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>

      <ReaderProfileModal
        open={profileOpen}
        onOpenChange={handleProfileOpenChange}
      />
    </>
  );
}
