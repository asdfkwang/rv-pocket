import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";

export function renderManual(state: AppState): string {
  const chapter = currentChapter(state);
  return `<article class="manual-paper">
    <div class="back-row"><button id="manual-back" class="text-button" data-action="view" data-view="workbench">← Back</button></div>
    <header class="manual-header"><span class="manual-wordmark">RV POCKET<br><strong>FIELD MANUAL</strong></span><span class="eyebrow">STUDIO COPY<br>CHAPTER ${String(chapter.id).padStart(2, "0")}</span></header>
    ${chapter.manual.map((section) => `<section class="manual-section" aria-labelledby="manual-${e(section.id)}"><h2 id="manual-${e(section.id)}">${e(section.title)}</h2>${section.blocks.map((block) => block.kind === "ascii" ? `<pre class="manual-diagram">${e(block.body)}</pre>` : `<p>${e(block.body)}</p>`).join("")}</section>`).join("")}
    ${chapter.quiz.length ? `<section class="quiz-section" aria-labelledby="quiz-heading"><span class="eyebrow">PAUSE & THINK</span><h2 id="quiz-heading">Check your understanding.</h2><p class="muted">Three small questions. Try again as often as you like, or return to the repair whenever you are ready.</p>
      ${chapter.quiz.map((question, index) => {
        const selected = state.ui.quizAnswers[question.id];
        const correct = selected === question.answerId;
        return `<fieldset class="quiz-question"><legend><span class="question-number">${String(index + 1).padStart(2, "0")}</span>${e(question.prompt)}</legend>
          <div class="quiz-options">${question.choices.map((choice) => `<label class="quiz-choice ${selected === choice.id ? "selected" : ""}"><input id="quiz-${e(question.id)}-${e(choice.id)}" type="radio" name="quiz-${e(question.id)}" data-question="${e(question.id)}" value="${e(choice.id)}" ${selected === choice.id ? "checked" : ""}><span>${e(choice.label)}</span></label>`).join("")}</div>
          ${selected ? `<p class="quiz-feedback ${correct ? "correct" : "retry"}"><strong>${correct ? "That's right." : "Not quite. Try again."}</strong> ${e(question.explanation)}</p>` : ""}</fieldset>`;
      }).join("")}
    </section>` : ""}
    <footer class="manual-footer"><span>Keep this copy close to the machine.</span></footer>
  </article>`;
}
