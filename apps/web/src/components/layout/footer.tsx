import Link from "next/link";
import { FC } from "react";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Solution", href: "#solution" },
    { label: "Benefits", href: "#benefits" },
    { label: "Dashboard", href: "#dashboard-preview" },
  ],
  company: [
    { label: "About", href: "#solution" },
    { label: "Use cases", href: "#features" },
    { label: "Contact", href: "mailto:hello@zentro.com" },
  ],
  resources: [
    { label: "Docs", href: "#features" },
    { label: "Tasks", href: "#features" },
    { label: "Projects", href: "#dashboard-preview" },
    { label: "Security", href: "mailto:security@zentro.com" },
  ],
  legal: [
    { label: "Privacy", href: "mailto:privacy@zentro.com" },
    { label: "Terms", href: "mailto:legal@zentro.com" },
    { label: "Security", href: "mailto:security@zentro.com" },
  ],
};

export const Footer: FC = () => {
  return (
    <footer className="border-t border-border/40 bg-card/30 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-accent to-accent/60">
                <span className="text-sm font-bold text-accent-foreground">
                  Z
                </span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                zentro
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The operating system for modern companies. One platform to run
              your entire business.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground">Product</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground">Company</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground">Resources</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground">Legal</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Zentro. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link
              href="mailto:hello@zentro.com"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
            <Link
              href="mailto:security@zentro.com"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Security
            </Link>
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
