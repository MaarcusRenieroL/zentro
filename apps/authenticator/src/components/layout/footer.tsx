export const Footer = () => {
  return (
    <footer className="flex h-16 items-center justify-center px-6 py-10">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Zentro. All rights reserved.
      </p>
    </footer>
  );
};
