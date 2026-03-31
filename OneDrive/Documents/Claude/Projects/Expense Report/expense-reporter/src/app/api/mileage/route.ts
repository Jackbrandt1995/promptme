import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const RATE_PER_MILE = 0.725;

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
          "Get a key at https://console.cloud.google.com/ and enable the Distance Matrix API.",
      },
      { status: 503 }
    );
  }

  // Uses the Distance Matrix API.
  // Enable "Distance Matrix API" in Google Cloud Console → APIs & Services → Library.
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origin.trim());
  url.searchParams.set("destinations", destination.trim());
  url.searchParams.set("units", "imperial");
  url.searchParams.set("key", apiKey);

  let googleRes: Response;
  try {
    googleRes = await fetch(url.toString());
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Google Maps. Check your network connection." },
      { status: 502 }
    );
  }

  if (!googleRes.ok) {
    return NextResponse.json(
      { error: `Google Maps returned HTTP ${googleRes.status}. Check your API key and billing.` },
      { status: 400 }
    );
  }

  const data = await googleRes.json();

  if (data.status === "REQUEST_DENIED") {
    return NextResponse.json(
      {
        error:
          "Google Maps request denied. In Google Cloud Console, go to " +
          "APIs & Services → Library, search for 'Distance Matrix API', and click Enable. " +
          "Also make sure billing is active on your project.",
      },
      { status: 400 }
    );
  }

  if (data.status === "OVER_DAILY_LIMIT" || data.status === "OVER_QUERY_LIMIT") {
    return NextResponse.json(
      { error: "Google Maps API quota exceeded. Please try again later." },
      { status: 429 }
    );
  }

  if (data.status !== "OK") {
    return NextResponse.json(
      { error: `Google Maps error: ${data.status}` },
      { status: 400 }
    );
  }

  const element = data.rows?.[0]?.elements?.[0];
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

  // distance.value is in meters; distance.text is the human-readable imperial string
  const distanceMeters: number = element.distance.value;
  const distanceMiles = Math.round((distanceMeters / 1609.344) * 10) / 10;
  const amount = Math.round(distanceMiles * RATE_PER_MILE * 100) / 100;
  const durationText: string = element.duration?.text ?? "";

  return NextResponse.json({
    distanceMiles,
    amount,
    ratePerMile: RATE_PER_MILE,
    origin: origin.trim(),
    destination: destination.trim(),
    durationText,
  });
}
