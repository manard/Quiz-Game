export type QuestionMark = "correct" | "wrong" | undefined;

type ProgressTrackProps = {
  total: number;
  currentIndex: number;
  /**
   * Per-question outcome, mirrored from the feedback already shown on screen.
   * Display only — the official score is calculated by the server.
   */
  marks: QuestionMark[];
};

/** Segmented competition progress bar, one segment per question. */
function ProgressTrack({ total, currentIndex, marks }: ProgressTrackProps) {
  return (
    <div
      className="q-track"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={currentIndex + 1}
      aria-label="تقدّم المسابقة"
    >
      {Array.from({ length: total }, (_, index) => {
        let state: string = "todo";

        if (marks[index]) {
          state = marks[index] as string;
        } else if (index === currentIndex) {
          state = "active";
        }

        return <span key={index} className="q-track__seg" data-state={state} />;
      })}
    </div>
  );
}

export default ProgressTrack;
