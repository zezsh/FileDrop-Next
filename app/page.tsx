import Image from 'next/image';
import { HomePanel } from '@/components/home-panel';

export default function Home() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <HomePanel />
      </div>
      <div className="relative hidden min-h-0 w-1/2 shrink-0 lg:block">
        <Image
          src="/img/home-bg-2.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover dark:brightness-[0.2]"
          priority
        />
      </div>
    </div>
  );
}
