import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">ReimburseAI</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage expenses</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
