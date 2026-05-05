import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import AnimatedList from './AnimatedList'
import PillNav from './PillNav'
import { AnimatePresence, motion } from 'motion/react'
import ScrollReveal from './ScrollReveal'

const FloatingLines = lazy(() => import('./FloatingLines'))

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="app-shell error-shell">
        <Background />
        <section className="app-error-panel">
          <span className="section-label">页面遇到问题</span>
          <h1>这里先停一下</h1>
          <p>{this.state.error.message || '页面加载失败，请刷新再试。'}</p>
        </section>
      </main>
    )
  }
}

const discoveryTags = ['同校', 'MBTI', '生辰', '搭子', '树洞话题']

const moodMetrics = [
  { label: '爱情', value: 58, color: '#ff7db8' },
  { label: '财富', value: 74, color: '#ffc857' },
  { label: '事业', value: 81, color: '#8ca8ff' },
  { label: '学习', value: 67, color: '#57d7ff' },
]

const shortcuts = [
  { title: 'ISFP', note: '校园人格', tone: 'yellow' },
  { title: '星座', note: '轻量破冰', tone: 'blue' },
  { title: '报告', note: '深度画像', tone: 'cyan' },
  { title: '生辰', note: '生日节奏', tone: 'orange' },
  { title: '推荐对比', note: '合拍提示', tone: 'pink' },
  { title: '陪伴小星', note: '同频搭子', tone: 'yellow' },
  { title: '倾诉', note: '匿名树洞', tone: 'peach' },
  { title: '智慧卡', note: '破冰问题', tone: 'violet' },
  { title: '报告库', note: '测试历史', tone: 'blue' },
  { title: '更多', note: '全部工具', tone: 'cyan' },
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
const quizPackSpecs = [
  ['campus-personality', '校园人格', '人格', '测出你的校园认识节奏', ['慢热', '真实日常'], ['同校'], '认识同校朋友'],
  ['relationship-radar', '关系雷达', '关系', '看清你更舒服的关系推进方式', ['认真了解', '边界感'], ['低压力'], '认真了解'],
  ['communication-style', '沟通偏好', '沟通', '找到更适合你的回复和表达方式', ['温柔回应', '直接沟通'], ['高效沟通'], '认识同校朋友'],
  ['campus-scenes', '校园场景', '场景', '判断你最容易自然开场的校园地点', ['散步聊天', '探店吃饭'], ['操场', '食堂'], '找校园搭子'],
  ['study-energy', '学习能量', '学习', '看看你适合哪种学习搭子', ['学习搭子', '稳定安排'], ['图书馆', '自习'], '找学习搭子'],
  ['dorm-roommate', '寝室相处', '生活', '测出你的宿舍边界和相处节奏', ['边界清楚', '生活节奏'], ['宿舍'], '找生活搭子'],
  ['social-battery', '社交电量', '社交', '判断你今天适合主动认识还是慢慢观察', ['社交电量', '慢节奏'], ['低压力'], '认识同校朋友'],
  ['mood-weather', '情绪天气', '心理', '看见此刻情绪需要怎样被回应', ['情绪觉察', '愿意倾听'], ['树洞'], '找倾诉搭子'],
  ['crush-signal', '暗恋信号', '关系', '用轻松方式观察好感表达', ['轻松聊天', '认真了解'], ['校园日常'], '认真了解'],
  ['partner-fit', '搭子适配', '搭子', '找到更合拍的学习、吃饭或活动搭子', ['搭子适配', '同频感'], ['活动', '食堂'], '找校园搭子'],
  ['conflict-repair', '冲突修复', '沟通', '看看你更适合怎样把话说开', ['冲突修复', '共情回应'], ['高效沟通'], '认识同校朋友'],
  ['boundary-sense', '边界感', '安全', '把舒服和不舒服说清楚', ['边界感', '安全感'], ['低压力'], '认识同校朋友'],
  ['secure-attachment', '安全感', '关系', '识别你在新关系里的安心来源', ['安全感', '慢慢熟悉'], ['同校认证'], '认真了解'],
  ['club-events', '活动社团', '活动', '适配你的社团和活动开场方式', ['活动搭子', '主动开场'], ['活动', '社团'], '找活动搭子'],
  ['stress-recovery', '压力恢复', '心理', '找到适合你的恢复节奏', ['压力恢复', '愿意倾听'], ['树洞', '操场'], '找倾诉搭子'],
  ['friend-circle-role', '朋友圈角色', '社交', '看你在小圈子里更像哪种角色', ['朋友圈角色', '真实日常'], ['同校'], '认识同校朋友'],
  ['same-frequency', '同频指数', '匹配', '提炼近期最适合推荐的同频标签', ['同频感', '推荐对比'], ['同校'], '认识同校朋友'],
  ['icebreaker-style', '破冰方式', '沟通', '生成更自然的第一句话', ['破冰问题', '轻松聊天'], ['校园日常'], '认识同校朋友'],
  ['zodiac-social', '星座相处', '轻娱乐', '用星座做轻松破冰参考', ['星座破冰', '轻娱乐'], ['生日节奏'], '认识同校朋友'],
  ['birthday-rhythm', '生日节奏', '轻娱乐', '用生日节奏整理今日开场提示', ['生日节奏', '轻娱乐'], ['校园日常'], '认识同校朋友'],
]

function makeCampusTestPack([id, title, category, description, tags, sceneTags, relationshipGoal], index) {
  const tone = ['cyan', 'pink', 'violet', 'blue', 'peach', 'yellow'][index % 6]
  const scene = sceneTags[0] || '校园日常'
  const tag = tags[0] || title
  return {
    id,
    title,
    category,
    description,
    tone,
    tags,
    sceneTags,
    relationshipGoal,
    questions: [
      {
        key: `${id}-energy`,
        eyebrow: '01 能量',
        category,
        resultKey: 'mbti',
        title: `做「${title}」时，你更舒服的开始方式是？`,
        options: [
          { value: 'I', label: '先观察一下', note: '确认安全感后再投入', tag: '慢热观察', sceneTag: scene },
          { value: 'E', label: '先试着互动', note: '有回应就能更快进入状态', tag: '主动开场', sceneTag: scene },
        ],
      },
      {
        key: `${id}-info`,
        eyebrow: '02 关注点',
        category,
        resultKey: 'mbti',
        title: `判断${title}是否合拍时，你更相信什么？`,
        options: [
          { value: 'N', label: '整体感觉', note: '气质、默契和想象空间', tag: '同频感', sceneTag: scene },
          { value: 'S', label: '具体细节', note: '时间、地点和真实习惯', tag: '真实日常', sceneTag: scene },
        ],
      },
      {
        key: `${id}-decision`,
        eyebrow: '03 回应',
        category,
        resultKey: 'mbti',
        title: `遇到${title}里的小分歧，你通常先做什么？`,
        options: [
          { value: 'F', label: '先照顾感受', note: '让对方知道自己被认真对待', tag: '共情回应', sceneTag: '低压力' },
          { value: 'T', label: '先说清问题', note: '把原因、边界和下一步讲明白', tag: '清楚表达', sceneTag: '高效沟通' },
        ],
      },
      {
        key: `${id}-pace`,
        eyebrow: '04 节奏',
        category,
        resultKey: 'mbti',
        title: `你希望${title}更像哪种节奏？`,
        options: [
          { value: 'J', label: '稳定安排', note: '约好时间和边界会更安心', tag: '稳定安排', sceneTag: scene },
          { value: 'P', label: '自然发生', note: '先轻松相处，不急着定规则', tag: '随性探索', sceneTag: '低压力' },
        ],
      },
      {
        key: `${id}-goal`,
        eyebrow: '05 场景',
        category,
        title: `完成这个短测后，你最想优先匹配哪类人？`,
        options: [
          { value: 'primary', label: `${tag}的人`, note: `能围绕${scene}自然开场`, tag, sceneTag: scene, relationshipGoal },
          { value: 'steady', label: '边界舒服的人', note: '节奏稳定，不强行推进', tag: tags[1] || '边界感', sceneTag: '安全感', relationshipGoal },
          { value: 'campus', label: '同校真实的人', note: '资料可靠，先从校园小事聊起', tag: '同校认证', sceneTag: '同校', relationshipGoal: '认识同校朋友' },
        ],
      },
    ],
  }
}

const campusTestPacks = quizPackSpecs.map(makeCampusTestPack)
const quizQuestions = campusTestPacks[0].questions

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
    detailChips: ['同校认证', 'INFP', '天秤座', '9月28日生'],
    reasonList: ['都喜欢安静自习', '聊天节奏偏慢', '电影歌单能开场'],
    identityLabel: '已认证',
    schoolLine: '同校 · 文学类 · 大三',
    accent: 'cyan',
  },
  {
    id: 'walk-match',
    name: '湖边散步',
    score: 81,
    meta: '同城校区 · 周末 · 低压力',
    note: '更喜欢边走边聊，不用一直找话题也舒服。',
    tags: ['散步', '歌单', '树洞'],
    detailChips: ['同城校区', 'ENFP', '双鱼座', '散步局'],
    reasonList: ['都接受低压力认识', '周末时间更合拍', '愿意从线下活动开始'],
    identityLabel: '校园资料',
    schoolLine: '同城校区 · 设计类 · 大二',
    accent: 'pink',
  },
  {
    id: 'mbti-match',
    name: '同频小卡',
    score: 78,
    meta: 'MBTI · 生辰 · 轻聊天',
    note: '回复不一定快，但每一句都会认真看。',
    tags: ['INFP', '星座', '慢节奏'],
    detailChips: ['INFP', '巨蟹座', '7月10日生', '慢热聊天'],
    reasonList: ['MBTI 节奏接近', '都偏认真回复', '适合先聊校园日常'],
    identityLabel: '同频推荐',
    schoolLine: '资料完善度较高',
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
  photos: [],
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

function messageDayKey(value) {
  const timestamp = Date.parse(value || '')
  if (!Number.isFinite(timestamp)) return 'draft'

  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function formatMessageDay(value) {
  const timestamp = Date.parse(value || '')
  if (!Number.isFinite(timestamp)) return '今天'

  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return '今天'
  if (date.toDateString() === yesterday.toDateString()) return '昨天'

  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

function groupMessagesByDay(messages = []) {
  const rows = []
  let lastKey = ''

  messages.forEach((message, index) => {
    const dayKey = messageDayKey(message.createdAt)
    if (dayKey !== lastKey) {
      rows.push({
        type: 'date',
        key: `date-${dayKey}-${index}`,
        label: formatMessageDay(message.createdAt),
      })
      lastKey = dayKey
    }

    rows.push({
      type: 'message',
      key: `message-${message.id || message.createdAt || index}`,
      message,
      index,
    })
  })

  return rows
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
  const verified = user.isVerified || user.verificationStatus === 'approved'
  const photos = normalizeProfilePhotos(user.photos)
  const primaryPhoto = photos[0] || user.avatar || ''
  const birthLabel = formatBirthDate(user.birthDate)
  const zodiac = zodiacFromBirthDate(user.birthDate)
  const meta = [
    verified ? '同校认证' : user.school,
    user.major,
    user.mbti,
  ]
    .filter(Boolean)
    .join(' · ')
  const detailChips = [
    verified ? '同校认证' : user.school,
    user.mbti,
    zodiac,
    birthLabel ? `${birthLabel}生` : '',
    user.relationshipGoal,
  ]
    .filter(Boolean)
    .slice(0, 4)
  const reasonList = (reasonTags.length ? reasonTags : profileTags).filter(Boolean).slice(0, 3)

  return {
    id,
    userId: id,
    name: user.nickname || user.name || '校园同学',
    score,
    photo: primaryPhoto,
    gallery: [primaryPhoto, ...photos.filter((photo) => photo !== primaryPhoto)].filter(Boolean).slice(0, 3),
    meta: meta || '校园资料 · 等你认识',
    note: user.bio || reasonTags.join('、') || '资料还在慢慢完善，先从一个轻松话题开始。',
    tags: tags.length ? tags : ['同校', '轻聊天', '合拍'],
    detailChips: detailChips.length ? detailChips : ['同校推荐', '资料待补', '轻松开场'],
    reasonList: reasonList.length ? reasonList : ['资料越完整，推荐越准'],
    identityLabel: verified ? '已认证' : (user.school ? '校园资料' : '待完善'),
    schoolLine: [user.school, user.major, user.grade].filter(Boolean).join(' · ') || '补充学校和专业后更准',
    accent: matchAccents[index % matchAccents.length],
    source: user,
  }
}

function normalizeMessageThread(match = {}, index = 0) {
  const user = match.user || {}
  const name = user.nickname || user.name || '校园同学'
  const school = [user.school, user.major || user.mbti || '轻聊天'].filter(Boolean).join(' · ')
  const photos = normalizeProfilePhotos(user.photos)
  const avatar = photos[0] || user.avatar || ''
  const zodiac = zodiacFromBirthDate(user.birthDate)
  const birthLabel = formatBirthDate(user.birthDate)
  const detailChips = [
    user.isVerified || user.verificationStatus === 'approved' ? '同校认证' : user.school,
    user.mbti,
    zodiac,
    birthLabel ? `${birthLabel}生` : '',
  ]
    .filter(Boolean)
    .slice(0, 4)
  const preview = match.lastMessagePreview || '你们已经匹配，可以从一个轻松问题开始。'

  return {
    id: match.id || match._id || `match-${index}`,
    name,
    school: school || '同校 · 轻聊天',
    time: formatRelativeTime(match.lastMessageAt || match.matchedAt),
    unread: Number(match.unreadCount || 0),
    online: Boolean(match.typing?.activeUsers?.length),
    tone: matchAccents[index % matchAccents.length],
    lastMessage: preview,
    avatar,
    photos,
    detailChips: detailChips.length ? detailChips : ['校园资料', '轻聊天'],
    bio: user.bio || '',
    mbti: user.mbti || '',
    zodiac,
    birthLabel,
    isVerified: Boolean(user.isVerified || user.verificationStatus === 'approved'),
    identityRevealed: Boolean(match.identityRevealed),
    lastOwnMessageRead: Boolean(match.lastOwnMessageRead),
    lastMessageSenderId: match.lastMessageSenderId || '',
    messages: [],
    sourceMatch: match,
  }
}

function normalizeChatMessage(message = {}, currentUserId = '') {
  const senderId = message.senderId || message.sender?.id || message.sender?._id || ''
  const type = message.type || 'text'
  const isRecalled = Boolean(message.recalledAt || message.recalled)
  return {
    id: message.id || message._id || '',
    senderId,
    from: senderId && senderId === currentUserId ? 'me' : 'other',
    text: isRecalled ? '消息已撤回' : message.content || message.text || '',
    type,
    imageUrl: !isRecalled && type === 'image' ? message.content || message.imageUrl || '' : '',
    createdAt: message.createdAt,
    recalledAt: message.recalledAt || '',
    isRecalled,
    senderName: message.senderNickname || message.sender?.nickname || '',
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
    ISFP: profile.mbti || (loading ? '正在读取资料' : '先测人格'),
    MBTI: profile.mbti || (loading ? '正在读取资料' : '去资料页补充'),
    星座: zodiac || (loading ? '正在读取生日' : '填生日生成'),
    报告: homeData.insight?.latestReport?.resultTitle || '完成短测后生成',
    生辰: formatBirthDate(profile.birthDate) || (loading ? '正在读取生辰' : '去资料页补充'),
    缘分盘: recommendations.length
      ? `${recommendations.length} 个新推荐`
      : `${counts.matches || matches.length || 0} 个匹配`,
    缘分合盘: recommendations.length
      ? `${recommendations.length} 个可对比`
      : `${counts.matches || matches.length || 0} 个同频`,
    陪伴小星: sceneTags[0] ? `${sceneTags[0]}搭子` : '同校陪伴',
    倾诉: sceneTags.includes('树洞') ? '已加入树洞偏好' : (activity.insights?.[0] || '树洞话题已接入推荐'),
    智慧卡: recommendations[0]?.nickname
      ? `给 ${recommendations[0].nickname} 的开场`
      : (tags[0] ? `${tags[0]} 开场` : membership.title || '登录后生成'),
    报告库: homeData.insight?.testReports?.length ? `${homeData.insight.testReports.length} 份报告` : '完成短测后生成',
    更多: '测试库与社区',
  }

  const actionByTitle = {
    ISFP: 'profile',
    MBTI: 'profile',
    星座: 'profile',
    报告: 'profile',
    生辰: 'profile',
    缘分盘: 'match',
    推荐对比: 'match',
    陪伴小星: 'match',
    倾诉: 'discover',
    智慧卡: 'wisdom',
    报告库: 'profile',
    更多: 'discover',
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

function passVerticalWheelToPage(event) {
  if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
  event.preventDefault()
  window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' })
}

function mbtiFromQuizAnswers(answers = {}, questions = quizQuestions) {
  return questions
    .filter((question) => question.resultKey === 'mbti')
    .map((question) => answers[question.key])
    .join('')
}

function selectedQuizOptions(answers = {}, questions = quizQuestions) {
  return questions
    .map((question) => question.options?.find((option) => option.value === answers[question.key]))
    .filter(Boolean)
}

function quizTagsFromAnswers(answers = {}, questions = quizQuestions) {
  return Array.from(new Set(selectedQuizOptions(answers, questions).map((option) => option.tag).filter(Boolean)))
}

function quizSceneTagsFromAnswers(answers = {}, questions = quizQuestions) {
  return Array.from(new Set(selectedQuizOptions(answers, questions).map((option) => option.sceneTag).filter(Boolean)))
}

function quizRelationshipGoalFromAnswers(answers = {}, questions = quizQuestions) {
  return selectedQuizOptions(answers, questions).find((option) => option.relationshipGoal)?.relationshipGoal || ''
}

function quizBirthDateFromAnswers(answers = {}) {
  const birthDate = answers.birthDate
  return birthDate && birthDate !== 'skip' ? birthDate : ''
}

function isQuizQuestionAnswered(question, answers = {}) {
  const answer = answers[question.key]
  if (question.type === 'date') return Boolean(answer)
  return Boolean(question.options?.some((option) => option.value === answer))
}

function quizFocusFromResult({ mbti = '', birthDate = '', sceneTags = [] } = {}) {
  if (!mbti || mbti.length < 4) return '先完成小测试，生成更贴近你的开场方式'
  const zodiac = zodiacFromBirthDate(birthDate)
  const scene = sceneTags[0] || '同校话题'
  if (mbti.startsWith('I')) {
    return `从${scene}开始会更舒服，先给彼此一点慢慢熟悉的空间${zodiac ? `，${zodiac}的提示也已记下` : ''}`
  }
  return `可以主动发一个关于${scene}的轻松问题，让同校连接自然开始${zodiac ? `，${zodiac}会参与今日提示` : ''}`
}

function quizMoodFromMbti(mbti = '') {
  if (!mbti || mbti.length < 4) return { moodLabel: '想聊天', moodScore: 76 }
  const score = 70 + (mbti.startsWith('E') ? 8 : 2) + (mbti.includes('N') ? 4 : 1) + (mbti.endsWith('P') ? 3 : 0)
  return {
    moodLabel: mbti.startsWith('I') ? '轻松' : '想聊天',
    moodScore: Math.max(58, Math.min(92, score)),
  }
}

function quizPortraitFromResult({ mbti = '', birthDate = '', relationshipGoal = '', tags = [], sceneTags = [] } = {}) {
  const zodiac = zodiacFromBirthDate(birthDate)
  const energy = mbti.startsWith('I') ? '慢热观察型' : '主动开场型'
  const info = mbti.includes('N') ? '看重感觉和想象空间' : '看重真实细节'
  const reply = mbti.includes('F') ? '更吃温柔回应' : '更吃清楚直接'
  const pace = mbti.endsWith('J') ? '喜欢稳定节奏' : '喜欢自然发生'
  const scene = sceneTags[0] || tags[0] || '同校话题'
  const title = `${mbti || '校园'} · ${energy}`
  const subtitle = `${info}，${reply}，${pace}。适合从${scene}这样具体、低压力的入口开始认识。`
  const opener = mbti.startsWith('I')
    ? `开场可以轻一点：我也更喜欢慢慢熟悉，看到你也提到${scene}，想问问你平时会怎么安排这类时间？`
    : `开场可以主动一点：看到你也对${scene}有兴趣，刚好想找个同校的人聊聊，你最近有类似的小计划吗？`

  return {
    title,
    subtitle,
    opener,
    chips: [zodiac, relationshipGoal, ...tags, ...sceneTags].filter(Boolean),
    tiles: [
      {
        label: '人格节奏',
        value: mbti || '待生成',
        text: `${energy}，${pace}。`,
      },
      {
        label: '生辰提示',
        value: zodiac || '可后补',
        text: zodiac ? `${zodiac}会参与每日提示。` : '补上生日后，会生成星座和生辰提示。',
      },
      {
        label: '合拍入口',
        value: relationshipGoal || scene,
        text: `先从${scene}开聊，更容易自然接上。`,
      },
    ],
  }
}

function todayPackId(packs = campusTestPacks) {
  const dayKey = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const dayNumber = Number(dayKey)
  return packs[Number.isFinite(dayNumber) ? dayNumber % packs.length : 0]?.id || packs[0]?.id
}

function reportByPack(reports = []) {
  return new Map((Array.isArray(reports) ? reports : []).filter(Boolean).map((report) => [report.packId || report.title, report]))
}

function createDeepQuizReport({ pack, answers, mbti, birthDate, relationshipGoal, tags, sceneTags, resultMood, resultPortrait }) {
  const completedAt = new Date().toISOString()
  const answerLabels = Object.fromEntries(
    pack.questions.map((question) => {
      const option = question.options?.find((item) => item.value === answers[question.key])
      return [question.key, option?.label || answers[question.key] || '']
    }),
  )
  const primaryTag = tags[0] || pack.tags[0] || '校园合拍'
  const primaryScene = sceneTags[0] || pack.sceneTags[0] || '校园日常'
  const resultTitle = `${pack.title} · ${resultPortrait.title}`
  const openingLines = [
    resultPortrait.opener,
    `我刚做了「${pack.title}」，发现自己更适合从${primaryScene}开始认识人。你平时也会关注这个吗？`,
    `看到你也提到${primaryTag}，想问问你最近一次觉得舒服的校园瞬间是什么？`,
  ].filter(Boolean)

  return {
    id: `${pack.id}-${Date.now()}`,
    type: 'campus-fit',
    title: pack.title,
    packId: pack.id,
    packTitle: pack.title,
    category: pack.category,
    version: 'inner-beta-2026-05',
    completedAt,
    answers: answerLabels,
    dimensions: [
      { label: '人格节奏', value: mbti || '校园画像', text: resultPortrait.tiles[0]?.text || resultPortrait.subtitle },
      { label: '场景入口', value: primaryScene, text: `更适合从${primaryScene}这样具体、低压力的入口开始。` },
      { label: '关系目标', value: relationshipGoal || pack.relationshipGoal, text: '推荐会优先参考这个关系目标。' },
      { label: '开场指数', value: String(resultMood.moodScore), text: `${resultMood.moodLabel}状态下，先用短句开场更自然。` },
      { label: '轻娱乐提示', value: zodiacFromBirthDate(birthDate) || '可后补', text: '星座和生日只作为破冰参考，不做绝对预测。' },
    ],
    resultTitle,
    resultSummary: resultPortrait.subtitle,
    tags: Array.from(new Set([primaryTag, ...pack.tags, ...tags, mbti].filter(Boolean))).slice(0, 10),
    sceneTags: Array.from(new Set([primaryScene, ...pack.sceneTags, ...sceneTags].filter(Boolean))).slice(0, 10),
    relationshipGoal: relationshipGoal || pack.relationshipGoal,
    opener: openingLines[0],
    recommendedPeople: `适合能围绕${primaryScene}自然互动、尊重边界、愿意慢慢熟悉的人。`,
    riskReminder: '校园匹配要保留节奏感，线下见面前先确认身份和公共场景。',
    deepSections: [
      { title: '核心画像', summary: resultPortrait.subtitle, items: resultPortrait.tiles.map((tile) => `${tile.label}：${tile.text}`) },
      { title: '合拍建议', summary: `先从${primaryScene}开启，再根据回应决定是否深入。`, items: ['用具体问题代替泛泛打招呼', '优先选择同校认证用户', '不急着交换敏感联系方式'] },
      { title: '校园场景', summary: `${pack.title}最适合落在真实校园场景里。`, items: [`推荐场景：${primaryScene}`, `关键词：${[primaryTag, ...sceneTags].filter(Boolean).slice(0, 3).join('、')}`, '如果对方节奏不同，先退回低压力聊天'] },
    ],
    matchAdvice: {
      suitable: `适合${primaryTag}明显、愿意从${primaryScene}慢慢熟悉的人。`,
      unsuitable: '不太适合一上来强推线下、催回复或忽视边界的人。',
    },
    openingLines,
    compareHints: {
      shared: [primaryTag, primaryScene].filter(Boolean),
      complement: ['同校认证', '节奏互补'],
      opener: openingLines[1] || openingLines[0],
    },
    shareCard: {
      title: `${pack.title}深度报告`,
      resultTitle,
      tags: [primaryTag, primaryScene, mbti].filter(Boolean).slice(0, 3),
      quote: openingLines[0],
      text: `${pack.title}深度报告\n${resultTitle}\n关键词：${[primaryTag, primaryScene, mbti].filter(Boolean).slice(0, 3).join('、')}\n开场：${openingLines[0]}`,
    },
  }
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

function normalizeProfilePhotos(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
    .filter((photo) => photo.startsWith('/api/uploads/profile-photos/') || photo.startsWith('blob:'))
    .slice(0, 6)
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

function HomeTopDock({ profile = profileFallback, insight = insightFallback }) {
  const photos = normalizeProfilePhotos(profile.photos)
  const avatar = profile.avatar || photos[0] || ''
  const score = insight.moodScore || 70
  const name = profile.nickname || '校园同学'

  return (
    <section className="cece-home-dock" aria-label="首页快捷区">
      <div className="cece-search-row">
        <button className="cece-search-pill" type="button" onClick={() => navigateTo('/#discover')}>
          <Icon name="search" />
          <span>搜索测试、树洞、同校搭子</span>
        </button>
        <button className="cece-icon-button" type="button" onClick={() => navigateTo('/profile')} aria-label="完善资料">
          <Icon name="plus" />
        </button>
      </div>

      <div className="cece-avatar-row">
        <button className={`cece-avatar ${avatar ? 'has-image' : ''}`} type="button" onClick={() => navigateTo('/profile')}>
          {avatar ? <img src={avatar} alt="" /> : name.slice(0, 1)}
        </button>
        <button className="cece-score-bubble" type="button" onClick={() => navigateTo('/#tests')}>
          <small>今日</small>
          <strong>{score}</strong>
        </button>
        <button className="cece-birthday-tip" type="button" onClick={() => navigateTo('/profile')}>
          输入生日，更加了解TA
        </button>
        <button className="cece-menu-button" type="button" onClick={() => navigateTo('/#discover')} aria-label="打开内容分区">
          <span />
          <span />
          <span />
        </button>
      </div>
    </section>
  )
}

function PromoBanner({ label = '今日校园短测', action = '去完成' }) {
  return (
    <section className="cece-promo-banner" aria-label={label}>
      <div className="cece-promo-icon" aria-hidden="true">5</div>
      <strong>{label}</strong>
      <button type="button" onClick={() => navigateTo('/#tests')}>{action}</button>
    </section>
  )
}

function ProfileUtilityDeck({ currentMembership = {}, displayStats = {}, onEditProfile }) {
  const wealthItems = [
    { title: '收到喜欢', value: displayStats.likes || 0, tone: 'yellow' },
    { title: '合拍关系', value: displayStats.matches || 0, tone: 'orange' },
    { title: '报告与测试', value: '档案', tone: 'peach' },
    { title: '内测反馈', value: '入口', tone: 'pink' },
  ]
  const recordItems = [
    { title: '档案', action: onEditProfile, tone: 'peach' },
    { title: '我的发布', action: () => navigateTo('/#discover'), tone: 'orange' },
    { title: '赞与收藏', action: () => navigateTo('/#match'), tone: 'pink' },
    { title: '浏览记录', action: () => navigateTo('/profile'), tone: 'yellow' },
    { title: '测友讨论', action: () => navigateTo('/#tests'), tone: 'green' },
    { title: '心情日记', action: () => navigateTo('/#tests'), tone: 'cyan' },
  ]

  return (
    <section className="cece-profile-utilities" aria-label="我的功能">
      <div className="cece-vip-card">
        <div>
          <strong>内测权益</strong>
          <p>{currentMembership.title || '内测阶段优先开放报告、推荐与社区增强能力'}</p>
        </div>
        <button type="button" onClick={() => navigateTo('/#tests')}>去测一测</button>
        <div className="cece-vip-perks">
          <span>深度报告</span>
          <span>每日心情</span>
          <span>推荐对比</span>
        </div>
      </div>

      <div className="cece-tool-section">
        <h2>财富</h2>
        <div className="cece-tool-grid four">
          {wealthItems.map((item) => (
            <button type="button" key={item.title} onClick={() => navigateTo('/#tests')}>
              <span className={item.tone}>{item.value}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </div>

      <PromoBanner />

      <div className="cece-tool-section">
        <h2>记录</h2>
        <div className="cece-tool-grid records">
          {recordItems.map((item) => (
            <button type="button" key={item.title} onClick={item.action}>
              <span className={item.tone}>{item.title.slice(0, 1)}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </div>
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

        setMatchNotice('暂时没有新的真实推荐，先看看示范卡片。')
      } catch (error) {
        if (mounted) {
          setMatchNotice(error.message || '推荐接口暂时不可用，先看看示范卡片。')
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
      setMatchNotice(type === 'like' ? '登录后可以把喜欢同步到真实匹配。' : '已切到下一张推荐卡。')
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
            className={`match-card ${activeProfile.accent} has-media`}
            key={activeProfile.id}
            initial={{ opacity: 0, y: 24, rotate: -2, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, rotate: 2, scale: 0.96 }}
            transition={{ duration: 0.42, ease: [0.2, 0.82, 0.2, 1] }}
          >
            <div className="match-orbit">
              <span />
            </div>
            <div className="match-media" aria-hidden="true">
              {activeProfile.photo ? (
                <img src={activeProfile.photo} alt="" />
              ) : (
                <span className="match-avatar-fallback">{activeProfile.name.slice(0, 1)}</span>
              )}
              <span className="match-identity">{activeProfile.identityLabel || '校园资料'}</span>
              <div className="match-mini-photos">
                {(activeProfile.gallery || []).slice(1, 3).map((photo) => (
                  <span key={photo}>
                    <img src={photo} alt="" />
                  </span>
                ))}
              </div>
            </div>
            <div className="match-score">
              <strong>{activeProfile.score}</strong>
              <small>合拍分</small>
            </div>
            <div className="match-person">
              <h3>{activeProfile.name}</h3>
              <p>{activeProfile.meta}</p>
              {activeProfile.schoolLine && <small>{activeProfile.schoolLine}</small>}
            </div>
            <div className="match-signals">
              {(activeProfile.detailChips || []).map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
            <p className="match-note">{activeProfile.note}</p>
            <div className="match-reasons">
              {(activeProfile.reasonList || []).map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
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
        onWheel={passVerticalWheelToPage}
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

function QuizPager({ onComplete, busy = '', insight = insightFallback }) {
  const trackRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })
  const [activePackId, setActivePackId] = useState(() => todayPackId())
  const [answers, setAnswers] = useState({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState('')
  const selectedPack = campusTestPacks.find((pack) => pack.id === activePackId) || campusTestPacks[0]
  const questions = selectedPack.questions
  const reports = Array.isArray(insight.testReports) ? insight.testReports : []
  const reportMap = reportByPack(reports)
  const latestPackReport = reportMap.get(selectedPack.id) || null
  const selectedReport = reports.find((report) => report.id === selectedReportId) || null
  const completedCount = questions.filter((question) => isQuizQuestionAnswered(question, answers)).length
  const completed = completedCount === questions.length
  const mbti = mbtiFromQuizAnswers(answers, questions)
  const tags = Array.from(new Set([...selectedPack.tags, ...quizTagsFromAnswers(answers, questions)])).slice(0, 10)
  const sceneTags = Array.from(new Set([...selectedPack.sceneTags, ...quizSceneTagsFromAnswers(answers, questions)])).slice(0, 10)
  const birthDate = quizBirthDateFromAnswers(answers)
  const relationshipGoal = quizRelationshipGoalFromAnswers(answers, questions) || selectedPack.relationshipGoal
  const focus = quizFocusFromResult({ mbti, birthDate, sceneTags })
  const resultMood = quizMoodFromMbti(mbti)
  const resultPortrait = quizPortraitFromResult({ mbti, birthDate, relationshipGoal, tags, sceneTags })
  const draftReport = createDeepQuizReport({
    pack: selectedPack,
    answers,
    mbti,
    birthDate,
    relationshipGoal,
    tags,
    sceneTags,
    resultMood,
    resultPortrait,
  })
  const visibleReport = selectedReport || (completed ? draftReport : latestPackReport)
  const pageCount = questions.length + 1
  const currentQuestion = questions[activeIndex]
  const currentQuestionAnswered = currentQuestion ? isQuizQuestionAnswered(currentQuestion, answers) : true
  const progressPercent = Math.round((completedCount / questions.length) * 100)

  const selectPack = (packId) => {
    if (packId === activePackId) return
    setActivePackId(packId)
    setAnswers({})
    setSaved(false)
    setSelectedReportId('')
    window.setTimeout(() => scrollToPage(0, 'auto'), 0)
  }

  const scrollToPage = (index, behavior = 'smooth') => {
    const track = trackRef.current
    if (!track) return
    const nextIndex = Math.max(0, Math.min(pageCount - 1, index))
    track.scrollTo({ left: nextIndex * track.clientWidth, behavior })
    setActiveIndex(nextIndex)
  }

  const handleScroll = (event) => {
    const width = event.currentTarget.clientWidth || 1
    setActiveIndex(Math.round(event.currentTarget.scrollLeft / width))
  }

  const snapToNearestPage = () => {
    const track = trackRef.current
    if (!track) return
    const width = track.clientWidth || 1
    scrollToPage(Math.round(track.scrollLeft / width))
  }

  const handleNextPage = () => {
    if (activeIndex >= pageCount - 1) return
    const question = questions[activeIndex]
    if (question?.type === 'date' && !answers[question.key]) {
      setAnswers((current) => ({ ...current, [question.key]: 'skip' }))
      setSaved(false)
      scrollToPage(activeIndex + 1)
      return
    }
    if (question && !isQuizQuestionAnswered(question, answers)) return
    scrollToPage(activeIndex + 1)
  }

  const selectOption = (question, option, questionIndex, event) => {
    if (dragRef.current.moved) {
      event.preventDefault()
      return
    }

    setAnswers((current) => ({
      ...current,
      [question.key]: option.value,
    }))
    setSaved(false)

    window.setTimeout(() => {
      scrollToPage(questionIndex < questions.length - 1 ? questionIndex + 1 : questions.length)
    }, 180)
  }

  const resetQuiz = () => {
    setAnswers({})
    setSaved(false)
    scrollToPage(0)
  }

  const saveResult = async () => {
    if (!completed || saving || busy === 'quiz') return
    setSaving(true)
    const ok = await onComplete?.({
      answers,
      pack: selectedPack,
      report: draftReport,
      mbti,
      tags,
      sceneTags,
      birthDate,
      relationshipGoal,
      focus,
      moodLabel: resultMood.moodLabel,
      moodScore: resultMood.moodScore,
    })
    if (ok !== false) {
      setSaved(true)
    }
    setSaving(false)
  }

  const startDrag = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    }
    setIsDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const moveDrag = (event) => {
    if (!dragRef.current.active) return
    const delta = event.clientX - dragRef.current.startX
    if (Math.abs(delta) > 6) {
      dragRef.current.moved = true
    }
    event.currentTarget.scrollLeft = dragRef.current.scrollLeft - delta
  }

  const endDrag = (event) => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    setIsDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    snapToNearestPage()
    window.setTimeout(() => {
      dragRef.current.moved = false
    }, 80)
  }

  const handleKeyDown = (event) => {
    if (event.target?.tagName === 'INPUT') return

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleNextPage()
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollToPage(activeIndex - 1)
    }
  }

  return (
    <section className="quiz-pager" aria-label="横向分页小测试">
      <div className="test-center-head">
        <article className={`daily-test-card ${selectedPack.tone}`}>
          <span>今日测试</span>
          <strong>{campusTestPacks.find((pack) => pack.id === todayPackId())?.title || selectedPack.title}</strong>
          <p>{campusTestPacks.find((pack) => pack.id === todayPackId())?.description || selectedPack.description}</p>
          <button type="button" onClick={() => selectPack(todayPackId())}>
            开始今日 5 题
          </button>
        </article>
        <div className="test-library-summary">
          <span>{campusTestPacks.length} 个短测</span>
          <strong>{reports.length} 份历史报告</strong>
          <p>每次只做一个 5 题短测，报告会沉淀到推荐标签里。</p>
        </div>
      </div>

      <div className="test-pack-grid" aria-label="测试库">
        {campusTestPacks.map((pack) => {
          const report = reportMap.get(pack.id)
          return (
            <button
              className={`test-pack-card ${pack.tone} ${pack.id === selectedPack.id ? 'active' : ''}`}
              type="button"
              key={pack.id}
              onClick={() => selectPack(pack.id)}
            >
              <span>{pack.category}</span>
              <strong>{pack.title}</strong>
              <small>{report ? `已测 · ${report.resultTitle || report.title}` : '5 题 · 未完成'}</small>
            </button>
          )
        })}
      </div>

      <div className="quiz-pager-head">
        <div className="quiz-pager-status">
          <span>{selectedPack.title}</span>
          <strong>{activeIndex < questions.length ? `${activeIndex + 1}/${questions.length}` : '结果'}</strong>
          <small>{completed ? '画像已生成' : `已完成 ${progressPercent}%`}</small>
        </div>
        <div className="quiz-pager-actions">
          <button type="button" onClick={() => scrollToPage(activeIndex - 1)} disabled={activeIndex <= 0}>
            上一题
          </button>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={activeIndex >= pageCount - 1 || (currentQuestion?.type !== 'date' && !currentQuestionAnswered)}
          >
            {currentQuestion?.type === 'date' && !answers[currentQuestion.key] ? '跳过' : '下一页'}
          </button>
        </div>
      </div>
      <div className="quiz-complete-meter" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <div
        className={`quiz-track${isDragging ? ' is-dragging' : ''}`}
        ref={trackRef}
        tabIndex={0}
        onScroll={handleScroll}
        onWheel={passVerticalWheelToPage}
        onKeyDown={handleKeyDown}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        {questions.map((question, questionIndex) => (
          <article className={`quiz-page${activeIndex === questionIndex ? ' active' : ''}`} key={question.key} aria-label={question.title}>
            <span className="quiz-eyebrow">{question.eyebrow}</span>
            <h3>{question.title}</h3>
            {question.type === 'date' ? (
              <div className="quiz-date-card">
                <p>{question.note}</p>
                <input
                  type="date"
                  value={answers.birthDate === 'skip' ? '' : answers.birthDate || ''}
                  onChange={(event) => {
                    setAnswers((current) => ({ ...current, birthDate: event.target.value }))
                    setSaved(false)
                  }}
                />
                <div className="quiz-date-actions">
                  <button type="button" onClick={() => scrollToPage(questionIndex + 1)} disabled={!answers.birthDate || answers.birthDate === 'skip'}>
                    继续
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers((current) => ({ ...current, birthDate: 'skip' }))
                      setSaved(false)
                      scrollToPage(questionIndex + 1)
                    }}
                  >
                    暂时跳过
                  </button>
                </div>
              </div>
            ) : (
              <div className="quiz-option-grid">
                {question.options.map((option) => (
                  <button
                    className={`quiz-option${answers[question.key] === option.value ? ' active' : ''}`}
                    type="button"
                    key={option.value}
                    onClick={(event) => selectOption(question, option, questionIndex, event)}
                  >
                    <span>{option.label}</span>
                    <small>{option.note}</small>
                    {answers[question.key] === option.value && <i aria-hidden="true">已选</i>}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        <article className={`quiz-page quiz-result-page${completed ? ' is-ready' : ''}${activeIndex === questions.length ? ' active' : ''}`}>
          {completed ? (
            <div className="quiz-result-ceremony">
              <div className="quiz-result-orbit" aria-hidden="true">
                <span />
                <span />
              </div>
              <span className="quiz-eyebrow">结果已生成</span>
              <div className="quiz-result-hero">
                <div>
                  <small>{selectedPack.title}深度报告</small>
                  <h3>{resultPortrait.title}</h3>
                  <p>{resultPortrait.subtitle}</p>
                </div>
                <strong className="quiz-result-code">{mbti}</strong>
              </div>
              <div className="quiz-result-meter">
                <strong>{resultMood.moodScore}</strong>
                <div>
                  <span>今日开场指数</span>
                  <i style={{ width: `${resultMood.moodScore}%` }} />
                </div>
              </div>
              <div className="quiz-result-tiles">
                {resultPortrait.tiles.map((tile) => (
                  <div className="quiz-result-tile" key={tile.label}>
                    <span>{tile.label}</span>
                    <strong>{tile.value}</strong>
                    <p>{tile.text}</p>
                  </div>
                ))}
              </div>
              <p className="quiz-starter-line">{resultPortrait.opener}</p>
              <DeepReportPreview report={draftReport} />
              <div className="quiz-tag-row">
                {resultPortrait.chips.slice(0, 8).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="quiz-result-actions">
                <button className="primary-action quiz-save-button" type="button" disabled={saving || busy === 'quiz'} onClick={saveResult}>
                  {saving || busy === 'quiz' ? '正在保存' : '保存到我的画像'}
                </button>
                <button className="ghost-action quiz-reset-button" type="button" onClick={resetQuiz}>
                  重新测一次
                </button>
              </div>
              {saved && <p className="quiz-save-note">已同步到首页画像，推荐会参考这个结果。</p>}
            </div>
          ) : (
            <>
              <span className="quiz-eyebrow">{latestPackReport ? '最近报告' : '结果准备中'}</span>
              <h3>{latestPackReport?.resultTitle || `还差 ${questions.length - completedCount} 题，就能生成完整画像。`}</h3>
              <div className="quiz-result-code">{`${completedCount}/${questions.length}`}</div>
              {latestPackReport && <DeepReportPreview report={latestPackReport} compact />}
              <div className="quiz-tag-row">
                {[selectedPack.category, '深度报告', '测友讨论'].map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button className="primary-action quiz-save-button" type="button" disabled>
                保存到我的画像
              </button>
            </>
          )}
        </article>
      </div>
      <div className="quiz-progress" aria-hidden="true">
        {Array.from({ length: pageCount }, (_, index) => (
          <button className={activeIndex === index ? 'active' : ''} type="button" key={index} onClick={() => scrollToPage(index)}>
            <span />
          </button>
        ))}
      </div>
      <ReportHistory reports={reports} onOpen={(report) => setSelectedReportId(report.id)} selectedReport={visibleReport} />
      <TestDiscussionPanel pack={selectedPack} latestReport={visibleReport} />
    </section>
  )
}

function DeepReportPreview({ report, compact = false }) {
  if (!report) return null
  const sections = Array.isArray(report.deepSections) ? report.deepSections : []
  const openingLines = Array.isArray(report.openingLines) && report.openingLines.length ? report.openingLines : [report.opener].filter(Boolean)
  const copyShareText = async () => {
    const text = report.shareCard?.text || `${report.title}\n${report.resultTitle}\n${report.opener || ''}`
    try {
      await navigator.clipboard?.writeText(text)
    } catch {
      window.prompt('复制这段分享文案', text)
    }
  }

  return (
    <div className={`deep-report-preview${compact ? ' compact' : ''}`}>
      <div className="deep-report-cover">
        <span>{report.category || '报告'}</span>
        <strong>{report.resultTitle}</strong>
        <p>{report.resultSummary}</p>
      </div>
      {!compact && (
        <>
          <div className="deep-report-sections">
            {sections.slice(0, 3).map((section) => (
              <article key={section.title}>
                <strong>{section.title}</strong>
                <p>{section.summary}</p>
                <ul>
                  {(section.items || []).slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="match-advice-grid">
            <article>
              <span>适合匹配的人</span>
              <p>{report.matchAdvice?.suitable || report.recommendedPeople}</p>
            </article>
            <article>
              <span>边界提醒</span>
              <p>{report.riskReminder || report.matchAdvice?.unsuitable}</p>
            </article>
          </div>
          <div className="opening-line-list">
            {openingLines.slice(0, 3).map((line) => (
              <button type="button" key={line} onClick={() => navigator.clipboard?.writeText(line)}>
                {line}
              </button>
            ))}
          </div>
          <div className="share-card-preview">
            <span>分享卡</span>
            <strong>{report.shareCard?.resultTitle || report.resultTitle}</strong>
            <p>{report.shareCard?.quote || report.opener}</p>
            <button type="button" onClick={copyShareText}>复制分享文案</button>
          </div>
        </>
      )}
    </div>
  )
}

function ReportHistory({ reports = [], onOpen, selectedReport }) {
  const visibleReports = reports.slice(0, 8)
  return (
    <section className="report-history-panel" aria-label="测试报告历史">
      <div className="report-history-head">
        <div>
          <span className="section-label">报告历史</span>
          <h3>最近 3 份会合成我的综合画像</h3>
        </div>
        <strong>{reports.length} 份</strong>
      </div>
      {selectedReport && (
        <article className="report-history-detail">
          <DeepReportPreview report={selectedReport} />
        </article>
      )}
      <div className="report-history-list">
        {visibleReports.length ? visibleReports.map((report) => (
          <button type="button" key={report.id} onClick={() => onOpen?.(report)}>
            <span>{report.packTitle || report.title}</span>
            <strong>{report.resultTitle}</strong>
            <small>{report.completedAt ? formatRelativeTime(report.completedAt) : '刚刚'}</small>
          </button>
        )) : (
          <p>完成任意 5 题短测后，这里会保存完整报告。</p>
        )}
      </div>
    </section>
  )
}

function TestDiscussionPanel({ pack, latestReport }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [replyText, setReplyText] = useState({})
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const loggedIn = hasAuthToken()

  const loadDiscussions = async () => {
    if (!loggedIn || !pack?.id) return
    setLoading(true)
    try {
      const payload = await apiRequest(`/tests/discussions?packId=${encodeURIComponent(pack.id)}&scope=same-school&limit=8`)
      setPosts(payload.data?.discussions || [])
      setNotice('')
    } catch (error) {
      setNotice(error.message || '测友讨论读取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loggedIn || !pack?.id) return undefined
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true)
    })
    apiRequest(`/tests/discussions?packId=${encodeURIComponent(pack.id)}&scope=same-school&limit=8`)
      .then((payload) => {
        if (cancelled) return
        setPosts(payload.data?.discussions || [])
        setNotice('')
      })
      .catch((error) => {
        if (!cancelled) setNotice(error.message || '测友讨论读取失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loggedIn, pack?.id])

  const submitDiscussion = async (event) => {
    event.preventDefault()
    const body = content.trim()
    if (!loggedIn) {
      navigateTo('/login')
      return
    }
    if (body.length < 6) return
    setLoading(true)
    try {
      const payload = await apiRequest('/tests/discussions', {
        method: 'POST',
        body: JSON.stringify({
          packId: pack.id,
          packTitle: pack.title,
          reportId: latestReport?.id,
          content: body,
          anonymous: true,
          tags: latestReport?.tags || pack.tags,
        }),
      })
      setPosts((current) => [payload.data?.discussion, ...current].filter(Boolean))
      setContent('')
      setNotice(payload.message || '已发布到测友讨论')
    } catch (error) {
      setNotice(error.message || '发布失败，请换一种表达')
    } finally {
      setLoading(false)
    }
  }

  const reactToPost = async (postId, type) => {
    if (!loggedIn) return navigateTo('/login')
    try {
      const payload = await apiRequest(`/tests/discussions/${encodeURIComponent(postId)}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      })
      setPosts((current) => current.map((post) => (post.id === postId ? payload.data?.discussion || post : post)))
    } catch (error) {
      setNotice(error.message || '互动失败')
    }
  }

  const reportPost = async (postId) => {
    if (!loggedIn) return navigateTo('/login')
    try {
      await apiRequest(`/tests/discussions/${encodeURIComponent(postId)}/reports`, {
        method: 'POST',
        body: JSON.stringify({ reason: '不适合公开讨论' }),
      })
      setPosts((current) => current.filter((post) => post.id !== postId))
      setNotice('举报已提交，运营会复核这条内容。')
    } catch (error) {
      setNotice(error.message || '举报失败')
    }
  }

  const submitReply = async (postId) => {
    const body = (replyText[postId] || '').trim()
    if (!loggedIn) return navigateTo('/login')
    if (body.length < 2) return
    try {
      const payload = await apiRequest(`/tests/discussions/${encodeURIComponent(postId)}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content: body, anonymous: true }),
      })
      setPosts((current) => current.map((post) => (post.id === postId ? payload.data?.discussion || post : post)))
      setReplyText((current) => ({ ...current, [postId]: '' }))
      setNotice(payload.message || '已回复')
    } catch (error) {
      setNotice(error.message || '回复失败')
    }
  }

  return (
    <section className="test-discussion-panel" aria-label="测友讨论">
      <div className="report-history-head">
        <div>
          <span className="section-label">测友讨论</span>
          <h3>看看同校同结果的人怎么说</h3>
        </div>
        <button type="button" onClick={loadDiscussions} disabled={!loggedIn || loading}>
          {loading ? '刷新中' : '刷新'}
        </button>
      </div>
      <form className="test-discussion-form" onSubmit={submitDiscussion}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={loggedIn ? `匿名聊聊你测完「${pack.title}」的感受` : '登录后可以查看和发布同校测友讨论'}
          rows="3"
        />
        <button type="submit" disabled={loading || content.trim().length < 6}>
          {loggedIn ? '匿名发布' : '去登录'}
        </button>
      </form>
      {notice && <p className="treehole-notice">{notice}</p>}
      <div className="test-discussion-list">
        {posts.length ? posts.map((post) => (
          <article className="test-discussion-card" key={post.id}>
            <div>
              <strong>{post.author?.nickname || '匿名同学'}</strong>
              <small>{post.school || '同校'} · {formatRelativeTime(post.createdAt)}</small>
            </div>
            <p>{post.content}</p>
            <div className="quiz-tag-row">
              {(post.tags || []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <div className="discussion-actions">
              <button type="button" onClick={() => reactToPost(post.id, 'resonate')}>共鸣 {post.reactionCounts?.resonate || 0}</button>
              <button type="button" onClick={() => reactToPost(post.id, 'like')}>喜欢 {post.reactionCounts?.like || 0}</button>
              <button type="button" onClick={() => reportPost(post.id)}>举报</button>
            </div>
            <div className="discussion-replies">
              {(post.replies || []).slice(0, 2).map((reply) => (
                <span key={reply.id}>{reply.author?.nickname || '匿名'}：{reply.content}</span>
              ))}
              <div className="discussion-reply-form">
                <input
                  value={replyText[post.id] || ''}
                  onChange={(event) => setReplyText((current) => ({ ...current, [post.id]: event.target.value }))}
                  placeholder="回复一句"
                />
                <button type="button" onClick={() => submitReply(post.id)}>回复</button>
              </div>
            </div>
          </article>
        )) : (
          <p className="discussion-empty">{loggedIn ? '这个测试还没有同校讨论，做第一个开场的人。' : '登录后查看同校测友讨论。'}</p>
        )}
      </div>
    </section>
  )
}

function SelfInsightPanel({
  insight = insightFallback,
  treeholes = treeholeFallback,
  onMoodUpdate,
  onQuizComplete,
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
        <QuizPager onComplete={onQuizComplete} busy={busy} insight={insight} />
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

function MessageAvatar({ thread, className = '' }) {
  const name = thread?.name || '同学'
  const avatar =
    thread?.avatar ||
    normalizeProfilePhotos(thread?.sourceMatch?.user?.photos)[0] ||
    thread?.sourceMatch?.user?.avatar ||
    ''

  return (
    <span className={`message-avatar ${thread?.tone || 'cyan'} ${avatar ? 'has-image' : ''} ${className}`}>
      {avatar ? <img src={avatar} alt="" /> : name.slice(0, 1)}
    </span>
  )
}

function MatchProfileSheet({ thread, onClose, onReveal, onMessage }) {
  const match = thread?.sourceMatch || {}
  const profile = match.user || {}
  if (!thread) return null

  const tags = [...splitList(profile.tags), ...splitList(profile.sceneTags)].slice(0, 6)
  const revealed = Boolean(match.identityRevealed)
  const photos = thread.photos?.length ? thread.photos : normalizeProfilePhotos(profile.photos)
  const birthLabel = formatBirthDate(profile.birthDate)
  const chips = [
    profile.isVerified || profile.verificationStatus === 'approved' ? '同校认证' : profile.school,
    profile.mbti,
    zodiacFromBirthDate(profile.birthDate),
    birthLabel ? `${birthLabel}生` : '',
  ]
    .filter(Boolean)
    .slice(0, 4)

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
        <div className="match-profile-hero">
          <MessageAvatar thread={thread} className="profile-sheet-avatar" />
          <div>
            <strong>{profile.nickname || thread.name}</strong>
            <p>{[profile.school, profile.grade, profile.major, profile.mbti].filter(Boolean).join(' · ') || thread.school}</p>
            {chips.length > 0 && (
              <div className="message-chip-row">
                {chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {photos.length > 1 && (
          <div className="match-profile-gallery" aria-hidden="true">
            {photos.slice(1, 4).map((photo) => (
              <span key={photo}>
                <img src={photo} alt="" />
              </span>
            ))}
          </div>
        )}
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
        <div className="feature-sheet-actions">
          <button className="primary-action" type="button" onClick={() => onMessage?.(match.id || thread.id)}>
            回到聊天
          </button>
          {match.id && (
            <button className="ghost-action" type="button" onClick={() => onReveal?.(match.id)}>
              {revealed ? '已公开身份' : '申请公开身份'}
            </button>
          )}
        </div>
      </motion.aside>
    </div>
  )
}

function BottomNav({ active = 'home', hideAtTop = 180 }) {
  const [hidden, setHidden] = useState(() => window.scrollY < hideAtTop)
  const items = [
    { key: 'home', icon: 'home', label: '首页', href: '/' },
    { key: 'chat', icon: 'chat', label: '消息', href: '/messages' },
    { key: 'tests', icon: 'ai', label: '测试', href: '/#tests' },
    { key: 'online', icon: 'online', label: '在线', href: '/#discover' },
    { key: 'user', icon: 'user', label: '我的', href: '/profile' },
  ]

  useEffect(() => {
    let lastY = window.scrollY

    const onScroll = () => {
      const currentY = window.scrollY
      const scrollingDown = currentY > lastY + 8
      const scrollingUp = currentY < lastY - 8

      if (currentY < hideAtTop) {
        setHidden(true)
      } else if (scrollingUp) {
        setHidden(false)
      } else if (scrollingDown) {
        setHidden(true)
      }

      lastY = currentY
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hideAtTop])

  return (
    <nav className={`bottom-nav ${hidden ? 'hidden' : ''}`} aria-label="底部导航">
      {items.map((item) => (
        <a
          className={`${item.key === 'tests' ? 'center' : ''} ${item.key === active ? 'active' : ''}`}
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
  const photoInputRef = useRef(null)
  const hasStoredToken = Boolean(localStorage.getItem('token'))
  const [user, setUser] = useState(profileFallback)
  const [form, setForm] = useState(() => userToProfileForm(profileFallback))
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(hasStoredToken)
  const [loading, setLoading] = useState(hasStoredToken)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [notice, setNotice] = useState(hasStoredToken ? '' : '登录后，资料和头像会保存到你的账号里。')
  const [error, setError] = useState('')
  const [activity, setActivity] = useState(null)
  const [membership, setMembership] = useState(null)
  const [insight, setInsight] = useState(() => normalizeInsightPayload(insightFallback, profileFallback))
  const [treeholes, setTreeholes] = useState([])
  const [activityBusy, setActivityBusy] = useState('')
  const [membershipBusy, setMembershipBusy] = useState('')
  const [photoBusy, setPhotoBusy] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordBusy, setPasswordBusy] = useState(false)

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
        setNotice('重新登录后会读取你的真实资料。')
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

  const profilePhotos = useMemo(() => normalizeProfilePhotos(user.photos), [user.photos])

  const profileReadiness = useMemo(() => {
    const checks = [
      { label: '头像', done: Boolean(avatarPreview || user.avatar) },
      { label: '照片', done: profilePhotos.length > 0 },
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
  }, [avatarPreview, form, profilePhotos.length, user.avatar, user.verificationStatus])

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
        setNotice('本地资料已更新。登录后可以把这些资料保存到账号里。')
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
      setNotice('头像已在本地换好。登录后可以保存到账号。')
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

  const handlePhotoFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean)
    if (!files.length) return

    setError('')
    setNotice('')
    const availableSlots = Math.max(0, 6 - profilePhotos.length)
    if (!availableSlots) {
      setError('个人照片最多保留 6 张。')
      return
    }

    const selectedFiles = files.slice(0, availableSlots)
    const oversized = selectedFiles.find((file) => file.size > 3 * 1024 * 1024)
    if (oversized) {
      setError('单张照片不能超过 3MB。')
      return
    }

    if (!isLoggedIn) {
      const localPhotos = selectedFiles.map((file) => URL.createObjectURL(file))
      setUser((current) => ({
        ...current,
        photos: normalizeProfilePhotos([...(current.photos || []), ...localPhotos]),
      }))
      setNotice('照片已加入本地资料。登录后可以保存到账号。')
      return
    }

    setPhotoBusy('upload')
    try {
      let nextUser = user
      for (const file of selectedFiles) {
        const uploadBody = await uploadPayloadFromFile(file)
        const payload = await apiRequest('/uploads/profile-photo', {
          method: 'POST',
          body: JSON.stringify(uploadBody),
        })
        nextUser = payload.data?.user || nextUser
      }
      setUser(nextUser)
      setForm(userToProfileForm(nextUser))
      setNotice(selectedFiles.length > 1 ? '照片已加入资料。' : '照片已加入资料。')
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy('')
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    }
  }

  const removeProfilePhoto = async (photo) => {
    if (!photo || photoBusy) return
    setError('')
    setNotice('')

    if (!isLoggedIn || photo.startsWith('blob:')) {
      setUser((current) => ({
        ...current,
        photos: normalizeProfilePhotos(current.photos).filter((item) => item !== photo),
      }))
      setNotice('照片已移除。')
      return
    }

    setPhotoBusy(photo)
    try {
      const payload = await apiRequest('/uploads/profile-photo', {
        method: 'DELETE',
        body: JSON.stringify({ imageUrl: photo }),
      })
      const updatedUser = payload.data?.user
      if (updatedUser) {
        setUser(updatedUser)
        setForm(userToProfileForm(updatedUser))
      }
      setNotice('照片已移除。')
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy('')
    }
  }

  const updatePasswordField = (key, value) => {
    setPasswordForm((current) => ({ ...current, [key]: value }))
    setError('')
    setNotice('')
  }

  const changePassword = async (event) => {
    event.preventDefault()
    if (!isLoggedIn || passwordBusy) return

    if (passwordForm.newPassword.length < 8) {
      setError('新密码至少需要 8 位。')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('两次输入的新密码不一致。')
      return
    }

    setPasswordBusy(true)
    setError('')
    try {
      const payload = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setNotice(payload.message || '密码已更新。')
    } catch (err) {
      setError(err.message)
    } finally {
      setPasswordBusy(false)
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
    <main className="app-shell cece-layout profile-shell">
      <Background />
      <Header />

      <section className="cece-profile-topbar" aria-label="我的顶部操作">
        <h1>我</h1>
        <div>
          <button className="cece-checkin" type="button" onClick={() => navigateTo('/#tests')}>签到</button>
          <button className="cece-settings" type="button" onClick={() => setEditing(true)} aria-label="设置">
            <Icon name="edit" />
          </button>
        </div>
      </section>

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

      <ProfileUtilityDeck
        currentMembership={currentMembership}
        displayStats={displayStats}
        onEditProfile={() => setEditing(true)}
      />

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

          <div className="profile-photo-editor">
            <div className="profile-photo-head">
              <span>我的照片</span>
              <button
                className="ghost-action compact-action"
                disabled={!editing || Boolean(photoBusy) || profilePhotos.length >= 6}
                type="button"
                onClick={() => photoInputRef.current?.click()}
              >
                <Icon name="plus" />
                添加照片
              </button>
            </div>
            <div className="profile-photo-grid">
              {profilePhotos.map((photo, index) => (
                <figure className="profile-photo-tile" key={photo}>
                  <img src={photo} alt={`个人照片 ${index + 1}`} />
                  {editing && (
                    <button
                      disabled={photoBusy === photo}
                      type="button"
                      onClick={() => removeProfilePhoto(photo)}
                    >
                      移除
                    </button>
                  )}
                </figure>
              ))}
              {profilePhotos.length < 6 && (
                <button
                  className="profile-photo-add"
                  disabled={!editing || Boolean(photoBusy)}
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Icon name="camera" />
                  <span>{photoBusy === 'upload' ? '上传中' : '补一张近照'}</span>
                </button>
              )}
            </div>
            <small>照片会出现在你的资料卡里，建议放清楚、自然、能代表你生活状态的图片。</small>
            <input
              ref={photoInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handlePhotoFiles(event.target.files)}
            />
          </div>

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
          <form className="account-security" onSubmit={changePassword}>
            <div>
              <strong>账号安全</strong>
              <small>定期换一个只有你知道的密码，管理员也可以在后台重置。</small>
            </div>
            <label>
              当前密码
              <input
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                disabled={!isLoggedIn || passwordBusy}
                required
              />
            </label>
            <label>
              新密码
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                disabled={!isLoggedIn || passwordBusy}
                required
              />
            </label>
            <label>
              确认新密码
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                disabled={!isLoggedIn || passwordBusy}
                required
              />
            </label>
            <button className="ghost-action" type="submit" disabled={!isLoggedIn || passwordBusy}>
              {passwordBusy ? '更新中' : '修改密码'}
            </button>
          </form>
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
              <span className="section-label">内测权益</span>
              <h2>{currentMembership.title || '免费用户'}</h2>
              <p>{currentMembership.description || '内测阶段先开放基础匹配、测试报告和社区反馈，不接真实付费。'}</p>
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
                  <span>{plan.id === 'free' ? '基础权益' : '内测中'}</span>
                  <ul>
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button
                    className={active ? 'ghost-action' : 'primary-action'}
                    type="button"
                    disabled
                    onClick={() => subscribePlan(plan.id)}
                  >
                    {busy ? '更新中' : active ? '当前权益' : '暂未开放'}
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
                      <button type="button" onClick={() => navigateTo(`/messages?match=${encodeURIComponent(item.matchId)}&view=chat`)}>
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
  const chatImageInputRef = useRef(null)
  const chatBubblesRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const swipeGestureRef = useRef({ id: '', startX: 0, startY: 0, swiping: false })
  const typingTimerRef = useRef({ idle: 0, lastSentAt: 0, active: false })
  const initialMessageParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const [threads, setThreads] = useState(messageThreads)
  const [selectedId, setSelectedId] = useState(initialMessageParams.get('match') || messageThreads[0]?.id)
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
  const [chatOpen, setChatOpen] = useState(() => window.location.hash === '#chat' || initialMessageParams.get('view') === 'chat')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [activeMessageMenu, setActiveMessageMenu] = useState('')
  const [swipeVisual, setSwipeVisual] = useState({ id: '', offset: 0, dragging: false })
  const [typingByThread, setTypingByThread] = useState({})
  const [lastMessageSyncAt, setLastMessageSyncAt] = useState('')
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
          setMessageNotice(matchesResult.reason?.message || '消息接口暂时没有返回，先保留示范会话。')
          return
        }

        const matches = matchesResult.value.data?.matches || []
        const nextThreads = matches.map(normalizeMessageThread)
        setTypingByThread((current) => ({
          ...current,
          ...Object.fromEntries(matches.map((match) => [match.id || match._id, match.typing?.activeUsers || []])),
        }))

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
  const selectedMessages = useMemo(
    () => messagesByThread[selectedThread?.id] || selectedThread?.messages || [],
    [messagesByThread, selectedThread?.id, selectedThread?.messages],
  )
  const selectedMessageRows = useMemo(() => groupMessagesByDay(selectedMessages), [selectedMessages])
  const selectedThreadHasSourceMatch = Boolean(selectedThread?.sourceMatch)
  const isLoggedIn = hasAuthToken()
  const filteredThreads = useMemo(() => {
    if (filter === '未读') return threads.filter((thread) => thread.unread > 0)
    if (filter === '同校') return threads.filter((thread) => thread.school.includes('同校') || thread.sourceMatch?.user?.school)
    if (filter === '树洞') return threads.filter((thread) => `${thread.school}${thread.lastMessage}`.includes('树洞'))
    return threads
  }, [filter, threads])
  const displayThreads = isLoggedIn ? filteredThreads : []
  const effectiveChatOpen = isLoggedIn && chatOpen
  const unreadTotal = isLoggedIn ? threads.reduce((total, thread) => total + thread.unread, 0) : 0
  const onlineTotal = isLoggedIn ? threads.filter((thread) => thread.online).length : 0
  const threadTotal = isLoggedIn ? threads.length : 0
  const selectedProfile = selectedThread?.sourceMatch?.user || {}
  const selectedScenes = splitList(selectedProfile.sceneTags)
  const activeTypingUsers = typingByThread[selectedThread?.id] || []
  const isPeerTyping = activeTypingUsers.length > 0
  const threadTypingUsers = (threadId) => typingByThread[threadId] || []
  const threadPreviewText = (thread) => {
    if (threadTypingUsers(thread.id).length) return '正在输入...'
    if (thread.lastMessageSenderId && thread.lastMessageSenderId === currentUserId) {
      return `我：${thread.lastMessage}`
    }
    return thread.lastMessage
  }
  const threadEmptyTitle = !isLoggedIn ? '登录后查看消息' : (filter === '未读' ? '没有未读消息' : '这里暂时安静')
  const threadEmptyText = !isLoggedIn
    ? '注册或登录后，真实匹配、树洞回应和活动邀约会同步到这里。'
    : (filter === '未读' ? '读过的消息会留在全部会话里。' : '新匹配、新消息和树洞回应都会自动出现在这里。')
  const markThreadReadLocally = (threadId) => {
    if (!threadId) return

    setThreads((current) =>
      current.map((thread) => {
        if (thread.id !== threadId || !thread.unread) return thread

        return {
          ...thread,
          unread: 0,
          sourceMatch: {
            ...(thread.sourceMatch || {}),
            unreadCount: 0,
            hasUnread: false,
          },
        }
      }),
    )
  }
  const openThread = (threadId, openChat = true) => {
    if (!threadId) return

    setSelectedId(threadId)
    markThreadReadLocally(threadId)
    setChatOpen(openChat)
    const params = new URLSearchParams()
    params.set('match', threadId)
    if (openChat) params.set('view', 'chat')
    window.history.replaceState({}, '', `/messages?${params.toString()}`)
  }
  const openingPrompts = [
    selectedScenes[0] ? `我也挺喜欢${selectedScenes[0]}，你一般什么时候会去？` : '',
    selectedProfile.mbti ? `看到你是 ${selectedProfile.mbti}，你会更喜欢慢慢熟悉还是直接一点？` : '',
    selectedProfile.bio ? `你资料里那句「${selectedProfile.bio.slice(0, 18)}」挺有意思，可以展开说说吗？` : '',
    '今天想先轻松聊一个校园里的小事吗？',
  ].filter(Boolean).slice(0, 3)
  const messageKeyFor = (message, index = 0) => message.id || `${message.createdAt || 'local'}-${index}`
  const scrollChatToBottom = (behavior = 'smooth') => {
    const chatBubbles = chatBubblesRef.current
    if (!chatBubbles) return

    window.requestAnimationFrame(() => {
      chatBubbles.scrollTo({
        top: chatBubbles.scrollHeight,
        behavior,
      })
    })
  }
  const latestOwnMessageKey = useMemo(() => {
    for (let index = selectedMessages.length - 1; index >= 0; index -= 1) {
      const message = selectedMessages[index]
      if (message?.from === 'me' && !message.isRecalled) {
        return messageKeyFor(message, index)
      }
    }

    return ''
  }, [selectedMessages])

  const syncThreadFromPayload = (matchId, payload) => {
    const nextMatch = payload.data?.match
    const nextTyping = payload.data?.typing?.activeUsers || nextMatch?.typing?.activeUsers || []

    setTypingByThread((current) => ({
      ...current,
      [matchId]: nextTyping,
    }))

    if (!nextMatch) return

    setThreads((current) =>
      current.map((thread, index) =>
        thread.id === matchId
          ? {
              ...normalizeMessageThread(nextMatch, index),
              tone: thread.tone,
              sourceMatch: nextMatch,
            }
          : thread,
      ),
    )
  }

  const updateThreadListFromMatches = (matches = []) => {
    if (!Array.isArray(matches) || !matches.length) return

    setThreads((current) => {
      const toneById = Object.fromEntries(current.map((thread) => [thread.id, thread.tone]))
      return matches.map((match, index) => {
        const normalized = normalizeMessageThread(match, index)
        return {
          ...normalized,
          tone: toneById[normalized.id] || normalized.tone,
        }
      })
    })

    setTypingByThread((current) => ({
      ...current,
      ...Object.fromEntries(
        matches.map((match) => [
          match.id || match._id,
          match.typing?.activeUsers || [],
        ]),
      ),
    }))
  }

  const copyText = async (value) => {
    const content = String(value || '')
    if (!content) return false

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content)
      return true
    }

    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }

  const clearLongPressTimer = () => {
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const resetSwipeGesture = () => {
    swipeGestureRef.current = { id: '', startX: 0, startY: 0, swiping: false }
    setSwipeVisual({ id: '', offset: 0, dragging: false })
  }

  const openMessageMenu = (messageId) => {
    clearLongPressTimer()
    setSwipeVisual({ id: '', offset: 0, dragging: false })
    setActiveMessageMenu((current) => (current === messageId ? '' : messageId))
  }

  const startLongPressMessage = (messageId) => {
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      setActiveMessageMenu(messageId)
    }, 420)
  }

  const beginMessageGesture = (event, messageId) => {
    if (event.button && event.pointerType === 'mouse') return
    startLongPressMessage(messageId)
    setActiveMessageMenu('')
    swipeGestureRef.current = {
      id: messageId,
      startX: event.clientX,
      startY: event.clientY,
      swiping: false,
    }
    setSwipeVisual({ id: messageId, offset: 0, dragging: false })
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const moveMessageGesture = (event, messageId) => {
    const gesture = swipeGestureRef.current
    if (gesture.id !== messageId) return

    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY

    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
      clearLongPressTimer()
    }

    if (!gesture.swiping && Math.abs(deltaY) > Math.abs(deltaX) + 8) {
      return
    }

    if (deltaX < -8 || gesture.swiping) {
      event.preventDefault()
      gesture.swiping = true
      const offset = Math.max(-96, Math.min(0, deltaX))
      setSwipeVisual({ id: messageId, offset, dragging: true })
    }
  }

  const endMessageGesture = (message, messageId) => {
    clearLongPressTimer()
    const gesture = swipeGestureRef.current
    const offset = swipeVisual.id === messageId ? swipeVisual.offset : 0

    if (gesture.id === messageId && gesture.swiping && offset <= -72) {
      setSwipeVisual({ id: messageId, offset: -96, dragging: false })
      window.setTimeout(() => {
        handleDeleteMessage(message).finally(resetSwipeGesture)
      }, 110)
      return
    }

    resetSwipeGesture()
  }

  useEffect(() => {
    if (!chatOpen || window.innerWidth > 860) return
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
  }, [chatOpen, selectedId])

  useEffect(() => {
    if (!selectedThread?.id) return
    scrollChatToBottom(chatOpen ? 'auto' : 'smooth')
  }, [chatOpen, selectedThread?.id, selectedMessageRows.length, isPeerTyping, messagesLoading])

  useEffect(() => {
    if (!chatOpen) {
      document.documentElement.style.removeProperty('--chat-vh')
      return undefined
    }

    const updateChatViewport = () => {
      const viewport = window.visualViewport
      const height = Math.round(viewport?.height || window.innerHeight || 0)
      if (height > 0) {
        document.documentElement.style.setProperty('--chat-vh', `${height}px`)
      }
      scrollChatToBottom('auto')
    }

    updateChatViewport()
    window.visualViewport?.addEventListener('resize', updateChatViewport)
    window.visualViewport?.addEventListener('scroll', updateChatViewport)
    window.addEventListener('orientationchange', updateChatViewport)

    return () => {
      window.visualViewport?.removeEventListener('resize', updateChatViewport)
      window.visualViewport?.removeEventListener('scroll', updateChatViewport)
      window.removeEventListener('orientationchange', updateChatViewport)
      document.documentElement.style.removeProperty('--chat-vh')
    }
  }, [chatOpen, selectedThread?.id])

  useEffect(() => {
    if (!selectedThread?.id) return undefined
    if (chatOpen || window.innerWidth > 860) {
      let cancelled = false
      const threadId = selectedThread.id
      Promise.resolve().then(() => {
        if (cancelled) return
        markThreadReadLocally(threadId)
      })
      return () => {
        cancelled = true
      }
    }
    return undefined
  }, [chatOpen, selectedThread?.id])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setActiveMessageMenu('')
      swipeGestureRef.current = { id: '', startX: 0, startY: 0, swiping: false }
      setSwipeVisual({ id: '', offset: 0, dragging: false })
    })
    return () => {
      cancelled = true
      clearLongPressTimer()
    }
  }, [selectedId])

  useEffect(() => {
    if (!hasAuthToken() || !selectedThreadHasSourceMatch || !currentUserId) return undefined

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
        setTypingByThread((current) => ({
          ...current,
          [selectedThread.id]: payload.data?.typing?.activeUsers || nextMatch?.typing?.activeUsers || [],
        }))
        setLastMessageSyncAt(new Date().toISOString())

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
  }, [currentUserId, selectedThread?.id, selectedThreadHasSourceMatch])

  useEffect(() => {
    if (!hasAuthToken() || !selectedThreadHasSourceMatch || !currentUserId || !chatOpen) return undefined

    let mounted = true
    const syncMessages = async () => {
      try {
        const payload = await apiRequest(`/messages/${encodeURIComponent(selectedThread.id)}?limit=40`)
        if (!mounted) return

        const nextMessages = (payload.data?.messages || []).map((message) => normalizeChatMessage(message, currentUserId))
        setMessagesByThread((current) => ({
          ...current,
          [selectedThread.id]: nextMessages,
        }))
        syncThreadFromPayload(selectedThread.id, payload)
        setLastMessageSyncAt(new Date().toISOString())
      } catch {
        if (mounted) {
          setTypingByThread((current) => ({
            ...current,
            [selectedThread.id]: [],
          }))
        }
      }
    }

    const intervalId = window.setInterval(syncMessages, 5200)
    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [chatOpen, currentUserId, selectedThread?.id, selectedThreadHasSourceMatch])

  useEffect(() => {
    if (!hasAuthToken() || !currentUserId) return undefined

    let mounted = true
    const syncThreads = async () => {
      try {
        const payload = await apiRequest('/matches')
        if (!mounted) return
        updateThreadListFromMatches(payload.data?.matches || [])
      } catch {
        // 静默轮询，失败时保留当前会话列表。
      }
    }

    const intervalId = window.setInterval(syncThreads, 12000)
    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [currentUserId])

  const sendTypingSignal = (active) => {
    if (!hasAuthToken() || !selectedThreadHasSourceMatch) return

    const now = Date.now()
    if (active && typingTimerRef.current.active && now - typingTimerRef.current.lastSentAt < 2400) {
      return
    }

    typingTimerRef.current.active = active
    typingTimerRef.current.lastSentAt = now
    apiRequest(`/messages/${encodeURIComponent(selectedThread.id)}/typing`, {
      method: 'POST',
      body: JSON.stringify({ active }),
    }).catch(() => {})
  }

  const scheduleTypingIdle = () => {
    window.clearTimeout(typingTimerRef.current.idle)
    typingTimerRef.current.idle = window.setTimeout(() => {
      sendTypingSignal(false)
    }, 1600)
  }

  const handleComposerChange = (event) => {
    const nextValue = event.target.value
    setComposer(nextValue)

    if (!nextValue.trim()) {
      window.clearTimeout(typingTimerRef.current.idle)
      sendTypingSignal(false)
      return
    }

    sendTypingSignal(true)
    scheduleTypingIdle()
  }

  useEffect(() => {
    const typingTimer = typingTimerRef.current
    const threadId = selectedThread?.id
    return () => {
      window.clearTimeout(typingTimer.idle)
      if (typingTimer.active && selectedThreadHasSourceMatch && threadId) {
        apiRequest(`/messages/${encodeURIComponent(threadId)}/typing`, {
          method: 'POST',
          body: JSON.stringify({ active: false }),
        }).catch(() => {})
      }
      typingTimer.active = false
    }
  }, [selectedThread?.id, selectedThreadHasSourceMatch])

  const sendMessageContent = async ({ content, type = 'text', clearComposer = false }) => {
    const normalizedContent = String(content || '').trim()
    if (!normalizedContent || sending) return false

    if (!hasAuthToken()) {
      navigateTo('/login')
      return false
    }

    if (!selectedThread?.sourceMatch) {
      setMessageNotice('这是示范会话。互相喜欢形成真实匹配后，就能发送到后端保存。')
      return false
    }

    setSending(true)
    try {
      const payload = await apiRequest(`/messages/${encodeURIComponent(selectedThread.id)}`, {
        method: 'POST',
        body: JSON.stringify({ content: normalizedContent, type }),
      })
      const nextMessage = { ...normalizeChatMessage(payload.data?.message, currentUserId), from: 'me' }
      const nextMatch = payload.data?.match
      const preview = type === 'image' ? '发来一张图片' : normalizedContent
      window.clearTimeout(typingTimerRef.current.idle)
      sendTypingSignal(false)

      setMessagesByThread((current) => ({
        ...current,
        [selectedThread.id]: [...(current[selectedThread.id] || []), nextMessage],
      }))
      setThreads((current) =>
        current.map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...normalizeMessageThread(nextMatch || thread.sourceMatch || {}, current.indexOf(thread)),
                tone: thread.tone,
                lastMessage: preview,
                time: '刚刚',
                unread: 0,
                sourceMatch: nextMatch || thread.sourceMatch,
              }
          : thread,
        ),
      )
      if (clearComposer) setComposer('')
      setEmojiOpen(false)
      setMessageNotice(type === 'image' ? '图片已发送。' : '消息已发送。')
      return true
    } catch (error) {
      setMessageNotice(error.message || '发送失败，请稍后再试。')
      return false
    } finally {
      setSending(false)
    }
  }

  const handleSendMessage = () => {
    sendMessageContent({ content: composer, type: 'text', clearComposer: true })
  }

  const handlePickImage = () => {
    if (!hasAuthToken()) {
      navigateTo('/login')
      return
    }
    if (!selectedThread?.sourceMatch) {
      setMessageNotice('示范会话还不能发图片。互相喜欢后，图片会保存到真实聊天里。')
      return
    }
    chatImageInputRef.current?.click()
  }

  const handleChatImageChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || sending) return

    setSending(true)
    try {
      const uploadBody = await uploadPayloadFromFile(file)
      const uploadPayload = await apiRequest('/uploads/chat-image', {
        method: 'POST',
        body: JSON.stringify(uploadBody),
      })
      const imageUrl = uploadPayload.data?.imageUrl
      if (!imageUrl) throw new Error('图片上传成功但没有返回地址。')
      setSending(false)
      await sendMessageContent({ content: imageUrl, type: 'image' })
    } catch (error) {
      setMessageNotice(error.message || '图片发送失败，请换一张再试。')
      setSending(false)
    }
  }

  const appendEmoji = (emoji) => {
    setComposer((current) => `${current}${emoji}`)
  }

  const handleVoicePlaceholder = () => {
    if (!hasAuthToken()) {
      navigateTo('/login')
      return
    }
    setMessageNotice('语音消息还在内测准备中，当前请先用文字或图片聊天。')
  }

  const handleRefreshConversations = async () => {
    if (!hasAuthToken()) {
      navigateTo('/login')
      return
    }

    setMessagesLoading(true)
    try {
      const payload = await apiRequest('/matches')
      const matches = payload.data?.matches || []
      updateThreadListFromMatches(matches)
      setLastMessageSyncAt(new Date().toISOString())
      setMessageNotice(matches.length ? '会话已更新。' : '还没有真实匹配，互相喜欢后会出现在这里。')
    } catch (error) {
      setMessageNotice(error.message || '会话同步失败，请稍后再试。')
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleCopyMessage = async (message) => {
    try {
      const content = message.type === 'image' && message.imageUrl ? message.imageUrl : message.text
      const copied = await copyText(content)
      setMessageNotice(copied ? '已复制这条消息。' : '复制没有成功，可以再试一次。')
    } catch {
      setMessageNotice('复制没有成功，可以再试一次。')
    } finally {
      setActiveMessageMenu('')
    }
  }

  const handleDeleteMessage = async (message, { recall = false } = {}) => {
    const messageId = message.id
    if (!messageId) {
      setMessagesByThread((current) => ({
        ...current,
        [selectedThread.id]: (current[selectedThread.id] || []).filter((item) => item !== message),
      }))
      setActiveMessageMenu('')
      setMessageNotice('这条示范消息已从本地移除。')
      return
    }

    if (!selectedThread?.sourceMatch) {
      setMessageNotice('示范会话只能本地删除，真实匹配后会同步到后端。')
      return
    }

    try {
      const endpoint = `/messages/${encodeURIComponent(selectedThread.id)}/${encodeURIComponent(messageId)}${recall ? '?scope=all' : ''}`
      const payload = await apiRequest(endpoint, { method: 'DELETE' })
      const nextMessages = (payload.data?.messages || []).map((item) => normalizeChatMessage(item, currentUserId))

      setMessagesByThread((current) => ({
        ...current,
        [selectedThread.id]: nextMessages,
      }))
      syncThreadFromPayload(selectedThread.id, payload)
      setMessageNotice(payload.message || (recall ? '消息已撤回。' : '消息已从你的聊天里删除。'))
    } catch (error) {
      setMessageNotice(error.message || (recall ? '撤回失败，请稍后再试。' : '删除失败，请稍后再试。'))
    } finally {
      setActiveMessageMenu('')
    }
  }

  const handleReportMessage = async (message) => {
    const messageId = message.id
    if (!messageId || !selectedThread?.sourceMatch) {
      setMessageNotice('示范会话暂不需要举报，真实匹配聊天会进入运营复核。')
      setActiveMessageMenu('')
      return
    }

    try {
      const payload = await apiRequest(`/messages/${encodeURIComponent(selectedThread.id)}/${encodeURIComponent(messageId)}/reports`, {
        method: 'POST',
        body: JSON.stringify({ reason: '不适合校园聊天' }),
      })
      const nextMessages = (payload.data?.messages || []).map((item) => normalizeChatMessage(item, currentUserId))
      setMessagesByThread((current) => ({
        ...current,
        [selectedThread.id]: nextMessages,
      }))
      syncThreadFromPayload(selectedThread.id, payload)
      setMessageNotice(payload.message || '举报已提交，运营会复核这条消息。')
    } catch (error) {
      setMessageNotice(error.message || '举报失败，请稍后再试。')
    } finally {
      setActiveMessageMenu('')
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
    <main className={`app-shell cece-layout messages-shell ${effectiveChatOpen ? 'chat-open' : ''}`}>
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
          <span><strong>{threadTotal}</strong>会话</span>
        </div>
      </section>

      <section className={`messages-layout ${effectiveChatOpen ? 'is-chat-open' : ''}`} aria-label="消息中心">
        <aside className="messages-panel thread-panel">
          {messageNotice && <p className="message-notice">{messageNotice}</p>}
          <div className="inbox-summary" aria-label="消息状态">
            <div>
              <span>收件箱</span>
              <strong>{unreadTotal > 0 ? `${unreadTotal} 条未读` : '没有未读'}</strong>
            </div>
            <div>
              <span>在线</span>
              <strong>{onlineTotal} 人活跃</strong>
            </div>
            <button type="button" onClick={handleRefreshConversations} disabled={messagesLoading}>
              {!isLoggedIn ? '登录' : (messagesLoading ? '同步中' : '同步')}
            </button>
          </div>
          <div className="message-filter" aria-label="消息筛选">
            {['全部', '未读', '同校', '树洞'].map((item) => (
              <button className={filter === item ? 'active' : ''} type="button" key={item} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
          {displayThreads.length > 0 ? (
          <AnimatedList
            className="message-thread-list"
            items={displayThreads}
            getItemKey={(thread) => thread.id}
            initialSelectedIndex={0}
            onItemSelect={(thread) => {
              openThread(thread.id, true)
            }}
            renderItem={(thread, _index, selected) => {
              const isActive = selected || thread.id === selectedId
              const typing = threadTypingUsers(thread.id).length > 0
              const unread = thread.unread > 0
              const preview = threadPreviewText(thread)
              const detailChips = thread.detailChips || []

              return (
                <article className={`message-thread ${isActive ? 'active' : ''} ${unread ? 'unread' : ''} ${typing ? 'typing' : ''}`}>
                  <MessageAvatar thread={thread} />
                  <div>
                    <div className="message-thread-head">
                      <strong>{thread.name}</strong>
                      <small>{thread.time}</small>
                    </div>
                    <p>{preview}</p>
                    <span>{thread.school}</span>
                    <div className="message-chip-row">
                      {(typing ? ['正在输入', ...detailChips] : detailChips).slice(0, 3).map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  </div>
                  <div className="thread-state">
                    {unread ? <i aria-label={`${thread.unread} 条未读`}>{thread.unread}</i> : <small>{typing ? '输入中' : '已同步'}</small>}
                    <em className={thread.online || typing ? 'online' : ''} aria-label={thread.online || typing ? '在线' : '离线'} />
                  </div>
                </article>
              )
            }}
          />
          ) : (
            <div className="message-thread-empty" role="status">
              <strong>{threadEmptyTitle}</strong>
              <p>{threadEmptyText}</p>
              {!isLoggedIn && (
                <button type="button" onClick={() => navigateTo('/login')}>
                  去登录
                </button>
              )}
            </div>
          )}
        </aside>

        <AnimatePresence mode="wait">
          {isLoggedIn && selectedThread && (
        <motion.section
          className="messages-panel chat-panel"
          aria-label="聊天面板"
          key={selectedThread.id}
          initial={{ opacity: 0, x: 18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -18, filter: 'blur(8px)' }}
          transition={{ duration: 0.28, ease: [0.2, 0.82, 0.2, 1] }}
        >
          <div className="chat-head">
            <button className="chat-back" type="button" onClick={() => openThread(selectedThread.id, false)} aria-label="返回会话列表">
              ‹
            </button>
            <MessageAvatar thread={selectedThread} />
            <div>
              <strong>{selectedThread.name}</strong>
              <span>{isPeerTyping ? '正在输入...' : selectedThread.school}</span>
              <div className="message-chip-row">
                {(selectedThread.detailChips || []).slice(0, 4).map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>
            <button className="ghost-action" type="button" onClick={() => setProfileSheetThread(selectedThread)}>查看资料</button>
          </div>

          <div className="chat-bubbles" ref={chatBubblesRef}>
            {messagesLoading && selectedThread.sourceMatch && <p>正在同步聊天记录...</p>}
            {!messagesLoading && selectedMessages.length === 0 && (
              <p>你们已经匹配了，先发一句轻松的开场吧。</p>
            )}
            {selectedMessageRows.map((row) => {
              if (row.type === 'date') {
                return (
                  <div className="message-date-divider" key={row.key}>
                    <span>{row.label}</span>
                  </div>
                )
              }

              const { message, index } = row
              const messageId = messageKeyFor(message, index)
              const menuOpen = activeMessageMenu === messageId
              const swipeOffset = swipeVisual.id === messageId ? swipeVisual.offset : 0
              const isSwiping = swipeVisual.id === messageId && swipeOffset < 0
              const canRecall = message.from === 'me' && !message.isRecalled
              const isLatestOwnMessage = message.from === 'me' && messageId === latestOwnMessageKey
              const deliveryLabel = isLatestOwnMessage ? (selectedThread.lastOwnMessageRead ? '对方已读' : '已送达') : ''

              return (
                <div
                  className={`chat-message ${message.from === 'me' ? 'me' : ''} ${menuOpen ? 'menu-open' : ''} ${isSwiping ? 'is-swiping' : ''} ${swipeVisual.dragging && swipeVisual.id === messageId ? 'is-dragging' : ''}`}
                  key={`${selectedThread.id}-${row.key}-${messageId}`}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    openMessageMenu(messageId)
                  }}
                  onPointerDown={(event) => beginMessageGesture(event, messageId)}
                  onPointerMove={(event) => moveMessageGesture(event, messageId)}
                  onPointerUp={() => endMessageGesture(message, messageId)}
                  onPointerCancel={resetSwipeGesture}
                  onPointerLeave={() => {
                    if (swipeGestureRef.current.id === messageId && swipeGestureRef.current.swiping) {
                      endMessageGesture(message, messageId)
                    } else {
                      clearLongPressTimer()
                    }
                  }}
                >
                  <div className="message-swipe-shell">
                    <button
                      className="swipe-delete-hint"
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => handleDeleteMessage(message).finally(resetSwipeGesture)}
                    >
                      删除
                    </button>
                    <div className="message-swipe-content" style={{ '--swipe-x': `${swipeOffset}px` }}>
                      <button
                        className="message-more"
                        type="button"
                        aria-label="消息操作"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation()
                          openMessageMenu(messageId)
                        }}
                      >
                        ···
                      </button>
                      {message.isRecalled ? (
                        <p className="message-recalled">消息已撤回</p>
                      ) : message.type === 'image' && message.imageUrl ? (
                        <img src={message.imageUrl} alt="聊天图片" />
                      ) : (
                        <p>{message.text}</p>
                      )}
                      {(message.createdAt || deliveryLabel || message.isRecalled) && (
                        <small className={`message-meta ${deliveryLabel ? 'with-status' : ''} ${message.isRecalled ? 'recalled' : ''}`}>
                          {message.createdAt && <span>{formatRelativeTime(message.createdAt)}</span>}
                          {deliveryLabel && <span>{deliveryLabel}</span>}
                          {message.isRecalled && <span>已撤回</span>}
                        </small>
                      )}
                      {menuOpen && (
                        <div className="message-action-popover" role="menu" onPointerDown={(event) => event.stopPropagation()}>
                          {!message.isRecalled && (
                            <button type="button" role="menuitem" onClick={() => handleCopyMessage(message)}>
                              复制
                            </button>
                          )}
                          <button type="button" role="menuitem" onClick={() => handleDeleteMessage(message)}>
                            删除
                          </button>
                          <button type="button" role="menuitem" onClick={() => handleReportMessage(message)}>
                            举报
                          </button>
                          {canRecall && (
                            <button type="button" role="menuitem" onClick={() => handleDeleteMessage(message, { recall: true })}>
                              撤回
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {isPeerTyping && (
              <div className="chat-message typing-indicator" aria-live="polite">
                <p>
                  <span />
                  <span />
                  <span />
                </p>
                <small>{selectedThread.name} 正在输入</small>
              </div>
            )}
            {!messagesLoading && selectedMessages.length === 0 && selectedThread.sourceMatch && (
              <div className="chat-prompts" aria-label="开场建议">
                {openingPrompts.map((prompt) => (
                  <button type="button" key={prompt} onClick={() => setComposer(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="chat-footnote">
            <span>{selectedThread.identityRevealed ? '身份已公开' : '低压力匹配中'}</span>
            {selectedThread.lastMessageSenderId === currentUserId && (
              <span>{selectedThread.lastOwnMessageRead ? '对方已读' : '已送达'}</span>
            )}
            <span>{lastMessageSyncAt ? `${formatRelativeTime(lastMessageSyncAt)}同步` : '自动同步中'}</span>
          </div>

          <div className="message-composer" aria-label="发送消息">
            <input
              ref={chatImageInputRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChatImageChange}
              tabIndex={-1}
            />
            <div className="chat-tools" aria-label="聊天工具">
              <button type="button" onClick={handlePickImage} disabled={sending}>图片</button>
              <button type="button" onClick={() => setEmojiOpen((current) => !current)}>表情</button>
              <button type="button" onClick={handleVoicePlaceholder}>语音</button>
            </div>
            {emojiOpen && (
              <div className="emoji-tray" aria-label="选择表情">
                {['🙂', '✨', '👌', '哈哈', '收到', '慢慢聊'].map((emoji) => (
                  <button type="button" key={emoji} onClick={() => appendEmoji(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <input
              placeholder="写一句轻松的开场..."
              value={composer}
              onChange={handleComposerChange}
              onFocus={() => {
                window.setTimeout(() => scrollChatToBottom('smooth'), 80)
                window.setTimeout(() => scrollChatToBottom('smooth'), 320)
              }}
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
        </motion.section>
          )}
        </AnimatePresence>
      </section>
      <AnimatePresence>
        {profileSheetThread && (
          <MatchProfileSheet
            thread={profileSheetThread}
            onClose={() => setProfileSheetThread(null)}
            onReveal={handleRevealIdentity}
            onMessage={(threadId) => {
              setProfileSheetThread(null)
              openThread(threadId, true)
            }}
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
        setInsightNotice('本地状态已更新。登录后会保存到账号里。')
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

  const completeHomeQuiz = async ({ mbti, birthDate = '', relationshipGoal = '', tags = [], sceneTags = [], focus, moodLabel, moodScore, report }) => {
    const insightBody = { moodLabel, moodScore, focus }
    const buildUpdatedProfile = (profile = {}) => {
      const nextTags = Array.from(new Set([...splitList(profile.tags), ...tags, '测一测'])).slice(0, 10)
      const nextSceneTags = Array.from(new Set([...splitList(profile.sceneTags), ...sceneTags, '测一测'])).slice(0, 8)
      return {
        ...profile,
        mbti,
        birthDate: birthDate || profile.birthDate || '',
        relationshipGoal: relationshipGoal || profile.relationshipGoal || '',
        tags: nextTags,
        sceneTags: nextSceneTags,
      }
    }

    if (!hasAuthToken()) {
      setHomeData((current) => {
        const updatedProfile = buildUpdatedProfile(current.profile || profileFallback)
        return {
          ...current,
          profile: updatedProfile,
          insight: normalizeInsightPayload({
            ...current.insight,
            mbti,
            birthDate: updatedProfile.birthDate,
            tags: updatedProfile.tags,
            moodScore,
            latestReport: report || current.insight?.latestReport,
            testReports: report
              ? [report, ...(current.insight?.testReports || []).filter((item) => item.id !== report.id)].slice(0, 40)
              : current.insight?.testReports,
            selfInsight: {
              ...(current.insight?.selfInsight || {}),
              ...insightBody,
              testReports: report
                ? [report, ...(current.insight?.selfInsight?.testReports || []).filter((item) => item.id !== report.id)].slice(0, 40)
                : current.insight?.selfInsight?.testReports,
            },
          }, updatedProfile),
        }
      })
      setInsightNotice('测试结果已更新到本地画像。登录后可以保存到账号里。')
      return true
    }

    setInsightBusy('quiz')
    setInsightNotice('')
    try {
      const profileDraft = buildUpdatedProfile(homeData.profile || profileFallback)
      const reportPayload = report
        ? await apiRequest('/users/insights/reports', {
            method: 'POST',
            body: JSON.stringify({ mbti: profileDraft.mbti, birthDate: profileDraft.birthDate, report }),
          })
        : null
      const insightPayload = await apiRequest('/users/insights', {
        method: 'POST',
        body: JSON.stringify(insightBody),
      })
      const [recommendationResult, activityResult] = await Promise.allSettled([
        apiRequest('/users/recommendations?limit=6'),
        apiRequest('/users/activity'),
      ])
      const updatedProfile = buildUpdatedProfile(homeData.profile || profileFallback)
      setHomeData((current) => ({
        ...current,
        profile: updatedProfile,
        insight: normalizeInsightPayload({
          ...(reportPayload?.data || {}),
          ...(insightPayload.data || {}),
          latestReport: reportPayload?.data?.latestReport || report,
          testReports: reportPayload?.data?.testReports || current.insight?.testReports,
        }, updatedProfile),
        recommendations:
          recommendationResult.status === 'fulfilled'
            ? recommendationResult.value.data?.users || current.recommendations
            : current.recommendations,
        activity: activityResult.status === 'fulfilled' ? activityResult.value.data || current.activity : current.activity,
      }))
      setInsightNotice('测试结果已保存，推荐会参考你的新画像。')
      return true
    } catch (error) {
      setInsightNotice(error.message || '测试结果保存失败，再试一次。')
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
    <main className="app-shell cece-layout">
      <Background />
      <Header />
      <HomeTopDock profile={homeData.profile || profileFallback} insight={visibleInsight} />
      <MoodCard />
      <ShortcutGrid items={shortcutItems} onSelect={handleShortcutSelect} />
      <PromoBanner />
      <SelfInsightPanel
        insight={visibleInsight}
        treeholes={homeData.treeholes}
        onMoodUpdate={updateHomeInsight}
        onQuizComplete={completeHomeQuiz}
        onTreeholeSubmit={submitTreehole}
        busy={insightBusy}
        notice={insightNotice}
      />
      <Feed items={feedItems} />
      <MatchPreview />
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
    return <AppErrorBoundary><AuthPage /></AppErrorBoundary>
  }

  if (path === '/profile') {
    return <AppErrorBoundary><ProfilePage /></AppErrorBoundary>
  }

  if (path === '/messages') {
    return <AppErrorBoundary><MessagesPage /></AppErrorBoundary>
  }

  return <AppErrorBoundary><HomePage /></AppErrorBoundary>
}

export default App
