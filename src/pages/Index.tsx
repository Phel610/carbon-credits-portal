import Navigation from "@/components/sections/Navigation";
import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import Solution from "@/components/sections/Solution";
import CoreModules from "@/components/sections/CoreModules";
import TargetUsers from "@/components/sections/TargetUsers";
import Benefits from "@/components/sections/Benefits";
import CTA from "@/components/sections/CTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <CoreModules />
        <TargetUsers />
        <Benefits />
        <CTA />
      </main>
    </div>
  );
};

export default Index;
