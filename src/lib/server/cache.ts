import { broadcastBootstrapBump } from "./realtime";

export async function invalidateBootstrapCache() {
  void broadcastBootstrapBump();
}
