import type { FeedGroup } from '../app/types/feed'
// 友链检测 CLI 需要使用显式导入和相对路径
import { myFeed } from '../blog.config'
// eslint-disable-next-line unused-imports/no-unused-imports
import { getFavicon, getGithubAvatar, getGithubIcon, getOciqGroupAvatar, getOicqAvatar, OicqAvatarSize } from './utils/img'

export default [
	// #endregion
	// #region 网上邻居 since 2024
	{
		name: '网上邻居',
		desc: '哔——啵——电波通讯中，欢迎常来串门。',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			// #region 2026
			{
				author: '狡猫三窝',
				sitenick: '',
				desc: '“美”不是一种外部标准，它是一种内在情感。那是爱',
				link: 'https://slykiten.com/',
				feed: 'https://slykiten.com/feed',
				icon: 'https://slykiten.com/wp-content/themes/Puma/build/images/favicon.png',
				avatar: 'https://c.wpista.com/avatar/5bac49c5f9bfb23d51345355d0c5a4079ef952fb1125548f1fb6a0b637932c1c?s=42&d=mm&r=g',
				archs: ['Hugo'],
				date: '2026-06-18',
				comment: '本科毕业后旅居日本读博，毕业后辗转美国，暂以科研谋生。',
			}
			/* ========从此处新增友链======== */
		],
	},
	// #endregion
	// #region 知识分享
	{
		name: '知识分享',
		desc: '知识内容收集。',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			{
				author: '极客兔兔',
				desc: '致力于分享有趣的技术实践',
				link: 'https://geektutu.com/',
				feed: 'https://geektutu.com/feed.xml',
				icon: getGithubIcon('geektutu'),
				avatar: getGithubAvatar('geektutu'),
				archs: ['Hugo'],
				date: '2026-06-18',
				comment: '主要以 Go 相关的技术为主的分享，文笔通俗易懂，技术含量极高。',
			},
			{
				author: 'DaiJun Wu',
				desc: '生活中不拘小节，技术上精益求精',
				link: 'https://wudaijun.com/',
				feed: 'https://wudaijun.com/atom.xml',
				icon: getGithubIcon('wudaijun'),
				avatar: getGithubAvatar('wudaijun'),
				archs: ['Hugo'],
				date: '2026-06-18',
				comment: '曾是 SLG 游戏工程师，对游戏架构也有自己的见解。',
			},
			{
				author: '美团 · 技术团队',
				desc: '帮大家吃得更好，生活更好',
				link: 'https://tech.meituan.com/',
				icon: getGithubIcon('meituan'),
				avatar: getGithubAvatar('meituan'),
				date: '2026-06-18',
				comment: '难得一见不水文章的互联网大厂，没有侃侃而谈，实用且有深度。',
			},
			{
				author: 'Eli Bendersky',
				desc: 'This blog began in 2003',
				link: 'https://eli.thegreenplace.net/',
				icon: getGithubIcon('eliben'),
				avatar: getGithubAvatar('eliben'),
				date: '2026-06-18',
				comment: '文章简短，通俗易懂，GoByExample 作者。',
			},
		],
	},
	// #endregion
] satisfies FeedGroup[]
