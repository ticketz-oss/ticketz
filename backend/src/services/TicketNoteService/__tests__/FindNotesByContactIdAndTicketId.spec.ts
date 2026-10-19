import TicketNote from "../../../models/TicketNote";
import FindNotesByContactIdAndTicketId from "../FindNotesByContactIdAndTicketId";

describe("FindNotesByContactIdAndTicketId", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads contact-wide notes while constraining tickets to the company", async () => {
    const findAll = jest.spyOn(TicketNote, "findAll").mockResolvedValue([]);

    await FindNotesByContactIdAndTicketId({
      contactId: 15,
      companyId: 4
    });

    const options = (findAll as jest.Mock).mock.calls[0][0];
    expect(options.where).toEqual({ contactId: 15 });
    expect(options.include).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          as: "ticket",
          where: { companyId: 4 },
          required: true
        })
      ])
    );
  });

  it("can keep the list limited to the current ticket", async () => {
    const findAll = jest.spyOn(TicketNote, "findAll").mockResolvedValue([]);

    await FindNotesByContactIdAndTicketId({
      contactId: 15,
      companyId: 4,
      ticketId: 22
    });

    expect((findAll as jest.Mock).mock.calls[0][0].where).toEqual({
      contactId: 15,
      ticketId: 22
    });
  });
});
