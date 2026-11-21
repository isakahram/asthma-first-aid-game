import { useState } from 'react'
import { Heart } from 'lucide-react'
import { chapters, CHAPTER_SIZE, SCENARIO_COUNT, scenarios } from './data'
import { sceneIcons } from './icons'
import { assetUrl } from './paths'

export default function QuestOverview() {
  const [chapterIndex, setChapterIndex] = useState(0)
  const chapter = chapters[chapterIndex]
  const start = chapterIndex * CHAPTER_SIZE
  return (
    <section className="quest-overview" id="quest-path" aria-labelledby="overview-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Школа, друзья и знакомые места</span>
          <h2 id="overview-heading">Один друг. {SCENARIO_COUNT} ситуаций.</h2>
        </div>
        <p>
          4 главы по 5 ситуаций.
          <br />
          <span>Можно сделать паузу — прогресс сохранится.</span>
        </p>
      </div>
      <div className="chapter-switcher" role="group" aria-label="Посмотреть ситуации главы">
        {chapters.map((item, i) => (
          <button
            key={item.title}
            aria-pressed={i === chapterIndex}
            aria-controls="overview-scenes"
            onClick={() => setChapterIndex(i)}
          >
            <span className="chapter-switcher-number">0{i + 1}</span>
            <span>{item.title}</span>
            <small>
              {i * CHAPTER_SIZE + 1}–{(i + 1) * CHAPTER_SIZE}
            </small>
          </button>
        ))}
      </div>
      <p className="chapter-description" aria-live="polite">
        {chapter.description}
      </p>
      <ol className="scene-grid" id="overview-scenes" start={start + 1}>
        {scenarios.slice(start, start + CHAPTER_SIZE).map((scene, i) => {
          const Icon = sceneIcons[scene.icon]
          return (
            <li className={`scene-card scene-${scene.color}`} key={scene.id}>
              <div className="scene-thumbnail">
                <img src={assetUrl(scene.image)} alt="" width="360" height="240" loading="lazy" />
                <span className="scene-number">{String(start + i + 1).padStart(2, '0')}</span>
              </div>
              <div className="scene-card-details">
                <span className="scene-icon">
                  <Icon size={21} strokeWidth={1.5} />
                </span>
                <div>
                  <h3>{scene.location}</h3>
                  <p>{scene.preview}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="overview-bottom">
        <span className="overlapping-hearts" aria-hidden="true">
          <Heart size={15} fill="currentColor" />
          <Heart size={15} fill="currentColor" />
        </span>
        Не нужно быть супергероем, чтобы поддержать друга.
      </div>
    </section>
  )
}
