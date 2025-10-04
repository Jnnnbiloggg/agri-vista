<script setup lang="ts">
// Component logic can be added here if needed
</script>

<template>
  <section id="about" class="about-section">
    <!-- <v-container fluid class="fill-height"> -->
    <v-card color="primary" class="pa-8 fill-height" rounded="lg">
      <v-row align="center" class="fill-height">
        <!-- Left Column - Text Content -->
        <v-col cols="12" md="6" class="pr-md-8">
          <h2 class="display-1 font-weight-bold text-white mb-4">ABOUT US</h2>
          <h3 class="text-h4 font-weight-medium mb-6 text-white">
            Robrosa's Strawberry & Herbs Farm
          </h3>
          <div class="text-body-1 text-white mb-8 line-height-1-6">
            <p class="mb-4">
              The first and only strawberry farm in Butuan City, located in Sitio Tagkiling,
              Barangay Anticala. Founded by Mr. Vandeer Abuzo, the farm is officially recognized as
              a Learning Site for Agriculture (LSA), offering a combination of educational,
              recreational, and eco-tourism experiences. Visitors can enjoy strawberry and herb
              picking, hands-on farming, and even training workshops on sustainable agriculture.
            </p>
            <p>
              As part of its commitment to the community, Robrosa's Farm aims to promote
              agri-tourism, support local livelihoods, and inspire the next generation of farmers by
              creating a space where nature meets knowledge.
            </p>
          </div>
          <v-btn size="large" color="white" variant="elevated" rounded="lg" class="px-6">
            Learn More
          </v-btn>
        </v-col>
        <!-- Right Column - Images -->
        <v-col cols="12" md="6" class="pl-md-8">
          <v-row class="image-grid">
            <v-col cols="6" class="pr-2">
              <v-card class="mb-4" height="280">
                <v-img src="/landing-page/about-1.jpg" height="280" cover></v-img>
              </v-card>
            </v-col>
            <v-col cols="6" class="pl-2" style="margin-top: 30px">
              <v-card class="mb-4" height="280">
                <v-img src="/landing-page/about-2.jpg" height="280" cover></v-img>
              </v-card>
            </v-col>
            <v-col cols="6" class="pr-2">
              <v-card height="280">
                <v-img src="/landing-page/about-3.jpg" height="280" cover></v-img>
              </v-card>
            </v-col>
            <v-col cols="6" class="pl-2" style="margin-top: 30px">
              <v-card height="280">
                <v-img src="/landing-page/about-4.jpg" height="280" cover></v-img>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card>
    <!-- </v-container> -->
  </section>
</template>

<style scoped>
.about-section {
  min-height: 100svh;
  /* padding-top: 80px; */
  background-color: #ffffff;
}

.line-height-1-6 {
  line-height: 1.6;
}

.image-grid {
  height: 100%;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .image-grid .v-col {
    margin-top: 0 !important;
  }

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
