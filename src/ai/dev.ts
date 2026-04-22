import { config } from 'dotenv';
config();

import { summarizePostContent } from '@/ai/flows/post-content-summarizer-flow';
import { studentBioGenerator } from '@/ai/flows/student-bio-generator';
import { adminAnnouncementAssistant } from '@/ai/flows/admin-announcement-assistant';

async function main() {
  console.log('Running AI flow smoke tests...');

  const summary = await summarizePostContent({
    postContent: 'Campus life is buzzing this week! Join us for study groups, socials, and a new entrepreneurship workshop. The library will also be open late to support finals prep.',
  });
  console.log('Post summary:', summary);

  const bio = await studentBioGenerator({
    academicField: 'Computer Science',
    interests: 'AI, basketball, and student government',
  });
  console.log('Student bio:', bio);

  const announcement = await adminAnnouncementAssistant({
    draftMessage: 'The student center will be closed tomorrow for emergency maintenance. Please plan to use alternate study spaces.',
    context: 'This affects meal plans and club meetings.',
  });
  console.log('Announcement suggestion:', announcement);
}

main().catch((error) => {
  console.error('AI dev harness failed:', error);
  process.exit(1);
});