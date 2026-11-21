import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Armchair,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Flag,
  HandHeart,
  Heart,
  HeartHandshake,
  Info,
  Lightbulb,
  MapPin,
  Megaphone,
  NotebookPen,
  Phone,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  X,
} from 'lucide-react'
import {
  countryNote,
  disclaimer,
  getScore,
  getScoreRange,
  scenarios,
  scoreRanges,
  steps,
  SCENARIO_COUNT,
  MAX_SCORE,
  CHAPTER_SIZE,
  chapters,
} from './data'
import type { Screen } from './data'

import { sceneIcons } from './icons'
import { assetUrl } from './paths'
import QuestOverview from './QuestOverview'
import { STORAGE_KEY, freshProgress, loadProgress } from './progress'
import type { Progress } from './progress'

const stepIcons = [Megaphone, Armchair, HandHeart, PhoneCall]

function Starburst({ className = '' }: { className?: string }) {
  return (
    <svg className={`starburst ${className}`} viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
      <path d="m24 0 4.4 14L41 6.8l-7.2 12.8L48 24l-14.2 4.4L41 41.2 28.4 34 24 48l-4.4-14L7 41.2l7.2-12.8L0 24l14.2-4.4L7 6.8 19.6 14 24 0Z" />
    </svg>
  )
}

function Brand({ onClick, footer = false }: { onClick: () => void; footer?: boolean }) {
  return (
    <button
      className={`brand ${footer ? 'brand-footer' : ''}`}
      onClick={onClick}
      aria-label="Рядом — на стартовый экран"
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M20 5c1.5 9 6 13.5 15 15-9 1.5-13.5 6-15 15-1.5-9-6-13.5-15-15C14 18.5 18.5 14 20 5Z"
            fill="currentColor"
          />
          <circle cx="20" cy="20" r="3" fill="#26786b" />
        </svg>
      </span>
      <span className="brand-name">
        рядом<span className="brand-dot">.</span>
      </span>
    </button>
  )
}

function Disclaimer({ final = false }: { final?: boolean }) {
  return (
    <aside className={`disclaimer ${final ? 'disclaimer-final' : ''}`}>
      <span className="disclaimer-icon">
        <ShieldCheck size={23} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div>
        <strong>{final ? 'Важно помнить' : 'Сначала — важное'}</strong>
        <p>
          {disclaimer}{' '}
          {final
            ? 'В реальной ситуации сразу сообщи взрослому, при необходимости вызови помощь.'
            : 'В реальной ситуации сразу зови взрослого.'}
        </p>
      </div>
      <span className="disclaimer-tag">Забота без самолечения</span>
    </aside>
  )
}

function Journey({ stage }: { stage: 1 | 2 | 3 }) {
  return (
    <nav className="journey" aria-label="Этапы квеста">
      {['Правила', `${SCENARIO_COUNT} ситуаций`, 'Твой результат'].map((label, i) => (
        <span
          key={label}
          className={`journey-step ${stage === i + 1 ? 'is-current' : ''} ${stage > i + 1 ? 'is-done' : ''}`}
          aria-current={stage === i + 1 ? 'step' : undefined}
        >
          <span className="journey-number">{stage > i + 1 ? <Check size={13} /> : `0${i + 1}`}</span>
          <span>{label}</span>
          {i < 2 && <span className="journey-line" aria-hidden="true" />}
        </span>
      ))}
    </nav>
  )
}

function HelpContacts({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`help-contacts ${compact ? 'contacts-compact' : ''}`}>
      <div className="contact-card contact-adult">
        <span className="contact-icon">
          <UsersRound size={22} strokeWidth={1.7} />
        </span>
        <div>
          <strong>Взрослый рядом</strong>
          <span>Учитель, родитель, тренер</span>
        </div>
      </div>
      <a className="contact-card" href="tel:103" aria-label="103 — скорая помощь в России">
        <span className="contact-icon">
          <Phone size={22} strokeWidth={1.7} />
        </span>
        <div>
          <strong>103</strong>
          <span>Скорая помощь</span>
        </div>
        <ArrowUpRight size={17} className="contact-arrow" />
      </a>
      <a className="contact-card" href="tel:112" aria-label="112 — экстренная помощь">
        <span className="contact-icon">
          <PhoneCall size={22} strokeWidth={1.7} />
        </span>
        <div>
          <strong>112</strong>
          <span>Экстренная помощь</span>
        </div>
        <ArrowUpRight size={17} className="contact-arrow" />
      </a>
    </div>
  )
}

function Intro({ answers, onStart }: { answers: number[]; onStart: () => void }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <Starburst className="small-star" /> {SCENARIO_COUNT} ситуаций. Один важный навык.
          </div>
          <h1 id="main-heading" tabIndex={-1} className="hero-title">
            Астма:
            <br />
            <span>что делать,</span>
            <br />
            если
            <span className="title-ellipsis">
              …
              <svg viewBox="0 0 116 13" aria-hidden="true">
                <path d="M3 9C33 1 72 1 112 5" />
              </svg>
            </span>
          </h1>
          <p className="hero-description">
            Когда другу трудно дышать, важны простые действия и твоё спокойствие.
            <br className="desktop-break" /> Потренируемся помогать вместе?
          </p>
          <div className="hero-actions">
            <button className="button button-primary button-large" onClick={onStart}>
              {answers.length === scenarios.length
                ? 'К моему результату'
                : answers.length > 0
                  ? 'Продолжить квест'
                  : 'Начать квест'}
              <ArrowRight size={21} />
            </button>
            <button
              className="button-text hero-secondary"
              onClick={() =>
                document.getElementById('quest-path')?.scrollIntoView({
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                })
              }
            >
              Что меня ждёт? <ArrowDown size={17} />
            </button>
          </div>
          <div className="hero-meta">
            <span>
              <Flag size={16} /> {SCENARIO_COUNT} ситуаций
            </span>
            <span>
              <Clock3 size={17} /> ~15 минут
            </span>
            <span>
              <Heart size={16} /> Без стресса
            </span>
          </div>
          <p className="hero-safety-note">
            <ShieldCheck size={14} aria-hidden="true" />
            Учебный квест, не медицинская инструкция.
          </p>
        </div>
        <div className="hero-visual">
          <div className="visual-dots" aria-hidden="true" />
          <Starburst className="visual-spark spark-one" />
          <div className="hero-picture">
            <img
              src={assetUrl('images/school-friends.webp')}
              alt="Саша сидит на скамейке у школы, а подруга спокойно поддерживает его, положив руку ему на плечо."
              width="1152"
              height="928"
              fetchPriority="high"
            />
            <div className="mission-label">
              <span className="mission-dot" /> Твоя миссия — быть рядом
            </div>
            <div className="hero-picture-caption">
              <span className="little-heart">
                <Heart size={15} fill="currentColor" strokeWidth={0} />
              </span>{' '}
              Ты не врач. Ты — друг.
            </div>
          </div>
          <div className="friend-note">
            <span className="friend-note-icon">
              <HeartHandshake size={29} strokeWidth={1.6} />
            </span>
            <div>
              <strong>Помочь может каждый</strong>
              <span>Начни с простых действий</span>
            </div>
            <span className="note-check">
              <Check size={15} strokeWidth={2.5} />
            </span>
          </div>
          <div className="round-sticker" aria-hidden="true">
            <Sparkles size={25} strokeWidth={1.4} />
            <span>ты справишься</span>
          </div>
        </div>
      </section>
      <Disclaimer />
      <QuestOverview />
    </>
  )
}

function Rules({
  onContinue,
  onBack,
  hasProgress,
}: {
  onContinue: () => void
  onBack: () => void
  hasProgress: boolean
}) {
  return (
    <section className="rules-page page-content">
      <Journey stage={1} />
      <div className="page-heading">
        <span className="eyebrow">
          <Sparkles size={15} /> Сначала немного уверенности
        </span>
        <h1 id="main-heading" tabIndex={-1}>
          Если другу трудно дышать,
          <br />
          <span className="highlight">начни с простого.</span>
        </h1>
        <p>
          Твоя задача — поддержать, позвать взрослого и не оставлять одного.
          <br className="desktop-break" /> Лечить и самостоятельно искать причину не нужно.
        </p>
      </div>
      <div className="rule-steps">
        {steps.map((step, i) => {
          const Icon = stepIcons[i]
          return (
            <article className="rule-step" key={step.title}>
              <div className="rule-step-top">
                <span className="step-art">
                  <Icon size={31} strokeWidth={1.5} />
                </span>
                <span className="step-index">{String(i + 1).padStart(2, '0')}</span>
                {i < 3 && <ArrowRight size={20} className="step-connector" />}
              </div>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </article>
          )
        })}
      </div>
      <div className="urgent-note">
        <Info size={19} />
        <p>
          Если нужна срочная помощь — звони <strong>103 или 112 сразу</strong>, не дожидаясь взрослого.
        </p>
      </div>
      <div className="rules-contrast">
        <section className="contrast-card do-card">
          <h2>
            <span className="contrast-symbol">
              <Check size={18} />
            </span>{' '}
            Так помогаем
          </h2>
          <ul>
            <li>Спокойно говорим: «Я рядом, сейчас позовём помощь».</li>
            <li>Помогаем удобно сесть и остаёмся с другом.</li>
            <li>Сразу сообщаем взрослому, при необходимости звоним 103 или 112.</li>
          </ul>
        </section>
        <section className="contrast-card dont-card">
          <h2>
            <span className="contrast-symbol">
              <X size={18} />
            </span>{' '}
            Так не делаем
          </h2>
          <ul>
            <li>Не просим «потерпеть» или продолжать занятие.</li>
            <li>Не отправляем друга одного искать помощь.</li>
            <li>Не предлагаем лекарства и не придумываем лечение.</li>
          </ul>
        </section>
      </div>
      <div className="rules-footer">
        <div className="rules-scoring">
          <Trophy size={23} strokeWidth={1.5} />
          <p>
            <strong>За каждое решение — 0, 5 или 10 баллов.</strong>
            <span>После ответа узнаешь почему. Без таймера и оценок в журнал.</span>
          </p>
        </div>
        <div className="rules-actions">
          <button className="button-text" onClick={onBack}>
            <ArrowLeft size={17} /> Назад
          </button>
          <button className="button button-primary" onClick={onContinue}>
            {hasProgress ? 'Продолжить квест' : 'Всё понятно, начнём'} <ArrowRight size={19} />
          </button>
        </div>
      </div>
      <p className="country-note">{countryNote}</p>
    </section>
  )
}

function Quiz({
  index,
  answers,
  onAnswer,
  onNext,
  onRules,
}: {
  index: number
  answers: number[]
  onAnswer: (choice: number) => void
  onNext: () => void
  onRules: () => void
}) {
  const scene = scenarios[index]
  const Icon = sceneIcons[scene.icon]
  const selected = answers[index]
  const answer = selected !== undefined ? scene.options[selected] : undefined
  const isLast = index === scenarios.length - 1
  const revealRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!answer) return
    const frame = requestAnimationFrame(() => {
      const reveal = revealRef.current
      if (reveal && reveal.getBoundingClientRect().bottom > window.innerHeight - 24) {
        reveal.scrollIntoView({
          block: 'nearest',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [answer, index])

  return (
    <section className="quiz-page page-content">
      <Journey stage={2} />
      <div className="quiz-topline">
        <button className="button-text" onClick={onRules}>
          <ArrowLeft size={16} /> Вспомнить правила
        </button>
        <span className="quiz-no-pressure">
          <Heart size={14} /> Здесь можно учиться на ошибках
        </span>
      </div>
      <div className="quiz-progress-heading">
        <span className="eyebrow">
          Глава {Math.floor(index / CHAPTER_SIZE) + 1} · {chapters[Math.floor(index / CHAPTER_SIZE)].title}
        </span>
        <span>
          Ситуация <b>{index + 1}</b> из {SCENARIO_COUNT}
        </span>
      </div>
      <div
        className="quiz-progress"
        style={{ '--scenario-count': SCENARIO_COUNT } as CSSProperties}
        role="progressbar"
        aria-label="Пройдено ситуаций"
        aria-valuenow={answers.length}
        aria-valuemin={0}
        aria-valuemax={SCENARIO_COUNT}
      >
        {scenarios.map((item, i) => (
          <span
            key={item.id}
            className={`${i < index || (i === index && answer) ? 'complete' : ''} ${i === index ? 'current' : ''}`}
          />
        ))}
      </div>
      <div className="quiz-layout">
        <div className={`quiz-scene scene-${scene.color}`}>
          <div className="quiz-scene-badge">
            <Icon size={17} strokeWidth={1.7} />
            <span>{scene.location}</span>
            <span className="quiz-scene-number">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <img
            className="quiz-scene-image"
            src={assetUrl(scene.image)}
            alt={scene.imageAlt}
            width="1152"
            height="928"
            fetchPriority="high"
          />
          <div className="quiz-scene-caption">
            <MapPin size={15} />
            <span>{scene.setting}</span>
          </div>
          <div className="scene-thought">
            <span>
              <HandHeart size={24} strokeWidth={1.5} />
            </span>
            <p>{scene.note}</p>
          </div>
        </div>
        <div className="question-area">
          <span className="question-eyebrow">
            Ситуация {String(index + 1).padStart(2, '0')} <span>/ {SCENARIO_COUNT}</span>
          </span>
          <h1 id="main-heading" tabIndex={-1}>
            {scene.title}
          </h1>
          <p className="question-description">{scene.description}</p>
          <div className="answer-label">
            <span>Как поступишь ты?</span>
            <span>Выбери один ответ</span>
          </div>
          <div className={`answer-options ${answer ? 'is-answered' : ''}`}>
            {scene.options.map((option, i) => {
              const isSelected = selected === i
              const isBest = !!answer && option.points === 10
              return (
                <button
                  key={option.text}
                  className={`answer-option ${isSelected ? `selected points-${option.points}` : ''} ${isBest && !isSelected ? 'best-choice' : ''}`}
                  onClick={() => onAnswer(i)}
                  disabled={!!answer}
                  aria-pressed={isSelected}
                  aria-label={`${i + 1}. ${option.text}${answer ? ` — ${option.points} баллов` : ''}`}
                >
                  <span className="answer-key">
                    {(isSelected && option.points === 10) || (isBest && !isSelected) ? (
                      <Check size={18} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="answer-text">
                    {option.text}
                    {isBest && !isSelected && <small>Так безопаснее</small>}
                  </span>
                  {isSelected ? (
                    <span className="answer-points">+{option.points}</span>
                  ) : (
                    <span className="answer-radio" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
          {answer ? (
            <div className="answer-reveal" ref={revealRef}>
              <div className={`feedback feedback-${answer.points}`} role="status">
                <span className="feedback-icon">
                  {answer.points === 10 ? <Sparkles size={23} /> : <Lightbulb size={23} />}
                </span>
                <div>
                  <h2>
                    {answer.points === 10
                      ? 'Ты рядом — и это правильно!'
                      : answer.points === 5
                        ? 'Хорошее начало!'
                        : 'Давай разберёмся вместе'}
                  </h2>
                  <p>{answer.feedback}</p>
                </div>
              </div>
              <div className="next-action">
                <span>{isLast ? `Все ${SCENARIO_COUNT} ситуаций позади` : 'Ещё один шаг к уверенности'}</span>
                <button className="button button-primary" onClick={onNext}>
                  {isLast ? 'Узнать результат' : 'Следующая ситуация'} <ArrowRight size={19} />
                </button>
              </div>
            </div>
          ) : (
            <p className="keyboard-hint">
              Можно отвечать клавишами <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>
              <span>Не спеши. Таймера нет.</span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Result({
  answers,
  onRestart,
  onDownload,
}: {
  answers: number[]
  onRestart: () => void
  onDownload: () => void
}) {
  const score = getScore(answers)
  const range = getScoreRange(score)
  return (
    <section className="result-page page-content">
      <Journey stage={3} />
      <div className="page-heading result-heading">
        <span className="completion-pill">
          <Check size={14} /> Квест пройден
        </span>
        <h1 id="main-heading" tabIndex={-1}>
          Быть рядом — <span className="highlight">уже важно.</span>
        </h1>
        <p>Все {SCENARIO_COUNT} ситуаций позади. А полезный навык — с тобой.</p>
      </div>
      <div className="result-main">
        <section className="score-result-card" aria-label={`Твой результат: ${score} из ${MAX_SCORE} баллов`}>
          <Starburst className="result-spark result-spark-one" />
          <Starburst className="result-spark result-spark-two" />
          <span className="eyebrow">Твой результат</span>
          <div
            className="score-ring"
            style={{ '--score-angle': `${(score / MAX_SCORE) * 360}deg` } as CSSProperties}
          >
            <div className="score-ring-inner">
              <Trophy size={24} strokeWidth={1.5} />
              <strong>
                {score}
                <span>/ {MAX_SCORE}</span>
              </strong>
              <span>баллов заботы</span>
            </div>
          </div>
          <h2>{range.label}</h2>
          <p>{range.text}</p>
        </section>
        <section className="remember-card">
          <div className="remember-heading">
            <span className="remember-bookmark">
              <Bookmark size={24} strokeWidth={1.6} />
            </span>
            <div>
              <span className="eyebrow">Твоя памятка</span>
              <h2>Запомни простое</h2>
            </div>
          </div>
          <ol className="remember-list">
            {steps.map((step, i) => {
              const Icon = stepIcons[i]
              return (
                <li key={step.title}>
                  <span className="remember-number">{i + 1}</span>
                  <div>
                    <h3>{step.short}</h3>
                    <p>{step.description}</p>
                  </div>
                  <Icon size={24} strokeWidth={1.5} className="remember-step-icon" />
                </li>
              )
            })}
          </ol>
          <button className="save-link" onClick={onDownload}>
            <Download size={17} /> Сохранить памятку <ArrowDown size={16} />
          </button>
        </section>
      </div>
      <ol className="score-ranges" aria-label="Как понимать результат">
        {scoreRanges.map((item) => (
          <li
            key={item.min}
            className={range.min === item.min ? 'active' : ''}
            aria-current={range.min === item.min ? 'true' : undefined}
          >
            <span>
              {item.min}–{item.max} баллов {range.min === item.min && <Check size={14} />}
            </span>
            <strong>{item.label}</strong>
          </li>
        ))}
      </ol>
      <section className="result-help">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Не оставайся с этим один</span>
            <h2>К кому обратиться за помощью</h2>
          </div>
          <p>
            Если нужна срочная помощь,
            <br />
            звони сразу.
          </p>
        </div>
        <HelpContacts />
        <p className="country-note">{countryNote}</p>
      </section>
      <details className="review">
        <summary>
          <span>
            <NotebookPen size={21} /> Посмотреть мои ответы
          </span>
          <span className="review-counter">
            {SCENARIO_COUNT} ситуаций <ChevronDown size={19} />
          </span>
        </summary>
        <div className="review-list">
          {scenarios.map((scene, i) => {
            const choice = scene.options[answers[i]]
            return (
              <article key={scene.id}>
                <div className="review-title">
                  <h3>
                    <span>{String(i + 1).padStart(2, '0')}</span> {scene.location}
                  </h3>
                  <span className={`review-points review-points-${choice.points}`}>
                    +{choice.points} баллов
                  </span>
                </div>
                <p className="review-choice">{choice.text}</p>
                <p className="review-feedback">{choice.feedback}</p>
              </article>
            )
          })}
        </div>
      </details>
      <Disclaimer final />
      <div className="result-actions">
        <button className="button button-primary button-large" onClick={onRestart}>
          <RotateCcw size={19} /> Пройти заново
        </button>
        <span>
          <Heart size={16} /> Забота становится привычкой с практикой.
        </span>
      </div>
    </section>
  )
}

function HelpDialog({
  open,
  onClose,
  onDownload,
}: {
  open: boolean
  onClose: () => void
  onDownload: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="help-dialog"
      aria-labelledby="help-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-top">
          <span className="eyebrow">
            <Bookmark size={15} /> Пусть будет под рукой
          </span>
          <button className="icon-button dialog-close" onClick={onClose} aria-label="Закрыть памятку">
            <X size={23} />
          </button>
        </div>
        <h2 id="help-title">
          Другу трудно дышать?
          <br />
          <span className="highlight">Вот как быть рядом.</span>
        </h2>
        <ol className="dialog-steps">
          {steps.map((step, i) => {
            const Icon = stepIcons[i]
            return (
              <li key={step.title}>
                <span className="dialog-step-icon">
                  <Icon size={23} strokeWidth={1.5} />
                </span>
                <div>
                  <h3>
                    <span>{String(i + 1).padStart(2, '0')}.</span> {step.title}
                  </h3>
                  <p>{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>
        <div className="dialog-urgent">
          <Info size={18} />
          <p>Если помощь нужна срочно, звони сразу — не жди взрослого.</p>
        </div>
        <HelpContacts compact />
        <p className="country-note">{countryNote}</p>
        <p className="dialog-disclaimer">{disclaimer}</p>
        <button className="button button-primary download-button" onClick={onDownload}>
          <Download size={18} /> Сохранить памятку
        </button>
      </div>
    </dialog>
  )
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [helpOpen, setHelpOpen] = useState(false)
  const [toast, setToast] = useState('')
  const { screen, questionIndex, answers } = progress
  const score = getScore(answers)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback((nextScreen: Screen) => {
    setProgress((previous) => ({ ...previous, screen: nextScreen }))
  }, [])

  const chooseAnswer = useCallback((choice: number) => {
    setProgress((previous) => {
      if (
        previous.screen !== 'play' ||
        previous.answers.length !== previous.questionIndex ||
        ![0, 1, 2].includes(choice)
      )
        return previous
      return { ...previous, answers: [...previous.answers, choice] }
    })
  }, [])

  const nextQuestion = () => {
    setProgress((previous) => {
      if (previous.answers.length <= previous.questionIndex) return previous
      return previous.questionIndex < scenarios.length - 1
        ? { ...previous, questionIndex: previous.questionIndex + 1 }
        : { ...previous, screen: 'result' }
    })
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      /* The quest also works when browser storage is unavailable. */
    }
  }, [progress])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.getElementById('main-heading')?.focus({ preventScroll: true })
    const pageTitles: Record<Screen, string> = {
      intro: 'Астма: что делать, если…',
      rules: 'Правила квеста',
      play: `Ситуация ${questionIndex + 1}: ${scenarios[questionIndex].location}`,
      result: 'Твой результат',
    }
    document.title = `${pageTitles[screen]} — Рядом`
    if (screen === 'play' && questionIndex < scenarios.length - 1) {
      const image = new Image()
      image.src = assetUrl(scenarios[questionIndex + 1].image)
    }
  }, [screen, questionIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screen !== 'play' || helpOpen || event.repeat || event.ctrlKey || event.metaKey || event.altKey)
        return
      if (
        event.target instanceof HTMLElement &&
        (event.target.matches('input, textarea, select') || event.target.isContentEditable)
      )
        return
      if (['1', '2', '3'].includes(event.key)) {
        event.preventDefault()
        chooseAnswer(Number(event.key) - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, helpOpen, chooseAnswer])

  useEffect(
    () => () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current)
    },
    [],
  )

  const downloadChecklist = () => {
    const text = [
      'РЯДОМ. Астма: что делать, если…',
      '',
      'ЗАПОМНИ',
      '',
      ...steps.map((step, i) => `${i + 1}. ${step.title}\n${step.description}\n`),
      'Если помощь нужна срочно, звони сразу — не жди взрослого.',
      '',
      'ПОМОЩЬ',
      'Взрослый рядом: учитель, родитель, тренер.',
      '103 — скорая помощь в России.',
      '112 — экстренная помощь.',
      '',
      countryNote,
      '',
      disclaimer,
      'В реальной ситуации сразу сообщи взрослому, при необходимости вызови помощь.',
    ].join('\n')
    const blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ryadom-pamyatka.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast('Памятка готова к сохранению')
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Перейти к содержимому
      </a>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-brand">
            <Brand onClick={() => goTo('intro')} />
            <span className="brand-caption">Квест о помощи другу</span>
          </div>
          <nav className="header-nav" aria-label="Основная навигация">
            <button
              className={screen === 'intro' ? 'active' : ''}
              onClick={() => goTo('intro')}
              aria-current={screen === 'intro' ? 'page' : undefined}
            >
              О квесте
            </button>
            <button
              className={screen === 'rules' ? 'active' : ''}
              onClick={() => goTo('rules')}
              aria-current={screen === 'rules' ? 'page' : undefined}
            >
              Правила
            </button>
            <button onClick={() => setHelpOpen(true)}>
              <Bookmark size={15} /> Памятка
            </button>
          </nav>
          <div className="header-status">
            <span className="age-badge">
              <UsersRound size={16} strokeWidth={1.7} />
              11–17 лет
            </span>
            <div
              className="score-badge"
              aria-label={`Твой счёт: ${score} из ${MAX_SCORE} баллов`}
              aria-live="polite"
            >
              <Trophy size={19} strokeWidth={1.7} />
              <span className="score-number" key={score} data-testid="score">
                {score}
              </span>
              <span className="score-out-of">/ {MAX_SCORE}</span>
            </div>
          </div>
        </div>
      </header>
      <main id="main-content" className={`site-main screen-${screen}`} key={`${screen}-${questionIndex}`}>
        {screen === 'intro' && (
          <Intro
            answers={answers}
            onStart={() =>
              goTo(answers.length === scenarios.length ? 'result' : answers.length > 0 ? 'play' : 'rules')
            }
          />
        )}
        {screen === 'rules' && (
          <Rules
            onContinue={() => goTo(answers.length === scenarios.length ? 'result' : 'play')}
            onBack={() => goTo('intro')}
            hasProgress={answers.length > 0}
          />
        )}
        {screen === 'play' && (
          <Quiz
            index={questionIndex}
            answers={answers}
            onAnswer={chooseAnswer}
            onNext={nextQuestion}
            onRules={() => goTo('rules')}
          />
        )}
        {screen === 'result' && (
          <Result
            answers={answers}
            onRestart={() => setProgress({ ...freshProgress, answers: [] })}
            onDownload={downloadChecklist}
          />
        )}
      </main>
      <footer className="site-footer">
        <div className="footer-left">
          <Brand onClick={() => goTo('intro')} footer />
          <span>Забота начинается с тебя.</span>
        </div>
        <div className="footer-right">
          <span>Учебный квест · 2026</span>
          <button onClick={() => setHelpOpen(true)}>
            Памятка всегда рядом <ArrowUpRight size={15} />
          </button>
        </div>
      </footer>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} onDownload={downloadChecklist} />
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}
