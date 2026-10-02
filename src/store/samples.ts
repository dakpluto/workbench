import { db } from "./db";
import { connect, createArtifact } from "./artifacts";
import type { ArtifactStatus, LinkKind } from "../model/artifact";

const DAY = 86_400_000;

interface Sample {
  key: string;
  title: string;
  type: string;
  status: ArtifactStatus;
  summary: string;
  body?: string;
  tags: string[];
  /** Days ago it was created / last touched. */
  born: number;
  touched: number;
}

const SAMPLES: Sample[] = [
  {
    key: "cities",
    title: "Some idea about procedural cities",
    type: "idea",
    status: "seed",
    summary: "Streets that grow like river deltas instead of grids.",
    body: "What if road networks were grown with a flow simulation — water finding the path of least resistance — and buildings settled along the banks?\n\nCould start with L-systems, but I suspect erosion models are more interesting.",
    tags: ["procedural", "generative", "cities"],
    born: 212,
    touched: 143,
  },
  {
    key: "automata",
    title: "Cellular automata playground",
    type: "experiment",
    status: "exploring",
    summary: "A sandbox for 1D and 2D rule sets with a scrubbable timeline.",
    body: "Start with elementary rules (Wolfram 0–255). Then Life-like rules in B/S notation.\n\nWant: pause, step, rewind, and save interesting seeds.",
    tags: ["simulation", "automata", "generative"],
    born: 30,
    touched: 1,
  },
  {
    key: "rule110",
    title: "Why is Rule 110 Turing complete?",
    type: "curiosity",
    status: "seed",
    summary: "Read Cook's proof someday. Gliders as signals?",
    tags: ["automata", "computation"],
    born: 41,
    touched: 41,
  },
  {
    key: "sky",
    title: "Night sky from my backyard",
    type: "project",
    status: "simmering",
    summary: "Plot what's overhead tonight from latitude, longitude and time.",
    body: "Need a star catalog (HYG database?) and the sidereal time math. Got as far as converting RA/Dec to alt/az.",
    tags: ["astronomy", "visualization"],
    born: 96,
    touched: 58,
  },
  {
    key: "palette",
    title: "Palette extractor",
    type: "tool",
    status: "done",
    summary: "Drop an image, get five colors via k-means in Lab space.",
    tags: ["color", "tools"],
    born: 70,
    touched: 22,
  },
  {
    key: "boids",
    title: "Boids with fear",
    type: "experiment",
    status: "abandoned",
    summary: "Flocking agents that scatter from a predator. Got muddy.",
    body: "Separation/alignment/cohesion worked. Adding a predator made everything jitter. Probably needed a smoothing term on steering.",
    tags: ["simulation", "agents"],
    born: 180,
    touched: 160,
  },
  {
    key: "notebook",
    title: "Nature of Code, chapter 7",
    type: "reference",
    status: "done",
    summary: "Shiffman on cellular automata. Good on wolfram classes.",
    tags: ["automata", "reading"],
    born: 33,
    touched: 29,
  },
  {
    key: "sounds",
    title: "What would a city sound like if it were an instrument?",
    type: "thing",
    status: "seed",
    summary: "",
    tags: ["sound", "cities"],
    born: 5,
    touched: 5,
  },
];

const SAMPLE_LINKS: [string, LinkKind, string][] = [
  ["automata", "inspired", "notebook"],
  ["rule110", "derived", "automata"],
  ["boids", "related", "automata"],
  ["sounds", "inspired", "cities"],
];

export async function addSamples(): Promise<void> {
  const ids = new Map<string, string>();
  const now = Date.now();
  // Oldest first so catalog numbers follow creation order.
  for (const s of [...SAMPLES].sort((a, b) => b.born - a.born)) {
    const a = await createArtifact({
      title: s.title,
      type: s.type,
      status: s.status,
      summary: s.summary,
      body: s.body ?? "",
      tags: s.tags,
      createdAt: now - s.born * DAY,
      updatedAt: now - s.touched * DAY,
      viewedAt: now - s.touched * DAY,
      metadata: { sample: true },
    });
    ids.set(s.key, a.id);
  }
  for (const [from, kind, to] of SAMPLE_LINKS) {
    await connect(ids.get(from)!, ids.get(to)!, kind);
  }
}

export async function hasAnything(): Promise<boolean> {
  return (await db.artifacts.count()) > 0;
}
