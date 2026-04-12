const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error("Shiprocket credentials not configured");

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shiprocket auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days (token valid for 10)
  return cachedToken!;
}

async function srFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Shiprocket] ${options.method ?? "GET"} ${path} → ${res.status}`, text);
    throw new Error(`Shiprocket API error: ${res.status}`);
  }

  return res.json();
}

// ─── Types ──────────────────────────────────────────

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string; // YYYY-MM-DD HH:mm
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketOrderItem[];
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
}

export interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
}

interface CourierOption {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  estimated_delivery_days: number;
}

export interface ServiceabilityResult {
  available: boolean;
  cod: boolean;
  estimatedDays: number | null;
  couriers: CourierOption[];
}

interface TrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
}

export interface TrackingResult {
  awbCode: string;
  courierName: string;
  currentStatus: string;
  activities: TrackingActivity[];
  deliveredDate: string | null;
  pickupDate: string | null;
  etd: string | null;
}

// ─── Create Order ───────────────────────────────────

export async function createShiprocketOrder(
  payload: ShiprocketOrderPayload
): Promise<ShiprocketOrderResponse> {
  return srFetch("/orders/create/adhoc", {
    method: "POST",
    body: payload,
  });
}

// ─── Generate AWB (assign courier) ────────────────

export async function generateAWB(
  shipmentId: number,
  courierCompanyId?: number
): Promise<{ awb_code: string; courier_company_id: number; courier_name: string }> {
  const body: Record<string, unknown> = { shipment_id: shipmentId };
  if (courierCompanyId) body.courier_id = courierCompanyId;

  const res = await srFetch<{
    response: { data: { awb_code: string; courier_company_id: number; courier_name: string } };
  }>("/courier/assign/awb", { method: "POST", body });

  return res.response.data;
}

// ─── Request Pickup ─────────────────────────────────

export async function requestPickup(shipmentId: number): Promise<void> {
  await srFetch("/courier/generate/pickup", {
    method: "POST",
    body: { shipment_id: [shipmentId] },
  });
}

// ─── Generate Manifest ──────────────────────────────

export async function generateManifest(shipmentIds: number[]): Promise<void> {
  await srFetch("/manifests/generate", {
    method: "POST",
    body: { shipment_id: shipmentIds },
  });
}

// ─── Track Shipment ─────────────────────────────────

export async function trackByAWB(awbCode: string): Promise<TrackingResult> {
  const data = await srFetch<{
    tracking_data: {
      track_status: number;
      shipment_status: number;
      shipment_track: Array<{
        current_status: string;
        delivered_date: string;
        pickup_date: string;
        etd: string;
        courier_name: string;
      }>;
      shipment_track_activities: TrackingActivity[];
    };
  }>(`/courier/track/awb/${awbCode}`);

  const track = data.tracking_data;
  const shipment = track.shipment_track?.[0];

  return {
    awbCode,
    courierName: shipment?.courier_name ?? "",
    currentStatus: shipment?.current_status ?? "",
    activities: track.shipment_track_activities ?? [],
    deliveredDate: shipment?.delivered_date || null,
    pickupDate: shipment?.pickup_date || null,
    etd: shipment?.etd || null,
  };
}

export async function trackByShipmentId(shipmentId: number): Promise<TrackingResult | null> {
  try {
    const data = await srFetch<{
      tracking_data: Record<string, {
        tracking_data: {
          track_status: number;
          shipment_track: Array<{
            awb_code: string;
            current_status: string;
            delivered_date: string;
            pickup_date: string;
            etd: string;
            courier_name: string;
          }>;
          shipment_track_activities: TrackingActivity[];
        };
      }>;
    }>(`/courier/track/shipment/${shipmentId}`);

    const entry = Object.values(data.tracking_data)[0];
    if (!entry) return null;

    const shipment = entry.tracking_data.shipment_track?.[0];
    return {
      awbCode: shipment?.awb_code ?? "",
      courierName: shipment?.courier_name ?? "",
      currentStatus: shipment?.current_status ?? "",
      activities: entry.tracking_data.shipment_track_activities ?? [],
      deliveredDate: shipment?.delivered_date || null,
      pickupDate: shipment?.pickup_date || null,
      etd: shipment?.etd || null,
    };
  } catch {
    return null;
  }
}

// ─── Pincode Serviceability ─────────────────────────

export async function checkServiceability(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number = 0.5,
  cod: boolean = false
): Promise<ServiceabilityResult> {
  try {
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: String(weight),
      cod: cod ? "1" : "0",
    });

    const data = await srFetch<{
      data: {
        available_courier_companies: Array<{
          courier_company_id: number;
          courier_name: string;
          rate: number;
          etd: string;
          estimated_delivery_days: number;
        }>;
      };
    }>(`/courier/serviceability/?${params}`);

    const couriers = data.data?.available_courier_companies ?? [];
    const cheapest = couriers.sort((a, b) => a.rate - b.rate)[0];

    return {
      available: couriers.length > 0,
      cod: couriers.some((c) => c.courier_company_id > 0),
      estimatedDays: cheapest?.estimated_delivery_days ?? null,
      couriers,
    };
  } catch {
    return { available: false, cod: false, estimatedDays: null, couriers: [] };
  }
}

// ─── Cancel Order ───────────────────────────────────

export async function cancelShiprocketOrder(shiprocketOrderIds: number[]): Promise<void> {
  await srFetch("/orders/cancel", {
    method: "POST",
    body: { ids: shiprocketOrderIds },
  });
}

// ─── Pickup Locations ───────────────────────────────

export async function getPickupLocations(): Promise<
  Array<{ pickup_location: string; address: string; pin_code: string }>
> {
  const data = await srFetch<{
    data: {
      shipping_address: Array<{
        pickup_location: string;
        address: string;
        pin_code: string;
      }>;
    };
  }>("/settings/company/pickup");

  return data.data?.shipping_address ?? [];
}
