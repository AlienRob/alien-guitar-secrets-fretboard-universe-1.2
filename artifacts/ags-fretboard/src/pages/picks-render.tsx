import { useSearch } from "wouter";
import { GEAR } from "@/data/gear";
import type { PickItem } from "@/data/gear";
import Pick3DViewer from "@/components/pick-3d-viewer";

const PICKS = GEAR.filter((g): g is PickItem => g.category === "pick");

export default function PicksRender() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const id = params.get("id");

  const pick = id ? PICKS.find((p) => p.id === id) : null;

  if (pick) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pick3DViewer item={pick} className="w-[600px] h-[600px]" />
      </div>
    );
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: 32 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {PICKS.map((p) => (
          <a
            key={p.id}
            href={`?id=${p.id}`}
            style={{ color: "#fff", textAlign: "center", textDecoration: "none" }}
          >
            <div style={{ width: 200, height: 200 }}>
              <Pick3DViewer item={p} className="w-full h-full" />
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{p.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
