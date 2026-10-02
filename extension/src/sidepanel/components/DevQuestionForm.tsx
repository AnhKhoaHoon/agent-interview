import { FormEvent, useState } from 'react';

interface DevQuestionFormProps {
  disabled: boolean;
  onAsk: (question: string) => Promise<void>;
}

export function DevQuestionForm({ disabled, onAsk }: DevQuestionFormProps): JSX.Element {
  const [question, setQuestion] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || disabled) return;
    await onAsk(trimmed);
    setQuestion('');
  }

  return (
    <form className="dev-question-form" onSubmit={(event) => void submit(event)}>
      <label htmlFor="manual-question">Development question</label>
      <textarea
        id="manual-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="What is Kubernetes HPA?"
        disabled={disabled}
        rows={3}
      />
      <button className="button" type="submit" disabled={disabled || !question.trim()}>Ask</button>
    </form>
  );
}
