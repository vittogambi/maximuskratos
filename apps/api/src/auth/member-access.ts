import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEarlyAccessMode } from '../product-phase';

/** Server-only: accounts that see the private review note. Access to the questionnaire is every authenticated account. */
export const MEMBER_PREVIEW_USER_IDS = 'MEMBER_PREVIEW_USER_IDS';

export type MemberAccess = {
  canUseMemberProduct: boolean;
  /** True only when access comes from the private review list while early access is on. */
  isMemberPreview: boolean;
};

export function parsePreviewUserIds(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function resolveMemberAccess(input: {
  earlyAccess: boolean;
  previewUserIds: ReadonlySet<string>;
  userId: string | null | undefined;
}): MemberAccess {
  if (!input.userId) return { canUseMemberProduct: false, isMemberPreview: false };
  const isMemberPreview =
    input.earlyAccess && input.previewUserIds.has(input.userId.toLowerCase());
  return { canUseMemberProduct: true, isMemberPreview };
}

@Injectable()
export class MemberAccessService {
  private readonly logger = new Logger(MemberAccessService.name);
  private readonly previewUserIds: ReadonlySet<string>;

  constructor(config: ConfigService) {
    this.previewUserIds = parsePreviewUserIds(config.get<string>(MEMBER_PREVIEW_USER_IDS));
    if (this.previewUserIds.size > 0) {
      this.logger.log(`Member preview enabled for ${this.previewUserIds.size} account(s)`);
    }
  }

  forUser(userId: string | null | undefined): MemberAccess {
    return resolveMemberAccess({
      earlyAccess: isEarlyAccessMode(),
      previewUserIds: this.previewUserIds,
      userId,
    });
  }
}
