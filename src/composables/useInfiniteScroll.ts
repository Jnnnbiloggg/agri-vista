// src/composables/useInfiniteScroll.ts

import { ref, onMounted, onUnmounted } from 'vue'

interface InfiniteScrollOptions {
  threshold?: number // Distance from bottom to trigger load (in pixels)
  onLoadMore: () => Promise<void> | void
  hasMore: () => boolean
}

export const useInfiniteScroll = (options: InfiniteScrollOptions) => {
  const { threshold = 300, onLoadMore, hasMore } = options

  const isLoading = ref(false)
  const scrollContainer = ref<HTMLElement | null>(null)

  const handleScroll = async () => {
    if (!scrollContainer.value || isLoading.value || !hasMore()) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

    if (distanceFromBottom < threshold) {
      isLoading.value = true
      try {
        await onLoadMore()
      } finally {
        isLoading.value = false
      }
    }
  }

  const setupScrollListener = (element?: HTMLElement) => {
    // Use window scroll if no specific element is provided
    const target = element || window

    scrollContainer.value = element || (document.documentElement as HTMLElement)

    target.addEventListener('scroll', handleScroll, { passive: true })
  }

  const cleanupScrollListener = (element?: HTMLElement) => {
    const target = element || window
    target.removeEventListener('scroll', handleScroll)
  }

  onMounted(() => {
    // Auto-setup on window by default
    setupScrollListener()
  })

  onUnmounted(() => {
    cleanupScrollListener()
  })

  return {
    isLoading,
    setupScrollListener,
    cleanupScrollListener,
  }
}
