import type { Response } from 'express';
import { execFile, spawn } from 'child_process';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import type { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const TIMEOUT_MS = 10000;
const MAX_OUTPUT = 10000;

interface RunResult {
  output: string;
  error: string;
  exitCode: number;
  timedOut: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + '\n... (output truncated)';
}

async function runJava(codeDir: string, code: string): Promise<RunResult> {
  const filePath = join(codeDir, 'Main.java');
  await writeFile(filePath, code);

  try {
    const compileOut = await withTimeout(
      new Promise<string>((resolve, reject) => {
        execFile(
          'javac',
          [filePath],
          { cwd: codeDir, timeout: TIMEOUT_MS },
          (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || stdout || String(err)));
            else resolve(stdout);
          },
        );
      }),
      TIMEOUT_MS,
    );
    void compileOut;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      output: '',
      error: truncate(msg, MAX_OUTPUT),
      exitCode: 1,
      timedOut: msg === 'TIMEOUT',
    };
  }

  try {
    const result = await withTimeout(
      new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        execFile(
          'java',
          ['-cp', codeDir, 'Main'],
          { cwd: codeDir, timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 },
          (err, stdout, stderr) => {
            if (err) {
              reject(new Error(stderr || stdout || String(err)));
            } else {
              resolve({ stdout, stderr });
            }
          },
        );
      }),
      TIMEOUT_MS,
    );
    return {
      output: truncate(result.stdout, MAX_OUTPUT),
      error: truncate(result.stderr, MAX_OUTPUT),
      exitCode: 0,
      timedOut: false,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      output: '',
      error: truncate(msg, MAX_OUTPUT),
      exitCode: 1,
      timedOut: msg === 'TIMEOUT',
    };
  }
}

async function runPython(codeDir: string, code: string): Promise<RunResult> {
  const filePath = join(codeDir, 'main.py');
  await writeFile(filePath, code);

  try {
    const result = await withTimeout(
      new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        execFile(
          'python3',
          [filePath],
          { cwd: codeDir, timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 },
          (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || stdout || String(err)));
            else resolve({ stdout, stderr });
          },
        );
      }),
      TIMEOUT_MS,
    );
    return {
      output: truncate(result.stdout, MAX_OUTPUT),
      error: truncate(result.stderr, MAX_OUTPUT),
      exitCode: 0,
      timedOut: false,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      output: '',
      error: truncate(msg, MAX_OUTPUT),
      exitCode: 1,
      timedOut: msg === 'TIMEOUT',
    };
  }
}

function compileAndRun(
  compiler: string,
  compilerArgs: string[],
  runCmd: string,
  runArgs: string[],
  codeDir: string,
): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile(
      compiler,
      [...compilerArgs, join(codeDir, 'main')],
      { cwd: codeDir, timeout: TIMEOUT_MS },
      (compileErr, _stdout, compileStderr) => {
        if (compileErr) {
          resolve({
            output: '',
            error: truncate(compileStderr || String(compileErr), MAX_OUTPUT),
            exitCode: 1,
            timedOut: false,
          });
          return;
        }

        const proc = spawn(runCmd, runArgs, {
          cwd: codeDir,
          timeout: TIMEOUT_MS,
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        proc.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        const timer = setTimeout(() => {
          timedOut = true;
          proc.kill('SIGKILL');
        }, TIMEOUT_MS);

        proc.on('close', (code) => {
          clearTimeout(timer);
          resolve({
            output: truncate(stdout, MAX_OUTPUT),
            error: truncate(stderr, MAX_OUTPUT),
            exitCode: code ?? 1,
            timedOut,
          });
        });

        proc.on('error', (err) => {
          clearTimeout(timer);
          resolve({
            output: '',
            error: truncate(String(err), MAX_OUTPUT),
            exitCode: 1,
            timedOut: false,
          });
        });
      },
    );
  });
}

async function runC(codeDir: string, code: string): Promise<RunResult> {
  const filePath = join(codeDir, 'main.c');
  await writeFile(filePath, code);
  return compileAndRun('gcc', ['-o', 'main', filePath], './main', [], codeDir);
}

async function runCpp(codeDir: string, code: string): Promise<RunResult> {
  const filePath = join(codeDir, 'main.cpp');
  await writeFile(filePath, code);
  return compileAndRun('g++', ['-o', 'main', filePath], './main', [], codeDir);
}

export async function runCode(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { language, code } = req.body;

  if (!code || !code.trim()) {
    throw new AppError('Code is required', 400);
  }

  const runId = randomBytes(8).toString('hex');
  const codeDir = join(tmpdir(), `syncspace-run-${runId}`);

  try {
    await mkdir(codeDir, { recursive: true });

    let result: RunResult;

    switch (language) {
      case 'java':
        result = await runJava(codeDir, code);
        break;
      case 'python':
        result = await runPython(codeDir, code);
        break;
      case 'c':
        result = await runC(codeDir, code);
        break;
      case 'cpp':
        result = await runCpp(codeDir, code);
        break;
      default:
        throw new AppError('Unsupported language', 400);
    }

    res.json({
      success: true,
      data: {
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
      },
    });
  } finally {
    await rm(codeDir, { recursive: true, force: true }).catch(() => {});
  }
}
