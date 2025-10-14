import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks for Mongoose models and utilities
vi.mock('../src/Database/Schemas/ticketDB', () => ({
  default: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn()
  }
}));

vi.mock('../src/Database/Schemas/ticketSetupDB', () => ({
  default: {
    findOne: vi.fn()
  }
}));

vi.mock('../src/Utilities/functions', () => ({
  safeInteractionReply: vi.fn()
}));

import DB from '../src/Database/Schemas/ticketDB';
import ticketSetup from '../src/Database/Schemas/ticketSetupDB';
import { safeInteractionReply } from '../src/Utilities/functions';

import ticketEvent from '../src/Events/Tickets/ticketResponse';

describe('Ticket interaction handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles close button: marks closed, replies and deletes DB entry', async () => {
    // Prepare fake DB document returned by findOne
    const docs = { TicketID: 'T-123', MembersID: ['U1'], Closed: false, Locked: false, Claimed: false } as any;

    // Mock DB.findOne to return a Query-like object with exec()
    (DB.findOne as any).mockImplementation(() => ({ exec: async () => docs }));
    (DB.updateOne as any).mockResolvedValue({});
    (DB.deleteOne as any).mockResolvedValue({});

    // Make ticketSetup.findOne thenable and with exec() for both usages in code
    (ticketSetup.findOne as any).mockImplementation(() => ({
      exec: async () => ({ Transcripts: undefined }),
      then: (onFulfilled: any) => onFulfilled({ Transcripts: undefined })
    }));

    // Fake interaction and channel objects
    const channel = {
      id: 'C1',
      isTextBased: () => true,
      messages: { fetch: vi.fn().mockResolvedValue({ size: 0, first: () => undefined }) },
      delete: vi.fn()
    } as any;

    const guild = { id: 'G1', channels: { fetch: vi.fn() } } as any;

    const interaction: any = {
      isButton: () => true,
      inCachedGuild: () => true,
      guild,
      customId: 'close',
      channel,
      member: { permissions: { has: () => true }, id: 'U1' }
    };

    // Execute the event handler
    await (ticketEvent as any).run(interaction);

    // Assertions: updateOne called to set Closed, safeInteractionReply to inform user, and deleteOne called
    expect((DB.updateOne as any)).toHaveBeenCalledWith({ ChannelID: channel.id }, { Closed: true });
    expect((safeInteractionReply as any)).toHaveBeenCalled();
    expect((DB.deleteOne as any)).toHaveBeenCalledWith({ ChannelID: channel.id });
  });

  it('handles lock button: sets Locked true and edits permissions for members', async () => {
    const docs = { TicketID: 'T-456', MembersID: ['U1', 'U2'], Locked: false } as any;
    (DB.findOne as any).mockImplementation(() => ({ exec: async () => docs }));
    (DB.updateOne as any).mockResolvedValue({});

    const permissionEdit = vi.fn();
    const channel = { id: 'C2', type: 0, permissionOverwrites: { edit: permissionEdit } } as any;
    const guild = { id: 'G2' } as any;

    const interaction: any = {
      isButton: () => true,
      inCachedGuild: () => true,
      guild,
      customId: 'lock',
      channel,
      member: { permissions: { has: () => true }, id: 'U1' }
    };

    await (ticketEvent as any).run(interaction);

    expect((DB.updateOne as any)).toHaveBeenCalledWith({ ChannelID: channel.id }, { Locked: true });
    // permissionOverwrites.edit should be called for each member
    expect(permissionEdit).toHaveBeenCalled();
    expect((safeInteractionReply as any)).toHaveBeenCalled();
  });

  it('handles unlock button: sets Locked false and restores permissions', async () => {
    const docs = { TicketID: 'T-789', MembersID: ['U1'], Locked: true } as any;
    (DB.findOne as any).mockImplementation(() => ({ exec: async () => docs }));
    (DB.updateOne as any).mockResolvedValue({});

    const permissionEdit = vi.fn();
    const channel = { id: 'C3', type: 0, permissionOverwrites: { edit: permissionEdit } } as any;
    const guild = { id: 'G3' } as any;

    const interaction: any = {
      isButton: () => true,
      inCachedGuild: () => true,
      guild,
      customId: 'unlock',
      channel,
      member: { permissions: { has: () => true }, id: 'U1' }
    };

    await (ticketEvent as any).run(interaction);

    expect((DB.updateOne as any)).toHaveBeenCalledWith({ ChannelID: channel.id }, { Locked: false });
    expect(permissionEdit).toHaveBeenCalled();
    expect((safeInteractionReply as any)).toHaveBeenCalled();
  });

  it('handles claim button: sets Claimed true and records ClaimedBy', async () => {
    const docs = { TicketID: 'T-999', Claimed: false } as any;
    (DB.findOne as any).mockImplementation(() => ({ exec: async () => docs }));
    (DB.updateOne as any).mockResolvedValue({});

    const channel = { id: 'C4' } as any;
    const guild = { id: 'G4' } as any;

    const interaction: any = {
      isButton: () => true,
      inCachedGuild: () => true,
      guild,
      customId: 'claim',
      channel,
      member: { permissions: { has: () => true }, id: 'CLAIMER#1', toString: () => '<@CLAIMER#1>' }
    };

    await (ticketEvent as any).run(interaction);

    expect((DB.updateOne as any)).toHaveBeenCalledWith({ ChannelID: channel.id }, { Claimed: true, ClaimedBy: interaction.member.id });
    expect((safeInteractionReply as any)).toHaveBeenCalled();
  });
});
