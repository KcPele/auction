import assert from "node:assert/strict";
import test from "node:test";

async function loadCapabilities() {
  try {
    // @ts-expect-error Node's strip-types test runner requires the explicit .ts extension.
    return await import("./listing-capabilities.ts");
  } catch (error) {
    assert.fail(
      `listing-capabilities module must exist: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

test("derives direct car access without application history", async () => {
  const { deriveListingCapabilities } = await loadCapabilities();

  assert.deepEqual(
    deriveListingCapabilities([{ category: "CAR" }]),
    {
      hasCar: true,
      hasGadget: false,
      hasAny: true,
      hasAll: false,
      grantedCategories: ["CAR"],
      missingCategories: ["GADGET"],
    },
  );
});

test("dual access has no missing category", async () => {
  const { deriveListingCapabilities } = await loadCapabilities();

  const result = deriveListingCapabilities([
    { category: "GADGET" },
    { category: "CAR" },
  ]);

  assert.equal(result.hasAll, true);
  assert.deepEqual(result.grantedCategories, ["CAR", "GADGET"]);
  assert.deepEqual(result.missingCategories, []);
});
