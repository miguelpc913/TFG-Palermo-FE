import { LoginForm } from "@/components/LoginForm/LoginForm";
import { createFileRoute } from "@tanstack/react-router";

function Index() {
  return <LoginForm />;
}

export const Route = createFileRoute("/")({
  component: Index,
});
