export { LibraryPanel } from "./ui/LibraryPanel";
export { handlers } from "./symphonies/load.symphony";

// Sequences are mounted via JSON catalogs at startup (see app conductor)
export async function register(_conductor: any) {
  // no-op for now (reserved for future runtime registration)
}
