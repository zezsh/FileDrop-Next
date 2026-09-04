import Image from "next/image";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-cols-2">
      <div />
      <div className="relative">
        <Image
          src="/img/home-bg.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
