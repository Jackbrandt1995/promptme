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
          "Get a key at https://console.cloud.google.com/ (enable Distance Matrix API).",
      },
      { status: 503 }
    );
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/distancematrix/json"
  );
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

  const data = await googleRes.json();

  if (data.status !== "OK") {
    const statusMessages: Record<string, string> = {
      REQUEST_DENIED:
        "Google Maps request was denied. Make sure the Distance Matrix API is enabled for your key at console.cloud.google.com → APIs & Services → Enable APIs.",
      OVER_DAILY_LIMIT:
        "Google Maps daily quota exceeded. Check your billing and quota settings at console.cloud.google.com.",
      OVER_QUERY_LIMIT: "Google Maps query limit exceeded. Please try again later.",
      INVALID_REQUEST: "Invalid request sent to Google Maps. Check the addresses and try again.",
    };
    const message = statusMessages[data.status] ?? `Google Maps error: ${data.status}`;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    return NextResponse.json(
      {
        error:
          "Could not calculate distance between those addresses. Please check the addresses and try again.",
      },
      { status: 400 }
    );
  }

  const distanceMeters: number = element.distance.value;
  const distanceMiles = Math.round((distanceMeters / METERS_PER_MILE) * 10) / 10;
  const amount = Math.round(distanceMiles * RATE_PER_MILE * 100) / 100;

  return NextResponse.json({
    distanceMiles,
    amount,
    ratePerMile: RATE_PER_MILE,
    origin: origin.trim(),
    destination: destination.trim(),
    durationText: element.duration?.text ?? "",
  });
}
