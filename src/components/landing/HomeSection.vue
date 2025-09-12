<script setup lang="ts">
const emit = defineEmits<{
  scrollToSection: [section: string]
}>()

const handleExploreClick = () => {
  emit('scrollToSection', 'about')
}
</script>

<template>
  <section id="home" class="home-section">
    <!-- Background Image Section -->
    <div class="hero-background">
      <v-img src="/landing-page/home-1.jpg" cover class="fill-height hero-image">
        <!-- Green Overlay -->
        <div class="green-overlay"></div>

        <!-- Content Overlay -->
        <div class="hero-overlay d-flex align-center justify-center fill-height">
          <v-container fluid>
            <v-row align="center" justify="center" class="fill-height">
              <v-col cols="12" md="10" lg="8" class="text-center">
                <h1 class="hero-title text-white mb-4">Welcome to AgriVista</h1>
                <h2 class="hero-subtitle text-white mb-6">
                  Experience Agriculture, Explore Butuan!
                </h2>
                <p class="hero-description text-white mb-8 mx-auto">
                  Discover the beauty and knowledge of Robrosa's Strawberry and Herbs Farm, the
                  first of its kind in Butuan City. Book guided farm tours, join educational
                  workshops, and shop local produce—all in one platform.
                </p>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </v-img>
    </div>

    <!-- Button Section (Outside Image) -->
    <div class="button-section">
      <v-container fluid>
        <v-row justify="center">
          <v-col cols="12" class="text-center">
            <v-btn
              size="x-large"
              color="primary"
              variant="elevated"
              rounded="lg"
              class="px-8 py-4 hero-button"
              @click="handleExploreClick"
            >
              EXPLORE FARM
              <v-icon end>mdi-magnify</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </section>
</template>

<style scoped>
.home-section {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #ffffff;
}

.hero-background {
  height: 85vh;
  position: relative;
  padding-top: 80px; /* Account for fixed header */
}

.hero-image {
  clip-path: polygon(
    0 60px,
    15% 45px,
    30% 70px,
    45% 35px,
    60% 65px,
    75% 40px,
    90% 55px,
    100% 30px,
    100% calc(100% - 60px),
    85% calc(100% - 30px),
    70% calc(100% - 50px),
    55% calc(100% - 20px),
    40% calc(100% - 45px),
    25% calc(100% - 25px),
    10% calc(100% - 40px),
    0 calc(100% - 15px)
  );
}

.green-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(76, 175, 80, 0.4); /* Green overlay with opacity */
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

.button-section {
  background-color: #ffffff;
  padding: 40px 0;
  position: relative;
  z-index: 4;
  margin-top: -20px; /* Overlap slightly with the wave cut */
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 2.5rem;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
}

.hero-description {
  font-size: 1.25rem;
  font-weight: 400;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  max-width: 800px;
  line-height: 1.6;
}

.hero-button {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 8px 16px rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
}

.hero-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(76, 175, 80, 0.4);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .hero-title {
    font-size: 2.8rem;
  }

  .hero-subtitle {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }

  .hero-image {
    clip-path: polygon(
      0 40px,
      15% 30px,
      30% 50px,
      45% 25px,
      60% 45px,
      75% 30px,
      90% 40px,
      100% 20px,
      100% calc(100% - 40px),
      85% calc(100% - 20px),
      70% calc(100% - 35px),
      55% calc(100% - 15px),
      40% calc(100% - 30px),
      25% calc(100% - 18px),
      10% calc(100% - 25px),
      0 calc(100% - 10px)
    );
  }

  .button-section {
    padding: 30px 0;
    margin-top: -15px;
  }
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1.6rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-button {
    font-size: 1rem;
  }

  .hero-image {
    clip-path: polygon(
      0 30px,
      15% 20px,
      30% 35px,
      45% 15px,
      60% 30px,
      75% 20px,
      90% 25px,
      100% 15px,
      100% calc(100% - 30px),
      85% calc(100% - 15px),
      70% calc(100% - 25px),
      55% calc(100% - 10px),
      40% calc(100% - 20px),
      25% calc(100% - 12px),
      10% calc(100% - 18px),
      0 calc(100% - 8px)
    );
  }

  .button-section {
    padding: 20px 0;
    margin-top: -10px;
  }
}
</style>
