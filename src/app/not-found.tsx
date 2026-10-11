import { StatusPage } from "@/components/eggs/StatusPage";

export default function NotFound() {
  return (
    <StatusPage status={404} reason="Not Found" path="/404" bugId="lost-packet">
      Um pacote se perdeu procurando essa rota. Ele ainda está vagando por aí,
      sem TTL e sem esperança.
    </StatusPage>
  );
}
