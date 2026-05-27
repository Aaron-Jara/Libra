"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { APP_NAME } from "@/lib/constants";
import { dispatchNavigateHome } from "@/lib/navigate-home";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();

  function goHome(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    dispatchNavigateHome();
    if (pathname !== "/") {
      router.push("/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-background/80 backdrop-blur-xl">
      <Container>
        <FadeIn className="flex h-14 items-center justify-between sm:h-16">
          <Link
            href="/"
            onClick={goHome}
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-medium text-primary">
              L
            </span>
            <span className="font-display text-lg tracking-tight text-foreground">
              {APP_NAME}
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink href="/" onClick={goHome}>
              Home
            </NavLink>
          </nav>
        </FadeIn>
      </Container>
    </header>
  );
}

function NavLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
