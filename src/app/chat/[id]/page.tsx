"use client";

import { use } from "react";
import ChatClient from "./ChatClientV2";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ChatClient matchId={id} />;
}
