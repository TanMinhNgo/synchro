import { RegisterForm } from '@/features/auth';

export const metadata = {
  title: 'Register - Synchro',
  description: 'Create a new Synchro account',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
