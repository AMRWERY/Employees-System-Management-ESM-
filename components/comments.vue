<template>
  <div>
    <div class="space-y-4">
      <div v-for="comment in comments" :key="comment.id">
        <!-- Main comment -->
        <div class="flex items-start space-s-3">
          <img :src="comment.avatar" class="w-8 h-8 rounded-full border border-gray-400" />
          <div>
            <div class="px-4 py-2 rounded-lg max-w-3xl border border-gray-300">
              <p class="font-bold text-sm">{{ comment.author }}</p>
              <p class="text-sm">{{ comment.text }}</p>
            </div>
            <div class="text-xs text-gray-400 flex items-center gap-4 mt-1.5 ms-2">
              <span>{{ comment.time }}</span>
              <p class="cursor-pointer hover:underline flex items-center gap-1">
                <icon name="solar:like-broken" class="w-4 h-4" />
                <icon name="solar:like-bold-duotone" class="w-4 h-4" />
                <span>{{ t('dashboard.like') }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Replies -->
        <div v-if="comment.replies" class="ms-12 mt-2 space-y-3">
          <div v-for="reply in comment.replies" :key="reply.id" class="flex items-start space-s-3">
            <img :src="comment.avatar" class="w-8 h-8 rounded-full border border-gray-400" />
            <div>
              <div class="px-4 py-2 rounded-lg max-w-3xl border border-gray-300">
                <p class="font-bold text-sm">{{ reply.author }}</p>
                <p class="text-sm">{{ reply.text }}</p>
              </div>
              <div class="text-xs text-gray-400 flex items-center gap-4 mt-1.5 ms-2">
                <span>{{ reply.time }}</span>
                <p class="cursor-pointer hover:underline flex items-center gap-1">
                  <icon name="solar:like-broken" class="w-4 h-4" />
                  <icon name="solar:like-bold-duotone" class="w-4 h-4" />
                  <span>{{ t('dashboard.like') }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

const comments = [
  {
    id: 1,
    author: "user 1",
    text: "Aspernatur beatae cu.",
    time: "1d",
    avatar: "https://justfields.com/storage/projects/7M5rV059/images.jpg",
    replies: [
      {
        id: 11,
        author: "user 2",
        text: "Et dolore exercitati.",
        time: "1d",
        avatar: "https://justfields.com/storage/projects/7M5rV059/images.jpg",
      },
    ],
  },
];
</script>