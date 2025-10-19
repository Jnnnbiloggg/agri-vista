// plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#4CAF50', // Green color for farm theme
          secondary: '#8BC34A',
          accent: '#FFC107',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4CAF50',
          surface: '#FFFFFF',
          background: '#F8F9FA',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'pill',
      elevation: 0,
      style: 'text-transform: none; letter-spacing: 0.025em;',
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'lg',
    },
    VChip: {
      rounded: 'pill',
    },
    VDataTable: {
      class: 'modern-table',
    },
    VDialog: {
      class: 'modern-dialog',
    },
    VMenu: {
      class: 'modern-menu',
    },
  },
})

export default vuetify
