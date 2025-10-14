<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import HomeSection from '../components/HomeSection.vue'
import AboutSection from '../components/AboutSection.vue'
import WhatWeOfferSection from '../components/WhatWeOfferSection.vue'

const currentSection = ref('home')
let observer: IntersectionObserver | null = null

const scrollToSection = (section: string) => {
  const element = document.getElementById(section)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    currentSection.value = section
  }
}

const setupScrollObserver = () => {
  const options = {
    root: null,
    rootMargin: '-80px 0px -50% 0px', // Account for header height and only trigger when section is well in view
    threshold: 0.1,
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id
        if (sectionId && sectionId !== currentSection.value) {
          currentSection.value = sectionId
        }
      }
    })
  }, options)

  // Observe all sections
  const sections = ['home', 'about', 'what-we-offer']
  sections.forEach((sectionId) => {
    const element = document.getElementById(sectionId)
    if (element && observer) {
      observer.observe(element)
    }
  })
}

onMounted(() => {
  // Setup observer after DOM is ready
  setTimeout(setupScrollObserver, 100)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const navigationItems = [
  { title: 'Home', id: 'home' },
  { title: 'About Us', id: 'about' },
  { title: 'What We Offer', id: 'what-we-offer' },
  { title: 'Login', id: 'login', route: '/select-user' },
]
</script>

<template>
  <v-app>
    <!-- Navigation Header -->
    <AppHeader
      :navigation-items="navigationItems"
      :current-section="currentSection"
      :show-section-navigation="true"
      @navigate="scrollToSection"
    />

    <v-main>
      <!-- Home Section -->
      <HomeSection @scroll-to-section="scrollToSection" />

      <!-- About Us Section -->
      <AboutSection />

      <!-- What We Offer Section -->
      <WhatWeOfferSection />

      <!-- Footer -->
      <AppFooter :navigation-items="navigationItems" @navigate="scrollToSection" />
    </v-main>
  </v-app>
</template>

<style scoped>
/* Ensure smooth scrolling behavior */
html {
  scroll-behavior: smooth;
}

/* Ensure v-main has proper spacing for fixed header */
.v-main {
  padding-top: 0 !important;
}
</style>
