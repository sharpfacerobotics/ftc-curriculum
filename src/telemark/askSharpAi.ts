const ENDPOINT = 'https://sharp-ai.srivibhavp.workers.dev/api/ask';

export interface Citation {
  n: number;
  title?: string;
  url?: string;
  sourceName?: string;
}

export interface PageContext {
  title: string;
  section?: string;
  url: string;
}

export interface Turn {
  question: string;
  answer: string;
}

export interface AskEvents {
  onMeta?: (citations: Citation[]) => void;
  onToken?: (text: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

/**
 * Streams an answer from Sharp AI.
 *
 * The reply arrives as server-sent events so the answer appears as it is
 * written. A question can take several seconds to retrieve and generate, and
 * a spinner for that long reads as a hang.
 *
 * The signed-in student's ID token stands in for the CAPTCHA the public site
 * uses, and it is what the daily limit is counted against.
 */
export async function askSharpAi(
  question: string,
  options: {idToken: string; page?: PageContext; history?: Turn[]; signal?: AbortSignal},
  events: AskEvents,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        question,
        idToken: options.idToken,
        page: options.page ?? null,
        // The worker keeps the last two turns, which is what a follow-up needs
        // to resolve "it" and "that". It stores none of this; the thread lives
        // in the tab.
        history: options.history ?? [],
      }),
      signal: options.signal,
    });
  } catch {
    events.onError?.('Could not reach the assistant. Check your connection and try again.');
    return;
  }

  if (!response.ok || !response.body) {
    const detail = await response.json().catch(() => ({}));
    events.onError?.(messageFor(response.status, (detail as {error?: string}).error));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';

  // SSE frames are separated by a blank line and can split across reads, so
  // the tail of the buffer is kept until its terminator arrives.
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, {stream: true});

    let split = buffer.indexOf('\n\n');
    while (split !== -1) {
      const frame = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) {
          const payload = safeParse(line.slice(5).trim());
          if (event === 'meta') events.onMeta?.((payload?.citations as Citation[]) ?? []);
          else if (event === 'token' && typeof payload?.t === 'string') events.onToken?.(payload.t);
          else if (event === 'done') events.onDone?.();
          else if (event === 'error') events.onError?.(String(payload?.message ?? 'Something went wrong.'));
        }
      }
      split = buffer.indexOf('\n\n');
    }
  }
  events.onDone?.();
}

function safeParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function messageFor(status: number, error?: string): string {
  if (status === 429) {
    return 'You have used your questions for today. The limit resets tomorrow.';
  }
  if (status === 403) {
    return 'Your session expired. Sign out and back in, then try again.';
  }
  if (error === 'no-answer') {
    return 'Nothing in the curriculum or the official docs covers that yet.';
  }
  return 'The assistant could not answer that. Try rewording the question.';
}
