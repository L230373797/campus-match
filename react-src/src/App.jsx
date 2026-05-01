import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import AnimatedList from './AnimatedList'
import ScrollReveal from './ScrollReveal'

const FloatingLines = lazy(() => import('./FloatingLines'))

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
  {
    title: 'MBTI 同频匹配',
    text: '想找一个同样慢热但稳定的人，从一个小测试开始认识。',
    meta: 'INFP · 轻聊天',
  },
  {
    title: '生日缘分小卡',
    text: '看看同一天或同星座的人，今天适不适合一起喝杯奶茶。',
    meta: '生辰 · 星座',
  },
  {
    title: '匿名树洞回应',
    text: '有些话不用马上说给熟人听，先找一个温柔的陌生同学接住。',
    meta: '树洞 · 心理',
  },
  {
    title: '晚自习搭子',
    text: '互相提醒别摸鱼，结束后可以一起走回宿舍。',
    meta: '学习 · 同校',
  },
]

const messageThreads = [
  {
    id: 'library',
    name: '图书馆搭子',
    school: '同校 · 学习',
    time: '刚刚',
    unread: 2,
    online: true,
    tone: 'blue',
    lastMessage: '今晚八点到闭馆可以吗？我在三楼靠窗那排。',
    messages: [
      { from: 'other', text: '我也想找个人一起自习，比较容易坐住。' },
      { from: 'me', text: '可以，我一般晚上会去图书馆。' },
      { from: 'other', text: '今晚八点到闭馆可以吗？我在三楼靠窗那排。' },
    ],
  },
  {
    id: 'walk',
    name: '周末散步局',
    school: '同城校区 · 低压力',
    time: '12:48',
    unread: 0,
    online: true,
    tone: 'pink',
    lastMessage: '天气好一点的话，从操场走到湖边就刚好。',
    messages: [
      { from: 'other', text: '我比较喜欢边走边聊，不用一直找话题。' },
      { from: 'me', text: '这个节奏挺舒服的。' },
      { from: 'other', text: '天气好一点的话，从操场走到湖边就刚好。' },
    ],
  },
  {
    id: 'mbti',
    name: 'INFP 同频',
    school: 'MBTI · 慢热聊天',
    time: '昨天',
    unread: 1,
    online: false,
    tone: 'violet',
    lastMessage: '我也不是很会秒回，但会认真回。',
    messages: [
      { from: 'other', text: '看到你也写了慢热，就点进来了。' },
      { from: 'me', text: '慢热但不冷淡，大概是这个状态。' },
      { from: 'other', text: '我也不是很会秒回，但会认真回。' },
    ],
  },
  {
    id: 'treehole',
    name: '树洞回应',
    school: '匿名 · 心理',
    time: '周二',
    unread: 0,
    online: false,
    tone: 'peach',
    lastMessage: '那种突然不知道往哪里走的感觉，我懂一点。',
    messages: [
      { from: 'other', text: '你的那条树洞我看到了。' },
      { from: 'other', text: '那种突然不知道往哪里走的感觉，我懂一点。' },
      { from: 'me', text: '谢谢你认真回。' },
    ],
  },
]

const revealTitleProps = {
  baseOpacity: 0.24,
  blurStrength: 2,
  wordAnimationEnd: 'bottom 82%',
}

const revealBodyProps = {
  baseOpacity: 0.3,
  blurStrength: 2,
  wordAnimationEnd: 'bottom 84%',
}

const revealSectionTitleProps = {
  baseOpacity: 0.2,
  blurStrength: 3,
  wordAnimationEnd: 'bottom 74%',
}

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

const profileFallback = {
  nickname: '校园新朋友',
  school: '你的学校',
  grade: '大二',
  major: '还没填写专业',
  college: '',
  bio: '写一点你最近喜欢做的事，系统会更容易帮你找到聊得来的人。',
  mbti: 'INFP',
  birthDate: '',
  relationshipGoal: '先从轻松聊天开始',
  tags: ['自习搭子', '电影', '散步', '低压力聊天'],
  sceneTags: ['图书馆', '周末', '树洞'],
  allowAnonymousMatch: true,
  allowOfflineEvents: true,
  verificationStatus: 'none',
  verificationBadge: '未认证',
  avatar: '',
  stats: {
    matches: 12,
    likes: 6,
    views: 38,
  },
}

const interestOptions = ['自习搭子', '电影', '散步', '音乐', '咖啡', '运动', '摄影', '游戏']
const sceneOptions = ['图书馆', '操场', '周末', '树洞', '食堂', '社团', '晚自习']
const backgroundWaves = ['top', 'middle', 'bottom']
const backgroundLineCount = [4, 6, 5]
const backgroundLineDistance = [9, 7, 10]

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token')
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function navigateTo(target) {
  const url = new URL(target, window.location.origin)
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.pushState({}, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.requestAnimationFrame(() => {
    if (url.hash) {
      document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value || '')
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatList(value) {
  return splitList(value).join('、')
}

function userToProfileForm(user = {}) {
  return {
    nickname: user.nickname || '',
    school: user.school || '',
    grade: user.grade || '',
    major: user.major || '',
    college: user.college || '',
    bio: user.bio || '',
    mbti: user.mbti || '',
    birthDate: user.birthDate || '',
    relationshipGoal: user.relationshipGoal || '',
    tags: formatList(user.tags),
    sceneTags: formatList(user.sceneTags),
    allowAnonymousMatch: user.allowAnonymousMatch ?? true,
    allowOfflineEvents: user.allowOfflineEvents ?? true,
  }
}

function uploadPayloadFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ contentType: file.type, data: reader.result })
    reader.onerror = () => reject(new Error('图片读取失败，请换一张试试。'))
    reader.readAsDataURL(file)
  })
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
    camera: <path d="M6.8 8 8.5 5.5h7L17.2 8H20v11H4V8h2.8Zm5.2 8a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" />,
    edit: <path d="M4 20h4l10.5-10.5a2.2 2.2 0 0 0-3.1-3.1L5 16.8V20Z" />,
    logout: <path d="M10 6H5v12h5m4-9 3 3-3 3m-7-3h10" />,
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
      <Suspense fallback={null}>
        <FloatingLines
          enabledWaves={backgroundWaves}
          lineCount={backgroundLineCount}
          lineDistance={backgroundLineDistance}
          bendRadius={6}
          bendStrength={-0.7}
          interactive
          parallax
          parallaxStrength={0.08}
          animationSpeed={0.55}
          gradientStart="#5bdcff"
          gradientMid="#e945f5"
          gradientEnd="#ffd8e7"
        />
      </Suspense>
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
        <a
          href="/#discover"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('/#discover')
          }}
        >
          发现
        </a>
        <a
          href="/#match"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('/#match')
          }}
        >
          匹配
        </a>
        <a
          href="/profile"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('/profile')
          }}
        >
          我的
        </a>
      </nav>
      <a
        className="top-action"
        href="/#discover"
        onClick={(event) => {
          event.preventDefault()
          navigateTo('/#discover')
        }}
      >
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
          <ScrollReveal as="span" {...revealSectionTitleProps}>
            今日心情
          </ScrollReveal>
          <strong>70</strong>
          <small>分</small>
        </div>
        <ScrollReveal as="p" {...revealBodyProps}>
          今天适合先看看同校推荐，找一个能轻松聊起来的人。
        </ScrollReveal>
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
        <ScrollReveal as="h2" {...revealTitleProps}>
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
      <div className="feed-head">
        <span className="section-label">校园动态</span>
        <ScrollReveal as="h2" {...revealSectionTitleProps}>
          看看同校最近在找什么样的连接
        </ScrollReveal>
      </div>
      <div className="feed-tabs" aria-label="内容分类">
        {['关注', '为你推荐', '测试', '星座', '树洞', '心理'].map((tab, index) => (
          <button className={index === 1 ? 'active' : ''} type="button" key={tab}>
            {tab}
          </button>
        ))}
      </div>
      <AnimatedList
        className="feed-animated-list"
        items={feedCards}
        getItemKey={(card) => card.title}
        showGradients={false}
        displayScrollbar={false}
        onItemSelect={(card) => {
          window.history.replaceState({}, '', `/#discover-${encodeURIComponent(card.title)}`)
        }}
        renderItem={(card) => (
          <article className="feed-card">
            <div className="feed-visual">
              <span>{card.title.slice(0, 2)}</span>
            </div>
            <div>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
              <small>{card.meta}</small>
            </div>
          </article>
        )}
      />
    </section>
  )
}

function BottomNav({ active = 'home' }) {
  const [hidden, setHidden] = useState(false)
  const items = [
    { key: 'home', icon: 'home', label: '首页', href: '/' },
    { key: 'chat', icon: 'chat', label: '消息', href: '/messages' },
    { key: 'ai', icon: 'ai', label: '问问', href: '/#match' },
    { key: 'online', icon: 'online', label: '在线', href: '/#discover' },
    { key: 'user', icon: 'user', label: '我的', href: '/profile' },
  ]

  useEffect(() => {
    let lastY = window.scrollY

    const onScroll = () => {
      const currentY = window.scrollY
      const scrollingDown = currentY > lastY + 8
      const scrollingUp = currentY < lastY - 8

      if (currentY < 80 || scrollingUp) {
        setHidden(false)
      } else if (scrollingDown) {
        setHidden(true)
      }

      lastY = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`bottom-nav ${hidden ? 'hidden' : ''}`} aria-label="底部导航">
      {items.map((item) => (
        <a
          className={`${item.key === 'ai' ? 'center' : ''} ${item.key === active ? 'active' : ''}`}
          href={item.href}
          key={item.label}
          onClick={(event) => {
            event.preventDefault()
            navigateTo(item.href)
          }}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
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
          <ScrollReveal as="h1" {...revealTitleProps}>
            先看见感觉，再开始认识。
          </ScrollReveal>
          <ScrollReveal as="p" {...revealBodyProps}>
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
          <ScrollReveal as="h2" {...revealSectionTitleProps}>
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

function ProfilePage() {
  const cameraInputRef = useRef(null)
  const albumInputRef = useRef(null)
  const hasStoredToken = Boolean(localStorage.getItem('token'))
  const [user, setUser] = useState(profileFallback)
  const [form, setForm] = useState(() => userToProfileForm(profileFallback))
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(hasStoredToken)
  const [loading, setLoading] = useState(hasStoredToken)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [notice, setNotice] = useState(hasStoredToken ? '' : '当前是本地预览。登录后，资料和头像会保存到你的账号里。')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const token = localStorage.getItem('token')

    if (!token) {
      return () => {
        mounted = false
      }
    }

    async function loadProfile() {
      try {
        const payload = await apiRequest('/users/profile')
        if (!mounted) return
        const loadedUser = payload.data?.user || profileFallback
        setUser(loadedUser)
        setForm(userToProfileForm(loadedUser))
        setIsLoggedIn(true)
      } catch (err) {
        if (!mounted) return
        setError(err.message)
        setNotice('先用本地预览看页面，重新登录后会读取你的真实资料。')
        setIsLoggedIn(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  const profileReadiness = useMemo(() => {
    const checks = [
      { label: '头像', done: Boolean(avatarPreview || user.avatar) },
      { label: '学校', done: Boolean(form.school && form.school !== '你的学校') },
      { label: '专业', done: Boolean(form.major && form.major !== '还没填写专业') },
      { label: '自我介绍', done: form.bio.trim().length >= 8 },
      { label: '兴趣标签', done: splitList(form.tags).length >= 3 },
      { label: '场景偏好', done: splitList(form.sceneTags).length >= 2 },
      { label: '校园认证', done: ['verified', 'approved'].includes(user.verificationStatus) },
    ]
    const doneCount = checks.filter((item) => item.done).length
    return {
      checks,
      percent: Math.round((doneCount / checks.length) * 100),
    }
  }, [avatarPreview, form, user.avatar, user.verificationStatus])

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setNotice('')
  }

  const toggleListItem = (key, value) => {
    const current = splitList(form[key])
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    updateForm(key, next.join('、'))
  }

  const saveProfile = async () => {
    const body = {
      ...form,
      tags: splitList(form.tags),
      sceneTags: splitList(form.sceneTags),
      mbti: form.mbti.toUpperCase().trim(),
      allowAnonymousMatch: Boolean(form.allowAnonymousMatch),
      allowOfflineEvents: Boolean(form.allowOfflineEvents),
    }

    try {
      setSaving(true)
      setError('')
      if (!isLoggedIn) {
        const localUser = { ...user, ...body }
        setUser(localUser)
        setForm(userToProfileForm(localUser))
        setNotice('本地预览已更新。登录后可以把这些资料保存到账号里。')
        setEditing(false)
        return
      }

      const payload = await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      const updatedUser = payload.data?.user || { ...user, ...body }
      setUser(updatedUser)
      setForm(userToProfileForm(updatedUser))
      setNotice('资料已保存。')
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarFile = async (file) => {
    if (!file) return
    setAvatarMenuOpen(false)
    setError('')
    setNotice('')

    if (file.size > 3 * 1024 * 1024) {
      setError('头像图片不能超过 3MB。')
      return
    }

    const localPreview = URL.createObjectURL(file)
    setAvatarPreview(localPreview)

    if (!isLoggedIn) {
      setNotice('头像已在本地预览里换好。登录后可以保存到账号。')
      return
    }

    try {
      setSaving(true)
      const uploadBody = await uploadPayloadFromFile(file)
      const payload = await apiRequest('/uploads/avatar', {
        method: 'POST',
        body: JSON.stringify(uploadBody),
      })
      const updatedUser = payload.data?.user
      if (updatedUser) {
        setUser(updatedUser)
        setForm(userToProfileForm(updatedUser))
        setAvatarPreview(payload.data?.imageUrl || updatedUser.avatar || localPreview)
      }
      setNotice('头像已更新。')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    navigateTo('/login')
  }

  const stats = user.stats || {}
  const avatarSrc = avatarPreview || user.avatar
  const verificationText = {
    verified: '校园已认证',
    approved: '校园已认证',
    pending: '认证审核中',
    rejected: '认证未通过',
    none: '还未认证',
  }[user.verificationStatus || 'none']

  return (
    <main className="app-shell profile-shell">
      <Background />
      <Header />

      <section className="profile-hero">
        <div className="profile-summary">
          <div className="profile-avatar-wrap">
            <button className="profile-avatar" type="button" onClick={() => setAvatarMenuOpen(true)} aria-label="更换头像">
              {avatarSrc ? <img src={avatarSrc} alt="头像" /> : <span>{(form.nickname || '校').slice(0, 1)}</span>}
            </button>
            <button className="profile-camera" type="button" onClick={() => setAvatarMenuOpen(true)} aria-label="拍照或选择头像">
              <Icon name="camera" />
            </button>
            {avatarMenuOpen && (
              <div className="avatar-sheet" onMouseDown={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => cameraInputRef.current?.click()}>拍照</button>
                <button type="button" onClick={() => albumInputRef.current?.click()}>从相册选择</button>
              </div>
            )}
            <input
              ref={cameraInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              capture="user"
              onChange={(event) => handleAvatarFile(event.target.files?.[0])}
            />
            <input
              ref={albumInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={(event) => handleAvatarFile(event.target.files?.[0])}
            />
          </div>

          <div className="profile-title">
            <span className="section-label">我的主页</span>
            <ScrollReveal as="h1" {...revealTitleProps}>
              {form.nickname || '校园新朋友'}
            </ScrollReveal>
            <p>{[form.school, form.grade, form.major].filter(Boolean).join(' · ') || '完善学校、年级和专业后，推荐会更准。'}</p>
            <div className="profile-badges">
              <span>{verificationText}</span>
              {form.mbti && <span>{form.mbti.toUpperCase()}</span>}
              {form.relationshipGoal && <span>{form.relationshipGoal}</span>}
            </div>
          </div>

          <div className="profile-stats" aria-label="账号数据">
            <span><strong>{stats.matches ?? 0}</strong>合拍</span>
            <span><strong>{stats.likes ?? 0}</strong>喜欢</span>
            <span><strong>{stats.views ?? 0}</strong>浏览</span>
          </div>
        </div>
      </section>

      <section className="profile-layout">
        <aside className="profile-panel profile-progress">
          <div>
            <span className="section-label">资料完整度</span>
            <strong>{profileReadiness.percent}%</strong>
            <p>资料越具体，系统越容易帮你找到自然开聊的人。</p>
          </div>
          <div className="progress-track" aria-hidden="true">
            <i style={{ width: `${profileReadiness.percent}%` }} />
          </div>
          <div className="profile-checks">
            {profileReadiness.checks.map((item) => (
              <span className={item.done ? 'done' : ''} key={item.label}>
                {item.label}
              </span>
            ))}
          </div>
        </aside>

        <section className="profile-panel profile-form-panel" aria-label="个人资料">
          <div className="profile-panel-head">
            <div>
              <span className="section-label">个人资料</span>
              <ScrollReveal as="h2" {...revealSectionTitleProps}>
                把自己写得更像自己一点
              </ScrollReveal>
            </div>
            <button
              className="ghost-action"
              type="button"
              onClick={() => (editing ? saveProfile() : setEditing(true))}
              disabled={saving || loading}
            >
              <Icon name={editing ? 'spark' : 'edit'} />
              {saving ? '保存中' : editing ? '保存' : '编辑'}
            </button>
          </div>

          {(notice || error) && <div className={`auth-message ${error ? 'error' : ''}`}>{error || notice}</div>}

          <div className="profile-form-grid">
            <label>
              <span>昵称</span>
              <input disabled={!editing} value={form.nickname} onChange={(event) => updateForm('nickname', event.target.value)} />
            </label>
            <label>
              <span>学校</span>
              <input disabled={!editing} value={form.school} onChange={(event) => updateForm('school', event.target.value)} />
            </label>
            <label>
              <span>年级</span>
              <select disabled={!editing} value={form.grade} onChange={(event) => updateForm('grade', event.target.value)}>
                <option value="">选择年级</option>
                <option>大一</option>
                <option>大二</option>
                <option>大三</option>
                <option>大四</option>
                <option>研一</option>
                <option>研二</option>
                <option>研三</option>
              </select>
            </label>
            <label>
              <span>专业</span>
              <input disabled={!editing} value={form.major} onChange={(event) => updateForm('major', event.target.value)} />
            </label>
            <label>
              <span>学院</span>
              <input disabled={!editing} value={form.college} onChange={(event) => updateForm('college', event.target.value)} placeholder="选填" />
            </label>
            <label>
              <span>MBTI</span>
              <input disabled={!editing} value={form.mbti} onChange={(event) => updateForm('mbti', event.target.value.toUpperCase())} placeholder="例如 INFP" />
            </label>
            <label>
              <span>生日</span>
              <input disabled={!editing} type="date" value={form.birthDate} onChange={(event) => updateForm('birthDate', event.target.value)} />
            </label>
            <label>
              <span>期待关系</span>
              <input disabled={!editing} value={form.relationshipGoal} onChange={(event) => updateForm('relationshipGoal', event.target.value)} />
            </label>
          </div>

          <label className="profile-wide-field">
            <span>自我介绍</span>
            <textarea disabled={!editing} value={form.bio} onChange={(event) => updateForm('bio', event.target.value)} rows="4" />
          </label>

          <div className="profile-tags-editor">
            <span>兴趣标签</span>
            <div>
              {interestOptions.map((tag) => (
                <button
                  className={splitList(form.tags).includes(tag) ? 'active' : ''}
                  disabled={!editing}
                  key={tag}
                  type="button"
                  onClick={() => toggleListItem('tags', tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-tags-editor">
            <span>常出现的场景</span>
            <div>
              {sceneOptions.map((tag) => (
                <button
                  className={splitList(form.sceneTags).includes(tag) ? 'active' : ''}
                  disabled={!editing}
                  key={tag}
                  type="button"
                  onClick={() => toggleListItem('sceneTags', tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="profile-panel profile-privacy">
          <span className="section-label">隐私与状态</span>
          <label className="profile-toggle">
            <span>
              <strong>允许匿名匹配</strong>
              <small>先保护身份，聊得来再公开更多信息。</small>
            </span>
            <input
              checked={form.allowAnonymousMatch}
              disabled={!editing}
              type="checkbox"
              onChange={(event) => updateForm('allowAnonymousMatch', event.target.checked)}
            />
          </label>
          <label className="profile-toggle">
            <span>
              <strong>接收线下活动</strong>
              <small>同校活动、社团局和轻社交邀请。</small>
            </span>
            <input
              checked={form.allowOfflineEvents}
              disabled={!editing}
              type="checkbox"
              onChange={(event) => updateForm('allowOfflineEvents', event.target.checked)}
            />
          </label>
          <button className="danger-action" type="button" onClick={logout}>
            <Icon name="logout" />
            退出登录
          </button>
        </aside>
      </section>

      <BottomNav active="user" />
    </main>
  )
}

function MessagesPage() {
  const [selectedId, setSelectedId] = useState(messageThreads[0]?.id)
  const selectedThread = messageThreads.find((thread) => thread.id === selectedId) || messageThreads[0]

  return (
    <main className="app-shell messages-shell">
      <Background />
      <Header />

      <section className="messages-hero">
        <div>
          <span className="section-label">消息</span>
          <ScrollReveal as="h1" {...revealTitleProps}>
            把聊得来的连接留住
          </ScrollReveal>
          <ScrollReveal as="p" {...revealBodyProps}>
            新匹配、树洞回应、活动邀约都在这里。先轻轻说一句，再慢慢认识。
          </ScrollReveal>
        </div>
        <div className="messages-hero-stats">
          <span><strong>3</strong>新消息</span>
          <span><strong>2</strong>在线</span>
          <span><strong>6</strong>会话</span>
        </div>
      </section>

      <section className="messages-layout" aria-label="消息中心">
        <aside className="messages-panel thread-panel">
          <div className="message-filter" aria-label="消息筛选">
            {['全部', '未读', '同校', '树洞'].map((item, index) => (
              <button className={index === 0 ? 'active' : ''} type="button" key={item}>
                {item}
              </button>
            ))}
          </div>
          <AnimatedList
            className="message-thread-list"
            items={messageThreads}
            getItemKey={(thread) => thread.id}
            initialSelectedIndex={0}
            onItemSelect={(thread) => setSelectedId(thread.id)}
            renderItem={(thread, _index, selected) => (
              <article className={`message-thread ${selected || thread.id === selectedId ? 'active' : ''}`}>
                <div className={`message-avatar ${thread.tone}`}>{thread.name.slice(0, 1)}</div>
                <div>
                  <div className="message-thread-head">
                    <strong>{thread.name}</strong>
                    <small>{thread.time}</small>
                  </div>
                  <p>{thread.lastMessage}</p>
                  <span>{thread.school}</span>
                </div>
                {thread.unread > 0 && <i aria-label={`${thread.unread} 条未读`}>{thread.unread}</i>}
                <em className={thread.online ? 'online' : ''} aria-label={thread.online ? '在线' : '离线'} />
              </article>
            )}
          />
        </aside>

        <section className="messages-panel chat-panel" aria-label="聊天预览">
          <div className="chat-head">
            <div className={`message-avatar ${selectedThread.tone}`}>{selectedThread.name.slice(0, 1)}</div>
            <div>
              <strong>{selectedThread.name}</strong>
              <span>{selectedThread.school}</span>
            </div>
            <button className="ghost-action" type="button">查看资料</button>
          </div>

          <div className="chat-bubbles">
            {selectedThread.messages.map((message, index) => (
              <p className={message.from === 'me' ? 'me' : ''} key={`${selectedThread.id}-${index}`}>
                {message.text}
              </p>
            ))}
          </div>

          <div className="message-composer" aria-label="发送消息">
            <input placeholder="写一句轻松的开场..." />
            <button type="button">发送</button>
          </div>
        </section>
      </section>

      <BottomNav active="chat" />
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
            <ScrollReveal as="h1" {...revealTitleProps}>
              校园里的真实连接，从一条低压力消息开始
            </ScrollReveal>
            <ScrollReveal as="p" {...revealBodyProps}>
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
      <section className="section-intro" aria-label="功能入口介绍">
        <span className="section-label">功能入口</span>
        <ScrollReveal as="h2" {...revealSectionTitleProps}>
          从性格、星座、生辰和树洞里找到开场理由
        </ScrollReveal>
      </section>
      <ShortcutGrid />
      <Feed />
      <BottomNav active="home" />
    </main>
  )
}

function App() {
  const [locationKey, setLocationKey] = useState(`${window.location.pathname}${window.location.hash}`)

  useEffect(() => {
    const onPopState = () => setLocationKey(`${window.location.pathname}${window.location.hash}`)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!window.location.hash) return undefined

    const timer = window.setTimeout(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)

    return () => window.clearTimeout(timer)
  }, [locationKey])

  const path = window.location.pathname

  if (path === '/login') {
    return <AuthPage />
  }

  if (path === '/profile') {
    return <ProfilePage />
  }

  if (path === '/messages') {
    return <MessagesPage />
  }

  return <HomePage />
}

export default App
