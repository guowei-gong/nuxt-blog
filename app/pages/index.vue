<script setup lang="ts">
import { orderBy } from 'es-toolkit/array'

const appConfig = useAppConfig()
useSeoMeta({
	description: appConfig.description,
	ogImage: appConfig.author.avatar,
})

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'comm-group'])

const { data: listRaw } = await useAsyncData('posts:index', () => getArticleIndexOptions(), { default: () => [] })
const { listSorted, isAscending, sortOrder } = useArticleSort(listRaw, { bindDirectionQuery: 'asc', bindOrderQuery: 'sort' })
const { category, categories, listCategorized } = useCategory(listSorted, { bindQuery: 'category' })
const { page, totalPages, listPaged } = usePagination(listCategorized, { bindQuery: 'page' })

const isPaging = ref(false)
let pagingTimer: ReturnType<typeof setTimeout> | undefined

watch(page, (newPage, oldPage) => {
	if (newPage === oldPage)
		return

	isPaging.value = true
	clearTimeout(pagingTimer)
	pagingTimer = setTimeout(() => {
		isPaging.value = false
	}, 180)
}, { flush: 'sync' })

watch(category, () => {
	page.value = 1
})

onBeforeUnmount(() => {
	clearTimeout(pagingTimer)
})

useSeoMeta({ title: () => (page.value > 1 ? `第${page.value}页` : '') })

const listRecommended = computed(() => orderBy(
	listRaw.value.filter(item => item.recommend !== null),
	['recommend', 'date'],
	['desc'],
))

const { data: previewCount } = useAsyncData(
	'previews:count',
	() => queryCollection('content').where('stem', 'LIKE', 'previews/%').count(),
)
</script>

<template>
<BlogHeader class="mobile-only" to="/" tag="h1" />

<UtilHydrateSafe>
	<PostSlide v-if="listRecommended.length && page === 1 && !category" :list="listRecommended" />

	<div class="post-list">
		<PostOrderToggle
			v-model:is-ascending="isAscending"
			v-model:sort-order="sortOrder"
			v-model:category="category"
			:categories
		>
			<ZSecret>
				<UtilLink v-if="previewCount" to="/preview" class="preview-entrance">
					<Icon name="tabler:shield-lock" />
					查看预览文章
				</UtilLink>
			</ZSecret>
		</PostOrderToggle>

		<Transition name="post-page" mode="out-in">
			<menu :key="page" class="proper-height post-page-list" :class="{ 'is-paging': isPaging }">
				<PostArticle
					v-for="article, index in listPaged"
					:key="article.path"
					v-bind="article"
					:to="article.path"
					:use-updated="sortOrder === 'updated'"
					:style="getFixedDelay(isPaging ? 0 : index * 0.05)"
				/>
			</menu>
		</Transition>

		<ZPagination v-model="page" sticky avoid :total-pages="totalPages" />
	</div>
</UtilHydrateSafe>
</template>

<style lang="scss" scoped>
.post-list {
	margin: 1rem;
}

.post-page-enter-active,
.post-page-leave-active {
	transition: opacity 0.12s ease, transform 0.12s ease;
}

.post-page-enter-from,
.post-page-leave-to {
	opacity: 0;
	transform: translateY(0.25rem);
}

.post-page-list.is-paging {
	:deep(.article-card) {
		animation: none;
	}
}
</style>
