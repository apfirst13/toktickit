import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "../../src/utils/ticket.util.js";

describe("generateTicketNumber", () => {
  it("should generate a ticket number starting with TIK-", () => {
    const ticketNumber = generateTicketNumber();
    expect(ticketNumber.startsWith("TIK-")).toBe(true);
  });

  it("should generate a ticket number with correct length (TIK- + 6 digits time + 4 digits random = 14 chars)", () => {
    const ticketNumber = generateTicketNumber();
    expect(ticketNumber.length).toBe(14);
  });

  it("should generate unique ticket numbers on subsequent calls", () => {
    const ticket1 = generateTicketNumber();
    const ticket2 = generateTicketNumber();
    expect(ticket1).not.toBe(ticket2);
  });
});
