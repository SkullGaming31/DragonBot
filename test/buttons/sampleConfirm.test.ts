import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the handler
import sampleConfirm from '../../src/Buttons/sampleConfirm';

describe('sampleConfirm button handler', () => {
  let mockInteraction: any;
  let mockClient: any;

  beforeEach(() => {
    mockInteraction = {
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      user: { id: '123' },
      customId: sampleConfirm.customId,
      isButton: true,
    };

    mockClient = {
      // include any client properties the handler might use in future
      buttons: new Map(),
    };
  });

  it('should defer update and edit reply when run is called', async () => {
    await sampleConfirm.run({ client: mockClient as any, interaction: mockInteraction });

    expect(mockInteraction.deferUpdate).toHaveBeenCalled();
    // sampleConfirm edits the reply after deferUpdate in the example
    expect(mockInteraction.editReply).toHaveBeenCalled();
  });
});
