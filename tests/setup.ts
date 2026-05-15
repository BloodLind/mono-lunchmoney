import { afterEach } from "vitest";

afterEach(() => {
  delete process.env.MONO_TOKEN;
  delete process.env.LUNCHMONEY_TOKEN;
});
