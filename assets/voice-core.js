// Speech recognition starts only after the user presses the microphone button.
export function createThaiDictation(Recognition, {base = '', onPreview, onComplete, onError}) {
  const recognition = new Recognition();
  recognition.lang = 'th-TH';
  recognition.continuous = true;
  recognition.interimResults = true;
  const finals = new Map();
  let disposed = false;
  recognition.onresult = event => {
    if (disposed) return;
    const interim = [];
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) finals.set(i, result[0].transcript.trim());
      else interim.push(result[0].transcript);
    }
    onPreview?.([...finals.values(), ...interim].join(' '));
  };
  recognition.onerror = event => { if (!disposed) onError?.(event.error); };
  recognition.onend = () => {
    if (disposed) return;
    disposed = true;
    const spoken = [...finals.values()].filter(Boolean).join(' ');
    onComplete?.(spoken ? [base.trim(), spoken].filter(Boolean).join('\n') : base, !!spoken);
  };
  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    dispose: () => { disposed = true; recognition.abort(); }
  };
}
