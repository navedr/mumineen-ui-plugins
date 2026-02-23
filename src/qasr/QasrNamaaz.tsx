import * as React from "react";
import "./QasrNamaaz.css";
import {
    RouteResult,
    CountyEntry,
    QASR_MI,
    gm,
    getCounty,
    getState,
    stAbbr,
    setGeocoder,
    setDirSvc,
    getOriginPlace,
    setOriginPlace,
    getDestPlace,
    setDestPlace,
    mapInstances,
    initLeafletMap,
    getRoutes,
    analyzeRoute,
    resetGApiLog,
} from "./qasr-engine";

interface QasrNamaazProps {
    googleMapsApiKey: string;
    defaultOrigin?: string;
    defaultDestination?: string;
    showResultsAsOverlay?: boolean;
}

export const QasrNamaaz: React.FC<QasrNamaazProps> = React.memo(
    ({ googleMapsApiKey, defaultOrigin, defaultDestination, showResultsAsOverlay }) => {
        const [scriptsLoaded, setScriptsLoaded] = React.useState(false);
        const [results, setResults] = React.useState<RouteResult[]>([]);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState("");
        const [progress, setProgress] = React.useState({ pct: 0, label: "" });
        const [showProgress, setShowProgress] = React.useState(false);
        const [showResults, setShowResults] = React.useState(false);
        const [resultCountText, setResultCountText] = React.useState("");
        const [originBadge, setOriginBadge] = React.useState({ text: "", visible: false });
        const [destBadge, setDestBadge] = React.useState({ text: "", visible: false });
        const [openCards, setOpenCards] = React.useState<Record<number, boolean>>({});
        const [activeTabs, setActiveTabs] = React.useState<Record<number, string>>({});
        const [fsMap, setFsMap] = React.useState<{ mapId: string; title: string } | null>(null);
        const [showOverlay, setShowOverlay] = React.useState(false);

        const originRef = React.useRef<HTMLInputElement>(null);
        const destRef = React.useRef<HTMLInputElement>(null);
        const resultsRef = React.useRef<HTMLDivElement>(null);
        const fsMapHostRef = React.useRef<HTMLDivElement>(null);

        // Load external scripts
        React.useEffect(() => {
            const elements: HTMLElement[] = [];
            const fonts = document.createElement("link");
            fonts.rel = "stylesheet";
            fonts.href =
                "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap";
            document.head.appendChild(fonts);
            elements.push(fonts);
            const lcss = document.createElement("link");
            lcss.rel = "stylesheet";
            lcss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(lcss);
            elements.push(lcss);
            const ljs = document.createElement("script");
            ljs.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            document.body.appendChild(ljs);
            elements.push(ljs);
            const cbName = "__initQasrNamaaz_" + Date.now();
            (window as any)[cbName] = () => setScriptsLoaded(true);
            const gjs = document.createElement("script");
            gjs.src =
                "https://maps.googleapis.com/maps/api/js?key=" +
                googleMapsApiKey +
                "&libraries=places,geometry&callback=" +
                cbName +
                "&loading=async";
            gjs.defer = true;
            document.body.appendChild(gjs);
            elements.push(gjs);
            return () => {
                delete (window as any)[cbName];
                elements.forEach(el => {
                    try {
                        el.parentNode?.removeChild(el);
                    } catch (_e) {}
                });
                Object.keys(mapInstances).forEach(k => {
                    try {
                        mapInstances[k].map.remove();
                    } catch (_e) {}
                    delete mapInstances[k];
                });
                setGeocoder(null);
                setDirSvc(null);
                setOriginPlace(null);
                setDestPlace(null);
            };
        }, []);

        // Init Google Maps Autocomplete
        React.useEffect(() => {
            if (!scriptsLoaded || !originRef.current || !destRef.current) return;
            setGeocoder(new (gm().maps.Geocoder)());
            setDirSvc(new (gm().maps.DirectionsService)());
            const makeAC = (input: HTMLInputElement, which: "origin" | "dest") => {
                const ac = new (gm().maps.places.Autocomplete)(input, {
                    strictBounds: false,
                    componentRestrictions: { country: "us" },
                    types: ["geocode"],
                    fields: ["address_components", "geometry", "formatted_address"],
                });
                ac.addListener("place_changed", () => {
                    const p = ac.getPlace();
                    if (!p.geometry) return;
                    setError("");
                    const co = getCounty(p),
                        st = getState(p);
                    const text = co ? co + " County, " + st : st;
                    if (which === "origin") {
                        setOriginPlace(p);
                        setOriginBadge({ text, visible: true });
                    } else {
                        setDestPlace(p);
                        setDestBadge({ text, visible: true });
                    }
                });
            };
            makeAC(originRef.current, "origin");
            makeAC(destRef.current, "dest");
        }, [scriptsLoaded]);

        // Geocode default addresses after scripts are ready
        React.useEffect(() => {
            if (!scriptsLoaded) return;
            const gc = new (gm().maps.Geocoder)();
            const geocodeDefault = (address: string, which: "origin" | "dest") => {
                gc.geocode({ address }, (results: any, status: string) => {
                    if (status !== "OK" || !results?.length) return;
                    const p = results[0];
                    if (!p.geometry) return;
                    const co = getCounty(p),
                        st = getState(p);
                    const text = co ? co + " County, " + st : st;
                    if (which === "origin") {
                        if (originRef.current) originRef.current.value = address;
                        setOriginPlace(p);
                        setOriginBadge({ text, visible: true });
                    } else {
                        if (destRef.current) destRef.current.value = address;
                        setDestPlace(p);
                        setDestBadge({ text, visible: true });
                    }
                });
            };
            if (defaultOrigin) geocodeDefault(defaultOrigin, "origin");
            if (defaultDestination) geocodeDefault(defaultDestination, "dest");
        }, [scriptsLoaded]);

        // Init Leaflet maps when Map tab is opened
        React.useEffect(() => {
            Object.entries(activeTabs).forEach(([idxStr, tab]) => {
                if (tab !== "map") return;
                const idx = Number(idxStr);
                if (!openCards[idx] || !results[idx]) return;
                setTimeout(() => initLeafletMap("qm-" + idx, results[idx]), 50);
            });
        }, [activeTabs, openCards, results]);

        // Fullscreen map handling
        React.useEffect(() => {
            if (!fsMap) return;
            const mapEl = document.getElementById(fsMap.mapId);
            if (!mapEl || !fsMapHostRef.current) return;
            const ph = document.createElement("div");
            ph.setAttribute("data-fs-ph", fsMap.mapId);
            mapEl.parentNode?.insertBefore(ph, mapEl);
            fsMapHostRef.current.appendChild(mapEl);
            const inst = mapInstances[fsMap.mapId];
            if (inst)
                requestAnimationFrame(() => {
                    try {
                        inst.map.invalidateSize(true);
                        inst.map.scrollWheelZoom.enable();
                    } catch (_e) {}
                });
            const onKey = (e: KeyboardEvent) => {
                if (e.key === "Escape") setFsMap(null);
            };
            document.addEventListener("keydown", onKey);
            return () => {
                document.removeEventListener("keydown", onKey);
                const placeholder = document.querySelector('[data-fs-ph="' + fsMap.mapId + '"]');
                if (placeholder?.parentNode && mapEl) {
                    placeholder.parentNode.insertBefore(mapEl, placeholder);
                    placeholder.remove();
                }
                if (inst)
                    requestAnimationFrame(() => {
                        try {
                            inst.map.invalidateSize(true);
                        } catch (_e) {}
                    });
            };
        }, [fsMap]);

        // Calculate handler
        const handleCalculate = React.useCallback(async () => {
            resetGApiLog();
            setError("");
            setShowResults(false);
            setResults([]);
            Object.keys(mapInstances).forEach(k => {
                try {
                    mapInstances[k].map.remove();
                } catch (_e) {}
                delete mapInstances[k];
            });
            if (!getOriginPlace() || !getDestPlace()) {
                setError("Please select both addresses from the dropdown.");
                return;
            }
            setLoading(true);
            setShowProgress(true);
            setProgress({ pct: 5, label: "Getting routes" });
            try {
                const routes = await getRoutes(getOriginPlace().geometry.location, getDestPlace().geometry.location);
                if (!routes?.length) {
                    setError("No routes found.");
                    return;
                }
                setResultCountText(routes.length + " route" + (routes.length > 1 ? "s" : "") + " found");
                setProgress({ pct: 12, label: "Analyzing routes" });
                const analyzed: RouteResult[] = [];
                for (let i = 0; i < routes.length; i++)
                    analyzed.push(
                        await analyzeRoute(routes[i], i, routes.length, (pct, label) => setProgress({ pct, label })),
                    );
                setProgress({ pct: 97, label: "Preparing results" });
                setResults(analyzed);
                setOpenCards({});
                setActiveTabs({});
                setShowResults(true);
                setProgress({ pct: 100, label: "Done!" });
                if (showResultsAsOverlay) {
                    setShowOverlay(true);
                } else {
                    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                }
            } catch (e: any) {
                setError("Error: " + e.message);
            } finally {
                setLoading(false);
                setTimeout(() => {
                    setShowProgress(false);
                    setProgress({ pct: 0, label: "" });
                }, 800);
            }
        }, []);

        const toggleCard = React.useCallback(
            (idx: number) => setOpenCards(prev => ({ ...prev, [idx]: !prev[idx] })),
            [],
        );
        const switchTab = React.useCallback(
            (idx: number, tab: string) => setActiveTabs(prev => ({ ...prev, [idx]: tab })),
            [],
        );

        // Build county chain JSX
        const buildChain = (counties: CountyEntry[]) =>
            counties.map((s, i) => {
                const last = i === counties.length - 1;
                const dc = s.tag === "home" ? "o" : s.tag === "dest" ? "d" : "m";
                return (
                    <div className="cstep" key={i}>
                        <div className="sline">
                            <div className={"sdot " + dc} />
                            {!last && (
                                <div className={"sconn" + (s.tag === "pass" || s.tag === "dest" ? " measured" : "")} />
                            )}
                        </div>
                        <div className="scontent">
                            <div className={"scounty" + (s.tag === "home" ? " hc" : s.tag === "dest" ? " dc" : "")}>
                                {s.co} County, {s.st}
                            </div>
                            <div className="sdetail">{s.det}</div>
                            <span className={"stag " + s.tag}>
                                {s.tag === "home"
                                    ? "Home County"
                                    : s.tag === "dest"
                                    ? "Destination County"
                                    : "Pass-Through"}
                            </span>
                        </div>
                    </div>
                );
            });

        // Render a route result card
        const renderRouteCard = (r: RouteResult, i: number) => {
            const mapId = "qm-" + i;
            const isOpen = openCards[i] || false;
            const activeTab = activeTabs[i] || "ruling";
            const op = r.overviewPoints;
            const gmUrl =
                op.length > 1
                    ? "https://www.google.com/maps/dir/?api=1&origin=" +
                      op[0].lat +
                      "," +
                      op[0].lng +
                      "&destination=" +
                      op[op.length - 1].lat +
                      "," +
                      op[op.length - 1].lng +
                      "&travelmode=driving"
                    : "#";

            return (
                <div key={i} className={"rc rc-" + r.ruling + (isOpen ? " open" : "")}>
                    <div className="rc-hd" onClick={() => toggleCard(i)}>
                        <div className="rc-accent" />
                        <div className="rc-hd-inner">
                            <div className="rc-hd-left">
                                <div className="rc-route-id">
                                    Route {r.idx + 1}
                                    {r.name ? " \u00b7 via " + r.name : ""}
                                </div>
                                <div className="rc-ruling-row">
                                    <div className="rc-ruling-word">{r.ruling === "qasr" ? "Qasr" : "Full"}</div>
                                    <div className="rc-ruling-desc">
                                        {r.ruling === "qasr" ? "Shorten your prayers" : "Pray in full"}
                                    </div>
                                </div>
                            </div>
                            <div className="rc-hd-right">
                                <div className="rc-meta">
                                    <strong>{r.dist}</strong>
                                    {r.dur}
                                </div>
                                <span className="rc-chev">{"\u25BC"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="rc-body">
                        <div className="tab-bar">
                            {(["ruling", "map", "navigate"] as const).map(tab => (
                                <button
                                    key={tab}
                                    className={"tab-btn" + (activeTab === tab ? " on" : "")}
                                    onClick={e => {
                                        e.stopPropagation();
                                        switchTab(i, tab);
                                    }}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Ruling Tab */}
                        <div className={"tab-pane" + (activeTab === "ruling" ? " on" : "")}>
                            {r.autoQasr ? (
                                <>
                                    <div className="auto-qasr-banner">
                                        <div className="aqb-icon">{"\u26A1"}</div>
                                        <div>
                                            <div className="aqb-title">Long Journey &mdash; Qasr Confirmed</div>
                                            {/* rtxt contains only <strong> tags generated by our own engine */}
                                            <div className="aqb-desc" dangerouslySetInnerHTML={{ __html: r.rtxt }} />
                                        </div>
                                    </div>
                                    <div className="auto-qasr-counties">
                                        <div className="sec-lbl" style={{ marginBottom: 10 }}>
                                            Journey
                                        </div>
                                        <div className="aq-journey">
                                            <div className="aq-pt">
                                                <div className="aq-dot o" />
                                                <div>
                                                    <div className="aq-name">
                                                        {r.counties[0].co} County
                                                        {r.counties[0].st ? ", " + stAbbr(r.counties[0].st) : ""}
                                                    </div>
                                                    <div className="aq-tag">Origin</div>
                                                </div>
                                            </div>
                                            <div className="aq-line" />
                                            <div className="aq-pt">
                                                <div className="aq-dot d" />
                                                <div>
                                                    <div className="aq-name">
                                                        {r.counties[r.counties.length - 1].co} County
                                                        {r.counties[r.counties.length - 1].st
                                                            ? ", " + stAbbr(r.counties[r.counties.length - 1].st)
                                                            : ""}
                                                    </div>
                                                    <div className="aq-tag">Destination</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="sec-lbl">County Route</div>
                                    <div className="chain">{buildChain(r.counties)}</div>
                                    {r.di && (
                                        <div className="dist-result">
                                            <div className="dist-num">{r.di.miles.toFixed(2)} mi</div>
                                            <div>
                                                <div className="dist-verdict">
                                                    {r.di.miles >= QASR_MI
                                                        ? "\u2265 12 mi \u2014 Qasr applies"
                                                        : "< 12 mi \u2014 Full prayer"}
                                                </div>
                                                <div className="dist-lbl">Border-to-border driving distance</div>
                                            </div>
                                        </div>
                                    )}
                                    {r.rnum ? (
                                        <div className="rule-note">
                                            <span className="rule-n">{r.rnum}</span>{" "}
                                            <strong>Rule {r.rnum} Applied:</strong>{" "}
                                            {/* rtxt contains only <strong> tags generated by our own engine */}
                                            <span dangerouslySetInnerHTML={{ __html: r.rtxt }} />
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>

                        {/* Map Tab */}
                        <div className={"tab-pane" + (activeTab === "map" ? " on" : "")}>
                            <div className="map-wrap">
                                <button
                                    className="map-fs-btn"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setFsMap({ mapId, title: "Route " + (r.idx + 1) });
                                    }}
                                    title="Fullscreen"
                                >
                                    {"\u2922"}
                                </button>
                                <div className="map-el" id={mapId} />
                            </div>
                            {r.di ? (
                                <>
                                    <div className="coord-row">
                                        {[
                                            {
                                                label: "Exit",
                                                data: { lat: r.di.exitLat, lng: r.di.exitLng },
                                                county: r.di.fc,
                                            },
                                            {
                                                label: "Entry",
                                                data: { lat: r.di.entLat, lng: r.di.entLng },
                                                county: r.di.tc,
                                            },
                                        ].map(c => (
                                            <div className="coord-box" key={c.label}>
                                                <div className="coord-lbl">
                                                    {c.label} &mdash; {c.county} County
                                                </div>
                                                <div className="coord-val">
                                                    {c.data.lat.toFixed(6)}, {c.data.lng.toFixed(6)}
                                                </div>
                                                <div className="coord-links">
                                                    <a
                                                        className="vlink m"
                                                        href={
                                                            "https://www.google.com/maps?q=" +
                                                            c.data.lat.toFixed(6) +
                                                            "," +
                                                            c.data.lng.toFixed(6)
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Maps
                                                    </a>
                                                    <a
                                                        className="vlink s"
                                                        href={
                                                            "https://www.google.com/maps?layer=c&cbll=" +
                                                            c.data.lat.toFixed(6) +
                                                            "," +
                                                            c.data.lng.toFixed(6)
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Street
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <a
                                        className="border-route-link"
                                        href={
                                            "https://www.google.com/maps/dir/" +
                                            r.di.exitLat.toFixed(6) +
                                            "," +
                                            r.di.exitLng.toFixed(6) +
                                            "/" +
                                            r.di.entLat.toFixed(6) +
                                            "," +
                                            r.di.entLng.toFixed(6)
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View border-to-border route on Google Maps
                                    </a>
                                    <div className="dist-compare">
                                        <div className="dist-box">
                                            <div className="dist-box-lbl">App Calculated</div>
                                            <div className="dist-box-val av">{r.di.miles.toFixed(2)}</div>
                                            <div className="dist-box-sub">miles (driving)</div>
                                        </div>
                                        <div className="dist-box">
                                            <div className="dist-box-lbl">Verify on Google Maps</div>
                                            <div className="dist-box-val gv">{"\u2192"}</div>
                                            <div className="dist-box-sub">
                                                <a
                                                    className="vlink r"
                                                    href={
                                                        "https://www.google.com/maps/dir/" +
                                                        r.di.exitLat.toFixed(6) +
                                                        "," +
                                                        r.di.exitLng.toFixed(6) +
                                                        "/" +
                                                        r.di.entLat.toFixed(6) +
                                                        "," +
                                                        r.di.entLng.toFixed(6)
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: 10 }}
                                                >
                                                    Open route
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dist-note">
                                        Compare Google Maps driving distance to the app value &mdash; should be within
                                        ~0.5 miles.
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "4px 0" }}>
                                    No border measurement for this route.
                                </div>
                            )}
                        </div>

                        {/* Navigate Tab */}
                        <div className={"tab-pane" + (activeTab === "navigate" ? " on" : "")}>
                            <div className="nav-notice">
                                This ruling applies <strong>only to this specific route</strong>. When opening Google
                                Maps, select the route that matches the details below.
                            </div>
                            <div className="nav-details">
                                <div className="nav-row">
                                    <span className="nav-key">Route</span>
                                    <span className="nav-val">Route {r.idx + 1}</span>
                                </div>
                                <div className="nav-row">
                                    <span className="nav-key">Distance</span>
                                    <span className="nav-val">{r.dist}</span>
                                </div>
                                {r.name && (
                                    <div className="nav-row">
                                        <span className="nav-key">Via</span>
                                        <span className="nav-val">{r.name}</span>
                                    </div>
                                )}
                                <div className="nav-row nav-row-counties">
                                    <span className="nav-key">Counties</span>
                                    <span className="nav-val">
                                        {r.counties.map(c => c.co + " County, " + stAbbr(c.st)).join(" \u2192 ")}
                                    </span>
                                </div>
                            </div>
                            <a className="gmaps-btn" href={gmUrl} target="_blank" rel="noopener noreferrer">
                                Open in Google Maps
                            </a>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="qasr-namaaz">
                <div className="qasr-container">
                    <div className="input-card">
                        <div className="card-lbl">Journey Details</div>
                        <div className="igroup">
                            <label>Origin Address</label>
                            <div className="iwrap">
                                <span className="iicon">{"\u29BF"}</span>
                                <input
                                    type="text"
                                    ref={originRef}
                                    placeholder="Enter your starting address"
                                    autoComplete="off"
                                />
                            </div>
                            <div className={"badge" + (originBadge.visible ? "" : " hidden")}>
                                <span>{originBadge.text || "\u2014"}</span>
                            </div>
                        </div>
                        <div className="igroup">
                            <label>Destination Address</label>
                            <div className="iwrap">
                                <span className="iicon">{"\u25CE"}</span>
                                <input
                                    type="text"
                                    ref={destRef}
                                    placeholder="Enter your destination address"
                                    autoComplete="off"
                                />
                            </div>
                            <div className={"badge" + (destBadge.visible ? "" : " hidden")}>
                                <span>{destBadge.text || "\u2014"}</span>
                            </div>
                        </div>
                        <button
                            className={"calc-btn" + (loading ? " loading" : "")}
                            disabled={loading}
                            onClick={handleCalculate}
                        >
                            <span className="btn-txt">Determine</span>
                            <span className="spinner" />
                        </button>
                        <div className={"prog-wrap" + (showProgress ? " on" : "")}>
                            <div className="prog-track">
                                <div className="prog-fill" style={{ width: progress.pct + "%" }} />
                            </div>
                            <div className="prog-lbl">{progress.label || "Starting"}</div>
                        </div>
                        <div className={"err" + (error ? " on" : "")}>{error}</div>
                    </div>

                    {!showResultsAsOverlay && (
                        <div className={"results-wrap" + (showResults ? " on" : "")} ref={resultsRef}>
                            <div className="results-hd">
                                <h2>Route Results</h2>
                                <span className="results-ct">{resultCountText}</span>
                            </div>
                            <div>{results.map((r, i) => renderRouteCard(r, i))}</div>
                        </div>
                    )}

                    {showResultsAsOverlay && showOverlay && showResults && (
                        <div className="overlay-layer">
                            <div className="overlay-header">
                                <div className="overlay-addresses">
                                    <div className="overlay-addr">
                                        <span className="overlay-addr-icon">{"\u29BF"}</span>
                                        <span className="overlay-addr-text">
                                            {originRef.current?.value || "Origin"}
                                        </span>
                                    </div>
                                    <div className="overlay-arrow">{"\u2192"}</div>
                                    <div className="overlay-addr">
                                        <span className="overlay-addr-icon">{"\u25CE"}</span>
                                        <span className="overlay-addr-text">
                                            {destRef.current?.value || "Destination"}
                                        </span>
                                    </div>
                                </div>
                                <button className="overlay-dismiss" onClick={() => setShowOverlay(false)}>
                                    {"\u2715"}
                                </button>
                            </div>
                            <div className="overlay-body" ref={resultsRef}>
                                <div className="results-hd">
                                    <h2>Route Results</h2>
                                    <span className="results-ct">{resultCountText}</span>
                                </div>
                                <div>{results.map((r, i) => renderRouteCard(r, i))}</div>
                            </div>
                        </div>
                    )}
                </div>

                {fsMap && (
                    <div
                        className="fs-overlay"
                        onClick={e => {
                            if (e.target === e.currentTarget) setFsMap(null);
                        }}
                    >
                        <div className="fs-panel">
                            <div className="fs-bar">
                                <div className="fs-title">{fsMap.title}</div>
                                <button className="fs-close" onClick={() => setFsMap(null)}>
                                    {"\u2715"}
                                </button>
                            </div>
                            <div className="fs-map-host" ref={fsMapHostRef} />
                        </div>
                    </div>
                )}
            </div>
        );
    },
);
