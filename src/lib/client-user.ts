"use client";

/**
 * Ensures a user exists in the database by syncing auth metadata.
 * This is used as a safety net when API routes need to guarantee user existence.
 */
export async function ensureDbUser(dashUser: any, session: any): Promise<boolean> {
  try {
    if (!dashUser?.id) return false;
    
    const res = await fetch("/api/users/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: dashUser.id,
        email: dashUser.email,
        fullName: dashUser.fullName,
        username: dashUser.username,
        schoolId: dashUser.schoolId,
        fieldOfStudyId: dashUser.fieldOfStudyId,
        levelId: dashUser.levelId,
        avatar: dashUser.profilePhoto,
      }),
    });
    
    return res.ok;
  } catch {
    return false;
  }
}