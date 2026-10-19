import Contact from "../../../models/Contact";
import {
  contactNameLockOnCreate,
  preserveLockedNameOnMerge,
  protectContactNameUpdate
} from "../ContactNamePolicy";

const contact = (values: Partial<Contact>): Contact =>
  ({
    isGroup: false,
    name: "Nome atual",
    nameLocked: false,
    ...values
  }) as Contact;

describe("manual contact name policy", () => {
  it("locks manually created contacts but not external or group contacts", () => {
    expect(contactNameLockOnCreate("manual")).toBe(true);
    expect(contactNameLockOnCreate("external")).toBe(false);
    expect(contactNameLockOnCreate("manual", true)).toBe(false);
  });

  it("keeps a locked manual name when WhatsApp publishes another name", () => {
    expect(
      protectContactNameUpdate(
        contact({ name: "Nome corrigido", nameLocked: true }),
        { name: "Nome do WhatsApp", profilePicUrl: "new-picture" },
        "external"
      )
    ).toEqual({ profilePicUrl: "new-picture" });
  });

  it("continues updating external names for unlocked contacts", () => {
    expect(
      protectContactNameUpdate(
        contact({ nameLocked: false }),
        { name: "Novo nome externo" },
        "external"
      )
    ).toEqual({ name: "Novo nome externo" });
  });

  it("locks a name edited by an attendant", () => {
    expect(
      protectContactNameUpdate(
        contact({ nameLocked: false }),
        { name: "Nome revisado" },
        "manual"
      )
    ).toEqual({ name: "Nome revisado", nameLocked: true });
  });

  it("moves a protected name to the winner of a phone/LID merge", () => {
    expect(
      preserveLockedNameOnMerge(
        contact({ name: "Registro do telefone", nameLocked: false }),
        contact({ name: "Nome revisado", nameLocked: true })
      )
    ).toEqual({ name: "Nome revisado", nameLocked: true });
  });
});
