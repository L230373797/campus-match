import './App.css'

const discoveryTags = ['同校', 'MBTI', '生辰', '搭子', '树洞话题']

const moodMetrics = [
  { label: '爱情', value: 58, color: '#ff7db8' },
  { label: '财富', value: 74, color: '#ffc857' },
  { label: '事业', value: 81, color: '#8ca8ff' },
  { label: '学习', value: 67, color: '#57d7ff' },
]

const shortcuts = [
  { title: 'MBTI', note: '性格名片', tone: 'yellow' },
  { title: '星座', note: '节奏偏好', tone: 'blue' },
  { title: '生辰', note: '合拍参考', tone: 'orange' },
  { title: '缘分盘', note: '今日推荐', tone: 'pink' },
  { title: '倾诉', note: '匿名树洞', tone: 'peach' },
  { title: '智慧卡', note: '破冰问题', tone: 'violet' },
]

const feedCards = [
  {
    title: '今晚图书馆搭子',
    text: '想找一个安静学习的人，互相监督到闭馆。',
    meta: '北京大学 · 学习',
  },
  {
    title: '周末散步聊天',
    text: '从操场走到湖边，聊电影、歌单和最近的小烦恼。',
    meta: '同城校区 · 低压力',
  },
]

function Icon({ name }) {
  const icons = {
    search: (
      <path d="m20 20-4.2-4.2m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    spark: (
      <path d="M12 3.5 14.2 9l5.8 2.2-5.8 2.2L12 19l-2.2-5.6L4 11.2 9.8 9 12 3.5Z" />
    ),
    home: <path d="M4 11.5 12 5l8 6.5V20H6v-8" />,
    chat: <path d="M5 6.5h14v9H9l-4 3v-12Z" />,
    ai: <path d="M12 4c4.2 0 7.5 2.8 7.5 6.4S16.2 17 12 17c-.7 0-1.4-.1-2-.2L5 20l1.5-4.4A6.1 6.1 0 0 1 4.5 10.4C4.5 6.8 7.8 4 12 4Z" />,
    online: <path d="M7 12.2a5 5 0 0 1 10 0M4 12.2a8 8 0 0 1 16 0M12 16h.01" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />,
  }

  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

function Background() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene-ray scene-ray-a" />
      <div className="scene-ray scene-ray-b" />
      <div className="scene-glow scene-glow-a" />
      <div className="scene-glow scene-glow-b" />
      <div className="scene-grid" />
    </div>
  )
}

function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="spark" />
        </span>
        <span>
          <strong>校园匹配</strong>
          <small>同校真实连接，低压力开始</small>
        </span>
      </div>
      <nav className="desktop-nav" aria-label="主要入口">
        <a href="#discover">发现</a>
        <a href="#match">匹配</a>
        <a href="#profile">资料</a>
      </nav>
      <a className="top-action" href="/login">
        进入发现
        <span aria-hidden="true">→</span>
      </a>
    </header>
  )
}

function MoodCard() {
  return (
    <section className="mood-card" aria-label="今日心情">
      <div>
        <div className="section-label">自己</div>
        <div className="mood-score">
          <span>今日心情</span>
          <strong>70</strong>
          <small>分</small>
        </div>
        <p>今天适合先看看同校推荐，找一个能轻松聊起来的人。</p>
      </div>
      <div className="metric-bars">
        {moodMetrics.map((item) => (
          <div className="metric-bar" key={item.label}>
            <span className="bar-track">
              <i style={{ height: `${item.value}%`, background: item.color }} />
            </span>
            <strong>{item.value}</strong>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

function ShortcutGrid() {
  return (
    <section className="shortcut-grid" aria-label="功能入口">
      {shortcuts.map((item) => (
        <button className="shortcut" type="button" key={item.title}>
          <span className={`shortcut-glyph ${item.tone}`}>{item.title.slice(0, 1)}</span>
          <strong>{item.title}</strong>
          <small>{item.note}</small>
        </button>
      ))}
    </section>
  )
}

function MatchPreview() {
  return (
    <section className="match-preview" id="match">
      <div className="preview-copy">
        <span className="section-label">今日推荐</span>
        <h2>从同校、兴趣和节奏里，找到更自然的开场。</h2>
        <div className="tag-row">
          {discoveryTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="profile-card">
        <div className="avatar-ring">
          <span />
        </div>
        <div>
          <strong>73</strong>
          <small>合拍分</small>
        </div>
        <p>同校认证 · 喜欢自习、电影和夜晚散步</p>
        <button type="button">发现</button>
      </div>
    </section>
  )
}

function Feed() {
  return (
    <section className="feed" id="discover">
      <div className="feed-tabs" aria-label="内容分类">
        {['关注', '为你推荐', '测试', '星座', '树洞', '心理'].map((tab, index) => (
          <button className={index === 1 ? 'active' : ''} type="button" key={tab}>
            {tab}
          </button>
        ))}
      </div>
      <div className="feed-grid">
        {feedCards.map((card) => (
          <article className="feed-card" key={card.title}>
            <div className="feed-visual">
              <span>{card.title.slice(0, 2)}</span>
            </div>
            <div>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
              <small>{card.meta}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function BottomNav() {
  const items = [
    ['home', '首页'],
    ['chat', '消息'],
    ['ai', '问问'],
    ['online', '在线'],
    ['user', '我的'],
  ]

  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {items.map(([icon, label], index) => (
        <a className={index === 2 ? 'center' : ''} href="/" key={label}>
          <Icon name={icon} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  )
}

function App() {
  return (
    <main className="app-shell">
      <Background />
      <Header />
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-copy">
            <span className="section-label">Campus Match</span>
            <h1>校园里的真实连接，从一条低压力消息开始</h1>
            <p>基于校内认证、兴趣标签、MBTI、生辰和树洞话题，先找到聊得来的同校新朋友。</p>
            <div className="hero-actions">
              <a className="primary-action" href="/login">立即开始</a>
              <a className="ghost-action" href="#discover">先看看内容</a>
            </div>
          </div>
          <MatchPreview />
        </div>
      </section>
      <MoodCard />
      <ShortcutGrid />
      <Feed />
      <BottomNav />
    </main>
  )
}

export default App
