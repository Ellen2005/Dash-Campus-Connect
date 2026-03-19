"use client";

import { AuthenticatedFeed } from "@/app/page"; // We can move the feed logic here properly

export default function FeedPage() {
  return <AuthenticatedFeed />;
}
