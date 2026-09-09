import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { importMatrix } from '../import/xlsx-importer';
import { formatReport } from '../import/report';
import { MatrixImportError } from '../types';

function arg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main(): Promise<void> {
  const xlsx = arg('--xlsx');
  const definitionId = arg('--definition-id') ?? 'matrix-v2.0';
  const out = arg('--out');
  const expectSha256 = arg('--expect-sha256');

  if (!xlsx || !out) {
    process.stderr.write(
      'usage: matrix:import --xlsx <file> --out <json> [--definition-id matrix-v2.0] [--expect-sha256 <hex>]\n',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = await importMatrix({
      xlsxPath: resolve(xlsx),
      definitionId,
      expectSha256,
    });
    await mkdir(dirname(resolve(out)), { recursive: true });
    await writeFile(resolve(out), `${result.canonicalJson}\n`, 'utf8');
    const reportPath = resolve(out).replace(/\.json$/, '.report.txt');
    await writeFile(reportPath, `${formatReport(result.report)}\n`, 'utf8');
    process.stdout.write(`${formatReport(result.report)}\n`);
    process.stdout.write(`wrote ${resolve(out)}\n`);
    if (!result.report.publishable) {
      process.exitCode = 1;
    }
  } catch (error) {
    const message =
      error instanceof MatrixImportError || error instanceof Error
        ? error.message
        : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = hasFlag('--expect-sha256') && message.includes('sha256') ? 2 : 1;
  }
}

void main();
