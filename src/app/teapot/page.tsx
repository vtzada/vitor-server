import { StatusPage } from "@/components/eggs/StatusPage";

export const metadata = { title: "418 I'm a teapot" };

export default function Teapot() {
  return (
    <StatusPage
      status={418}
      reason="I'm a teapot"
      path="/teapot"
      bugId="teapot"
    >
      <pre className="mx-auto mb-6 w-fit text-left text-violet">
        {[
          "         (  )   (   )  )",
          "          ) (   )  (  (",
          "       _____________",
          "   ___/             \\___",
          "  (  /    ~  ~  ~    \\  )",
          "   \\|_________________|/",
          "      \\_____________/",
        ].join("\n")}
      </pre>
      Este servidor se recusa a passar café, porque é um bule. (RFC 2324, seção
      2.3.2)
    </StatusPage>
  );
}
