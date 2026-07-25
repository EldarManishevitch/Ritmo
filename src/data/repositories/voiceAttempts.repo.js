import { base44 } from '@/api/base44Client';

export const voiceAttemptsRepo = {
  create: (data) => base44.entities.VoiceAttempt.create(data),
};
