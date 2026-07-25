import {
  generateSimulation,
  summarizeSimulation,
} from "@/features/simulation/generator";

const summary = summarizeSimulation(generateSimulation());

console.log(JSON.stringify(summary, null, 2));
