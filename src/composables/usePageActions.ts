// src/composables/usePageActions.ts
import { useRouter } from 'vue-router'

export interface PageActionsOptions {
  userType: 'admin' | 'user'
  onSearch?: (query: string) => Promise<void> | void
}

export const usePageActions = (options: PageActionsOptions) => {
  const router = useRouter()

  const handleSearch = async (query: string) => {
    if (options.onSearch) {
      await options.onSearch(query)
    }
  }

  const handleClearSearch = async () => {
    if (options.onSearch) {
      await options.onSearch('')
    }
  }

  const handleSettingsClick = () => {
    router.push(`/${options.userType}/settings`)
  }

  return {
    handleSearch,
    handleClearSearch,
    handleSettingsClick,
  }
}
