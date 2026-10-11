import { StatusPage } from "@/components/eggs/StatusPage";
import { JsonView } from "@/components/ui/JsonView";
import { services } from "@/lib/content";

export const metadata = { title: "/actuator/health" };

export default function Health() {
  const body = {
    status: "UP",
    components: Object.fromEntries([
      ...services.map((s) => [s.name, { status: s.status }]),
      ["coffee", { status: "DEGRADED", details: { cups: 1, required: 3 } }],
    ]),
  };
  return (
    <StatusPage status={200} reason="OK" path="/actuator/health" bugId="health">
      <div className="text-left text-xs">
        <JsonView value={body} />
      </div>
    </StatusPage>
  );
}
