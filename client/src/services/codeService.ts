import api from './api';

export interface RunCodeResult {
  output: string;
  error: string;
  exitCode: number;
  timedOut: boolean;
}

export const codeService = {
  async run(language: string, code: string): Promise<RunCodeResult> {
    const { data } = await api.post('/code/run', { language, code });
    return data.data as RunCodeResult;
  },
};
