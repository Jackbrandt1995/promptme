import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const RATE_PER_MILE = 0.75;
const METERS_PER_MILE = 1609.344;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { origin, destination } = await req.json();

  if (!origin?.trim() || !destination?.trim()) {
    return NextResponse.json(
      { error: "Both origin and destination are required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Google Maps API key not configured. Add GOOGLE_MAPS_API_KEY to your .env file. " +
          "Get a key at https://console.cloud.google.com/ (enable Routes API).",
      },
      { status: 503 }
    );
  }

  // Uses the Routes API (computeRouteMatrix) — the modern replacement for
  // the deprecated Distance Matrix API. Enable "Routes API" in Google Cloud
  // Console → APIs & Services → Library.
  let googleRes: Response;
  try {
    googleRes = await fetch(
      "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          // Only request the fields we need
          "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,status",
        },
        body: JSON.stringify({
          origins: [{ waypoint: { address: origin.trim() } }],
          destinations: [{ waypoint: { address: destination.trim() } }],
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
        }),
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Google Maps. Check your network connection." },
      { status: 502 }
    );
  }

  if (!googleRes.ok) {
    let body: any = {};
    try { body = await googleRes.json(); } catch { /* ignore */ }

    const detail: string = body?.error?.message ?? body?.error?.status ?? String(googleRes.status);

    // 403 = API not enabled or key restricted
    if (googleRes.status === 403) {
      return NextResponse.json(
        {
          error:
            "Google Maps request denied (403). In Google Cloud Console, go to " +
            "APIs & Services → Library, search for 'Routes API', and click Enable. " +
            "Also make sure billing is active on your project.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Google Maps error: ${detail}` },
      { status: 400 }
    );
  }

  const data = await googleRes.json();

  // computeRouteMatrix returns an array; grab the first element
  const element = Array.isArray(data) ? data[0] : null;
  if (!element || element.status !== "OK") {
    const elementStatus: string = element?.status ?? "NO_ROUTE";
    if (elementStatus === "NOT_FOUND") {
      return NextResponse.json(
        { error: "One or both addresses could not be found. Please use full street addresses including city and state." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not calculate distance between those addresses. Please check the addresses and try again." },
      { status: 400 }
    );
  }

  const distanceMeters: number = element.distanceMeters;
  const distanceMiles = Math.round((distanceMeters / METERS_PER_MILE) * 10) / 10;
  const amount = Math.round(distanceMiles * RATE_PER_MILE * 100) / 100;

  // duration comes back as e.g. "1234s" — convert to "X min" / "X hr Y min"
  const durationText = formatDuration(element.duration ?? "");

  return NextResponse.json({
    distanceMiles,
    amount,
    ratePerMile: RATE_PER_MILE,
    origin: origin.trim(),
    destination: destination.trim(),
    durationText,
  });
}

function formatDuration(raw: string): string {
  const seconds = parseInt(raw.replace("s", ""), 10);
  if (isNaN(seconds) || seconds <= 0) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
}
