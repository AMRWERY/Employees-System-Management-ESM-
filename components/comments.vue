<template>
  <div>
    <div class="space-y-4">
      <div v-for="comment in comments" :key="comment.id">
        <!-- Main comment -->
        <div class="flex items-start space-s-3">
          <img :src="comment.avatar || '/dummy-profile-img.jpg'" class="w-8 h-8 rounded-full border border-gray-400" />
          <div>
            <div class="px-4 py-2 rounded-lg max-w-3xl border border-gray-300">
              <p class="font-bold text-sm">{{ comment.author }}</p>
              <p class="text-sm">
                <template v-if="comment.mentionedEmployee">
                  <span class="font-semibold text-blue-500">@{{ comment.mentionedEmployee.name }}</span>
                </template>
                {{ comment.comment }}
              </p>
            </div>
            <div class="text-xs text-gray-400 flex items-center gap-4 mt-1.5 ms-2">
              <span>{{ getTimeAgo(comment.createdAt) }}</span>
              <p class="cursor-pointer flex items-center gap-1" @click="toggleLike(comment.id || '')">
                <icon :name="comment.likes?.includes(currentUserUid) ? 'solar:like-bold-duotone' : 'solar:like-broken'"
                  class="w-4 h-4" />
                <span class="hover:underline">{{ t('dashboard.like') }}</span>
                <span v-if="comment.likes?.length" class="text-gray-400">({{ comment.likes.length }})</span>
                <span class="hover:underline" @click="replyingToId = comment.id ?? null">{{ t('dashboard.reply')
                }}</span>
              </p>
            </div>
          </div>
        </div>
        <div v-if="replyingToId === comment.id" class="mt-2 ms-12 relative">
          <textarea :placeholder="t('form.write_reply')" rows="3"
            class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow"
            v-model="replyText" />
          <base-button :default-icon="false" :type="'button'" class="absolute bottom-3 end-2"
            @click="submitReply(comment.id)">
            {{ t('btn.reply') }}</base-button>
        </div>

        <!-- Replies -->
        <div v-if="comment.replies" class="ms-12 mt-2 space-y-3">
          <div v-for="reply in comment.replies" :key="reply.id" class="flex items-start space-s-3">
            <img :src="reply.avatar || '/dummy-profile-img.jpg'" class="w-8 h-8 rounded-full border border-gray-400" />
            <div>
              <div class="px-4 py-2 rounded-lg max-w-3xl border border-gray-300">
                <p class="font-bold text-sm">{{ reply.author }}</p>
                <p class="text-sm">{{ reply.comment }}</p>
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
import type { TaskComment } from '@/types/task-comments';

const { t } = useI18n()
const commentsStore = useCommentsStore();
const authStore = useAuthStore();

defineProps<{
  comments: TaskComment[]
}>()

const now = ref(new Date());

onMounted(() => {
  const interval = setInterval(() => {
    now.value = new Date();
  }, 60000); // update every minute

  onUnmounted(() => clearInterval(interval));
});

function getTimeAgo(createdAt: any): string {
  const createdDate = createdAt?.toDate?.() || new Date(createdAt);
  const diffMs = now.value.getTime() - createdDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

const currentUserUid = computed(() => authStore.user?.uid ?? "");

const toggleLike = (commentId: string) => {
  commentsStore.likeOrDislike(commentId);
};

const replyingToId = ref<string | null>(null);
const replyText = ref('');

const submitReply = async (commentId: string) => {
  if (!replyText.value.trim()) return;
  await commentsStore.addReplyTo(commentId, replyText.value.trim());
  replyText.value = '';
  replyingToId.value = null;
};
</script>