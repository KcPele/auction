import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const listingSurfaces = [
  "app/components/user-dashboard/screens/BrowseScreen.tsx",
  "app/components/user-dashboard/screens/HomeScreen.tsx",
  "app/components/user-dashboard/screens/MyBidsScreen.tsx",
  "app/components/user-dashboard/screens/WatchlistScreen.tsx",
  "app/components/user-dashboard/screens/ListingDetailScreen.tsx",
  "app/components/auctions/widgets/DetailHero.tsx",
];

test("user listing surfaces do not download raw full-size images", async () => {
  for (const file of listingSurfaces) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /<img\b/, `${file} still renders a raw image`);
  }
});

test("Next Image allows only the owned listing media hosts", async () => {
  const config = await readFile("next.config.ts", "utf8");
  assert.match(config, /api-minio-s3-storage\.kcpele\.com/);
  assert.match(config, /openinary\.kcpele\.com/);
});
