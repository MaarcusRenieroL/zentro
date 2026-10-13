export const AuthFooter = () => {
  return (
    <footer className="flex min-h-16 items-center justify-center px-4 py-6 text-center sm:px-6">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Zentro. All rights reserved.
      </p>
    </footer>
  );
};
