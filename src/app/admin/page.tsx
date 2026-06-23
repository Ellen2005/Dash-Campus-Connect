import Link from "next/link";

export default function AdminEntryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">
        <h1 className="text-2xl font-headline font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Use the Admin Portal to manage school settings and approve student registrations.
        </p>

        <div className="dash-card p-5 space-y-3">
          <Link href="/admin-portal/login" className="dash-button-primary h-11 w-full inline-flex items-center justify-center">
            Go to Admin Portal Login
          </Link>
          <Link href="/admin-portal/register" className="h-11 w-full inline-flex items-center justify-center rounded-xl border border-border bg-muted/30 hover:bg-muted/40 transition-colors text-sm font-semibold">
            Register a School (Admin Setup)
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground">
          If you are a student, use <Link className="text-primary font-bold hover:underline" href="/login">/login</Link>.
        </p>
      </div>
    </div>
  );
}

