import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/events');
  return null;
}
