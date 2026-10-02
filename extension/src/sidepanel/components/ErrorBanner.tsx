export function ErrorBanner({ message }: { message?: string }): JSX.Element | null {
  if (!message) return null;
  return <details className="error-banner" role="alert"><summary><span aria-hidden="true">!</span> Backend issue</summary><p>{message}</p></details>;
}
