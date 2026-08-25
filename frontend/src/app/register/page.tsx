import { RegisterForm } from '@/components/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Adinas General Hospital',
  description: 'Create your account at Adinas General Hospital',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 dark:from-primary/10 dark:via-background dark:to-secondary/5 py-12">
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <RegisterForm />
      </div>
    </div>
  );
}