import { redirect } from 'next/navigation';

export const metadata = { title: 'Register - Perinba Vilas' };

export default function RegisterPage() {
  redirect('/login');
}
