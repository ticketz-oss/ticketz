import {
  storyStateLabel,
  ringGradient,
  initialsOf,
  loadSeen,
  markSeen,
  groupPostsByConnection,
  upsertPost
} from "./storyState";

const NOW = new Date("2026-10-19T12:00:00Z").getTime();

describe("story state helpers", () => {
  it("ignores a stale post that arrives after a newer update", () => {
    const published = {
      id: 1,
      state: "published",
      updatedAt: "2026-10-19T12:00:05Z"
    };
    const staleQueued = {
      id: 1,
      state: "queued",
      updatedAt: "2026-10-19T12:00:01Z"
    };
    expect(upsertPost([published], staleQueued)).toEqual([published]);
    const edited = {
      ...staleQueued,
      state: "draft",
      updatedAt: "2026-10-19T12:01:00Z"
    };
    expect(upsertPost([published], edited)).toEqual([edited]);
  });

  it("labels a future queued post as scheduled and a published one as sent", () => {
    expect(
      storyStateLabel(
        { state: "queued", scheduledAt: "2026-10-19T15:00:00Z" },
        NOW
      )
    ).toBe("whatsappStatus.state.scheduled");
    expect(storyStateLabel({ state: "published" }, NOW)).toBe(
      "whatsappStatus.state.sent"
    );
    expect(
      storyStateLabel(
        { state: "queued", scheduledAt: "2026-10-19T11:00:00Z" },
        NOW
      )
    ).toBe("whatsappStatus.state.sending");
    expect(storyStateLabel({ state: "queued" }, NOW)).toBe(
      "whatsappStatus.state.sending"
    );
    expect(storyStateLabel({ state: "publishing" }, NOW)).toBe(
      "whatsappStatus.state.sending"
    );
    expect(storyStateLabel({ state: "failed" }, NOW)).toBe(
      "whatsappStatus.state.failed"
    );
    expect(storyStateLabel({ state: "unsupported" }, NOW)).toBe(
      "whatsappStatus.state.unsupported"
    );
    expect(storyStateLabel({ state: "draft" }, NOW)).toBe(
      "whatsappStatus.state.draft"
    );
    expect(storyStateLabel({ state: "cancelled" }, NOW)).toBe(
      "whatsappStatus.state.cancelled"
    );
  });

  it("builds the design ring: one solid segment, or gapped segments", () => {
    expect(ringGradient(1, false, "#FFF")).toBe(
      "conic-gradient(#024BF4 0% 100%)"
    );
    expect(ringGradient(2, true, "#FFF")).toBe(
      "conic-gradient(#C4C4CC 0% 47.5%,#FFF 47.5% 50%,#C4C4CC 50% 97.5%,#FFF 97.5% 100%)"
    );
  });

  it("derives two-letter initials from a connection name", () => {
    expect(initialsOf("Espaço Whats")).toBe("EW");
    expect(initialsOf("Comercial")).toBe("CO");
    expect(initialsOf("")).toBe("?");
  });

  it("keeps seen ids per user and survives a broken storage", () => {
    localStorage.clear();
    markSeen(9, [3, 4]);
    expect(loadSeen(9).has(3)).toBe(true);
    expect(loadSeen(10).size).toBe(0);
    const spy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(loadSeen(9).size).toBe(0);
    spy.mockRestore();
  });

  it("groups active posts by connection, oldest first, dropping cancelled and expired", () => {
    const grouped = groupPostsByConnection(
      [
        {
          id: 2,
          whatsappId: 1,
          state: "published",
          createdAt: "2026-10-19T10:00:00Z"
        },
        {
          id: 1,
          whatsappId: 1,
          state: "published",
          createdAt: "2026-10-19T09:00:00Z"
        },
        {
          id: 3,
          whatsappId: 2,
          state: "cancelled",
          createdAt: "2026-10-19T09:00:00Z"
        },
        {
          id: 4,
          whatsappId: 2,
          state: "published",
          createdAt: "2026-10-18T09:00:00Z",
          expiresAt: "2026-10-19T09:00:00Z"
        }
      ],
      NOW
    );
    expect(grouped[1].map(post => post.id)).toEqual([1, 2]);
    expect(grouped[2]).toBeUndefined();
  });

  it("keeps the previous author when a socket payload has no createdBy", () => {
    const author = { id: 7, name: "Guilherme Santos" };
    const current = [
      { id: 1, state: "queued", createdBy: author },
      { id: 2, state: "published", createdBy: { id: 8, name: "Ana" } }
    ];
    const merged = upsertPost(current, { id: 1, state: "published" });
    expect(merged.find(post => post.id === 1)).toEqual({
      id: 1,
      state: "published",
      createdBy: author
    });
    const replaced = upsertPost(merged, {
      id: 2,
      state: "failed",
      createdBy: { id: 9, name: "Bia" }
    });
    expect(replaced.find(post => post.id === 2).createdBy.name).toBe("Bia");
    expect(upsertPost([], { id: 3, state: "draft" })).toEqual([
      { id: 3, state: "draft" }
    ]);
  });
});
