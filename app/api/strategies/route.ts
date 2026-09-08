import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CustomStrategy } from "@/lib/mapData";

const STRATEGIES_FILE = path.join(process.cwd(), "data", "strategies.json");

function getStrategies(): CustomStrategy[] {
  try {
    if (!fs.existsSync(STRATEGIES_FILE)) {
      // Seed default strategies
      const defaults: CustomStrategy[] = [
        {
          id: "strat-1",
          title: "Ascent A-Split & Tree Pinch",
          mapId: "ascent",
          side: "ATTACK",
          buyType: "FULL_BUY",
          author: "Head Coach",
          createdAt: "2026-09-08",
          phase1: "Omen smokes Bottom Mid. Sova fires A-Main high recon dart.",
          phase2: "KAY/O flashes Mid Tree from Courtyard; Jett dashes into A-Tree to close door.",
          phase3: "Execute onto A site from both A-Main and A-Tree simultaneously. Cypher watches B-flank.",
          comp: [
            { agent: "Jett", role: "Duelist", note: "Entry onto Site" },
            { agent: "Sova", role: "Initiator", note: "High A-Main Recon" },
            { agent: "Omen", role: "Controller", note: "Mid & Heaven Smokes" },
            { agent: "KAY/O", role: "Initiator", note: "Tree Flash" },
            { agent: "Cypher", role: "Sentinel", note: "Flank Trip in B-Main" },
          ],
          utilityMarkers: [
            { x: 45, y: 55, type: "SMOKE", label: "Mid Bottom" },
            { x: 70, y: 35, type: "SMOKE", label: "A Heaven" },
            { x: 65, y: 60, type: "FLASH", label: "Tree Pop-Flash" },
            { x: 75, y: 45, type: "SPIKE", label: "Default Plant" },
          ],
        },
        {
          id: "strat-2",
          title: "Bind B-Site Hookah Crunch & TP Fake",
          mapId: "bind",
          side: "ATTACK",
          buyType: "FULL_BUY",
          author: "Tactical Analyst",
          createdAt: "2026-09-07",
          phase1: "Brimstone drops Stim Beacon outside B-Short. Fake noise in A-Showers.",
          phase2: "Raze double-satchels into Hookah window. Skye dog clears under Hookah.",
          phase3: "Brimstone smokes B-Elbow and CT spawn. Plant safe behind B-Site tube.",
          comp: [
            { agent: "Raze", role: "Duelist", note: "Hookah Satchel Clear" },
            { agent: "Brimstone", role: "Controller", note: "CT & Elbow Smokes" },
            { agent: "Skye", role: "Initiator", note: "Flash & Info Dog" },
            { agent: "Cypher", role: "Sentinel", note: "A-Short Flank Anchor" },
            { agent: "Yoru", role: "Duelist", note: "Teleport Anchor" },
          ],
          utilityMarkers: [
            { x: 35, y: 40, type: "SMOKE", label: "B Elbow" },
            { x: 45, y: 25, type: "SMOKE", label: "B CT" },
            { x: 30, y: 55, type: "FLASH", label: "Hookah Pop" },
            { x: 40, y: 45, type: "SPIKE", label: "Safe Tube Plant" },
          ],
        },
      ];
      fs.writeFileSync(STRATEGIES_FILE, JSON.stringify(defaults, null, 2), "utf-8");
      return defaults;
    }
    const raw = fs.readFileSync(STRATEGIES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export async function GET() {
  const strats = getStrategies();
  return NextResponse.json({ strategies: strats });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const strats = getStrategies();

    const newStrategy: CustomStrategy = {
      id: `strat-${Date.now()}`,
      title: body.title || "Custom Squad Strategy",
      mapId: body.mapId || "ascent",
      side: body.side || "ATTACK",
      buyType: body.buyType || "FULL_BUY",
      author: body.author || "Coach",
      createdAt: new Date().toISOString().split("T")[0],
      phase1: body.phase1 || "",
      phase2: body.phase2 || "",
      phase3: body.phase3 || "",
      comp: body.comp || [],
      utilityMarkers: body.utilityMarkers || [],
    };

    strats.unshift(newStrategy);
    fs.writeFileSync(STRATEGIES_FILE, JSON.stringify(strats, null, 2), "utf-8");

    return NextResponse.json({ success: true, strategy: newStrategy, strategies: strats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed saving strategy" }, { status: 500 });
  }
}
