import { useEffect, useMemo, useState } from 'react'
import './App.css'
import ScrollReveal from './ScrollReveal'

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

const fallbackSchools = [
  { name: '北京大学', city: '北京', province: '北京' },
  { name: '清华大学', city: '北京', province: '北京' },
  { name: '中国人民大学', city: '北京', province: '北京' },
  { name: '复旦大学', city: '上海', province: '上海' },
  { name: '上海交通大学', city: '上海', province: '上海' },
  { name: '浙江大学', city: '杭州', province: '浙江' },
  { name: '南京大学', city: '南京', province: '江苏' },
  { name: '武汉大学', city: '武汉', province: '湖北' },
  { name: '中山大学', city: '广州', province: '广东' },
  { name: '四川大学', city: '成都', province: '四川' },
]

async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || '请求失败，请稍后再试')
  }
  return payload
}

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
        <ScrollReveal as="h2" baseOpacity={0.24} blurStrength={2} wordAnimationEnd="bottom 82%">
          从同校、兴趣和节奏里，找到更自然的开场。
        </ScrollReveal>
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

function AuthPage() {
  const [mode, setMode] = useState('login')
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [schools, setSchools] = useState(() => {
    if (window.CAMPUS_CHINA_UNIVERSITIES?.length) {
      return window.CAMPUS_CHINA_UNIVERSITIES
    }
    return fallbackSchools
  })
  const [form, setForm] = useState({
    email: '',
    password: '',
    emailCode: '',
    school: '',
    nickname: '',
    grade: '',
    major: '',
    college: '',
    mbti: '',
    birthDate: '',
  })

  useEffect(() => {
    if (window.CAMPUS_CHINA_UNIVERSITIES?.length) {
      return
    }

    const script = document.createElement('script')
    script.src = '/assets/data/china-universities.js'
    script.async = true
    script.onload = () => {
      if (window.CAMPUS_CHINA_UNIVERSITIES?.length) {
        setSchools(window.CAMPUS_CHINA_UNIVERSITIES)
      }
    }
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      if (window.scrollY / maxScroll > 0.86) {
        setOverlayOpen(true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const schoolSuggestions = useMemo(() => {
    const query = form.school.trim().toLowerCase()
    if (!query) {
      return schools.slice(0, 6)
    }
    if (window.CampusUniversityOptions?.searchSchools) {
      return window.CampusUniversityOptions.searchSchools(form.school, 6)
    }
    return schools
      .filter((school) => {
        const name = school.name || ''
        const city = school.city || ''
        const province = school.province || ''
        const abbr = school.abbr || ''
        return name.includes(form.school) || city.includes(form.school) || province.includes(form.school) || abbr.includes(query)
      })
      .slice(0, 6)
  }, [form.school, schools])

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setNotice('')
  }

  const sendCode = async () => {
    if (!form.email.trim()) {
      setError('先填写 QQ 邮箱，再获取验证码。')
      return
    }

    try {
      setSendingCode(true)
      setError('')
      const payload = await apiRequest('/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ email: form.email }),
      })
      setNotice(payload.data?.debugCode ? `验证码已生成：${payload.data.debugCode}` : '验证码已发送，请查看 QQ 邮箱。')
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingCode(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (payload.data?.token) {
        localStorage.setItem('token', payload.data.token)
      }
      setNotice(mode === 'login' ? '登录成功，正在回到首页。' : '注册成功，正在回到首页。')
      window.setTimeout(() => {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, 450)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <Background />
      <section className="auth-story">
        <div className="auth-story-copy">
          <span className="section-label">Campus Match</span>
          <ScrollReveal as="h1" baseOpacity={0.24} blurStrength={2} wordAnimationEnd="bottom 82%">
            先看见感觉，再开始认识。
          </ScrollReveal>
          <ScrollReveal as="p" baseOpacity={0.3} blurStrength={2} wordAnimationEnd="bottom 84%">
            你可以慢慢往下滑。滑到底部时，登录或注册会自动出现，不用回头找入口。
          </ScrollReveal>
          <button className="primary-action" type="button" onClick={() => setOverlayOpen(true)}>
            现在开始
          </button>
        </div>
        <div className="auth-preview-panel">
          <MoodCard />
          <ShortcutGrid />
          <MatchPreview />
        </div>
        <div className="auth-bottom">
          <span className="section-label">准备好了</span>
          <ScrollReveal as="h2" baseOpacity={0.18} blurStrength={4} wordAnimationEnd="bottom 60%">
            从一个 QQ 邮箱验证码开始，进入你的校园匹配。
          </ScrollReveal>
          <button className="primary-action" type="button" onClick={() => setOverlayOpen(true)}>
            打开登录注册
          </button>
        </div>
      </section>

      <div
        className={`auth-overlay ${overlayOpen ? 'open' : ''}`}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setOverlayOpen(false)
          }
        }}
      >
        <section className="auth-card" aria-label="登录注册">
          <div className="auth-card-head">
            <div className="brand-mark">
              <Icon name="spark" />
            </div>
            <div>
              <h2>校园匹配</h2>
              <p>{mode === 'login' ? '欢迎回来，继续认识同校新朋友。' : '注册后先完善资料，再开始推荐。'}</p>
            </div>
          </div>

          <div className="auth-switch" role="tablist" aria-label="登录注册切换">
            <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
              登录
            </button>
            <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
              注册
            </button>
          </div>

          {(error || notice) && (
            <div className={`auth-message ${error ? 'error' : ''}`}>
              {error || notice}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <label>
              <span>QQ 邮箱</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="123456@qq.com"
                required
              />
            </label>

            <label>
              <span>密码</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="至少 6 位"
                required
              />
            </label>

            {mode === 'register' && (
              <>
                <label>
                  <span>验证码</span>
                  <div className="code-row">
                    <input
                      value={form.emailCode}
                      onChange={(event) => updateField('emailCode', event.target.value)}
                      placeholder="邮箱验证码"
                      required
                    />
                    <button type="button" onClick={sendCode} disabled={sendingCode}>
                      {sendingCode ? '发送中' : '获取'}
                    </button>
                  </div>
                </label>

                <label className="school-field">
                  <span>学校</span>
                  <input
                    value={form.school}
                    onChange={(event) => updateField('school', event.target.value)}
                    placeholder="输入学校名称"
                    required
                  />
                  <div className="school-suggestions">
                    {schoolSuggestions.map((school) => (
                      <button
                        type="button"
                        key={`${school.name}-${school.city || school.province || ''}`}
                        onClick={() => updateField('school', school.name)}
                      >
                        <strong>{school.name}</strong>
                        <small>{[school.province, school.city].filter(Boolean).join(' · ')}</small>
                      </button>
                    ))}
                  </div>
                </label>

                <div className="auth-grid">
                  <label>
                    <span>昵称</span>
                    <input
                      value={form.nickname}
                      onChange={(event) => updateField('nickname', event.target.value)}
                      placeholder="怎么称呼你"
                      required
                    />
                  </label>
                  <label>
                    <span>年级</span>
                    <select value={form.grade} onChange={(event) => updateField('grade', event.target.value)} required>
                      <option value="">选择</option>
                      <option>大一</option>
                      <option>大二</option>
                      <option>大三</option>
                      <option>大四</option>
                      <option>研一</option>
                      <option>研二</option>
                    </select>
                  </label>
                </div>

                <div className="auth-grid">
                  <label>
                    <span>专业</span>
                    <input value={form.major} onChange={(event) => updateField('major', event.target.value)} placeholder="你的专业" />
                  </label>
                  <label>
                    <span>学院</span>
                    <input value={form.college} onChange={(event) => updateField('college', event.target.value)} placeholder="所在学院" />
                  </label>
                </div>

                <div className="auth-grid">
                  <label>
                    <span>MBTI</span>
                    <input value={form.mbti} onChange={(event) => updateField('mbti', event.target.value.toUpperCase())} placeholder="例如 INFP" />
                  </label>
                  <label>
                    <span>生日</span>
                    <input type="date" value={form.birthDate} onChange={(event) => updateField('birthDate', event.target.value)} />
                  </label>
                </div>
              </>
            )}

            <button className="primary-action auth-submit" type="submit" disabled={loading}>
              {loading ? '处理中...' : mode === 'login' ? '登录' : '创建账号'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

function HomePage() {
  return (
    <main className="app-shell">
      <Background />
      <Header />
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-copy">
            <span className="section-label">Campus Match</span>
            <ScrollReveal as="h1" baseOpacity={0.24} blurStrength={2} wordAnimationEnd="bottom 82%">
              校园里的真实连接，从一条低压力消息开始
            </ScrollReveal>
            <ScrollReveal as="p" baseOpacity={0.3} blurStrength={2} wordAnimationEnd="bottom 84%">
              基于校内认证、兴趣标签、MBTI、生辰和树洞话题，先找到聊得来的同校新朋友。
            </ScrollReveal>
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

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (path === '/login') {
    return <AuthPage />
  }

  return <HomePage />
}

export default App
