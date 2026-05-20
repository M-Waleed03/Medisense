import { PageHeader } from "@/components/app/page-header";
import { ChatbotClient } from "@/components/chat/chatbot-client";

export default function ChatbotPage() {
  return (
    <>
      <PageHeader title="AI chatbot" subtitle="Ask for health guidance, report interpretation, and next-step recommendations." />
      <ChatbotClient />
    </>
  );
}
