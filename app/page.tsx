"use client";

import { useEffect, useMemo, useState } from "react";

type Listing = {
  id: number;
  title: string;
  area: string;
  address: string;
  price: number;
  deposit: number;
  agency: number;
  utilities: number;
  rooms: number;
  lifestyle: string;
  safety: string;
  noise: string;
  match: number;
  verified: boolean;
  video: boolean;
  deal: string;
  image: string;
  gallery: string[];
  agent: string;
  phone: string;
  rating: number;
  response: string;
  distance: string;
  views: number;
  status: "available" | "booked" | "occupied";
};

type StatusMap = Record<string, Listing["status"]>;

const OWNER_PASSWORD_HASH =
  "643a3b0d15972578355e0fd2cfdf5e130d8667f0de165747d3d56925e80ae821";
const CUSTOM_LISTINGS_KEY = "kigali-home-hub-custom-listings";
const STATUS_KEY = "kigali-home-hub-listing-status";
const OWNER_WHATSAPP_KEY = "kigali-home-hub-owner-whatsapp";
const PRIVATE_IMAGES_KEY = "kigali-home-hub-private-images";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DATABASE_READY = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

type SupabaseListingRow = Omit<Listing, "gallery" | "status"> & {
  gallery: string[];
  status: Listing["status"];
  created_at?: string;
};

const starterListings: Listing[] = [
  {
    id: 1,
    title: "Bright furnished apartment",
    area: "Kacyiru",
    address: "KG 7 Avenue, near Kigali Heights",
    price: 520,
    deposit: 520,
    agency: 0,
    utilities: 45,
    rooms: 2,
    lifestyle: "Quiet professional",
    safety: "High",
    noise: "Quiet",
    match: 96,
    verified: true,
    video: true,
    deal: "Move in this week and save 10%",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=900&q=80"
    ],
    agent: "Aline Homes",
    phone: "250788123456",
    rating: 4.9,
    response: "12 min",
    distance: "7 min to shops, 11 min to transport",
    views: 1820,
    status: "available"
  },
  {
    id: 2,
    title: "Modern family townhouse",
    area: "Kibagabaga",
    address: "Quiet lane off KG 11 Avenue",
    price: 780,
    deposit: 780,
    agency: 180,
    utilities: 70,
    rooms: 3,
    lifestyle: "Family comfort",
    safety: "High",
    noise: "Calm",
    match: 89,
    verified: true,
    video: true,
    deal: "No agency fee for first 5 visits",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
    ],
    agent: "Prime Nest",
    phone: "250789654321",
    rating: 4.7,
    response: "21 min",
    distance: "4 min to school, 9 min to supermarket",
    views: 1344,
    status: "booked"
  },
  {
    id: 3,
    title: "Compact studio near offices",
    area: "Nyarutarama",
    address: "KN 8 Avenue, close to cafes",
    price: 360,
    deposit: 360,
    agency: 60,
    utilities: 32,
    rooms: 1,
    lifestyle: "City access",
    safety: "Medium",
    noise: "Busy",
    match: 84,
    verified: false,
    video: false,
    deal: "Urgent rent deal",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=80"
    ],
    agent: "Urban Key",
    phone: "250787222333",
    rating: 4.4,
    response: "38 min",
    distance: "3 min to cafes, 6 min to buses",
    views: 956,
    status: "occupied"
  }
];

const messages = [
  { from: "AI", text: "Kacyiru fits your quiet lifestyle and keeps the first month cost lowest." },
  { from: "Agent", text: "Yes, the furnished apartment is still available for Saturday viewing." },
  { from: "Support", text: "This listing passed phone, photo, and identity checks." }
];

export default function Home() {
  const [customListings, setCustomListings] = useState<Listing[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      return JSON.parse(localStorage.getItem(CUSTOM_LISTINGS_KEY) ?? "[]") as Listing[];
    } catch {
      return [];
    }
  });
  const [statusOverrides, setStatusOverrides] = useState<StatusMap>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      return JSON.parse(localStorage.getItem(STATUS_KEY) ?? "{}") as StatusMap;
    } catch {
      return {};
    }
  });
  const [selectedId, setSelectedId] = useState(1);
  const [budget, setBudget] = useState(650);
  const [rooms, setRooms] = useState(2);
  const [mode, setMode] = useState<"match" | "map" | "portal">("match");
  const [liked, setLiked] = useState<number[]>([1]);
  const [alertOn, setAlertOn] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [ownerWhatsApp, setOwnerWhatsApp] = useState(() => {
    if (typeof window === "undefined") {
      return "25078";
    }

    return localStorage.getItem(OWNER_WHATSAPP_KEY) ?? "25078";
  });
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState(
    DATABASE_READY ? "Connecting to database..." : "Database not connected yet"
  );

  const listings = useMemo(() => {
    return [...customListings, ...starterListings].map((listing) => ({
      ...listing,
      status: statusOverrides[String(listing.id)] ?? listing.status
    }));
  }, [customListings, statusOverrides]);

  const selected = listings.find((listing) => listing.id === selectedId) ?? listings[0];

  const matches = useMemo(() => {
    return listings
      .map((listing) => ({
        ...listing,
        score:
          listing.match -
          Math.max(0, listing.price - budget) / 20 -
          Math.abs(listing.rooms - rooms) * 4
      }))
      .sort((a, b) => b.score - a.score);
  }, [budget, rooms]);

  function toggleLike(id: number) {
    setLiked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function addListing(listing: Listing) {
    const savedListing = await saveListingToDatabase(listing);

    setCustomListings((current) => [savedListing, ...current]);
    setSelectedId(savedListing.id);
    setMode("match");
    setDatabaseStatus(
      DATABASE_READY
        ? "Saved online. Other devices can see it."
        : "Saved on this browser only. Add Supabase keys to sync devices."
    );
  }

  async function updateListingStatus(id: number, status: Listing["status"]) {
    setStatusOverrides((current) => ({ ...current, [String(id)]: status }));
    setCustomListings((current) =>
      current.map((listing) => (listing.id === id ? { ...listing, status } : listing))
    );

    const savedOnline = await updateListingStatusInDatabase(id, status);
    setDatabaseStatus(
      savedOnline
        ? "Status updated online."
        : "Status saved locally. Database is not connected or this is a starter listing."
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      const onlineListings = await fetchListingsFromDatabase();

      if (cancelled) {
        return;
      }

      if (onlineListings) {
        setCustomListings(onlineListings);
        setDatabaseStatus("Database connected. Listings sync across devices.");
        return;
      }

      setDatabaseStatus(
        DATABASE_READY
          ? "Database connection failed. Using local browser storage."
          : "Database not connected. Using local browser storage."
      );
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CUSTOM_LISTINGS_KEY, JSON.stringify(customListings));
  }, [customListings]);

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statusOverrides));
  }, [statusOverrides]);

  useEffect(() => {
    localStorage.setItem(OWNER_WHATSAPP_KEY, ownerWhatsApp);
  }, [ownerWhatsApp]);

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Kigali Home Hub navigation">
        <div className="brand">
          <span className="brandMark" aria-hidden="true" />
          <div>
            <strong>Kigali Home Hub</strong>
            <small>Smart rentals</small>
          </div>
        </div>

        <nav className="nav">
          {[
            ["match", "Matches"],
            ["map", "Neighborhoods"]
          ].map(([key, label]) => (
            <button
              key={key}
              className={mode === key ? "active" : ""}
              onClick={() => setMode(key as typeof mode)}
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          className="ownerAccess"
          onClick={() => setMode("portal")}
          aria-label="Open private owner dashboard"
        >
          <span className="ownerIcon" aria-hidden="true" />
        </button>

        <section className="filters" aria-label="Smart matching preferences">
          <h2>Preferences</h2>
          <label>
            Budget
            <output>${budget}/mo</output>
            <input
              type="range"
              min="300"
              max="1000"
              step="20"
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
            />
          </label>
          <label>
            Rooms
            <output>{rooms}</output>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={rooms}
              onChange={(event) => setRooms(Number(event.target.value))}
            />
          </label>
          <div className="chips" aria-label="Lifestyle preferences">
            <span>Quiet</span>
            <span>Near transit</span>
            <span>Verified only</span>
          </div>
        </section>
      </aside>

      <section className="mainPanel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live rental command center</p>
            <h1>Find, verify, compare, and book homes in one flow.</h1>
          </div>
          <div className="topActions">
            <button className="iconButton" aria-label="Smart alerts" onClick={() => setAlertOn(!alertOn)}>
              {alertOn ? "On" : "Off"}
            </button>
            <button className="primary" onClick={() => setBookingOpen(true)}>
              Book visit
            </button>
          </div>
        </header>

        {mode === "match" && (
          <div className="contentGrid">
            <section className="matchDeck" aria-label="Smart apartment matches">
              <div className="sectionHead">
                <div>
                  <p className="eyebrow">Smart matching</p>
                  <h2>Swipe-ready recommendations</h2>
                </div>
                <span>{liked.length} saved</span>
              </div>
              <div className="listingStack">
                {matches.map((listing) => (
                  <article
                    className={`listingCard ${selectedId === listing.id ? "selected" : ""}`}
                    key={listing.id}
                    onClick={() => setSelectedId(listing.id)}
                  >
                    <img src={listing.image} alt={listing.title} />
                    <div className="listingBody">
                      <div className="listingTitle">
                        <div>
                          <h3>{listing.title}</h3>
                          <p>{listing.area} - {listing.rooms} rooms</p>
                        </div>
                        <strong>{Math.round(listing.score)}%</strong>
                      </div>
                      <div className="badges">
                        <span className={`statusBadge ${listing.status}`}>{listing.status}</span>
                        {listing.verified && <span>Verified</span>}
                        {listing.video && <span>Video tour</span>}
                        <span>{listing.noise}</span>
                      </div>
                      <div className="swipeActions">
                        <button onClick={(event) => { event.stopPropagation(); toggleLike(listing.id); }}>
                          {liked.includes(listing.id) ? "Interested" : "Save"}
                        </button>
                        <button onClick={(event) => event.stopPropagation()}>Pass</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <ListingDetail listing={selected} ownerWhatsApp={ownerWhatsApp} />
          </div>
        )}

        {mode === "map" && <Neighborhood listing={selected} />}
        {mode === "portal" && !ownerUnlocked && (
          <OwnerLogin onUnlock={() => setOwnerUnlocked(true)} onBack={() => setMode("match")} />
        )}
        {mode === "portal" && ownerUnlocked && (
          <Portal
            listings={listings}
            onAddListing={addListing}
            onUpdateListingStatus={updateListingStatus}
            databaseStatus={databaseStatus}
            ownerWhatsApp={ownerWhatsApp}
            onOwnerWhatsAppChange={setOwnerWhatsApp}
            onLock={() => {
              setOwnerUnlocked(false);
              setMode("match");
            }}
          />
        )}
      </section>

      <aside className="rightRail">
        <BookingPanel listing={selected} onBook={() => setBookingOpen(true)} />
        <Insights />
      </aside>

      <button
        className="aiLauncher"
        aria-expanded={aiOpen}
        aria-controls="ai-assistant-panel"
        onClick={() => setAiOpen((current) => !current)}
      >
        AI
      </button>

      {aiOpen && (
        <div className="aiOverlay" role="dialog" aria-label="AI apartment assistant">
          <AssistantPanel listing={selected} onClose={() => setAiOpen(false)} />
        </div>
      )}

      {bookingOpen && (
        <BookingModal
          listing={selected}
          ownerWhatsApp={ownerWhatsApp}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </main>
  );
}

function ListingDetail({
  listing,
  ownerWhatsApp
}: {
  listing: Listing;
  ownerWhatsApp: string;
}) {
  const whatsappText = encodeURIComponent(
    `Hi ${listing.agent}, I am interested in ${listing.title} in ${listing.area}. Is it still available?`
  );
  const contactPhone = ownerWhatsApp.replace(/\D/g, "") || listing.phone;
  const whatsappUrl = `https://wa.me/${contactPhone}?text=${whatsappText}`;

  return (
    <section className="detailPanel" aria-label="Apartment details">
      <div className="heroPhoto">
        <img src={listing.image} alt={`${listing.title} interior`} />
        <div className="photoOverlay">
          <span>{listing.status}</span>
          <span>{listing.verified ? "Verified photos" : "Needs verification"}</span>
          <span>{listing.video ? "Short video available" : "Photos only"}</span>
        </div>
      </div>

      <div className="galleryStrip" aria-label="House photo gallery">
        {listing.gallery.map((photo) => (
          <img src={photo} alt={`${listing.title} preview`} key={photo} />
        ))}
      </div>

      <div className="detailHeader">
        <div>
          <p className="eyebrow">{listing.area}</p>
          <h2>{listing.title}</h2>
          <p className="addressLine">{listing.address}</p>
        </div>
        <strong>${listing.price}/mo</strong>
      </div>

      <div className="priceGrid">
        <Metric label="Rent" value={`$${listing.price}`} />
        <Metric label="Deposit" value={`$${listing.deposit}`} />
        <Metric label="Agency fee" value={`$${listing.agency}`} />
        <Metric label="Utilities" value={`$${listing.utilities}`} />
      </div>

      <div className="trustRow">
        <div>
          <strong>{listing.agent}</strong>
          <span>{listing.rating} rating - responds in {listing.response}</span>
        </div>
        <a className="whatsappButton" href={whatsappUrl} target="_blank" rel="noreferrer">
          WhatsApp landlord
        </a>
      </div>

      <div className="dealBanner">{listing.deal}</div>
    </section>
  );
}

function AssistantPanel({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  return (
    <section className="railPanel aiPanel" id="ai-assistant-panel">
      <div className="sectionHead compact">
        <div>
          <p className="eyebrow">AI assistant</p>
          <h2>Ask and compare</h2>
        </div>
        <button className="closeButton" aria-label="Close AI assistant" onClick={onClose}>
          X
        </button>
      </div>
      <div className="messages">
        {messages.map((message) => (
          <div className="message" key={`${message.from}-${message.text}`}>
            <strong>{message.from}</strong>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="quickReplies">
        <button>Is it still available?</button>
        <button>Compare with cheaper homes</button>
        <button>Help negotiate</button>
      </div>
      <p className="assistantNote">{listing.title} has a {listing.match}% lifestyle match.</p>
    </section>
  );
}

function BookingPanel({ listing, onBook }: { listing: Listing; onBook: () => void }) {
  return (
    <section className="railPanel">
      <p className="eyebrow">Instant booking</p>
      <h2>Viewing slots</h2>
      <div className="slots">
        <button onClick={onBook}>Fri 10:00</button>
        <button onClick={onBook}>Sat 14:30</button>
        <button onClick={onBook}>Sun 11:15</button>
      </div>
      <small>Book a visit for {listing.title}. Confirmation can be sent by SMS or WhatsApp.</small>
    </section>
  );
}

function BookingModal({
  listing,
  ownerWhatsApp,
  onClose
}: {
  listing: Listing;
  ownerWhatsApp: string;
  onClose: () => void;
}) {
  const [slot, setSlot] = useState("Saturday 14:30");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const slots = ["Friday 10:00", "Saturday 14:30", "Sunday 11:15", "Monday 16:00"];
  const whatsappText = encodeURIComponent(
    `Hi ${listing.agent}, I booked a viewing for ${listing.title} in ${listing.area} on ${slot}. My name is ${name || "a renter"}.`
  );
  const contactPhone = ownerWhatsApp.replace(/\D/g, "") || listing.phone;

  return (
    <div className="modalBackdrop" role="presentation">
      <section className="bookingModal" role="dialog" aria-label="Book a house visit">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Book visit</p>
            <h2>{listing.title}</h2>
          </div>
          <button className="closeButton" aria-label="Close booking form" onClick={onClose}>
            X
          </button>
        </div>

        <div className="bookingSummary">
          <img src={listing.image} alt={listing.title} />
          <div>
            <strong>{listing.area}</strong>
            <span>{listing.address}</span>
            <span>${listing.price}/mo - {listing.rooms} rooms</span>
          </div>
        </div>

        <div className="slotPicker">
          {slots.map((item) => (
            <button
              className={slot === item ? "selectedSlot" : ""}
              key={item}
              onClick={() => setSlot(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="bookingForm">
          <label>
            Your name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" />
          </label>
          <label>
            Phone or WhatsApp
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="250..." />
          </label>
        </div>

        {confirmed && (
          <div className="confirmationBox">
            Visit requested for {slot}. Contact {listing.agent} on WhatsApp to finish confirmation.
          </div>
        )}

        <div className="modalActions">
          <button className="primary" onClick={() => setConfirmed(true)}>
            Confirm visit
          </button>
          <a
            className="whatsappButton"
            href={`https://wa.me/${contactPhone}?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
          >
            Confirm on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

function Insights() {
  return (
    <section className="railPanel">
      <p className="eyebrow">Market insights</p>
      <h2>Area signals</h2>
      <div className="trend">
        <span>Kacyiru avg rent</span>
        <strong>$545</strong>
      </div>
      <div className="bars" aria-label="Price trend chart">
        <span style={{ height: "42%" }} />
        <span style={{ height: "55%" }} />
        <span style={{ height: "48%" }} />
        <span style={{ height: "72%" }} />
        <span style={{ height: "64%" }} />
      </div>
      <small>Best budget areas this week: Remera, Kimironko, Gisozi.</small>
    </section>
  );
}

function Neighborhood({ listing }: { listing: Listing }) {
  return (
    <div className="wideGrid">
      <section className="mapPanel">
        <div className="mapMock">
          <span className="pin mainPin" />
          <span className="pin shopPin" />
          <span className="pin schoolPin" />
          <span className="road roadA" />
          <span className="road roadB" />
          <span className="road roadC" />
        </div>
      </section>
      <section className="detailPanel">
        <p className="eyebrow">Neighborhood intelligence</p>
        <h2>{listing.area} lifestyle report</h2>
        <div className="priceGrid">
          <Metric label="Safety" value={listing.safety} />
          <Metric label="Noise" value={listing.noise} />
          <Metric label="Nearby" value={listing.distance} />
          <Metric label="Scam risk" value={listing.verified ? "Low" : "Review"} />
        </div>
        <div className="socialStrip">
          <button>Like</button>
          <button>Comment</button>
          <button>Share board</button>
          <button>Report listing</button>
        </div>
      </section>
    </div>
  );
}

function OwnerLogin({ onUnlock, onBack }: { onUnlock: () => void; onBack: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function unlockDashboard() {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
    const hashedPin = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    if (hashedPin === OWNER_PASSWORD_HASH) {
      setError("");
      onUnlock();
      return;
    }

    setError("Wrong password. Use the private owner password.");
  }

  return (
    <section className="ownerLogin">
      <div>
        <p className="eyebrow">Private owner access</p>
        <h2>This dashboard is hidden from renters.</h2>
        <p>Enter your encrypted owner password to manage uploads, private images, WhatsApp, agency fees, and listing status.</p>
      </div>
      <div className="ownerLoginForm">
        <label>
          Owner password
          <input
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                unlockDashboard();
              }
            }}
            placeholder="Enter password"
          />
        </label>
        {error && <span>{error}</span>}
        <div className="modalActions">
          <button className="primary" onClick={unlockDashboard}>
            Unlock dashboard
          </button>
          <button className="secondaryButton" onClick={onBack}>
            Back to listings
          </button>
        </div>
      </div>
    </section>
  );
}

function Portal({
  listings,
  onAddListing,
  onUpdateListingStatus,
  databaseStatus,
  ownerWhatsApp,
  onOwnerWhatsAppChange,
  onLock
}: {
  listings: Listing[];
  onAddListing: (listing: Listing) => Promise<void> | void;
  onUpdateListingStatus: (id: number, status: Listing["status"]) => Promise<void> | void;
  databaseStatus: string;
  ownerWhatsApp: string;
  onOwnerWhatsAppChange: (phone: string) => void;
  onLock: () => void;
}) {
  return (
    <div className="portalStack">
      <div className="privateTopbar">
        <div>
          <p className="eyebrow">Private area</p>
          <h2>Owner dashboard</h2>
        </div>
        <button className="secondaryButton" onClick={onLock}>
          Lock dashboard
        </button>
      </div>
      <DashboardOverview
        databaseStatus={databaseStatus}
        ownerWhatsApp={ownerWhatsApp}
        onOwnerWhatsAppChange={onOwnerWhatsAppChange}
      />
      <PrivateImageVault />
      <UploadListing onAddListing={onAddListing} ownerWhatsApp={ownerWhatsApp} />
      <ListingManager listings={listings} onUpdateListingStatus={onUpdateListingStatus} />
      <div className="portalGrid">
        <section className="detailPanel">
          <p className="eyebrow">Agent and landlord portal</p>
          <h2>Listing performance</h2>
          <div className="priceGrid">
            <Metric label="Views" value="4,120" />
            <Metric label="Messages" value="86" />
            <Metric label="Booked visits" value="19" />
            <Metric label="Boost status" value="Active" />
          </div>
          <div className="portalActions">
            <button>Post apartment</button>
            <button>Verify identity</button>
            <button>Boost listing</button>
          </div>
        </section>
        <section className="detailPanel">
          <p className="eyebrow">Moderation</p>
          <h2>Safety queue</h2>
          <div className="queueItem">
            <span>Photo mismatch report</span>
            <button>Review</button>
          </div>
          <div className="queueItem">
            <span>Phone verification pending</span>
            <button>Verify</button>
          </div>
          <div className="queueItem">
            <span>Urgent rent deal approval</span>
            <button>Approve</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardOverview({
  databaseStatus,
  ownerWhatsApp,
  onOwnerWhatsAppChange
}: {
  databaseStatus: string;
  ownerWhatsApp: string;
  onOwnerWhatsAppChange: (phone: string) => void;
}) {
  return (
    <section className="dashboardHero">
      <div>
        <p className="eyebrow">Landlord dashboard</p>
        <h2>Manage houses, photos, visits, and tenant messages.</h2>
        <div className="dashboardStats">
          <Metric label="Active houses" value="12" />
          <Metric label="Photo views" value="8,240" />
          <Metric label="WhatsApp leads" value="134" />
        </div>
        <div className={`databasePill ${DATABASE_READY ? "connected" : "offline"}`}>
          {databaseStatus}
        </div>
        <label className="ownerWhatsApp">
          Your WhatsApp number
          <input
            value={ownerWhatsApp}
            onChange={(event) => onOwnerWhatsAppChange(event.target.value)}
            placeholder="250788123456"
          />
        </label>
      </div>
      <div className="dashboardImages">
        <img
          src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80"
          alt="Modern rental living room"
        />
        <img
          src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=900&q=80"
          alt="Premium house exterior"
        />
      </div>
    </section>
  );
}

function PrivateImageVault() {
  const [privateImages, setPrivateImages] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      return JSON.parse(localStorage.getItem(PRIVATE_IMAGES_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  async function handlePrivateImages(files: FileList | null) {
    if (!files) {
      return;
    }

    const images = await readFilesAsDataUrls(files);
    setPrivateImages((current) => [...images, ...current]);
  }

  useEffect(() => {
    localStorage.setItem(PRIVATE_IMAGES_KEY, JSON.stringify(privateImages));
  }, [privateImages]);

  return (
    <section className="privateVault">
      <div>
        <p className="eyebrow">Private image vault</p>
        <h2>Upload images only you can see in the landlord portal.</h2>
        <p>
          These photos stay in this private dashboard area and are not shown on public house
          listings.
        </p>
      </div>
      <label className="privateDrop">
        Add private photos
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => handlePrivateImages(event.target.files)}
        />
      </label>
      <div className="privateGallery">
        {privateImages.length === 0 ? (
          <div className="emptyVault">No private images uploaded yet.</div>
        ) : (
          privateImages.map((photo) => (
            <figure key={photo}>
              <img src={photo} alt="Private landlord upload" />
              <figcaption>Private</figcaption>
            </figure>
          ))
        )}
      </div>
    </section>
  );
}

function ListingManager({
  listings,
  onUpdateListingStatus
}: {
  listings: Listing[];
  onUpdateListingStatus: (id: number, status: Listing["status"]) => void;
}) {
  return (
    <section className="managerPanel">
      <div>
        <p className="eyebrow">House status control</p>
        <h2>Mark listings as available, booked, or occupied.</h2>
      </div>
      <div className="managerList">
        {listings.map((listing) => (
          <article className="managerItem" key={listing.id}>
            <img src={listing.image} alt={listing.title} />
            <div>
              <strong>{listing.title}</strong>
              <span>{listing.area} - ${listing.price}/mo - agency ${listing.agency}</span>
            </div>
            <select
              value={listing.status}
              onChange={(event) =>
                onUpdateListingStatus(listing.id, event.target.value as Listing["status"])
              }
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="occupied">Occupied</option>
            </select>
          </article>
        ))}
      </div>
    </section>
  );
}

function UploadListing({
  onAddListing,
  ownerWhatsApp
}: {
  onAddListing: (listing: Listing) => Promise<void> | void;
  ownerWhatsApp: string;
}) {
  const [title, setTitle] = useState("New apartment with balcony");
  const [area, setArea] = useState("Remera");
  const [address, setAddress] = useState("KG 18 Avenue");
  const [price, setPrice] = useState(450);
  const [agency, setAgency] = useState(0);
  const [rooms, setRooms] = useState(2);
  const [status, setStatus] = useState<Listing["status"]>("available");
  const [phone, setPhone] = useState(ownerWhatsApp);
  const [agent, setAgent] = useState("My Agency");
  const [photos, setPhotos] = useState<string[]>([]);

  async function handlePhotos(files: FileList | null) {
    if (!files) {
      return;
    }

    setPhotos(await readFilesAsDataUrls(files));
  }

  async function publishListing() {
    const fallbackImage =
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80";
    const gallery = photos.length > 0 ? photos : [fallbackImage];

    await onAddListing({
      id: Date.now(),
      title,
      area,
      address,
      price,
      deposit: price,
      agency,
      utilities: 40,
      rooms,
      lifestyle: "New listing",
      safety: "Pending",
      noise: "Review",
      match: 91,
      verified: false,
      video: false,
      deal: "Freshly uploaded by landlord",
      image: gallery[0],
      gallery,
      agent,
      phone: (phone || ownerWhatsApp).replace(/\D/g, ""),
      rating: 4.6,
      response: "new",
      distance: "Add nearby schools, shops, and transport",
      views: 0,
      status
    });
  }

  const previewPhotos =
    photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=80"
        ];

  return (
    <section className="uploadPanel">
      <div>
        <p className="eyebrow">Upload new house</p>
        <h2>Add your own property photos and publish a listing.</h2>
      </div>
      <div className="uploadGrid">
        <label>
          House title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Area
          <input value={area} onChange={(event) => setArea(event.target.value)} />
        </label>
        <label>
          Address
          <input value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        <label>
          Rent
          <input
            type="number"
            value={price}
            min="0"
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
        <label>
          Agency fee
          <input
            type="number"
            value={agency}
            min="0"
            onChange={(event) => setAgency(Number(event.target.value))}
          />
        </label>
        <label>
          Rooms
          <input
            type="number"
            value={rooms}
            min="1"
            onChange={(event) => setRooms(Number(event.target.value))}
          />
        </label>
        <label>
          House status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Listing["status"])}
          >
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="occupied">Occupied</option>
          </select>
        </label>
        <label>
          Landlord WhatsApp
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          Landlord or agency name
          <input value={agent} onChange={(event) => setAgent(event.target.value)} />
        </label>
        <label className="fileDrop">
          Upload house images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handlePhotos(event.target.files)}
          />
        </label>
      </div>
      <div className="uploadPreview">
        {previewPhotos.map((photo) => (
          <img src={photo} alt="Uploaded house preview" key={photo} />
        ))}
      </div>
      <button className="primary publishButton" onClick={publishListing}>
        Publish house
      </button>
    </section>
  );
}

function readFilesAsDataUrls(files: FileList): Promise<string[]> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
  );
}

function databaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ""}`,
    "Content-Type": "application/json"
  };
}

function toDatabaseRow(listing: Listing): Omit<SupabaseListingRow, "id" | "created_at"> {
  return {
    title: listing.title,
    area: listing.area,
    address: listing.address,
    price: listing.price,
    deposit: listing.deposit,
    agency: listing.agency,
    utilities: listing.utilities,
    rooms: listing.rooms,
    lifestyle: listing.lifestyle,
    safety: listing.safety,
    noise: listing.noise,
    match: listing.match,
    verified: listing.verified,
    video: listing.video,
    deal: listing.deal,
    image: listing.image,
    gallery: listing.gallery,
    agent: listing.agent,
    phone: listing.phone,
    rating: listing.rating,
    response: listing.response,
    distance: listing.distance,
    views: listing.views,
    status: listing.status
  };
}

async function fetchListingsFromDatabase(): Promise<Listing[] | null> {
  if (!DATABASE_READY) {
    return null;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?select=*&order=created_at.desc`,
      { headers: databaseHeaders() }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Listing[];
  } catch {
    return null;
  }
}

async function saveListingToDatabase(listing: Listing): Promise<Listing> {
  if (!DATABASE_READY) {
    return listing;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=*`, {
      method: "POST",
      headers: {
        ...databaseHeaders(),
        Prefer: "return=representation"
      },
      body: JSON.stringify(toDatabaseRow(listing))
    });

    if (!response.ok) {
      return listing;
    }

    const [savedListing] = (await response.json()) as Listing[];
    return savedListing ?? listing;
  } catch {
    return listing;
  }
}

async function updateListingStatusInDatabase(
  id: number,
  status: Listing["status"]
): Promise<boolean> {
  if (!DATABASE_READY) {
    return false;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        ...databaseHeaders(),
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ status })
    });

    return response.ok;
  } catch {
    return false;
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
