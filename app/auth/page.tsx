import { AuthForm } from '@/components/auth/AuthForm'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full flex justify-center">
        <AuthForm />
      </div>
    </div>
  )
}
