
/**
 * WHAT: This is the 'Main Entry Point' of the website.
 * WHY: Every website starts here. It defines the overall layout (Background + App).
 * HOW: It wraps our 'ConverterApp' inside the 'WavyBackground' component.
 */
import ConverterApp from "./ConverterApp";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function App() {
  return (
    // The WavyBackground creates the animated blue/purple lines in the background
    <WavyBackground className="w-full mx-auto">
      {/* The ConverterApp is our actual currency converter tool */}
      <ConverterApp />
    </WavyBackground>
  );
}
