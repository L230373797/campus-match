import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import AnimatedList from './AnimatedList'
import PillNav from './PillNav'
import { AnimatePresence, motion } from 'motion/react'
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

const insightFallback = {
  moodScore: 70,
  affinityScore: 82,
  mbti: 'INFP',
  zodiac: '双鱼座',
  birthDate: '',
  headline: 'INFP · 双鱼座，今天适合轻松认识新朋友',
  tags: ['同校', '慢热', '树洞'],
  selfInsight: {
    moodScore: 70,
    moodLabel: '轻松',
    focus: '先从一个具体的小问题开始',
  },
  dailyCards: [
    { title: '人格节奏', text: '慢一点开场更舒服，先问具体小事，再交换日常。' },
    { title: '生辰提示', text: '今天适合轻松表达，可以从兴趣或校园小事聊起。' },
    { title: '今日开场', text: '围绕「同校」开一句，会比泛泛打招呼更自然。' },
    { title: '倾诉回声', text: '有些话可以先放进匿名树洞，再慢慢决定要不要认识谁。' },
  ],
  treeholeCount: 0,
}

const treeholeFallback = [
  {
    id: 'sample-treehole-1',
    mood: '想被听见',
    content: '最近有点累，但又不想把压力全说给熟人听。想先找一个能认真听的人。',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-treehole-2',
    mood: '轻轻吐槽',
    content: '如果有人也喜欢晚饭后绕操场走两圈，大概会很好聊。',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
]

const moodChoices = ['轻松', '想聊天', '有点累', '需要陪伴']
const feedTabs = ['为你推荐', '测试', '星座', '树洞', '心理', '搭子']
const feedTabKeywords = {
  为你推荐: [],
  测试: ['MBTI', '测试', '性格', '生辰'],
  星座: ['星座', '生日', '生辰'],
  树洞: ['树洞', '倾诉', '匿名'],
  心理: ['心理', '烦恼', '压力', '低压力'],
  搭子: ['搭子', '自习', '散步', '学习'],
}

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

const matchProfiles = [
  {
    id: 'library-match',
    name: '晚风同学',
    score: 86,
    meta: '同校认证 · 图书馆 · INFP',
    note: '喜欢安静自习、电影配乐和晚上的校园路灯。',
    tags: ['自习搭子', '慢热', '电影'],
    accent: 'cyan',
  },
  {
    id: 'walk-match',
    name: '湖边散步',
    score: 81,
    meta: '同城校区 · 周末 · 低压力',
    note: '更喜欢边走边聊，不用一直找话题也舒服。',
    tags: ['散步', '歌单', '树洞'],
    accent: 'pink',
  },
  {
    id: 'mbti-match',
    name: '同频小卡',
    score: 78,
    meta: 'MBTI · 生辰 · 轻聊天',
    note: '回复不一定快，但每一句都会认真看。',
    tags: ['INFP', '星座', '慢节奏'],
    accent: 'violet',
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
const backgroundLineCount = [3, 5, 3]
const backgroundLineDistance = [12, 9, 13]
const matchAccents = ['cyan', 'pink', 'violet']
const navItems = [
  { label: '首页', href: '/' },
  { label: '测一测', href: '/#tests' },
  { label: '发现', href: '/#discover' },
  { label: '匹配', href: '/#match' },
  { label: '消息', href: '/messages' },
  { label: '我的', href: '/profile' },
]
const zodiacSigns = [
  { name: '摩羯座', from: [12, 22] },
  { name: '水瓶座', from: [1, 20] },
  { name: '双鱼座', from: [2, 19] },
  { name: '白羊座', from: [3, 21] },
  { name: '金牛座', from: [4, 20] },
  { name: '双子座', from: [5, 21] },
  { name: '巨蟹座', from: [6, 22] },
  { name: '狮子座', from: [7, 23] },
  { name: '处女座', from: [8, 23] },
  { name: '天秤座', from: [9, 23] },
  { name: '天蝎座', from: [10, 24] },
  { name: '射手座', from: [11, 23] },
]

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

function hasAuthToken() {
  return Boolean(localStorage.getItem('token'))
}

function formatRelativeTime(value) {
  const timestamp = Date.parse(value || '')
  if (!Number.isFinite(timestamp)) return '刚刚'

  const diff = Date.now() - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}小时前`
  if (diff < 2 * day) return '昨天'
  return `${Math.max(2, Math.floor(diff / day))}天前`
}

function formatBirthDate(value) {
  if (!value) return ''
  const parts = String(value).split('-').map((part) => Number(part))
  const month = parts[1]
  const day = parts[2]
  if (!month || !day) return ''
  return `${month}月${day}日`
}

function zodiacFromBirthDate(value) {
  if (!value) return ''
  const parts = String(value).split('-').map((part) => Number(part))
  const month = parts[1]
  const day = parts[2]
  if (!month || !day) return ''

  for (let index = zodiacSigns.length - 1; index >= 0; index -= 1) {
    const [fromMonth, fromDay] = zodiacSigns[index].from
    if (month > fromMonth || (month === fromMonth && day >= fromDay)) {
      return zodiacSigns[index].name
    }
  }

  return '摩羯座'
}

function formatShortDate(value) {
  const timestamp = Date.parse(value || '')
  if (!Number.isFinite(timestamp)) return '长期有效'
  const date = new Date(timestamp)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function formatPlanPrice(plan = {}, cycle = 'monthly') {
  const price = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  if (!price) return '免费'
  return `¥${price}/${cycle === 'yearly' ? '年' : '月'}`
}

function profileId(profile = {}) {
  return profile.id || profile._id || profile.userId || ''
}

function normalizeMatchProfile(user = {}, index = 0) {
  const id = user.id || user._id || `recommendation-${index}`
  const reasonTags = splitList(user.recommendation?.reasons)
  const profileTags = [...splitList(user.tags), ...splitList(user.sceneTags)]
  const tags = [...profileTags, ...reasonTags].filter(Boolean).slice(0, 3)
  const rawScore = Number(user.recommendation?.score ?? user.score ?? 72)
  const score = Math.max(40, Math.min(99, Math.round(Number.isFinite(rawScore) ? rawScore : 72)))
  const meta = [
    user.isVerified || user.verificationStatus === 'approved' ? '同校认证' : user.school,
    user.major,
    user.mbti,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    id,
    userId: id,
    name: user.nickname || user.name || '校园同学',
    score,
    meta: meta || '校园资料 · 等你认识',
    note: user.bio || reasonTags.join('、') || '资料还在慢慢完善，先从一个轻松话题开始。',
    tags: tags.length ? tags : ['同校', '轻聊天', '合拍'],
    accent: matchAccents[index % matchAccents.length],
    source: user,
  }
}

function normalizeMessageThread(match = {}, index = 0) {
  const user = match.user || {}
  const name = user.nickname || user.name || '校园同学'
  const school = [user.school, user.major || user.mbti || '轻聊天'].filter(Boolean).join(' · ')

  return {
    id: match.id || match._id || `match-${index}`,
    name,
    school: school || '同校 · 轻聊天',
    time: formatRelativeTime(match.lastMessageAt || match.matchedAt),
    unread: Number(match.unreadCount || 0),
    online: Boolean(match.typing?.activeUsers?.length),
    tone: matchAccents[index % matchAccents.length],
    lastMessage: match.lastMessagePreview || '你们已经匹配，可以从一个轻松问题开始。',
    messages: [],
    sourceMatch: match,
  }
}

function normalizeChatMessage(message = {}, currentUserId = '') {
  const senderId = message.senderId || message.sender?.id || message.sender?._id || ''
  return {
    from: senderId && senderId === currentUserId ? 'me' : 'other',
    text: message.content || message.text || '',
    createdAt: message.createdAt,
  }
}

function buildShortcutCards(homeData = {}, loading = false) {
  const profile = homeData.profile || {}
  const activity = homeData.activity || {}
  const counts = activity.counts || {}
  const recommendations = homeData.recommendations || []
  const matches = homeData.matches || []
  const membership = homeData.membership?.membership || profile.membership || {}
  const tags = splitList(profile.tags)
  const sceneTags = splitList(profile.sceneTags)
  const zodiac = zodiacFromBirthDate(profile.birthDate)

  const statusByTitle = {
    MBTI: profile.mbti || (loading ? '正在读取资料' : '去资料页补充'),
    星座: zodiac || (loading ? '正在读取生日' : '填生日生成'),
    生辰: formatBirthDate(profile.birthDate) || (loading ? '正在读取生辰' : '去资料页补充'),
    缘分盘: recommendations.length
      ? `${recommendations.length} 个新推荐`
      : `${counts.matches || matches.length || 0} 个匹配`,
    倾诉: sceneTags.includes('树洞') ? '已加入树洞偏好' : (activity.insights?.[0] || '树洞话题已接入推荐'),
    智慧卡: recommendations[0]?.nickname
      ? `给 ${recommendations[0].nickname} 的开场`
      : (tags[0] ? `${tags[0]} 开场` : membership.title || '登录后生成'),
  }

  const actionByTitle = {
    MBTI: 'profile',
    星座: 'profile',
    生辰: 'profile',
    缘分盘: 'match',
    倾诉: 'discover',
    智慧卡: 'wisdom',
  }

  return shortcuts.map((item) => ({
    ...item,
    status: statusByTitle[item.title] || item.note,
    action: actionByTitle[item.title],
  }))
}

function buildFeedCards(homeData = {}) {
  const cards = []
  const recommendations = homeData.recommendations || []
  const matches = homeData.matches || []
  const activity = homeData.activity || {}

  recommendations.slice(0, 4).forEach((user, index) => {
    const reasons = splitList(user.recommendation?.reasons)
    const meta = [user.school, user.mbti, reasons[0]].filter(Boolean).join(' · ')
    cards.push({
      title: `认识 ${user.nickname || user.name || '校园同学'}`,
      text: user.bio || reasons.join('、') || '系统按你的资料整理出的同校推荐，可以先从一个轻松话题开始。',
      meta: meta || '同校推荐 · 合拍资料',
      visual: user.nickname || `推荐${index + 1}`,
    })
  })

  matches.slice(0, 2).forEach((match) => {
    const user = match.user || {}
    cards.push({
      title: `和 ${user.nickname || '新匹配'} 继续聊聊`,
      text: match.lastMessagePreview || '你们已经匹配，发一句轻松的开场就能继续认识。',
      meta: [user.school, '匹配消息'].filter(Boolean).join(' · '),
      visual: '消息',
    })
  })

  ;(activity.footprints || []).slice(0, 2).forEach((item) => {
    const profile = item.profile || {}
    cards.push({
      title: `重新看看 ${profile.nickname || '略过的同学'}`,
      text: profile.bio || '这里会记录你略过的资料，方便之后重新整理推荐方向。',
      meta: [profile.school, item.note || '足迹'].filter(Boolean).join(' · '),
      visual: '足迹',
    })
  })

  return cards.length ? cards : feedCards
}

function buildWisdomCards(homeData = {}) {
  const profile = homeData.profile || {}
  const recommendations = homeData.recommendations || []
  const target = recommendations[0] || {}
  const targetName = target.nickname || target.name || '对方'
  const sharedTags = splitList(target.tags).concat(splitList(target.sceneTags)).slice(0, 2)
  const ownTags = splitList(profile.tags).concat(splitList(profile.sceneTags)).slice(0, 2)
  const topic = sharedTags[0] || ownTags[0] || '最近的校园生活'

  return [
    `看到你也提到${topic}，想问问你最近最舒服的一次校园瞬间是什么？`,
    `${targetName}的资料里有一点挺合拍：${target.bio || sharedTags.join('、') || '节奏很轻松'}。可以从这里开聊。`,
    profile.mbti ? `用你的 ${profile.mbti} 风格开场：不急着热络，先问一个具体又好回答的小问题。` : '资料补上 MBTI 后，破冰卡会更贴近你的聊天节奏。',
  ]
}

function normalizeInsightPayload(value = {}, profile = {}) {
  const birthDate = value.birthDate || profile.birthDate || ''
  const zodiac = value.zodiac || zodiacFromBirthDate(birthDate)
  const mbti = value.mbti || profile.mbti || ''
  const tags = splitList(value.tags?.length ? value.tags : profile.tags).slice(0, 5)
  const moodScore = Number(value.moodScore || value.selfInsight?.moodScore || insightFallback.moodScore)
  const affinityScore = Number(value.affinityScore || 76)
  return {
    ...insightFallback,
    ...value,
    moodScore: Number.isFinite(moodScore) ? Math.max(1, Math.min(100, Math.round(moodScore))) : insightFallback.moodScore,
    affinityScore: Number.isFinite(affinityScore) ? Math.max(1, Math.min(100, Math.round(affinityScore))) : 76,
    mbti,
    zodiac,
    birthDate,
    tags: tags.length ? tags : insightFallback.tags,
    selfInsight: {
      ...insightFallback.selfInsight,
      ...(value.selfInsight || {}),
    },
    dailyCards: Array.isArray(value.dailyCards) && value.dailyCards.length ? value.dailyCards : insightFallback.dailyCards,
    headline:
      value.headline ||
      (mbti && zodiac ? `${mbti} · ${zodiac}，今天适合轻松开场` : insightFallback.headline),
  }
}

function normalizeTreeholes(value) {
  const posts = Array.isArray(value) ? value : []
  return posts
    .map((item, index) => ({
      id: item.id || `treehole-${index}`,
      mood: item.mood || '想被听见',
      content: item.content || '',
      createdAt: item.createdAt || '',
    }))
    .filter((item) => item.content)
}

function buildFeedPages(items = feedCards) {
  const source = items.length ? items : feedCards
  return feedTabs.map((tab) => {
    const keywords = feedTabKeywords[tab] || []
    const matched = keywords.length
      ? source.filter((card) => keywords.some((keyword) => `${card.title} ${card.text} ${card.meta}`.includes(keyword)))
      : source
    const cards = matched.length >= 2 ? matched : source

    return {
      tab,
      cards: cards.slice(0, 6).map((card, index) => ({
        ...card,
        visual: card.visual || (tab === '为你推荐' ? card.title : tab),
        meta: card.meta || `${tab} · 校园内容`,
        pageKey: `${tab}-${card.title}-${index}`,
      })),
    }
  })
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
          bendStrength={-0.45}
          interactive
          parallax
          parallaxStrength={0.05}
          animationSpeed={0.42}
          lineOpacity={0.3}
          gradientStart="#7feeff"
          gradientMid="#b58dff"
          gradientEnd="#ffc8e8"
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
  const getActiveHref = () => {
    if (window.location.pathname === '/messages') return '/messages'
    if (window.location.pathname === '/profile') return '/profile'
    if (window.location.hash === '#tests') return '/#tests'
    if (window.location.hash === '#discover') return '/#discover'
    if (window.location.hash === '#match') return '/#match'
    return '/'
  }
  const [activeHref, setActiveHref] = useState(getActiveHref)

  useEffect(() => {
    const updateActiveHref = () => {
      if (window.location.pathname === '/messages') {
        setActiveHref('/messages')
        return
      }
      if (window.location.pathname === '/profile') {
        setActiveHref('/profile')
        return
      }
      if (window.location.pathname !== '/') {
        setActiveHref('/')
        return
      }
      if (window.scrollY < 320) {
        setActiveHref('/')
        return
      }

      const sections = [
        { href: '/#match', selector: '#match' },
        { href: '/#tests', selector: '#tests' },
        { href: '/#discover', selector: '#discover' },
      ]
      const current = sections.find(({ selector }) => {
        const element = document.querySelector(selector)
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top <= 170 && rect.bottom > 170
      })
      setActiveHref(current?.href || '/')
    }

    let frame = 0
    const onScroll = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateActiveHref)
    }

    frame = window.requestAnimationFrame(updateActiveHref)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('popstate', updateActiveHref)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('popstate', updateActiveHref)
    }
  }, [])

  return (
    <PillNav
      logoLabel="校园匹配"
      items={navItems}
      activeHref={activeHref}
      baseColor="#f5faff"
      pillColor="#07111f"
      hoveredPillTextColor="#07111f"
      onNavigate={navigateTo}
    />
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

function ShortcutGrid({ items = shortcuts, onSelect }) {
  return (
    <section className="shortcut-grid" aria-label="功能入口">
      {items.map((item) => (
        <button className="shortcut" type="button" key={item.title} onClick={() => onSelect?.(item)}>
          <span className={`shortcut-glyph ${item.tone}`}>{item.title.slice(0, 1)}</span>
          <strong>{item.title}</strong>
          <small>{item.note}</small>
          {item.status && <span className="shortcut-meta">{item.status}</span>}
        </button>
      ))}
    </section>
  )
}

function MatchPreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [profiles, setProfiles] = useState(matchProfiles)
  const [matchNotice, setMatchNotice] = useState(() =>
    localStorage.getItem('token') ? '正在整理你的推荐。' : '登录后会按你的资料生成真实推荐。',
  )
  const [matchLoading, setMatchLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState('')
  const visibleProfiles = profiles.length ? profiles : matchProfiles
  const activeProfile = visibleProfiles[activeIndex % visibleProfiles.length]
  const nextProfile = visibleProfiles[(activeIndex + 1) % visibleProfiles.length]

  const showNextProfile = () => {
    setActiveIndex((current) => (current + 1) % visibleProfiles.length)
  }

  useEffect(() => {
    let mounted = true

    async function loadRecommendations() {
      if (!localStorage.getItem('token')) {
        return
      }

      setMatchLoading(true)
      try {
        const payload = await apiRequest('/users/recommendations?limit=6')
        const users = payload.data?.users || []
        const nextProfiles = users.map(normalizeMatchProfile)

        if (!mounted) return

        if (nextProfiles.length) {
          setProfiles(nextProfiles)
          setActiveIndex(0)
          const signals = payload.data?.ranking?.signals || []
          setMatchNotice(signals.length ? `已参考：${signals.join('、')}` : '已按你的资料整理推荐。')
          return
        }

        setMatchNotice('暂时没有新的真实推荐，先看看预览卡片。')
      } catch (error) {
        if (mounted) {
          setMatchNotice(error.message || '推荐接口暂时不可用，先看看预览卡片。')
        }
      } finally {
        if (mounted) {
          setMatchLoading(false)
        }
      }
    }

    loadRecommendations()

    return () => {
      mounted = false
    }
  }, [])

  const handleMatchAction = async (type) => {
    const currentProfile = activeProfile
    const targetId = currentProfile.userId || currentProfile.id

    showNextProfile()

    if (!localStorage.getItem('token') || !currentProfile.source) {
      setMatchNotice(type === 'like' ? '预览里先记下喜欢，登录后会真正匹配。' : '已切到下一张推荐卡。')
      return
    }

    setActionBusy(type)
    try {
      const endpoint =
        type === 'like'
          ? `/matches/like/${encodeURIComponent(targetId)}`
          : `/matches/skip/${encodeURIComponent(targetId)}`
      const payload = await apiRequest(endpoint, { method: 'POST' })
      setMatchNotice(payload.data?.message || payload.message || (type === 'like' ? '已喜欢' : '已略过'))
    } catch (error) {
      setMatchNotice(error.message || '操作没有成功，再试一次。')
    } finally {
      setActionBusy('')
    }
  }

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

      <div className="match-deck" aria-live="polite">
        <div className={`match-card-shadow ${nextProfile.accent}`}>
          <span>{nextProfile.score}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.article
            className={`match-card ${activeProfile.accent}`}
            key={activeProfile.id}
            initial={{ opacity: 0, y: 24, rotate: -2, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, rotate: 2, scale: 0.96 }}
            transition={{ duration: 0.42, ease: [0.2, 0.82, 0.2, 1] }}
          >
            <div className="match-orbit">
              <span />
            </div>
            <div className="match-score">
              <strong>{activeProfile.score}</strong>
              <small>合拍分</small>
            </div>
            <div className="match-person">
              <h3>{activeProfile.name}</h3>
              <p>{activeProfile.meta}</p>
            </div>
            <p className="match-note">{activeProfile.note}</p>
            <div className="match-tags">
              {activeProfile.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            {(matchNotice || matchLoading) && (
              <p className="match-status">{matchLoading ? '正在整理推荐...' : matchNotice}</p>
            )}
            <div className="match-actions">
              <button
                className="ghost-match-action"
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() => handleMatchAction('skip')}
              >
                略过
              </button>
              <button
                className="primary-match-action"
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() => handleMatchAction('like')}
              >
                喜欢
              </button>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  )
}

function Feed({ items = feedCards }) {
  const pages = useMemo(() => buildFeedPages(items), [items])
  const scrollerRef = useRef(null)
  const dragStateRef = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined

    let frame = 0
    const updateActivePage = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const pageWidth = Math.max(scroller.clientWidth, 1)
        const nextIndex = Math.round(scroller.scrollLeft / pageWidth)
        setActiveIndex(Math.max(0, Math.min(pages.length - 1, nextIndex)))
      })
    }

    scroller.addEventListener('scroll', updateActivePage, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', updateActivePage)
    }
  }, [pages.length])

  const goToPage = (index) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollTo({ left: index * scroller.clientWidth, behavior: 'smooth' })
    setActiveIndex(index)
  }

  const snapToNearestPage = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const index = Math.round(scroller.scrollLeft / Math.max(scroller.clientWidth, 1))
    goToPage(Math.max(0, Math.min(pages.length - 1, index)))
  }

  const onPointerDown = (event) => {
    if (event.pointerType !== 'mouse') return
    const scroller = scrollerRef.current
    if (!scroller) return
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    }
    scroller.setPointerCapture?.(event.pointerId)
    scroller.classList.add('dragging')
  }

  const onPointerMove = (event) => {
    const scroller = scrollerRef.current
    const dragState = dragStateRef.current
    if (!scroller || !dragState.active) return
    event.preventDefault()
    scroller.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX)
  }

  const onPointerUp = (event) => {
    const scroller = scrollerRef.current
    if (!scroller || !dragStateRef.current.active) return
    dragStateRef.current.active = false
    scroller.releasePointerCapture?.(event.pointerId)
    scroller.classList.remove('dragging')
    snapToNearestPage()
  }

  return (
    <section className="feed" id="discover">
      <div className="feed-head">
        <span className="section-label">校园动态</span>
        <ScrollReveal as="h2" {...revealSectionTitleProps}>
          看看同校最近在找什么样的连接
        </ScrollReveal>
      </div>
      <div className="feed-tabs" aria-label="内容分类">
        {pages.map((page, index) => (
          <button
            className={index === activeIndex ? 'active' : ''}
            type="button"
            key={page.tab}
            onClick={() => goToPage(index)}
          >
            {page.tab}
          </button>
        ))}
      </div>
      <div
        className="feed-swipe-track"
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {pages.map((page) => (
          <div className="feed-page" key={page.tab} aria-label={page.tab}>
            {page.cards.map((card) => (
              <article
                className="feed-card"
                key={card.pageKey}
                onClick={() => {
                  window.history.replaceState({}, '', `/#discover-${encodeURIComponent(card.title)}`)
                }}
              >
                <div className="feed-visual">
                  <span>{(card.visual || card.title).slice(0, 2)}</span>
                </div>
                <div>
                  <strong>{card.title}</strong>
                  <p>{card.text}</p>
                  <small>{card.meta}</small>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
      <div className="feed-page-dots" aria-hidden="true">
        {pages.map((page, index) => (
          <button className={index === activeIndex ? 'active' : ''} type="button" key={page.tab} tabIndex={-1}>
            <span />
          </button>
        ))}
      </div>
    </section>
  )
}

function SelfInsightPanel({
  insight = insightFallback,
  treeholes = treeholeFallback,
  onMoodUpdate,
  onTreeholeSubmit,
  busy = '',
  notice = '',
}) {
  const [localMood, setLocalMood] = useState('')
  const [treeholeText, setTreeholeText] = useState('')
  const visibleTreeholes = treeholes.length ? treeholes : treeholeFallback
  const selectedMood = localMood || insight.selfInsight?.moodLabel || '轻松'
  const moodScores = {
    轻松: 76,
    想聊天: 84,
    有点累: 58,
    需要陪伴: 65,
  }

  const updateMood = async (mood) => {
    setLocalMood(mood)
    await onMoodUpdate?.({
      moodLabel: mood,
      moodScore: moodScores[mood] || insight.moodScore,
      focus: mood === '有点累' ? '先找一个能认真听你说话的人' : '先从一个具体的小问题开始',
    })
  }

  const submitTreehole = async (event) => {
    event.preventDefault()
    const content = treeholeText.trim()
    if (content.length < 6 || busy === 'treehole') return
    const ok = await onTreeholeSubmit?.({ content, mood: selectedMood })
    if (ok !== false) {
      setTreeholeText('')
    }
  }

  return (
    <section className="self-insight-panel" id="tests" aria-label="自我洞察和匿名倾诉">
      <div className="self-insight-main">
        <span className="section-label">测一测</span>
        <ScrollReveal as="h2" {...revealSectionTitleProps}>
          先认识自己，再认识更合拍的人
        </ScrollReveal>
        <p>{insight.headline}</p>
        <div className="insight-score-row">
          <span>
            <strong>{insight.moodScore}</strong>
            今日状态
          </span>
          <span>
            <strong>{insight.affinityScore}</strong>
            合拍指数
          </span>
        </div>
        <div className="insight-pills">
          <span>{insight.mbti || '补 MBTI'}</span>
          <span>{insight.zodiac || '补生日'}</span>
          <span>{formatBirthDate(insight.birthDate) || '生辰待补'}</span>
        </div>
        <div className="daily-card-grid">
          {insight.dailyCards.slice(0, 4).map((card) => (
            <article className="daily-card" key={card.title}>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </div>

      <aside className="treehole-panel">
        <div className="treehole-head">
          <div>
            <span className="section-label">匿名倾诉</span>
            <h3>把不好开口的话先放这里</h3>
          </div>
          <span>{insight.treeholeCount || treeholes.length} 条</span>
        </div>
        <div className="mood-choice-row" aria-label="选择此刻状态">
          {moodChoices.map((mood) => (
            <button
              className={selectedMood === mood ? 'active' : ''}
              key={mood}
              type="button"
              disabled={busy === 'mood'}
              onClick={() => updateMood(mood)}
            >
              {mood}
            </button>
          ))}
        </div>
        <form className="treehole-form" onSubmit={submitTreehole}>
          <textarea
            value={treeholeText}
            onChange={(event) => setTreeholeText(event.target.value)}
            placeholder="写给一个还没认识、但愿意认真听的人。"
            rows="4"
          />
          <button className="primary-action" type="submit" disabled={busy === 'treehole' || treeholeText.trim().length < 6}>
            {busy === 'treehole' ? '放入树洞中' : '匿名放入树洞'}
          </button>
        </form>
        {notice && <p className="treehole-notice">{notice}</p>}
        <div className="treehole-list">
          {visibleTreeholes.slice(0, 3).map((post) => (
            <article className="treehole-card" key={post.id}>
              <span>{post.mood}</span>
              <p>{post.content}</p>
              <small>{post.createdAt ? formatRelativeTime(post.createdAt) : '刚刚'}</small>
            </article>
          ))}
        </div>
      </aside>
    </section>
  )
}

function ProfileInsightPanel({ insight = insightFallback, treeholes = [] }) {
  const tags = insight.tags?.length ? insight.tags : insightFallback.tags

  return (
    <section className="profile-panel profile-self-panel">
      <div className="profile-panel-head">
        <div>
          <span className="section-label">我的画像</span>
          <h2>{insight.headline}</h2>
          <p>这里会把 MBTI、生辰、兴趣和倾诉状态汇总成更自然的匹配线索。</p>
        </div>
      </div>
      <div className="profile-self-score">
        <span>
          <strong>{insight.moodScore}</strong>
          今日状态
        </span>
        <span>
          <strong>{insight.affinityScore}</strong>
          合拍指数
        </span>
        <span>
          <strong>{treeholes.length || insight.treeholeCount || 0}</strong>
          树洞记录
        </span>
      </div>
      <div className="profile-badges">
        {(insight.mbti ? [insight.mbti] : []).concat(insight.zodiac ? [insight.zodiac] : [], tags).slice(0, 7).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="wisdom-card-list">
        {insight.dailyCards.slice(0, 2).map((card) => (
          <span key={card.title}>{card.text}</span>
        ))}
      </div>
    </section>
  )
}

function FeatureSheet({ shortcut, homeData, onClose }) {
  if (!shortcut) return null

  const cards = buildWisdomCards(homeData)

  return (
    <div className="feature-sheet-backdrop" role="presentation" onClick={onClose}>
      <motion.aside
        className="feature-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={shortcut.title}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.2, 0.82, 0.2, 1] }}
      >
        <button className="feature-sheet-close" type="button" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <span className={`shortcut-glyph ${shortcut.tone}`}>{shortcut.title.slice(0, 1)}</span>
        <strong>{shortcut.title}</strong>
        <p>{shortcut.status || shortcut.note}</p>
        <div className="wisdom-card-list">
          {cards.map((card) => (
            <span key={card}>{card}</span>
          ))}
        </div>
      </motion.aside>
    </div>
  )
}

function MatchProfileSheet({ thread, onClose, onReveal }) {
  const match = thread?.sourceMatch || {}
  const profile = match.user || {}
  if (!thread) return null

  const tags = [...splitList(profile.tags), ...splitList(profile.sceneTags)].slice(0, 6)
  const revealed = Boolean(match.identityRevealed)

  return (
    <div className="feature-sheet-backdrop" role="presentation" onClick={onClose}>
      <motion.aside
        className="feature-sheet match-profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="匹配资料"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.2, 0.82, 0.2, 1] }}
      >
        <button className="feature-sheet-close" type="button" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <span className={`message-avatar ${thread.tone}`}>{thread.name.slice(0, 1)}</span>
        <strong>{profile.nickname || thread.name}</strong>
        <p>{[profile.school, profile.grade, profile.major, profile.mbti].filter(Boolean).join(' · ') || thread.school}</p>
        <div className="wisdom-card-list">
          <span>{profile.bio || '对方还没有写太多介绍，可以先从一个轻松问题开始。'}</span>
          <span>{revealed ? '双方已确认公开身份，可以更放心地继续聊。' : '现在仍是低压力匹配状态，双方确认后再公开更多身份信息。'}</span>
        </div>
        {tags.length > 0 && (
          <div className="profile-badges">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
        {match.id && (
          <button className="primary-action" type="button" onClick={() => onReveal?.(match.id)}>
            {revealed ? '已公开身份' : '申请公开身份'}
          </button>
        )}
      </motion.aside>
    </div>
  )
}

function BottomNav({ active = 'home' }) {
  const [hidden, setHidden] = useState(false)
  const items = [
    { key: 'home', icon: 'home', label: '首页', href: '/' },
    { key: 'chat', icon: 'chat', label: '消息', href: '/messages' },
    { key: 'ai', icon: 'ai', label: '问问', href: '/#tests' },
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
  const [activity, setActivity] = useState(null)
  const [membership, setMembership] = useState(null)
  const [insight, setInsight] = useState(() => normalizeInsightPayload(insightFallback, profileFallback))
  const [treeholes, setTreeholes] = useState([])
  const [activityBusy, setActivityBusy] = useState('')
  const [membershipBusy, setMembershipBusy] = useState('')

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
        const [profileResult, activityResult, membershipResult, insightResult, treeholeResult] = await Promise.allSettled([
          apiRequest('/users/profile'),
          apiRequest('/users/activity'),
          apiRequest('/membership'),
          apiRequest('/users/insights'),
          apiRequest('/users/treeholes'),
        ])
        if (!mounted) return

        if (profileResult.status !== 'fulfilled') {
          throw profileResult.reason
        }

        const payload = profileResult.value
        const loadedUser = payload.data?.user || profileFallback
        setUser(loadedUser)
        setForm(userToProfileForm(loadedUser))
        setInsight(
          insightResult.status === 'fulfilled'
            ? normalizeInsightPayload(insightResult.value.data, loadedUser)
            : normalizeInsightPayload({}, loadedUser),
        )
        if (treeholeResult.status === 'fulfilled') {
          setTreeholes(normalizeTreeholes(treeholeResult.value.data?.posts))
        }
        if (activityResult.status === 'fulfilled') {
          setActivity(activityResult.value.data || null)
        }
        if (membershipResult.status === 'fulfilled') {
          setMembership(membershipResult.value.data || null)
        }
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
        setInsight((current) => normalizeInsightPayload(current, localUser))
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
      setInsight((current) => normalizeInsightPayload(current, updatedUser))
      setNotice('资料已保存。')
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const refreshActivity = async () => {
    if (!isLoggedIn) return
    const payload = await apiRequest('/users/activity')
    setActivity(payload.data || null)
  }

  const removeActivityItem = async (type, item) => {
    const targetId = profileId(item.profile)
    if (!targetId || activityBusy) return

    setActivityBusy(`${type}-${targetId}`)
    setError('')
    try {
      const endpoint =
        type === 'liked'
          ? `/users/activity/liked/${encodeURIComponent(targetId)}`
          : `/users/activity/footprints/${encodeURIComponent(targetId)}`
      const payload = await apiRequest(endpoint, { method: 'DELETE' })
      setActivity(payload.data || null)
      setNotice(type === 'liked' ? '已从喜欢列表移除。' : '已移除这条足迹。')
    } catch (err) {
      setError(err.message)
    } finally {
      setActivityBusy('')
    }
  }

  const clearFootprints = async () => {
    if (activityBusy) return

    setActivityBusy('footprints-all')
    setError('')
    try {
      const payload = await apiRequest('/users/activity/footprints', { method: 'DELETE' })
      setActivity(payload.data || null)
      setNotice('足迹已清空。')
    } catch (err) {
      setError(err.message)
    } finally {
      setActivityBusy('')
    }
  }

  const resetRecommendations = async () => {
    if (activityBusy) return

    setActivityBusy('recommendations-reset')
    setError('')
    try {
      const payload = await apiRequest('/users/recommendations/reset', { method: 'POST' })
      setActivity(payload.data?.activity || activity)
      if (payload.data?.user) {
        setUser(payload.data.user)
        setForm(userToProfileForm(payload.data.user))
      }
      setNotice(payload.message || '已重新整理推荐。')
    } catch (err) {
      setError(err.message)
    } finally {
      setActivityBusy('')
    }
  }

  const subscribePlan = async (planId, billingCycle = 'monthly') => {
    if (membershipBusy || !isLoggedIn) return

    setMembershipBusy(`${planId}-${billingCycle}`)
    setError('')
    try {
      const payload = await apiRequest('/membership/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId, billingCycle }),
      })
      setMembership(payload.data || null)
      if (payload.data?.user) {
        setUser(payload.data.user)
        setForm(userToProfileForm(payload.data.user))
      }
      setNotice(payload.message || '会员状态已更新。')
    } catch (err) {
      setError(err.message)
    } finally {
      setMembershipBusy('')
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
  const activityCounts = activity?.counts || {}
  const displayStats = {
    matches: activityCounts.matches ?? stats.matches ?? 0,
    likes: activityCounts.liked ?? stats.likes ?? 0,
    views: activityCounts.footprints ?? stats.views ?? 0,
  }
  const avatarSrc = avatarPreview || user.avatar
  const currentMembership = membership?.membership || user.membership || {}
  const plans = membership?.plans || []
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
            <span><strong>{displayStats.matches}</strong>合拍</span>
            <span><strong>{displayStats.likes}</strong>喜欢</span>
            <span><strong>{displayStats.views}</strong>足迹</span>
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

      <section className="profile-insights-grid" aria-label="账号功能">
        <ProfileInsightPanel insight={insight} treeholes={treeholes} />

        <section className="profile-panel membership-panel">
          <div className="profile-panel-head">
            <div>
              <span className="section-label">会员中心</span>
              <h2>{currentMembership.title || '免费用户'}</h2>
              <p>{currentMembership.description || '先用基础功能体验真实校园连接。'}</p>
            </div>
            <span className="membership-status">
              {currentMembership.status === 'active' ? '使用中' : '已到期'}
            </span>
          </div>
          <div className="membership-meta">
            <span>推荐额度 <strong>{currentMembership.limits?.recommendationWindow || 12}</strong></span>
            <span>到期时间 <strong>{formatShortDate(currentMembership.expiresAt)}</strong></span>
          </div>
          <div className="membership-plans">
            {plans.map((plan) => {
              const active = currentMembership.planId === plan.id
              const busy = membershipBusy === `${plan.id}-monthly`
              return (
                <article className={`membership-plan ${active ? 'active' : ''}`} key={plan.id}>
                  <div>
                    <strong>{plan.name}</strong>
                    <p>{plan.description}</p>
                  </div>
                  <span>{formatPlanPrice(plan)}</span>
                  <ul>
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button
                    className={active ? 'ghost-action' : 'primary-action'}
                    type="button"
                    disabled={!isLoggedIn || Boolean(membershipBusy) || active}
                    onClick={() => subscribePlan(plan.id)}
                  >
                    {busy ? '开通中' : active ? '当前方案' : '切换方案'}
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <section className="profile-panel activity-panel">
          <div className="profile-panel-head">
            <div>
              <span className="section-label">我的喜欢</span>
              <h2>聊得来的连接</h2>
            </div>
            <button className="ghost-action" type="button" onClick={refreshActivity} disabled={!isLoggedIn || Boolean(activityBusy)}>
              刷新
            </button>
          </div>
          <div className="activity-list">
            {(activity?.liked || []).slice(0, 4).map((item) => {
              const profile = item.profile || {}
              const id = profileId(profile)
              return (
                <article className="activity-card" key={item.id || id}>
                  <div>
                    <strong>{profile.nickname || '校园同学'}</strong>
                    <p>{profile.bio || item.lastMessagePreview || '已经互相喜欢，可以从消息里继续聊。'}</p>
                    <small>{[profile.school, profile.mbti, formatRelativeTime(item.actionAt)].filter(Boolean).join(' · ')}</small>
                  </div>
                  <div className="activity-actions">
                    {item.matchId && (
                      <button type="button" onClick={() => navigateTo('/messages')}>
                        去聊天
                      </button>
                    )}
                    <button type="button" disabled={activityBusy === `liked-${id}`} onClick={() => removeActivityItem('liked', item)}>
                      移除
                    </button>
                  </div>
                </article>
              )
            })}
            {(!activity?.liked || activity.liked.length === 0) && (
              <p className="empty-state">喜欢的人会出现在这里。先去首页看看今日推荐。</p>
            )}
          </div>
        </section>

        <section className="profile-panel activity-panel">
          <div className="profile-panel-head">
            <div>
              <span className="section-label">浏览足迹</span>
              <h2>重新整理推荐方向</h2>
            </div>
            <button className="ghost-action" type="button" onClick={clearFootprints} disabled={!isLoggedIn || activityBusy === 'footprints-all'}>
              清空
            </button>
          </div>
          <div className="activity-list">
            {(activity?.footprints || []).slice(0, 4).map((item) => {
              const profile = item.profile || {}
              const id = profileId(profile)
              return (
                <article className="activity-card compact" key={item.id || id}>
                  <div>
                    <strong>{profile.nickname || '略过的同学'}</strong>
                    <p>{profile.bio || item.note || '这条资料已经略过。'}</p>
                    <small>{[profile.school, formatRelativeTime(item.actionAt)].filter(Boolean).join(' · ')}</small>
                  </div>
                  <button type="button" disabled={activityBusy === `footprints-${id}`} onClick={() => removeActivityItem('footprints', item)}>
                    移除
                  </button>
                </article>
              )
            })}
            {(!activity?.footprints || activity.footprints.length === 0) && (
              <p className="empty-state">暂时没有足迹。略过推荐后会记录在这里。</p>
            )}
          </div>
          <button className="primary-action wide-action" type="button" onClick={resetRecommendations} disabled={!isLoggedIn || activityBusy === 'recommendations-reset'}>
            {activityBusy === 'recommendations-reset' ? '整理中' : '重新整理推荐'}
          </button>
        </section>
      </section>

      <BottomNav active="user" />
    </main>
  )
}

function MessagesPage() {
  const [threads, setThreads] = useState(messageThreads)
  const [selectedId, setSelectedId] = useState(messageThreads[0]?.id)
  const [messagesByThread, setMessagesByThread] = useState(() =>
    Object.fromEntries(messageThreads.map((thread) => [thread.id, thread.messages])),
  )
  const [currentUserId, setCurrentUserId] = useState('')
  const [filter, setFilter] = useState('全部')
  const [composer, setComposer] = useState('')
  const [messageNotice, setMessageNotice] = useState(() =>
    hasAuthToken() ? '正在同步真实匹配和消息。' : '登录后会同步真实匹配和消息。',
  )
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [profileSheetThread, setProfileSheetThread] = useState(null)

  useEffect(() => {
    if (!hasAuthToken()) return undefined

    let mounted = true
    Promise.resolve().then(() => {
      if (mounted) setMessagesLoading(true)
    })

    Promise.allSettled([apiRequest('/users/profile'), apiRequest('/matches')])
      .then(([profileResult, matchesResult]) => {
        if (!mounted) return

        if (profileResult.status === 'fulfilled') {
          const user = profileResult.value.data?.user || {}
          setCurrentUserId(user.id || user._id || '')
        }

        if (matchesResult.status !== 'fulfilled') {
          setMessageNotice(matchesResult.reason?.message || '消息接口暂时没有返回，先保留预览会话。')
          return
        }

        const matches = matchesResult.value.data?.matches || []
        const nextThreads = matches.map(normalizeMessageThread)

        if (!nextThreads.length) {
          setMessageNotice('现在还没有真实匹配，喜欢互相通过后会自动出现在这里。')
          return
        }

        setThreads(nextThreads)
        setSelectedId((current) => (nextThreads.some((thread) => thread.id === current) ? current : nextThreads[0].id))
        setMessagesByThread((current) => ({
          ...Object.fromEntries(nextThreads.map((thread) => [thread.id, current[thread.id] || []])),
        }))
        const unreadTotal = matchesResult.value.data?.unreadTotal ?? nextThreads.reduce((total, item) => total + item.unread, 0)
        setMessageNotice(unreadTotal > 0 ? `有 ${unreadTotal} 条未读消息。` : '真实匹配已同步，可以继续聊天。')
      })
      .finally(() => {
        if (mounted) setMessagesLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const selectedThread = threads.find((thread) => thread.id === selectedId) || threads[0]
  const selectedMessages = messagesByThread[selectedThread?.id] || selectedThread?.messages || []
  const filteredThreads = useMemo(() => {
    if (filter === '未读') return threads.filter((thread) => thread.unread > 0)
    if (filter === '同校') return threads.filter((thread) => thread.school.includes('同校') || thread.sourceMatch?.user?.school)
    if (filter === '树洞') return threads.filter((thread) => `${thread.school}${thread.lastMessage}`.includes('树洞'))
    return threads
  }, [filter, threads])
  const unreadTotal = threads.reduce((total, thread) => total + thread.unread, 0)
  const onlineTotal = threads.filter((thread) => thread.online).length

  useEffect(() => {
    if (!hasAuthToken() || !selectedThread?.sourceMatch || !currentUserId) return undefined

    let mounted = true
    Promise.resolve().then(() => {
      if (mounted) setMessagesLoading(true)
    })

    apiRequest(`/messages/${encodeURIComponent(selectedThread.id)}?limit=40`)
      .then((payload) => {
        if (!mounted) return

        const nextMessages = (payload.data?.messages || []).map((message) => normalizeChatMessage(message, currentUserId))
        const nextMatch = payload.data?.match

        setMessagesByThread((current) => ({
          ...current,
          [selectedThread.id]: nextMessages,
        }))

        if (nextMatch) {
          setThreads((current) =>
            current.map((thread, index) =>
              thread.id === selectedThread.id
                ? { ...normalizeMessageThread(nextMatch, index), tone: thread.tone }
                : thread,
            ),
          )
        }
      })
      .catch((error) => {
        if (mounted) setMessageNotice(error.message || '聊天记录同步失败，请稍后再试。')
      })
      .finally(() => {
        if (mounted) setMessagesLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentUserId, selectedThread?.id, selectedThread?.sourceMatch])

  const handleSendMessage = async () => {
    const content = composer.trim()
    if (!content || sending) return

    if (!hasAuthToken()) {
      navigateTo('/login')
      return
    }

    if (!selectedThread?.sourceMatch) {
      setMessageNotice('这是预览会话。互相喜欢形成真实匹配后，就能发送到后端保存。')
      return
    }

    setSending(true)
    try {
      const payload = await apiRequest(`/messages/${encodeURIComponent(selectedThread.id)}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      const nextMessage = { ...normalizeChatMessage(payload.data?.message, currentUserId), from: 'me' }
      const nextMatch = payload.data?.match

      setMessagesByThread((current) => ({
        ...current,
        [selectedThread.id]: [...(current[selectedThread.id] || []), nextMessage],
      }))
      setThreads((current) =>
        current.map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                lastMessage: content,
                time: '刚刚',
                unread: 0,
                sourceMatch: nextMatch || thread.sourceMatch,
              }
            : thread,
        ),
      )
      setComposer('')
      setMessageNotice('消息已发送。')
    } catch (error) {
      setMessageNotice(error.message || '发送失败，请稍后再试。')
    } finally {
      setSending(false)
    }
  }

  const handleRevealIdentity = async (matchId) => {
    if (!matchId) return

    try {
      const payload = await apiRequest(`/matches/${encodeURIComponent(matchId)}/reveal`, { method: 'POST' })
      const bothRevealed = Boolean(payload.data?.bothRevealed)
      setThreads((current) =>
        current.map((thread) =>
          thread.id === matchId
            ? {
                ...thread,
                sourceMatch: {
                  ...(thread.sourceMatch || {}),
                  identityRevealed: bothRevealed || thread.sourceMatch?.identityRevealed,
                },
              }
            : thread,
        ),
      )
      setProfileSheetThread((current) =>
        current?.id === matchId
          ? {
              ...current,
              sourceMatch: {
                ...(current.sourceMatch || {}),
                identityRevealed: bothRevealed || current.sourceMatch?.identityRevealed,
              },
            }
          : current,
      )
      setMessageNotice(payload.data?.message || '申请已发送。')
    } catch (error) {
      setMessageNotice(error.message || '申请没有成功，请稍后再试。')
    }
  }

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
          <span><strong>{unreadTotal}</strong>新消息</span>
          <span><strong>{onlineTotal}</strong>在线</span>
          <span><strong>{threads.length}</strong>会话</span>
        </div>
      </section>

      <section className="messages-layout" aria-label="消息中心">
        <aside className="messages-panel thread-panel">
          {messageNotice && <p className="message-notice">{messageNotice}</p>}
          <div className="message-filter" aria-label="消息筛选">
            {['全部', '未读', '同校', '树洞'].map((item) => (
              <button className={filter === item ? 'active' : ''} type="button" key={item} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
          <AnimatedList
            className="message-thread-list"
            items={filteredThreads}
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

        {selectedThread && (
        <section className="messages-panel chat-panel" aria-label="聊天预览">
          <div className="chat-head">
            <div className={`message-avatar ${selectedThread.tone}`}>{selectedThread.name.slice(0, 1)}</div>
            <div>
              <strong>{selectedThread.name}</strong>
              <span>{selectedThread.school}</span>
            </div>
            <button className="ghost-action" type="button" onClick={() => setProfileSheetThread(selectedThread)}>查看资料</button>
          </div>

          <div className="chat-bubbles">
            {messagesLoading && selectedThread.sourceMatch && <p>正在同步聊天记录...</p>}
            {!messagesLoading && selectedMessages.length === 0 && (
              <p>你们已经匹配了，先发一句轻松的开场吧。</p>
            )}
            {selectedMessages.map((message, index) => (
              <p className={message.from === 'me' ? 'me' : ''} key={`${selectedThread.id}-${index}`}>
                {message.text}
              </p>
            ))}
          </div>

          <div className="message-composer" aria-label="发送消息">
            <input
              placeholder="写一句轻松的开场..."
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <button type="button" onClick={handleSendMessage} disabled={sending}>
              {sending ? '发送中' : '发送'}
            </button>
          </div>
        </section>
        )}
      </section>
      <AnimatePresence>
        {profileSheetThread && (
          <MatchProfileSheet
            thread={profileSheetThread}
            onClose={() => setProfileSheetThread(null)}
            onReveal={handleRevealIdentity}
          />
        )}
      </AnimatePresence>

      <BottomNav active="chat" />
    </main>
  )
}

function HomePage() {
  const [homeData, setHomeData] = useState({
    profile: null,
    activity: null,
    recommendations: [],
    matches: [],
    membership: null,
    insight: insightFallback,
    treeholes: [],
  })
  const [homeLoading, setHomeLoading] = useState(false)
  const [activeShortcut, setActiveShortcut] = useState(null)
  const [insightBusy, setInsightBusy] = useState('')
  const [insightNotice, setInsightNotice] = useState('')

  useEffect(() => {
    if (!hasAuthToken()) return undefined

    let mounted = true
    Promise.resolve().then(() => {
      if (mounted) setHomeLoading(true)
    })

    Promise.allSettled([
      apiRequest('/users/profile'),
      apiRequest('/users/activity'),
      apiRequest('/users/recommendations?limit=6'),
      apiRequest('/matches'),
      apiRequest('/membership'),
      apiRequest('/users/insights'),
      apiRequest('/users/treeholes'),
    ])
      .then(([profileResult, activityResult, recommendationResult, matchesResult, membershipResult, insightResult, treeholeResult]) => {
        if (!mounted) return
        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data?.user || null : null

        setHomeData({
          profile,
          activity: activityResult.status === 'fulfilled' ? activityResult.value.data || null : null,
          recommendations:
            recommendationResult.status === 'fulfilled' ? recommendationResult.value.data?.users || [] : [],
          matches: matchesResult.status === 'fulfilled' ? matchesResult.value.data?.matches || [] : [],
          membership: membershipResult.status === 'fulfilled' ? membershipResult.value.data || null : null,
          insight:
            insightResult.status === 'fulfilled'
              ? normalizeInsightPayload(insightResult.value.data, profile || {})
              : normalizeInsightPayload({}, profile || {}),
          treeholes:
            treeholeResult.status === 'fulfilled'
              ? normalizeTreeholes(treeholeResult.value.data?.posts)
              : [],
        })
      })
      .finally(() => {
        if (mounted) setHomeLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const shortcutItems = useMemo(() => buildShortcutCards(homeData, homeLoading), [homeData, homeLoading])
  const feedItems = useMemo(() => buildFeedCards(homeData), [homeData])
  const visibleInsight = useMemo(
    () => normalizeInsightPayload(homeData.insight, homeData.profile || profileFallback),
    [homeData.insight, homeData.profile],
  )

  const updateHomeInsight = async (body) => {
    if (!hasAuthToken()) {
      setHomeData((current) => ({
        ...current,
        insight: normalizeInsightPayload({
          ...current.insight,
          moodScore: body.moodScore,
          selfInsight: {
            ...(current.insight?.selfInsight || {}),
            ...body,
          },
        }, current.profile || profileFallback),
      }))
      setInsightNotice('本地预览已更新。登录后会保存到账号里。')
      return true
    }

    setInsightBusy('mood')
    setInsightNotice('')
    try {
      const payload = await apiRequest('/users/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setHomeData((current) => ({
        ...current,
        insight: normalizeInsightPayload(payload.data, current.profile || profileFallback),
      }))
      setInsightNotice(payload.message || '今日状态已更新。')
      return true
    } catch (error) {
      setInsightNotice(error.message || '状态更新失败，再试一次。')
      return false
    } finally {
      setInsightBusy('')
    }
  }

  const submitTreehole = async (body) => {
    if (!hasAuthToken()) {
      const localPost = {
        id: `local-treehole-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
      }
      setHomeData((current) => ({
        ...current,
        treeholes: [localPost, ...(current.treeholes || [])],
        insight: normalizeInsightPayload({
          ...current.insight,
          treeholeCount: (current.insight?.treeholeCount || 0) + 1,
        }, current.profile || profileFallback),
      }))
      setInsightNotice('本地树洞已记下。登录后可以保存到账号里。')
      return true
    }

    setInsightBusy('treehole')
    setInsightNotice('')
    try {
      const payload = await apiRequest('/users/treeholes', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setHomeData((current) => ({
        ...current,
        treeholes: normalizeTreeholes(payload.data?.posts),
        insight: normalizeInsightPayload({
          ...(current.insight || {}),
          treeholeCount: payload.data?.posts?.length || current.insight?.treeholeCount || 0,
        }, current.profile || profileFallback),
      }))
      setInsightNotice(payload.message || '已放进你的匿名树洞。')
      return true
    } catch (error) {
      setInsightNotice(error.message || '树洞保存失败，再试一次。')
      return false
    } finally {
      setInsightBusy('')
    }
  }

  const handleShortcutSelect = (item) => {
    if (item.action === 'profile') {
      navigateTo('/profile')
      return
    }

    if (item.action === 'match') {
      navigateTo('/#match')
      return
    }

    if (item.action === 'discover') {
      navigateTo('/#discover')
      return
    }

    setActiveShortcut(item)
  }

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
      <ShortcutGrid items={shortcutItems} onSelect={handleShortcutSelect} />
      <SelfInsightPanel
        insight={visibleInsight}
        treeholes={homeData.treeholes}
        onMoodUpdate={updateHomeInsight}
        onTreeholeSubmit={submitTreehole}
        busy={insightBusy}
        notice={insightNotice}
      />
      <Feed items={feedItems} />
      <AnimatePresence>
        {activeShortcut && (
          <FeatureSheet
            shortcut={activeShortcut}
            homeData={homeData}
            onClose={() => setActiveShortcut(null)}
          />
        )}
      </AnimatePresence>
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
