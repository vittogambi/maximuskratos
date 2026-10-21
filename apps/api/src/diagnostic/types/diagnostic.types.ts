import type { QuestionCapture } from '../question-capture';
import type {
  AreaSectionDto,
  AuditCloseDto,
  SavedAnswerDto,
} from '../player-navigation';

export type { AreaSectionDto, AuditCloseDto, SavedAnswerDto };

export type DimensionScores = Record<string, number>;

export type QuestionDto = {
  id: string;
  type: string;
  textEs: string;
  sourceRef?: string | null;
  contextEs: string | null;
  maxSelections: number | null;
  scaleType: string | null;
  reasonPromptEs: string | null;
  reasonThreshold: number | null;
  options: AnswerOptionDto[];
  capture: QuestionCapture | null;
  heading: string | null;
  allowedExceptions: string[];
  answerRevision: number;
  savedAnswer?: SavedAnswerDto | null;
  previousQuestionId?: string | null;
  isFirstInModule?: boolean;
  savedChoices?: Record<string, string>;
  filledActivities?: string[];
  activityNotes?: { sourceRef: string; text: string }[];
};

export type AnswerOptionDto = {
  id: string;
  order: number;
  textEs: string;
  value: string;
};

export type OutroDto = {
  moduleSlug: string;
  titleEs: string;
  outroText: string;
  readings: { label: string; detail: string }[];
  auditClose?: AuditCloseDto;
};

export type PhaseResultsDto = {
  phase: string;
  completionPct: number;
  selfKnowledgePct: number;
};

export type ProfileRevealDto = {
  archetypePrimary: string;
  selfKnowledgePct: number;
};

export type SessionStateDto = {
  phase: string;
  completionPct: number;
  currentModuleSlug: string | null;
  currentModuleTitle: string | null;
  currentModuleIntro: string | null;
  currentModuleIcon: string | null;
  moduleProgress: number;
  selfKnowledgePct: number;
  isModuleStart: boolean;
  /** 1-indexed position of the current question in the active module (null when no active question) */
  currentQuestionIndex: number | null;
  /** Total questions in the active module (null when no active question) */
  moduleQuestionCount: number | null;
  /** True until the user completes the global welcome screen */
  showWelcomeScreen: boolean;
  currentModuleOrder: number | null;
  totalModules: number;
  currentModuleEstimatedMinutes: number | null;
  areaSections?: AreaSectionDto[];
  /** Desde la intro del módulo: slug del módulo anterior para mostrar su intro. */
  backIntroModuleSlug?: string | null;
};

export type ModuleProgressDto = {
  slug: string;
  titleEs: string;
  iconKey: string | null;
  status: string;
  estimatedMinutes: number;
  answeredQuestions: number;
  totalQuestions: number;
};

export type DiagnosticProgressDto = {
  completionPct: number;
  selfKnowledgePct: number;
  modules: ModuleProgressDto[];
};

export type NextStep =
  | { type: 'question'; data: QuestionDto }
  | { type: 'module_outro'; data: OutroDto }
  | { type: 'phase_end'; data: PhaseResultsDto }
  | { type: 'diagnostic_complete'; data: ProfileRevealDto }
  | { type: 'territory_complete'; data: { territory: string } }
  | { type: 'territory_pause'; data: { territory: string; moduleSlug: string } };

export type DiagnosticResponsePayload = {
  sessionState: SessionStateDto;
  nextStep: NextStep;
};
