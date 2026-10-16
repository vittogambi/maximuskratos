import { Injectable } from '@nestjs/common';

/** No-op unless a test overrides it to overlap two writes of the same answer. */
@Injectable()
export class ResponseWriteHook {
  async beforeUpsert(): Promise<void> {}
}
