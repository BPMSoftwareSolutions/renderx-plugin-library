import { describe, it, expect, vi, beforeEach } from "vitest";
import { register } from "../src/index";

describe("register function", () => {
  let mockConductor: any;

  beforeEach(() => {
    mockConductor = {
      mount: vi.fn(),
      _runtimeMountedSeqIds: new Set(),
    };
  });

  it("should call conductor.mount with correct sequence definition and handlers", async () => {
    await register(mockConductor);

    expect(mockConductor.mount).toHaveBeenCalledTimes(1);

    const [sequence, handlers, pluginId] = mockConductor.mount.mock.calls[0];

    // Verify the sequence structure
    expect(sequence).toMatchObject({
      pluginId: "LibraryPlugin",
      id: "library-load-symphony",
      name: "Library Load",
      movements: [
        {
          id: "load",
          name: "Load",
          beats: [
            {
              beat: 1,
              event: "library:components:load",
              title: "Load Components",
              dynamics: "mf",
              handler: "loadComponents",
              timing: "immediate",
              kind: "pure"
            },
            {
              beat: 2,
              event: "library:components:notify-ui",
              title: "Notify UI",
              dynamics: "mf",
              handler: "notifyUi",
              timing: "immediate",
              kind: "pure"
            }
          ]
        }
      ]
    });

    // Verify handlers are provided
    expect(handlers).toBeDefined();
    expect(typeof handlers.loadComponents).toBe("function");
    expect(typeof handlers.notifyUi).toBe("function");

    // Verify plugin ID
    expect(pluginId).toBe("LibraryPlugin");
  });

  it("should mark the sequence as mounted in conductor", async () => {
    await register(mockConductor);

    // Verify the sequence ID was marked as mounted
    expect(mockConductor._runtimeMountedSeqIds.has("library-load-symphony")).toBe(true);
  });

  it("should not call mount if conductor is null or undefined", async () => {
    await register(null);
    await register(undefined);

    expect(mockConductor.mount).not.toHaveBeenCalled();
  });

  it("should not call mount if conductor.mount is not available", async () => {
    const conductorWithoutMount = {};
    await register(conductorWithoutMount);

    expect(mockConductor.mount).not.toHaveBeenCalled();
  });

  it("should create _runtimeMountedSeqIds set if it doesn't exist", async () => {
    const conductorWithoutSet = {
      mount: vi.fn(),
    };

    await register(conductorWithoutSet);

    expect(conductorWithoutSet._runtimeMountedSeqIds).toBeInstanceOf(Set);
    expect(conductorWithoutSet._runtimeMountedSeqIds.has("library-load-symphony")).toBe(true);
  });
});
