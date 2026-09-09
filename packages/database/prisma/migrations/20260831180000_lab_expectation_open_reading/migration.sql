-- LAB-ONLY: open reading captured before Rafa translates the case into MK categories.
-- Nullable so existing expectations stay valid. Not read by the matrix engine and not
-- part of any definition, snapshot or hash.
ALTER TABLE "lab_expectations" ADD COLUMN "open_what_is_happening" TEXT;
ALTER TABLE "lab_expectations" ADD COLUMN "open_main_concern" TEXT;
ALTER TABLE "lab_expectations" ADD COLUMN "open_first_focus" TEXT;
ALTER TABLE "lab_expectations" ADD COLUMN "open_first_action" TEXT;
