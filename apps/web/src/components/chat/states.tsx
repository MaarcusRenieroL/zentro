"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";

import { Avatar } from "./message-item";

type Channel = {
  id: string;
  name: string;
  admins: Array<{ memberId: string; name: string }>;
};

/** A private channel you know exists but can't open. */
export function NoAccessView({ channel }: { channel: Channel }) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [asked, setAsked] = useState(false);
  const first = channel.admins[0];

  const ask = async () => {
    setAsking(true);

    try {
      await trpc.chat.requestAccess.mutate({ channelId: channel.id });
      setAsked(true);
      toastSuccess(
        "Request sent",
        first ? `${first.name} can add you from the message.` : undefined,
      );
    } catch (error) {
      toastError(error, "Could not send your request");
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-16">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <p className="eyebrow">Private channel · No access</p>
        <h2 className="font-serif-italic text-[2.5rem] leading-[3rem]">
          #{channel.name} is private.
        </h2>
        <p className="text-[15px] leading-[22px] text-ink-2">
          You can see it exists, but only members can read messages or see who’s
          in it.
        </p>

        {channel.admins.length ? (
          <div className="tile flex flex-col gap-2 p-4">
            <p className="text-[13px] text-ink-3">Who can add you</p>
            {channel.admins.map((admin) => (
              <div key={admin.memberId} className="flex items-center gap-2.5">
                <Avatar name={admin.name} size={26} />
                <span className="text-sm font-medium">{admin.name}</span>
                <span className="text-[13px] text-ink-3">Channel admin</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={asked || !first}
            loading={asking}
            onClick={() => void ask()}
          >
            {asked
              ? "Request sent"
              : first
                ? `Ask ${first.name.split(" ")[0]} to add you`
                : "No one can add you"}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon />
            Go back
          </Button>
          <Button asChild variant="ghost">
            <Link href="/chat">Back to Chat</Link>
          </Button>
        </div>
        <p className="text-[13px] text-ink-3">
          {first
            ? `${first.name.split(" ")[0]} gets a message with your name and a link back to this channel.`
            : ""}
        </p>
      </div>
    </div>
  );
}
