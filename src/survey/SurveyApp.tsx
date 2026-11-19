import { useEffect, useState } from "react";
import { SURVEY_QUESTIONS } from "./questions";
import { cleanEmail, emailOk } from "./email";
import { SURVEY_OPEN } from "./open";

const DRAFT_KEY = "bar-feuds-survey-draft";
const EMAIL_STEP = SURVEY_QUESTIONS.length;

function InstagramFollow() {
  return (
    <a
      className="follow"
      href="https://www.instagram.com/barskiduel/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <radialGradient id="ig" cx="30%" cy="110%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig)" />
        <rect
          x="6.15"
          y="6.15"
          width="11.7"
          height="11.7"
          rx="3.5"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
        />
        <circle
          cx="12"
          cy="12"
          r="2.55"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
        />
        <circle cx="16.35" cy="7.7" r="0.9" fill="#fff" />
      </svg>
      Последвай @barskiduel
    </a>
  );
}

const MAX_ANSWERS = 8;

type Draft = {
  email: string;
  accepted: boolean;
  answers: string[][];
  step: number;
  returnStep: number;
};

function Terms({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}) {
  return (
    <div className="terms-backdrop" onClick={onClose}>
      <div
        className="terms-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="terms-title">Условия за ползване</h2>
        <p>Анкетата е на @barskiduel.</p>
        <p>Пазя имейла и отговорите.</p>
        <p>
          Ползвам ги, за да видя най-честите отговори за играта и да избера
          един човек, на когото пращам 20€. Трябват отговори и на дванайсетте
          въпроса. Ако спечелиш, пиша ти на имейла. Аз избирам. Няма код и не
          всеки получава пари.
        </p>
        <p>
          Листчето с имейла го виждам само аз. Не го пускам публично, не го
          ползвам за реклама и не го давам на други.
        </p>
        <p>
          Самите отговори, без имейл, ще ги ползвам после в барската игра. Там
          се вижда само кой отговор колко често е писан, не кой го е написал.
        </p>
        <p>
          Имейла трия, след като парите са изпратени. Ако отговорите са
          написани само колкото да се участва, мога да махна цялото листче и то
          не влиза в играта. Ако искаш твоя запис да изтрия или да ти го покажа
          по-рано, пиши на @barskiduel.
        </p>
        <div className="dock">
          <button type="button" className="btn ghost" onClick={onClose}>
            Затвори
          </button>
          <button type="button" className="btn primary" onClick={onAccept}>
            Съгласявам се
          </button>
        </div>
      </div>
    </div>
  );
}

function blankAnswers() {
  return SURVEY_QUESTIONS.map(() => [""]);
}

function loadDraft(): Draft {
  const empty = {
    email: "",
    accepted: false,
    answers: blankAnswers(),
    step: 0,
    returnStep: 0,
  };
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw) as {
      email?: string;
      accepted?: boolean;
      answers?: unknown[];
      step?: number;
      returnStep?: number;
    };
    const answers = SURVEY_QUESTIONS.map((_, index) => {
      const item = data.answers?.[index];
      if (Array.isArray(item)) {
        const texts = item
          .filter((value): value is string => typeof value === "string")
          .slice(0, MAX_ANSWERS);
        return texts.length > 0 ? texts : [""];
      }
      return typeof item === "string" ? [item] : [""];
    });
    const email = cleanEmail(data.email);
    const accepted = data.accepted === true;
    const last = SURVEY_QUESTIONS.length - 1;
    const step =
      typeof data.step === "number" && data.step >= 0 && data.step <= EMAIL_STEP
        ? data.step
        : 0;
    const back = typeof data.returnStep === "number" ? data.returnStep : Math.min(Math.max(step, 0), last);
    const returnStep = back >= 0 && back <= last ? back : 0;
    return { email, accepted, answers, step, returnStep };
  } catch {
    return empty;
  }
}

export function SurveyApp() {
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    document.title = "Барски дуел · Анкета";
  }, []);

  useEffect(() => {
    if (done) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, done]);

  const step = draft.step;
  const slots = draft.answers[step] ?? [""];
  const current = slots.some((item) => item.trim());

  function goNext() {
    if (!current || step >= SURVEY_QUESTIONS.length - 1) return;
    setDraft({ ...draft, step: step + 1 });
  }

  function goToEmail() {
    setError("");
    setDraft({ ...draft, step: EMAIL_STEP, returnStep: step });
  }
  const question = step >= 0 ? SURVEY_QUESTIONS[step] : undefined;

  async function send() {
    const missing = SURVEY_QUESTIONS.some((_, index) =>
      !(draft.answers[index] ?? []).some((value) => value.trim()),
    );
    if (missing) {
      setError("Отговори и на дванайсетте въпроса.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/anketa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: draft.email,
          accepted: draft.accepted,
          answers: SURVEY_QUESTIONS.flatMap((item, index) =>
            (draft.answers[index] ?? []).flatMap((value) => {
              const text = value.trim();
              return text ? [{ id: item.id, text }] : [];
            }),
          ),
        }),
      });
      const text = await response.text();
      let body: { code?: string; error?: string } = {};
      try {
        body = JSON.parse(text) as { code?: string; error?: string };
      } catch {
        setError("Сървърът не прие листчето. Опитай пак след малко.");
        return;
      }
      if (!response.ok || body.error) {
        setError(body.error || "Не мина. Опитай пак.");
        return;
      }
      sessionStorage.removeItem(DRAFT_KEY);
      setDone(true);
    } catch {
      setError("Няма връзка. Отвори линка още веднъж.");
    } finally {
      setBusy(false);
    }
  }

  function setSlot(index: number, text: string) {
    setDraft((current) => {
      const answers = current.answers.map((row) => [...row]);
      const row = answers[current.step] ?? [""];
      row[index] = text;
      answers[current.step] = row;
      return { ...current, answers };
    });
    setError("");
  }

  function addSlot() {
    setDraft((current) => {
      const answers = current.answers.map((row) => [...row]);
      const row = answers[current.step] ?? [""];
      if (row.length >= MAX_ANSWERS) return current;
      answers[current.step] = [...row, ""];
      return { ...current, answers };
    });
  }

  if (!SURVEY_OPEN) {
    return (
      <div className="app">
        <main className="survey">
          <p className="eyebrow">Барски дуел</p>
          <h1>Анкетата е затворена.</h1>
          <p className="lede">Събрахме 100 листчета. Повече не се приемат.</p>
          <InstagramFollow />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="survey">
        <p className="eyebrow">Барски дуел</p>
        {done ? (
          <>
            <h1>Готово.</h1>
            <p className="lede">
              Листчето е прието. Ако те избера, ще ти пиша на имейла.
            </p>
            <InstagramFollow />
          </>
        ) : step >= EMAIL_STEP ? (
          <>
            <h1>Имейл, и готово.</h1>
            <p className="lede">
              Ако те избера, пиша тук. Имейлът го виждам само аз.
            </p>
            <label className="field">
              <span>Имейл</span>
              <input
                type="email"
                value={draft.email}
                autoComplete="email"
                inputMode="email"
                placeholder="ime@email.com"
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value })
                }
              />
            </label>
            <label className="consent">
              <input
                type="checkbox"
                checked={draft.accepted}
                onChange={(event) =>
                  setDraft({ ...draft, accepted: event.target.checked })
                }
              />
              <button
                type="button"
                className="terms-link"
                onClick={() => setTermsOpen(true)}
              >
                Съгласявам се с условията за ползване
              </button>
            </label>
            {termsOpen && (
              <Terms
                onClose={() => setTermsOpen(false)}
                onAccept={() => {
                  setDraft({ ...draft, accepted: true });
                  setTermsOpen(false);
                }}
              />
            )}
            {error && <p className="banner">{error}</p>}
            <div className="dock">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setDraft({ ...draft, step: draft.returnStep })}
              >
                Назад
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={
                  busy || !draft.accepted || !emailOk(cleanEmail(draft.email))
                }
                onClick={() => void send()}
              >
                {busy ? "Праща се…" : "Прати"}
              </button>
            </div>
          </>
        ) : (
          question && (
            <>
              {step === 0 && (
                <>
                  <h1>Дванайсет въпроса. 20€ за един човек.</h1>
                  <p className="lede">
                    На всеки въпрос напиши поне един отговор. Трябват и
                    дванайсетте. Ако те избера, ще ти пиша на имейла.
                  </p>
                </>
              )}
              <div className={step === 0 ? "home-ask" : undefined}>
                <p className="q-count">
                  {step + 1}/{SURVEY_QUESTIONS.length}
                </p>
                {step > 0 && (
                  <p className="whisper">
                    Попълнени {draft.answers.filter((row) => row.some((item) => item.trim())).length}/12
                  </p>
                )}
                {step === 0 ? <h2>{question.text}</h2> : <h1>{question.text}</h1>}
              </div>
              <div className="answer-stack">
                {slots.map((value, index) => (
                  <label className="field" key={index}>
                    <span>Отговор {index + 1}</span>
                    <input
                      value={value}
                      autoFocus={step > 0 && index === slots.length - 1}
                      maxLength={80}
                      enterKeyHint="next"
                      onChange={(event) => setSlot(index, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        if (
                          value.trim() &&
                          slots.length < MAX_ANSWERS &&
                          index === slots.length - 1
                        ) {
                          addSlot();
                          return;
                        }
                        if (!current || step === SURVEY_QUESTIONS.length - 1) return;
                        goNext();
                      }}
                    />
                  </label>
                ))}
                {slots.length < MAX_ANSWERS && (
                  <button
                    type="button"
                    className="btn ghost tiny"
                    onClick={addSlot}
                  >
                    Още един отговор
                  </button>
                )}
              </div>
              {error && <p className="banner">{error}</p>}
              <div className="survey-foot">
                <div className="dock">
                  {step > 0 && (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setDraft({ ...draft, step: step - 1 })}
                    >
                      Назад
                    </button>
                  )}
                  {step < SURVEY_QUESTIONS.length - 1 ? (
                    <button
                      type="button"
                      className="btn primary"
                      disabled={!current}
                      onClick={goNext}
                    >
                      Напред
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn primary"
                      disabled={!current}
                      onClick={goToEmail}
                    >
                      Прати
                    </button>
                  )}
                </div>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={SURVEY_QUESTIONS.length}
                  aria-valuenow={step + 1}
                  aria-label={
                    step < SURVEY_QUESTIONS.length - 1
                      ? `Още ${SURVEY_QUESTIONS.length - step - 1} до края`
                      : "Последен въпрос"
                  }
                >
                  <span style={{ width: `${((step + 1) / SURVEY_QUESTIONS.length) * 100}%` }} />
                </div>
                <p className="progress-note">
                  {step < SURVEY_QUESTIONS.length - 1
                    ? `Още ${SURVEY_QUESTIONS.length - step - 1} до края`
                    : "Последен въпрос"}
                </p>
                {step === 0 && <InstagramFollow />}
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
