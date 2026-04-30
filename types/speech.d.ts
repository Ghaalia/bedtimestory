interface SpeechRecognitionEventResult {
  0: { transcript: string };
}

interface SpeechRecognitionEvent extends Event {
  results: { [index: number]: SpeechRecognitionEventResult } & { length: number };
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
