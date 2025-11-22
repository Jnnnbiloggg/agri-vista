<script setup lang="ts">
import { useRouter } from 'vue-router'

interface OfferCard {
  title: string
  subtitle: string
  description: string
  icon: string
  image: string
  buttonText: string
  action: () => void
}

const router = useRouter()

function goToAnnouncements() {
  router.push({ name: 'user-announcements' })
}

function goToActivities() {
  router.push({ name: 'user-activities' })
}

function goToSchedule() {
  router.push({ name: 'user-schedule' })
}

function goToPrograms() {
  router.push({ name: 'user-programs' })
}

const offerCards: OfferCard[] = [
  {
    title: 'Announcement',
    subtitle: 'Stay Updated with Farm News & Events',
    description:
      "Be the first to know about strawberry harvest dates, seasonal promos, farm tours, training schedules, and special community events happening at Robrosa's. Check this space regularly for fresh updates straight from the field.",
    icon: 'mdi-bullhorn',
    image: '/landing-page/offer-1.jpg',
    buttonText: 'VIEW ANNOUNCEMENTS',
    action: goToAnnouncements,
  },
  {
    title: 'Farm Activities',
    subtitle: 'Strawberry Picking, Herb Trails & More',
    description:
      "Enjoy hands-on experiences like strawberry picking, organic gardening, planting demos, and guided farm walks. Whether you're a tourist or a student, there's something for everyone.",
    icon: 'mdi-leaf',
    image: '/landing-page/offer-2.jpg',
    buttonText: 'JOIN AN ACTIVITY',
    action: goToActivities,
  },
  {
    title: 'Set an Appointment',
    subtitle: 'Plan Your Visit or Training Session',
    description:
      "Schedule your tour, group visit, or workshop at Robrosa's. Select your date, specify your group size, and get ready for an unforgettable agri-learning experience.",
    icon: 'mdi-calendar-check',
    image: '/landing-page/offer-3.png',
    buttonText: 'SCHEDULE NOW',
    action: goToSchedule,
  },
  {
    title: 'Community Extension',
    subtitle: 'Learn and Grow with the Community',
    description:
      "Robrosa's is more than just a farm—it's a hub for agricultural learning. As a certified Learning Site for Agriculture, we offer training, demo sessions, and outreach programs for students, farmers, and barangay leaders.",
    icon: 'mdi-account-group',
    image: '/landing-page/offer-4.png',
    buttonText: 'SEE PROGRAMS',
    action: goToPrograms,
  },
]
</script>

<template>
  <section id="what-we-offer" class="what-we-offer-section">
    <!-- Header Section with Background Image and Green Overlay -->
    <div class="hero-background">
      <v-img src="/landing-page/offer-5.jpg" cover class="fill-height hero-image">
        <!-- Green Overlay -->
        <div class="green-overlay"></div>

        <!-- Content Overlay -->
        <div class="hero-overlay d-flex align-center justify-center fill-height">
          <v-container fluid>
            <v-row align="center" justify="center" class="fill-height">
              <v-col cols="12" md="10" lg="8" class="text-center">
                <h1 class="display-1 font-weight-bold text-white mb-6">
                  DISCOVER, EXPLORE, AND EXPERIENCE THE FARM
                </h1>
                <p class="text-h6 text-white mx-auto" style="max-width: 800px">
                  Experience the full charm of Robrosa's Strawberry and Herbs Farm, the first of its
                  kind in Butuan City. From farm appointments to fresh products, we bring you closer
                  to nature, learning, and local goodness—all in one place.
                </p>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </v-img>
    </div>

    <v-container fluid class="cards-container">
      <!-- Cards Section -->
      <v-row>
        <v-col v-for="card in offerCards" :key="card.title" cols="12" sm="6" md="3">
          <v-card class="fill-height d-flex flex-column" elevation="4">
            <v-card-item class="pa-5">
              <div class="d-flex align-center">
                <v-icon :icon="card.icon" size="48" color="primary" class="mr-3"></v-icon>
                <div class="flex-grow-1 d-flex flex-column">
                  <v-card-title class="text-h6 font-weight-bold pa-0">{{
                    card.title
                  }}</v-card-title>
                  <v-card-subtitle class="text-body-2 pa-0">{{ card.subtitle }}</v-card-subtitle>
                </div>
              </div>
            </v-card-item>

            <v-img :src="card.image" height="300" cover></v-img>

            <v-card-text class="flex-grow-1">
              <p class="text-body-2">{{ card.description }}</p>
            </v-card-text>

            <v-card-actions class="pa-5 mt-auto">
              <v-btn color="primary" variant="elevated" block rounded="lg" @click="card.action">
                {{ card.buttonText }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<style scoped>
.what-we-offer-section {
  min-height: 100svh;
  position: relative;
  overflow: hidden;
  background-color: #fafafa;
}

.hero-background {
  height: 60vh;
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}

.hero-image {
  width: 100%;
  height: 100%;
}

.green-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(76, 175, 80, 0.9),
    rgba(76, 175, 80, 0.6),
    rgba(76, 175, 80, 0.3)
  );
  z-index: 1;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.cards-container {
  padding-top: 80px;
  padding-bottom: 80px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .display-1 {
    font-size: 2.5rem !important;
  }

  .text-h4 {
    font-size: 1.8rem !important;
  }
}

@media (max-width: 600px) {
  .display-1 {
    font-size: 2rem !important;
  }

  .text-h4 {
    font-size: 1.5rem !important;
  }

  .text-h6 {
    font-size: 1.1rem !important;
  }
}
</style>
