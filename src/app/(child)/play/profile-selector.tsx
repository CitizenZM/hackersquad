"use client";

import { motion } from "framer-motion";
import { ProfileBubble } from "@/components/child/profile-bubble";
import { BookOpen } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export function ProfileSelector({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-8 safe-top safe-bottom bg-gradient-to-b from-sky-100 via-blue-50 to-violet-100">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 flex items-center gap-3"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-child-primary shadow-lg">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="child-heading text-child-primary mb-1"
      >
        StoryNest
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="child-body text-foreground/50 mb-12"
      >
        Who&apos;s listening today?
      </motion.p>

      {profiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="child-body text-foreground/40">
            No profiles yet!
          </p>
          <p className="child-caption text-foreground/30 mt-1">
            Ask a parent to create one.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8">
          {profiles.map((child, i) => (
            <ProfileBubble
              key={child.id}
              id={child.id}
              name={child.name}
              avatarUrl={child.avatarUrl}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
