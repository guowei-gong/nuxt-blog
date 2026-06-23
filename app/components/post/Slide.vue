<script setup lang="ts">
import type { ArticleProps } from '~/types/article'

const props = defineProps<{ list: ArticleProps[] }>()

const carouselEl = ref<HTMLElement | null>(null)
const isHovering = ref(false)
const selectedIndex = ref(0)
const leaderboardIcons = [
	'/assets/leaderboard/rank-1.png',
	'/assets/leaderboard/rank-2.png',
	'/assets/leaderboard/rank-3.png',
	'/assets/leaderboard/rank-4.png',
	'/assets/leaderboard/rank-5.png',
]

let autoplayTimer: ReturnType<typeof setInterval> | undefined

function normalizeIndex(index: number) {
	const count = props.list.length
	return count ? (index + count) % count : 0
}

function stopAutoplay() {
	if (!autoplayTimer)
		return

	clearInterval(autoplayTimer)
	autoplayTimer = undefined
}

function startAutoplay() {
	stopAutoplay()
	if (props.list.length <= 1 || isHovering.value)
		return

	autoplayTimer = setInterval(() => {
		selectedIndex.value = normalizeIndex(selectedIndex.value + 1)
	}, 4500)
}

function restartAutoplay() {
	if (!autoplayTimer)
		return

	startAutoplay()
}

function scrollTo(index: number) {
	selectedIndex.value = normalizeIndex(index)
	restartAutoplay()
}

function scrollNext() {
	scrollTo(selectedIndex.value + 1)
}

function scrollPrev() {
	scrollTo(selectedIndex.value - 1)
}

watch(() => props.list.length, (count) => {
	if (selectedIndex.value >= count)
		selectedIndex.value = 0

	startAutoplay()
})

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)

useEventListener(carouselEl, 'mouseenter', () => {
	isHovering.value = true
	stopAutoplay()
})

useEventListener(carouselEl, 'mouseleave', () => {
	isHovering.value = false
	startAutoplay()
})

// 鼠标横向滚动 / Shift + 纵向滚轮事件
useEventListener(carouselEl, 'wheel', (e) => {
	const delta = e.deltaX + (e.shiftKey ? e.deltaY : 0)
	if (Math.abs(delta) < 80)
		return

	delta > 0 ? scrollNext() : scrollPrev()
}, { passive: true })
</script>

<template>
<div class="z-slide">
	<div class="z-slide-header">
		<span class="title text-creative">精选文章</span>
		<div class="at-slide-hover">
			<Icon name="tabler:mouse" />
			按住 Shift 横向滚动
		</div>
	</div>

	<div class="z-slide-stage" :class="{ single: list.length <= 1 }">
		<div ref="carouselEl" class="z-slide-body" :class="{ preview: isHovering }" dir="ltr">
			<div class="slide-list">
				<UtilLink
					v-for="(article, index) in list"
					:key="index"
					class="slide-item"
					:class="{ active: selectedIndex === index }"
					:aria-hidden="selectedIndex !== index"
					:tabindex="selectedIndex === index ? undefined : -1"
					:title="article.title"
					:to="article.path"
				>
					<NuxtImg
						v-if="article.image"
						class="cover"
						:src="article.image"
						:alt="article.title"
					/>
					<div v-else class="cover fallback" />

					<div class="slide-content">
						<div v-if="article.categories?.[0]" class="category">
							<Icon :name="getCategoryIcon(article.categories[0])" />
							{{ article.categories[0] }}
						</div>

						<h2 class="title text-creative">
							{{ article.title }}
						</h2>

						<p v-if="article.description" class="desc">
							{{ article.description }}
						</p>

						<UtilDate
							v-if="article.date"
							class="date"
							:date="article.date"
							icon="tabler:pencil-minus"
						/>
					</div>
				</UtilLink>
			</div>

			<div v-if="list.length > 1" class="carousel-dots" aria-label="精选文章分页">
				<button
					v-for="(_, index) in list"
					:key="index"
					:class="{ active: selectedIndex === index }"
					:aria-label="`查看第 ${index + 1} 篇精选文章`"
					type="button"
					@click="scrollTo(index)"
				/>
			</div>
		</div>

		<aside v-if="list.length > 1" class="slide-rank" aria-label="精选文章列表">
			<UtilLink
				v-for="(article, index) in list.slice(0, 5)"
				:key="article.path"
				class="rank-item"
				:class="{ active: selectedIndex === index }"
				:to="article.path"
				@focus="scrollTo(index)"
				@mouseenter="scrollTo(index)"
			>
				<img
					class="rank-icon"
					:src="leaderboardIcons[index]"
					:alt="`第 ${index + 1} 名`"
				>
				<span class="rank-copy">
					<span class="rank-title text-creative">
						{{ article.title }}
					</span>
				</span>
			</UtilLink>
		</aside>
	</div>
</div>
</template>

<style lang="scss" scoped>
.z-slide {
	margin: 1rem;

	.at-slide-hover {
		opacity: 0;
		transition: opacity 0.2s;
	}

	&:hover .at-slide-hover,
	&:focus-within .at-slide-hover {
		opacity: 1;
	}
}

.z-slide-header {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 2rem;
	height: 3rem;
	margin-bottom: -0.2rem;
	mask-image: linear-gradient(#FFF, transparent);
	color: var(--c-text-3);

	>.title {
		font-size: 3rem;
		font-weight: bold;
		line-height: 1;
	}
}

.z-slide-stage {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(14rem, 16rem);
	align-items: stretch;
	gap: 0;

	&.single {
		grid-template-columns: 1fr;
	}
}

.z-slide-body {
	contain: paint;
	position: relative;
	overflow: hidden;
	aspect-ratio: 1.55;
	border-radius: 0.5rem;
	box-shadow: var(--box-shadow-2);
	background-color: var(--c-border);
	cursor: grab;
	user-select: none;

	.slide-list {
		position: relative;
		height: 100%;
	}

	&:hover,
	&:focus-within,
	&.preview {
		.slide-item.active > .slide-content {
			border-color: #FFF4;
			background-color: #0005;
			backdrop-filter: blur(1rem) saturate(1.35);

			> .desc,
			> .date {
				opacity: 1;
				max-height: 4rem;
				transform: translateY(0);
			}
		}
	}
}

.carousel-dots {
	display: flex;
	gap: 0.5rem;
	position: absolute;
	bottom: 1rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 3;

	> button {
		opacity: 0.65;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		box-shadow: var(--text-shadow-black);
		background-color: white;
		transition: width 0.2s, opacity 0.2s, background-color 0.2s;

		&.active {
			opacity: 1;
			width: 1.5rem;
			background-color: var(--c-accent);
		}
	}
}

.slide-item {
	contain: paint;
	position: absolute;
	opacity: 0;
	inset: 0;
	width: 100%;
	min-height: 100%;
	transition: opacity 0.65s ease;
	pointer-events: none;
	z-index: 0;

	&.active {
		opacity: 1;
		pointer-events: auto;
		z-index: 1;

		> .cover {
			transform: scale(1);
		}

		> .slide-content {
			opacity: 1;
			transform: translateY(0);
		}
	}

	// Firefox 图片 alt 为空时 fallback 失效
	@supports (-moz-force-broken-image-icon: 1) {
		background-color: var(--c-border);
	}

	> .cover {
		display: block;
		width: 100%;
		height: 100%;
		transform: scale(1.025);
		transition: transform 1.2s ease;
		object-fit: cover;

		&.fallback {
			background:
				radial-gradient(circle at 20% 20%, var(--c-accent), transparent 34%),
				linear-gradient(135deg, var(--c-primary), var(--c-bg-3));
		}
	}

	&::after {
		content: "";
		position: absolute;
		inset: 0;
		background:
			linear-gradient(to top, #000D 0%, #0009 35%, #0001 72%),
			linear-gradient(to var(--end), #0007 0%, transparent 52%);
		pointer-events: none;
	}
}

.slide-content {
	display: grid;
	align-content: end;
	gap: 0.45rem;
	position: absolute;
	opacity: 0;
	inset: 0;
	padding: clamp(1.25rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2rem) 2.75rem;
	text-shadow: var(--text-shadow-black);
	color: white;
	transform: translateY(0.5rem);
	transition: opacity 0.35s 0.12s, transform 0.35s 0.12s, background-color 0.25s, border-color 0.25s, backdrop-filter 0.25s;
	z-index: 1;

	> .category {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		width: fit-content;
		padding: 0.18em 0.48em;
		border: 1px solid #FFF4;
		border-radius: 999px;
		background-color: #0004;
		backdrop-filter: blur(0.35rem);
		font-size: 0.76rem;
	}

	> .title {
		display: -webkit-box;
		overflow: hidden;
		max-width: 16em;
		font-size: clamp(1.35rem, 3vw, 1.9rem);
		-webkit-line-clamp: 2;
		line-height: 1.18;
		text-wrap: balance;
		-webkit-box-orient: vertical;
	}

	> .desc {
		display: -webkit-box;
		overflow: hidden;
		opacity: 0;
		max-width: 36rem;
		max-height: 0;
		font-size: 0.88rem;
		-webkit-line-clamp: 2;
		line-height: 1.45;
		transform: translateY(0.25rem);
		transition: opacity 0.25s, max-height 0.25s, transform 0.25s;
		-webkit-box-orient: vertical;
	}

	> .date {
		overflow: hidden;
		opacity: 0;
		max-height: 0;
		font-size: 0.8rem;
		transform: translateY(0.25rem);
		transition: opacity 0.25s, max-height 0.25s, transform 0.25s;
	}
}

@media (prefers-reduced-motion: reduce) {
	.slide-item,
	.slide-item > .cover,
	.slide-content {
		transition: none;
	}
}

.slide-rank {
	display: grid;
	align-content: center;
	gap: 0.2rem;
	min-width: 0;
	padding-block: 0.25rem;
}

.rank-item {
	display: grid;
	grid-template-columns: 2.4rem minmax(0, 1fr);
	align-items: center;
	gap: 0.35rem;
	min-height: 3.75rem;
	padding: 0.85rem 0.9rem;
	border-radius: 0.5rem;
	color: var(--c-text-1);
	transition: background-color 0.2s, color 0.2s, transform 0.2s;

	&:hover,
	&:focus,
	&.active {
		background-color: var(--c-bg-soft);
		color: var(--c-text);
	}

	&.active {
		transform: translateX(0.2rem);
	}
}

.rank-icon {
	display: block;
	width: 2rem;
	height: 2rem;
	object-fit: contain;
}

.rank-copy {
	display: grid;
	min-width: 0;
}

.rank-title {
	display: -webkit-box;
	overflow: hidden;
	font-size: 0.94rem;
	font-weight: 700;
	-webkit-line-clamp: 2;
	line-height: 1.35;
	-webkit-box-orient: vertical;
}

@media (max-width: 1390px) {
	.z-slide-stage {
		grid-template-columns: 1fr;
		gap: 0.35rem;
	}

	.slide-rank {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
		align-content: stretch;
	}
}

@media (max-width: $breakpoint-mobile) {
	.z-slide-stage {
		grid-template-columns: 1fr;
	}

	.z-slide-body {
		min-height: auto;
		aspect-ratio: 1.45;
	}

	.slide-rank {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
	}
}

@media (max-width: $breakpoint-phone) {
	.z-slide {
		margin-inline: 0.75rem;
	}

	.z-slide-header {
		height: 2.5rem;

		> .title {
			font-size: 2.4rem;
		}
	}

	.slide-content {
		padding: 1rem 1rem 2.5rem;

		> .title {
			font-size: 1.35rem;
		}
	}
}
</style>
