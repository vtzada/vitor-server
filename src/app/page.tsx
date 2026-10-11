import { BootIntro } from "@/components/boot/BootIntro";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";

export default function Home() {
  return (
    <>
      <BootIntro />
      <main>
        <Hero />
        <Services />
        <About />
        <Contact />
      </main>
    </>
  );
}
