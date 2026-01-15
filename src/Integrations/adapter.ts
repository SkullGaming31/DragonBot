export type NormalizedEvent = {
  provider: string;
  eventType: string;
  id: string;
  title?: string;
  url?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
};

export interface IntegrationAdapter {
  validate?(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<boolean> | boolean;
  normalize(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<NormalizedEvent | null> | NormalizedEvent | null;
}
