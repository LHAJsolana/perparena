type ErrorMessageProps = {
  title: string;
  message: string;
};

export function ErrorMessage({ title, message }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-negative/40 bg-negative/10 p-4"
    >
      <h2 className="text-sm font-semibold text-negative">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-foreground">{message}</p>
    </div>
  );
}
