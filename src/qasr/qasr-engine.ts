// ═══════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════

export interface CountyEntry {
    co: string;
    st: string;
    tag: string;
    det: string;
}
export interface DistanceInfo {
    miles: number;
    fc: string;
    tc: string;
    exitLat: number;
    exitLng: number;
    entLat: number;
    entLng: number;
}
export interface RouteResult {
    idx: number;
    name: string;
    dist: string;
    dur: string;
    ruling: string;
    rnum: number | string;
    rtxt: string;
    counties: CountyEntry[];
    di: DistanceInfo | null;
    overviewPoints: Array<{ lat: number; lng: number }>;
    autoQasr: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════

export const QASR_MI = 12;
const AUTO_QASR_MI = 120;

const STATE_FIPS: Record<string, string> = {
    alabama: "01",
    alaska: "02",
    arizona: "04",
    arkansas: "05",
    california: "06",
    colorado: "08",
    connecticut: "09",
    delaware: "10",
    florida: "12",
    georgia: "13",
    hawaii: "15",
    idaho: "16",
    illinois: "17",
    indiana: "18",
    iowa: "19",
    kansas: "20",
    kentucky: "21",
    louisiana: "22",
    maine: "23",
    maryland: "24",
    massachusetts: "25",
    michigan: "26",
    minnesota: "27",
    mississippi: "28",
    missouri: "29",
    montana: "30",
    nebraska: "31",
    nevada: "32",
    "new hampshire": "33",
    "new jersey": "34",
    "new mexico": "35",
    "new york": "36",
    "north carolina": "37",
    "north dakota": "38",
    ohio: "39",
    oklahoma: "40",
    oregon: "41",
    pennsylvania: "42",
    "rhode island": "44",
    "south carolina": "45",
    "south dakota": "46",
    tennessee: "47",
    texas: "48",
    utah: "49",
    vermont: "50",
    virginia: "51",
    washington: "53",
    "west virginia": "54",
    wisconsin: "55",
    wyoming: "56",
};

const ST_ABBR: Record<string, string> = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
};

const BORDER_OVERRIDES = [
    {
        originMatch: "5315 bundle flower court, naperville",
        destMatch: "evanston, il",
        routeMatch: "i-55",
        exitPt: { lat: 41.704925, lng: -88.0294966 },
        entryPt: { lat: 41.7566799, lng: -87.9156011 },
        exitCounty: "Will",
        exitState: "Illinois",
        entryCounty: "Cook",
        entryState: "Illinois",
        intCounties: [{ co: "DuPage", st: "Illinois" }],
    },
];

// ═══════════════════════════════════════════════════════════════
//  Module-scoped engine state (singleton — one calculator per app)
// ═══════════════════════════════════════════════════════════════

let geocoder: any = null;
let dirSvc: any = null;
let originPlace: any = null;
let destPlace: any = null;
export const mapInstances: Record<string, { map: any; line: any }> = {};
const countyIndex: Record<string, any[]> = {};
const FIPS_TO_STATE: Record<string, string> = {};
const geocodeCache = new Map<string, any>();
const tigerCache: Record<string, any> = {};
let pipHits = 0,
    pipMisses = 0;

// State accessors (module-scoped lets can't be re-exported as writable)
export function setGeocoder(g: any) {
    geocoder = g;
}
export function setDirSvc(d: any) {
    dirSvc = d;
}
export function getOriginPlace() {
    return originPlace;
}
export function setOriginPlace(p: any) {
    originPlace = p;
}
export function getDestPlace() {
    return destPlace;
}
export function setDestPlace(p: any) {
    destPlace = p;
}

// ═══════════════════════════════════════════════════════════════
//  Utility functions
// ═══════════════════════════════════════════════════════════════

export const gm = () => (window as any).google;
export function getCounty(p: any): string {
    for (const c of p.address_components)
        if (c.types.includes("administrative_area_level_2")) return c.long_name.replace(" County", "").trim();
    return "";
}
export function getState(p: any): string {
    for (const c of p.address_components) if (c.types.includes("administrative_area_level_1")) return c.long_name;
    return "";
}
function ckey(co: string, st: string) {
    return (co + "||" + st).toLowerCase();
}
export function stAbbr(name: string) {
    return ST_ABBR[name] || name;
}
function geoKey(lat: number, lng: number) {
    return (Math.round(lat * 1e4) / 1e4).toFixed(4) + "," + (Math.round(lng * 1e4) / 1e4).toFixed(4);
}
function jitter(ll: any) {
    const o = 0.00001;
    return new (gm().maps.LatLng)(ll.lat() + (Math.random() - 0.5) * o, ll.lng() + (Math.random() - 0.5) * o);
}
function haversine(a: any, b: any) {
    const R = 3958.8,
        dLa = ((b.lat() - a.lat()) * Math.PI) / 180,
        dLo = ((b.lng() - a.lng()) * Math.PI) / 180;
    const x =
        Math.sin(dLa / 2) ** 2 +
        Math.cos((a.lat() * Math.PI) / 180) * Math.cos((b.lat() * Math.PI) / 180) * Math.sin(dLo / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function dedup(arr: any[]) {
    const s = new Set<string>();
    return arr.filter((x: any) => {
        if (s.has(x.key)) return false;
        s.add(x.key);
        return true;
    });
}

// ═══════════════════════════════════════════════════════════════
//  TIGER PiP Engine
// ═══════════════════════════════════════════════════════════════

function raycast(lat: number, lng: number, ring: number[][]) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const yi = ring[i][1],
            xi = ring[i][0],
            yj = ring[j][1],
            xj = ring[j][0];
        if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
function pointInPolygon(lat: number, lng: number, rings: number[][][]) {
    if (!raycast(lat, lng, rings[0])) return false;
    for (let h = 1; h < rings.length; h++) if (raycast(lat, lng, rings[h])) return false;
    return true;
}
function polyBBox(rings: number[][][]) {
    let minLat = Infinity,
        maxLat = -Infinity,
        minLng = Infinity,
        maxLng = -Infinity;
    for (const pt of rings[0]) {
        if (pt[1] < minLat) minLat = pt[1];
        if (pt[1] > maxLat) maxLat = pt[1];
        if (pt[0] < minLng) minLng = pt[0];
        if (pt[0] > maxLng) maxLng = pt[0];
    }
    return { minLat, maxLat, minLng, maxLng };
}
function polyBBoxMulti(mc: number[][][][]) {
    let minLat = Infinity,
        maxLat = -Infinity,
        minLng = Infinity,
        maxLng = -Infinity;
    for (const pr of mc) {
        const bb = polyBBox(pr);
        if (bb.minLat < minLat) minLat = bb.minLat;
        if (bb.maxLat > maxLat) maxLat = bb.maxLat;
        if (bb.minLng < minLng) minLng = bb.minLng;
        if (bb.maxLng > maxLng) maxLng = bb.maxLng;
    }
    return { minLat, maxLat, minLng, maxLng };
}
function inBBox(lat: number, lng: number, bb: any) {
    return lat >= bb.minLat && lat <= bb.maxLat && lng >= bb.minLng && lng <= bb.maxLng;
}
function indexCountyGeoJSON(gj: any, fips: string) {
    if (!gj?.features || countyIndex[fips]) return;
    const stateName = FIPS_TO_STATE[fips] || "";
    const entries: any[] = [];
    for (const f of gj.features) {
        const name = (f.properties.NAME || "").replace(/ County$/i, "").trim();
        if (!name) continue;
        const geom = f.geometry;
        let polys: any[];
        if (geom.type === "Polygon") polys = [geom.coordinates];
        else if (geom.type === "MultiPolygon") polys = geom.coordinates;
        else continue;
        entries.push({ name, stateName, polys, bbox: polys.length === 1 ? polyBBox(polys[0]) : polyBBoxMulti(polys) });
    }
    countyIndex[fips] = entries;
}
function pipCounty(lat: number, lng: number) {
    for (const entries of Object.values(countyIndex))
        for (const entry of entries) {
            if (!inBBox(lat, lng, entry.bbox)) continue;
            for (const pr of entry.polys)
                if (pointInPolygon(lat, lng, pr))
                    return { co: entry.name, st: entry.stateName, key: ckey(entry.name, entry.stateName) };
        }
    return null;
}
function quickStateFromPoint(lat: number, lng: number) {
    for (const entries of Object.values(countyIndex))
        for (const entry of entries) {
            if (!inBBox(lat, lng, entry.bbox)) continue;
            for (const pr of entry.polys)
                if (pointInPolygon(lat, lng, pr)) return (entry.stateName as string).toLowerCase();
        }
    return null;
}

// ═══════════════════════════════════════════════════════════════
//  Geocoding & TIGER Fetch
// ═══════════════════════════════════════════════════════════════

async function fetchCountyBounds(fips: string) {
    if (tigerCache[fips]) return tigerCache[fips];
    try {
        const url =
            "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query" +
            "?where=STATE='" +
            fips +
            "'&outFields=NAME,STATE,COUNTY&f=geojson&outSR=4326";
        const r = await fetch(url);
        if (!r.ok) return null;
        const gj = await r.json();
        tigerCache[fips] = gj;
        return gj;
    } catch (_e) {
        return null;
    }
}

function rgCountyGoogle(ll: any): Promise<any> {
    return new Promise(res => {
        geocoder.geocode({ location: jitter(ll) }, (results: any, status: string) => {
            if (status !== "OK" || !results.length) {
                res(null);
                return;
            }
            let co = "",
                st = "";
            for (const c of results[0].address_components) {
                if (c.types.includes("administrative_area_level_2")) co = c.long_name.replace(" County", "").trim();
                if (c.types.includes("administrative_area_level_1")) st = c.long_name;
            }
            res(co ? { co, st, key: ckey(co, st) } : null);
        });
    });
}

function rgCounty(ll: any): Promise<any> {
    const lat = ll.lat(),
        lng = ll.lng();
    const pip = pipCounty(lat, lng);
    if (pip) {
        pipHits++;
        return Promise.resolve(pip);
    }
    const ck = geoKey(lat, lng);
    if (geocodeCache.has(ck)) {
        pipHits++;
        return Promise.resolve(geocodeCache.get(ck));
    }
    pipMisses++;
    return new Promise(res => {
        geocoder.geocode({ location: jitter(ll) }, (results: any, status: string) => {
            if (status !== "OK" || !results.length) {
                res(null);
                return;
            }
            let co = "",
                st = "";
            for (const c of results[0].address_components) {
                if (c.types.includes("administrative_area_level_2")) co = c.long_name.replace(" County", "").trim();
                if (c.types.includes("administrative_area_level_1")) st = c.long_name;
            }
            const info = co ? { co, st, key: ckey(co, st) } : null;
            if (info) geocodeCache.set(ck, info);
            res(info);
        });
    });
}

// ═══════════════════════════════════════════════════════════════
//  Route Analysis Engine
// ═══════════════════════════════════════════════════════════════

async function prefetchTigerForRoute(route: any) {
    if (!Object.keys(FIPS_TO_STATE).length)
        for (const [name, fips] of Object.entries(STATE_FIPS))
            FIPS_TO_STATE[fips] = name.replace(/\b\w/g, c => c.toUpperCase());
    const stateSet = new Set<string>();
    const oS = getState(originPlace),
        dS = getState(destPlace);
    if (oS) stateSet.add(oS.toLowerCase());
    if (dS) stateSet.add(dS.toLowerCase());
    const op = route.overview_path || [];
    if (op.length > 2) {
        const step = Math.max(1, Math.floor(op.length / 5));
        for (let i = step; i < op.length - 1; i += step) {
            const pt = op[i];
            const found = quickStateFromPoint(pt.lat(), pt.lng());
            if (found) {
                stateSet.add(found);
                continue;
            }
            const info = await rgCountyGoogle(pt);
            if (info?.st) stateSet.add(info.st.toLowerCase());
        }
    }
    const fetches: Promise<void>[] = [];
    for (const sName of stateSet) {
        const fips = STATE_FIPS[sName];
        if (!fips || countyIndex[fips]) continue;
        fetches.push(
            fetchCountyBounds(fips).then(gj => {
                if (gj) indexCountyGeoJSON(gj, fips);
            }),
        );
    }
    if (fetches.length) await Promise.all(fetches);
}

export function getRoutes(origin: any, dest: any): Promise<any[]> {
    return new Promise((res, rej) => {
        dirSvc.route(
            { origin, destination: dest, travelMode: gm().maps.TravelMode.DRIVING, provideRouteAlternatives: true },
            (r: any, s: string) => {
                if (s === "OK") res(r.routes);
                else rej(new Error("Directions: " + s));
            },
        );
    });
}

function drivingDist(from: any, to: any): Promise<number> {
    return new Promise(res => {
        new (gm().maps.DistanceMatrixService)().getDistanceMatrix(
            {
                origins: [from],
                destinations: [to],
                travelMode: gm().maps.TravelMode.DRIVING,
                unitSystem: gm().maps.UnitSystem.IMPERIAL,
            },
            (r: any, s: string) => {
                if (s === "OK" && r.rows[0].elements[0].status === "OK")
                    res(r.rows[0].elements[0].distance.value / 1609.344);
                else res(haversine(from, to));
            },
        );
    });
}

async function binarySearchBorder(path: any[], lo: number, hi: number, homeKey: string): Promise<any> {
    while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        const inf = await rgCounty(path[mid]);
        if (inf?.key === homeKey) lo = mid;
        else hi = mid;
    }
    let rlo = lo;
    for (let i = hi; i >= lo; i--) {
        const inf = await rgCounty(path[i]);
        if (inf?.key === homeKey) {
            rlo = i;
            break;
        }
    }
    if (rlo > lo) lo = rlo;
    const trueHi = Math.min(lo + 1, path.length - 1);
    const from = path[lo],
        to = path[trueHi];
    const sd = gm().maps.geometry.spherical.computeDistanceBetween(from, to);
    const steps = Math.ceil(sd / 20);
    if (steps <= 1) return to;
    let flo = 0,
        fhi = steps;
    while (fhi - flo > 1) {
        const mid = Math.floor((flo + fhi) / 2),
            f = mid / steps;
        const pt = new (gm().maps.LatLng)(
            from.lat() + (to.lat() - from.lat()) * f,
            from.lng() + (to.lng() - from.lng()) * f,
        );
        const inf = await rgCounty(pt);
        if (inf?.key === homeKey) flo = mid;
        else fhi = mid;
    }
    const f = fhi / steps;
    return new (gm().maps.LatLng)(from.lat() + (to.lat() - from.lat()) * f, from.lng() + (to.lng() - from.lng()) * f);
}

async function sampleCounties(route: any, onProgress: (p: number, l: string) => void = () => {}): Promise<any[]> {
    const rawPath: any[] = [];
    for (const leg of route.legs)
        for (const step of leg.steps)
            for (const pt of gm().maps.geometry.encoding.decodePath(step.polyline.points)) rawPath.push(pt);
    if (!rawPath.length) return [];
    const MAX_SEG_M = 150,
        path: any[] = [rawPath[0]];
    for (let i = 1; i < rawPath.length; i++) {
        const from = rawPath[i - 1],
            to = rawPath[i];
        const d = gm().maps.geometry.spherical.computeDistanceBetween(from, to);
        if (d > MAX_SEG_M) {
            const n = Math.ceil(d / MAX_SEG_M);
            for (let s = 1; s < n; s++) {
                const f = s / n;
                path.push(
                    new (gm().maps.LatLng)(
                        from.lat() + (to.lat() - from.lat()) * f,
                        from.lng() + (to.lng() - from.lng()) * f,
                    ),
                );
            }
        }
        path.push(to);
    }
    onProgress(5, "Mapping route points");
    const sz = Math.max(1, Math.floor(path.length / 50));
    const coarse: any[] = [];
    for (let i = 0; i < path.length; i += sz) coarse.push({ pt: path[i], idx: i });
    const li = path.length - 1;
    if (coarse[coarse.length - 1].idx !== li) coarse.push({ pt: path[li], idx: li });
    onProgress(15, "Detecting counties along route");
    const BATCH = 8,
        ci: any[] = new Array(coarse.length);
    for (let s = 0; s < coarse.length; s += BATCH) {
        const e = Math.min(s + BATCH, coarse.length);
        const batchRes = await Promise.all(coarse.slice(s, e).map((c: any) => rgCounty(c.pt)));
        for (let j = 0; j < e - s; j++) {
            const inf = batchRes[j];
            ci[s + j] = { ...coarse[s + j], co: inf?.co || "", st: inf?.st || "", key: inf?.key || "" };
        }
        onProgress(15 + Math.round(((s + e) / 2 / coarse.length) * 40), "Detecting counties along route");
    }
    onProgress(55, "Pinpointing county borders");
    const counties: any[] = [];
    let prev = ci[0];
    if (prev.key) counties.push({ co: prev.co, st: prev.st, key: prev.key, pt: prev.pt });
    for (let i = 1; i < ci.length; i++) {
        const curr = ci[i];
        if (!curr.key) {
            prev = curr;
            continue;
        }
        if (curr.key !== prev.key && prev.key) {
            onProgress(55 + Math.round((i / ci.length) * 30), "Pinpointing county borders");
            const seg = path.slice(prev.idx, curr.idx + 1);
            const SS = Math.max(1, Math.floor(seg.length / 80));
            const si: number[] = [];
            for (let x = SS; x <= seg.length - 1; x += SS) si.push(x);
            const sr: any[] = new Array(si.length);
            for (let b = 0; b < si.length; b += BATCH) {
                const be = Math.min(b + BATCH, si.length);
                const br = await Promise.all(si.slice(b, be).map(x => rgCounty(seg[x])));
                for (let j = 0; j < br.length; j++) sr[b + j] = br[j];
            }
            let sp = { idx: 0, key: prev.key };
            for (let ri = 0; ri < si.length; ri++) {
                const x = si[ri],
                    sInf = sr[ri];
                if (!sInf) continue;
                if (sInf.key !== sp.key && sp.key) {
                    const bp = await binarySearchBorder(path, prev.idx + sp.idx, prev.idx + x, sp.key);
                    const bi = await rgCounty(bp);
                    if (bi && bi.key !== counties[counties.length - 1]?.key)
                        counties.push({ co: bi.co, st: bi.st, key: bi.key, pt: bp });
                    sp = { idx: x, key: sInf.key };
                }
            }
            if (curr.key !== counties[counties.length - 1]?.key) {
                const bp = await binarySearchBorder(path, prev.idx + sp.idx, curr.idx, sp.key);
                const bi = await rgCounty(bp);
                if (bi && bi.key !== counties[counties.length - 1]?.key)
                    counties.push({ co: bi.co, st: bi.st, key: bi.key, pt: bp });
            }
        } else if (curr.key !== counties[counties.length - 1]?.key && curr.key) {
            counties.push({ co: curr.co, st: curr.st, key: curr.key, pt: curr.pt });
        }
        prev = curr;
    }
    onProgress(88, "Measuring border-to-border distance");
    return counties;
}

function findOverride(route: any) {
    const oa = (originPlace.formatted_address || "").toLowerCase();
    const da = (destPlace.formatted_address || "").toLowerCase();
    const sm = (route.summary || "").toLowerCase();
    return (
        BORDER_OVERRIDES.find(
            o => oa.includes(o.originMatch) && da.includes(o.destMatch) && sm.includes(o.routeMatch),
        ) || null
    );
}

function toObject(
    idx: number,
    name: string,
    dist: string,
    dur: string,
    ruling: string,
    rnum: number | string,
    rtxt: string,
    counties: CountyEntry[],
    di: DistanceInfo | null,
    _dense: any[],
    overview: any[],
    autoQasr = false,
): RouteResult {
    return {
        idx,
        name,
        dist,
        dur,
        ruling,
        rnum,
        rtxt,
        counties,
        di,
        overviewPoints: overview.map((p: any) => ({ lat: p.lat(), lng: p.lng() })),
        autoQasr,
    };
}

export async function analyzeRoute(
    route: any,
    idx: number,
    total: number,
    onProg: (p: number, l: string) => void,
): Promise<RouteResult> {
    const oC = getCounty(originPlace),
        oS = getState(originPlace);
    const dC = getCounty(destPlace),
        dS = getState(destPlace);
    const leg = route.legs[0];
    const dist = leg.distance.text,
        dur = leg.duration.text,
        name = route.summary || "Route " + (idx + 1);
    const dense: any[] = [];
    for (const l of route.legs)
        for (const s of l.steps)
            for (const pt of gm().maps.geometry.encoding.decodePath(s.polyline.points)) dense.push(pt);
    const overview = route.overview_path || [];

    if (oC && dC && oC === dC && oS === dS)
        return toObject(
            idx,
            name,
            dist,
            dur,
            "full",
            1,
            "Both addresses are in <strong>" + oC + " County</strong>.",
            [{ co: oC, st: oS, tag: "home", det: "Origin & Destination \u2014 same county" }],
            null,
            dense,
            overview,
        );

    const drivingMiles = leg.distance.value / 1609.344;
    if (drivingMiles >= AUTO_QASR_MI)
        return toObject(
            idx,
            name,
            dist,
            dur,
            "qasr",
            "auto",
            "Total driving distance is <strong>" +
                dist +
                "</strong> \u2014 well beyond the 12\u2011mile threshold. Qasr is certain.",
            [
                { co: oC || "Home", st: oS, tag: "home", det: "Origin county" },
                { co: dC || "Destination", st: dS, tag: "dest", det: "Destination county" },
            ],
            null,
            dense,
            overview,
            true,
        );

    const ov = findOverride(route);
    if (ov) {
        const ep = new (gm().maps.LatLng)(ov.exitPt.lat, ov.exitPt.lng),
            np = new (gm().maps.LatLng)(ov.entryPt.lat, ov.entryPt.lng);
        const miles = await drivingDist(ep, np);
        const r = miles >= QASR_MI ? "qasr" : "full";
        return toObject(
            idx,
            name,
            dist,
            dur,
            r,
            r === "qasr" ? 3 : 4,
            "Route passes through <strong>" +
                ov.intCounties.length +
                " intermediate county</strong>. Border-to-border: <strong>" +
                miles.toFixed(2) +
                " miles</strong>.",
            [
                { co: ov.exitCounty, st: ov.exitState, tag: "home", det: "Home county" },
                ...ov.intCounties.map(x => ({ co: x.co, st: x.st, tag: "pass", det: "Intermediate county" })),
                { co: ov.entryCounty, st: ov.entryState, tag: "dest", det: "Destination county" },
            ],
            {
                miles,
                fc: ov.exitCounty,
                tc: ov.entryCounty,
                exitLat: ov.exitPt.lat,
                exitLng: ov.exitPt.lng,
                entLat: ov.entryPt.lat,
                entLng: ov.entryPt.lng,
            },
            dense,
            overview,
        );
    }

    pipHits = 0;
    pipMisses = 0;
    await prefetchTigerForRoute(route);
    const rc = await sampleCounties(route, (pct, lbl) => {
        const share = 75 / total,
            base = 12 + idx * share;
        onProg(Math.round(base + (pct / 100) * share), lbl);
    });
    const hk = ckey(oC, oS),
        dk = ckey(dC, dS);
    let exitI = 0;
    for (let i = 0; i < rc.length; i++) if (rc[i].key === hk) exitI = i;
    let entI = rc.length - 1;
    for (let i = exitI + 1; i < rc.length; i++)
        if (rc[i].key === dk) {
            entI = i;
            break;
        }
    const ints = dedup(rc.slice(exitI + 1, entI));

    if (!ints.length)
        return toObject(
            idx,
            name,
            dist,
            dur,
            "full",
            2,
            "Route exits <strong>" +
                rc[exitI].co +
                " County</strong> and immediately enters <strong>" +
                rc[entI].co +
                " County</strong> \u2014 directly adjacent.",
            [
                { co: rc[exitI].co, st: rc[exitI].st, tag: "home", det: "Home county" },
                { co: rc[entI].co, st: rc[entI].st, tag: "dest", det: "Destination county" },
            ],
            null,
            dense,
            overview,
        );

    const exitBp = rc[exitI + 1] ? rc[exitI + 1].pt : rc[exitI].pt;
    const entBp = rc[entI].pt;
    const miles = await drivingDist(exitBp, entBp);
    const ruling = miles >= QASR_MI ? "qasr" : "full";
    return toObject(
        idx,
        name,
        dist,
        dur,
        ruling,
        ruling === "qasr" ? 3 : 4,
        "Route passes through <strong>" +
            ints.length +
            " intermediate count" +
            (ints.length > 1 ? "ies" : "y") +
            "</strong>. Border-to-border: <strong>" +
            miles.toFixed(2) +
            " miles</strong> \u2014 " +
            (ruling === "qasr" ? "meets or exceeds" : "below") +
            " the 12\u2011mile threshold.",
        [
            { co: rc[exitI].co, st: rc[exitI].st, tag: "home", det: "Home county \u2014 exit point" },
            ...ints.map((x: any) => ({ co: x.co, st: x.st, tag: "pass", det: "Intermediate county" })),
            { co: rc[entI].co, st: rc[entI].st, tag: "dest", det: "Destination county \u2014 entry point" },
        ],
        {
            miles,
            fc: rc[exitI].co,
            tc: rc[entI].co,
            exitLat: exitBp.lat(),
            exitLng: exitBp.lng(),
            entLat: entBp.lat(),
            entLng: entBp.lng(),
        },
        dense,
        overview,
    );
}

// ═══════════════════════════════════════════════════════════════
//  Leaflet Map Rendering
// ═══════════════════════════════════════════════════════════════

export function initLeafletMap(mapId: string, result: RouteResult) {
    if (mapInstances[mapId]) {
        setTimeout(() => {
            try {
                mapInstances[mapId].map.invalidateSize();
            } catch (_e) {}
        }, 80);
        return;
    }
    const el = document.getElementById(mapId);
    const _L = (window as any).L;
    if (!el || !_L) return;
    const overview = result.overviewPoints;
    const exitD = result.di ? { lat: result.di.exitLat, lng: result.di.exitLng } : null;
    const entD = result.di ? { lat: result.di.entLat, lng: result.di.entLng } : null;
    if (!overview.length) return;

    const map = _L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
    _L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    const lls = overview.map((p: any) => [p.lat, p.lng]);

    if (exitD && entD) {
        const nearest = (pts: any[], t: any) => {
            let b = 0,
                bd = Infinity;
            for (let i = 0; i < pts.length; i++) {
                const d = Math.abs(pts[i].lat - t.lat) + Math.abs(pts[i].lng - t.lng);
                if (d < bd) {
                    bd = d;
                    b = i;
                }
            }
            return b;
        };
        const ei = nearest(overview, exitD),
            ni = nearest(overview, entD);
        const lo = Math.min(ei, ni),
            hi = Math.max(ei, ni);
        const seg = [
            [exitD.lat, exitD.lng],
            ...overview.slice(lo, hi + 1).map((p: any) => [p.lat, p.lng]),
            [entD.lat, entD.lng],
        ];
        _L.polyline(seg, { color: "#9f5850", weight: 5, opacity: 0.7 }).addTo(map);
    }
    const line = _L.polyline(lls, { color: "#5b6573", weight: 4, opacity: 0.85 }).addTo(map);
    _L.circleMarker([overview[0].lat, overview[0].lng], {
        radius: 7,
        color: "#0b1220",
        weight: 2.5,
        fillColor: "#fff",
        fillOpacity: 1,
    }).addTo(map);
    _L.circleMarker([overview[overview.length - 1].lat, overview[overview.length - 1].lng], {
        radius: 7,
        color: "#fff",
        weight: 2.5,
        fillColor: "#0b1220",
        fillOpacity: 1,
    }).addTo(map);
    if (exitD)
        _L.circleMarker([exitD.lat, exitD.lng], {
            radius: 7,
            color: "#0b1220",
            weight: 2,
            fillColor: "#9f5850",
            fillOpacity: 1,
        })
            .addTo(map)
            .bindTooltip("Home County Exit", { permanent: false });
    if (entD)
        _L.circleMarker([entD.lat, entD.lng], {
            radius: 7,
            color: "#0b1220",
            weight: 2,
            fillColor: "#1e3a5f",
            fillOpacity: 1,
        })
            .addTo(map)
            .bindTooltip("Dest County Entry", { permanent: false });
    map.fitBounds(line.getBounds(), { padding: [18, 18] });
    mapInstances[mapId] = { map, line };
    setTimeout(() => {
        try {
            map.invalidateSize();
        } catch (_e) {}
    }, 80);

    // Load TIGER county boundaries asynchronously
    (async () => {
        try {
            const bounds = line.getBounds();
            const n = bounds.getNorth().toFixed(5),
                s = bounds.getSouth().toFixed(5);
            const e = bounds.getEast().toFixed(5),
                w = bounds.getWest().toFixed(5);
            const url =
                "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query" +
                "?geometry=" +
                w +
                "," +
                s +
                "," +
                e +
                "," +
                n +
                "&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=NAME,STATE&f=geojson&outSR=4326";
            const r = await fetch(url);
            if (!r.ok) return;
            const gj = await r.json();
            if (!gj.features?.length) return;
            _L.geoJSON(gj, { style: { color: "#334155", weight: 1.8, opacity: 0.65, fillOpacity: 0 } }).addTo(map);
            try {
                line.bringToFront();
            } catch (_e) {}
            map.eachLayer((l: any) => {
                if (l instanceof _L.CircleMarker)
                    try {
                        l.bringToFront();
                    } catch (_e) {}
            });
        } catch (_e) {
            /* TIGER unavailable */
        }
    })();
}

// Google API logging helpers (debug only)
export function resetGApiLog() {
    /* no-op in React — console logging removed for cleanliness */
}
