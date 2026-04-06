const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const feedbackPanel = document.getElementById("feedback-panel");
const feedbackIcon = document.getElementById("feedback-icon");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackCopy = document.getElementById("feedback-copy");
const resultsGrid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const resultsTitle = document.getElementById("results-title");
const resultMeta = document.getElementById("result-meta");
const cityChips = Array.from(document.querySelectorAll(".city-chip"));
const featuredImage = document.getElementById("featured-image");
const featuredRating = document.getElementById("featured-rating");
const featuredReviews = document.getElementById("featured-reviews");
const featuredPrice = document.getElementById("featured-price");
const featuredName = document.getElementById("featured-name");
const featuredMeta = document.getElementById("featured-meta");
const featuredLink = document.getElementById("featured-link");

const YELP_API_KEY = window.YELP_API_KEY || "PToKoPDjdT2tKdJEpX9rUJDxraUx_zsdXq076iF1DPNoDfUSiz4uU6KIbyvFzxODcgTuS7lVuB7X7SUkeiyHDqgI33Zj5TYXfV6yDdk4fOqoe2bY6rEbvg7GPGfTaXYx";
const YELP_SEARCH_ENDPOINT = "https://api.yelp.com/v3/businesses/search";
const PAGE_SIZE = 9;

let currentRestaurants = [];
let currentCity = "";
let currentPage = 1;

function setFeedbackState(title, copy, variant = "idle") {
  feedbackPanel.className = "mt-6 flex items-start gap-4 rounded-2xl border p-4";

  if (variant === "loading") {
    feedbackPanel.classList.add("border-cyan-400/20", "bg-cyan-400/5");
    feedbackIcon.className = "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-lg font-extrabold text-cyan-200";
    feedbackIcon.textContent = "...";
  } else if (variant === "error") {
    feedbackPanel.classList.add("border-rose-400/20", "bg-rose-400/5");
    feedbackIcon.className = "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-400/10 text-lg font-extrabold text-rose-200";
    feedbackIcon.textContent = "!";
  } else if (variant === "empty") {
    feedbackPanel.classList.add("border-amber-400/20", "bg-amber-400/5");
    feedbackIcon.className = "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-400/10 text-lg font-extrabold text-amber-200";
    feedbackIcon.textContent = "?";
  } else {
    feedbackPanel.classList.add("border-white/10", "bg-slate-900/70");
    feedbackIcon.className = "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-400/10 text-lg font-extrabold text-orange-200";
    feedbackIcon.textContent = "+";
  }

  feedbackTitle.textContent = title;
  feedbackCopy.textContent = copy;
}

function resetResults() {
  resultsGrid.innerHTML = "";
}

function resetPagination() {
  if (pagination) {
    pagination.innerHTML = "";
  }
}

function createSkeletonCard() {
  const skeleton = document.createElement("article");
  skeleton.className = "animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-neutral-950";
  skeleton.innerHTML = `
    <div class="h-40 w-full bg-white/10"></div>
    <div class="space-y-2.5 p-4">
      <div class="h-5 w-3/4 rounded bg-white/10"></div>
      <div class="h-4 w-full rounded bg-white/10"></div>
      <div class="h-4 w-5/6 rounded bg-white/10"></div>
      <div class="flex gap-2 pt-1">
        <div class="h-7 w-16 rounded-full bg-white/10"></div>
        <div class="h-7 w-20 rounded-full bg-white/10"></div>
      </div>
    </div>
  `;

  return skeleton;
}

function renderLoadingSkeletons(count = 6) {
  resetResults();
  resetPagination();
  for (let index = 0; index < count; index += 1) {
    resultsGrid.append(createSkeletonCard());
  }
}

function formatBusiness(business) {
  const latitude = business.coordinates?.latitude;
  const longitude = business.coordinates?.longitude;

  return {
    name: business.name || "Restaurant",
    imageUrl: business.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    rating: business.rating ?? "N/A",
    reviewCount: business.review_count ?? 0,
    price: business.price || "Price N/A",
    phone: business.display_phone || "Phone unavailable",
    url: business.url || "https://www.yelp.com",
    location: Array.isArray(business.location?.display_address)
      ? business.location.display_address.join(", ")
      : business.location?.address1 || "Address unavailable",
    area: business.location?.neighborhoods?.join(", ") || business.location?.city || "",
    categories: Array.isArray(business.categories)
      ? business.categories.map((category) => category.title)
      : [],
    coordinates: Number.isFinite(latitude) && Number.isFinite(longitude)
      ? {
        latitude,
        longitude,
      }
      : null,
  };
}

function updateFeaturedRestaurant(restaurant) {
  if (!restaurant || !featuredImage || !featuredRating || !featuredReviews || !featuredPrice || !featuredName || !featuredMeta || !featuredLink) {
    return;
  }

  featuredImage.src = restaurant.imageUrl || "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1800&q=80";
  featuredImage.alt = restaurant.name || "Featured restaurant dish";
  featuredRating.textContent = `${restaurant.rating} ★`;
  featuredReviews.textContent = `${restaurant.reviewCount} reviews`;
  featuredPrice.textContent = restaurant.price || "Price N/A";
  featuredName.textContent = restaurant.name || "Featured Restaurant";
  featuredMeta.textContent = [restaurant.area, ...(restaurant.categories || []).slice(0, 2)].filter(Boolean).join(" • ") || restaurant.location || "Top restaurant result";
  featuredLink.href = restaurant.url || "https://www.yelp.com";
}

function createRestaurantCard(restaurant) {
  const article = document.createElement("article");
  article.className = "group overflow-hidden rounded-2xl border border-white/10 bg-black/35 transition duration-300 hover:-translate-y-1 hover:border-white/25";

  const image = document.createElement("img");
  image.className = "h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]";
  image.src = restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
  image.alt = restaurant.name;
  image.loading = "lazy";

  const body = document.createElement("div");
  body.className = "space-y-3 p-4";

  const heading = document.createElement("div");
  heading.className = "flex items-start justify-between gap-3";

  const title = document.createElement("h3");
  title.className = "text-lg font-semibold tracking-tight text-white";
  title.textContent = restaurant.name;

  const rating = document.createElement("span");
  rating.className = "inline-flex shrink-0 items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200";
  rating.textContent = `${restaurant.rating} stars`;

  heading.append(title, rating);

  const location = document.createElement("p");
  location.className = "text-sm leading-5 text-slate-400";
  location.textContent = [restaurant.location, restaurant.area].filter(Boolean).join(" • ");

  const coordinates = document.createElement("p");
  coordinates.className = "text-xs leading-5 text-slate-500";
  coordinates.textContent = restaurant.coordinates
    ? `Coordinates: ${restaurant.coordinates.latitude.toFixed(6)}, ${restaurant.coordinates.longitude.toFixed(6)}`
    : "Coordinates: unavailable";

  body.append(heading, location, coordinates);
  article.append(image, body);

  return article;
}

function renderPaginationControls(totalPages) {
  if (!pagination) {
    return;
  }

  pagination.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-50";
  previousButton.textContent = "Previous";
  previousButton.disabled = currentPage === 1;
  previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderCurrentPage();
    }
  });

  const pageLabel = document.createElement("span");
  pageLabel.className = "px-3 text-sm text-slate-300";
  pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-50";
  nextButton.textContent = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      renderCurrentPage();
    }
  });

  pagination.append(previousButton, pageLabel, nextButton);
}

function renderCurrentPage() {
  resetResults();

  const totalPages = Math.ceil(currentRestaurants.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRestaurants = currentRestaurants.slice(startIndex, startIndex + PAGE_SIZE);

  pageRestaurants.forEach((restaurant) => {
    resultsGrid.append(createRestaurantCard(restaurant));
  });

  resultMeta.textContent = `${currentRestaurants.length} restaurant${currentRestaurants.length === 1 ? "" : "s"} found. Showing page ${currentPage} of ${totalPages}.`;
  resultsTitle.textContent = `Best restaurant matches in ${currentCity}`;
  renderPaginationControls(totalPages);
}

function renderResults(restaurants, city) {
  resetResults();

  if (!restaurants.length) {
    setFeedbackState(
      "No restaurants found",
      `Try another city name or a nearby metro area for better Yelp coverage.`,
      "empty"
    );
    resultsTitle.textContent = `No results for ${city}`;
    resultMeta.textContent = "0 restaurants found.";
    resetPagination();
    return;
  }

  const featuredRestaurant = [...restaurants].sort((left, right) => {
    if ((right.rating ?? 0) !== (left.rating ?? 0)) {
      return (right.rating ?? 0) - (left.rating ?? 0);
    }

    return (right.reviewCount ?? 0) - (left.reviewCount ?? 0);
  })[0];
  updateFeaturedRestaurant(featuredRestaurant);

  feedbackPanel.className = "hidden";
  currentRestaurants = restaurants;
  currentCity = city;
  currentPage = 1;
  renderCurrentPage();
}

async function searchRestaurants(city) {
  if (!YELP_API_KEY) {
    throw new Error("Missing Yelp API key.");
  }

  if (/^https?:\/\//i.test(YELP_API_KEY)) {
    throw new Error("Invalid Yelp API key. The value provided looks like an API URL, not a key token.");
  }

  const query = new URLSearchParams({
    location: city,
    categories: "restaurants",
    sort_by: "best_match",
    limit: "24",
  });

  let response;
  try {
    response = await fetch(`${YELP_SEARCH_ENDPOINT}?${query.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    throw new Error("Failed to reach Yelp API. Browser likely blocked the request (CORS/network).");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.error?.description || payload?.error?.code || "Yelp request failed.";
    throw new Error(message);
  }

  return Array.isArray(payload?.businesses) ? payload.businesses.map(formatBusiness) : [];
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    setFeedbackState("City required", "Enter a city name before searching.", "error");
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  renderLoadingSkeletons(6);
  resultsTitle.textContent = `Searching ${city}`;
  resultMeta.textContent = "Fetching live Yelp data.";
  setFeedbackState("Loading restaurants", "Fetching live restaurants from Yelp...", "loading");
  featuredName.textContent = "Updating featured restaurant...";
  featuredMeta.textContent = "Syncing with latest Yelp search";

  try {
    const restaurants = await searchRestaurants(city);
    renderResults(restaurants, city);
  } catch (error) {
    setFeedbackState("Search failed", error.message || "Something went wrong while fetching restaurants.", "error");
    resultsTitle.textContent = `Could not load ${city}`;
    resultMeta.textContent = "Please try again.";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
});

cityChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const city = chip.dataset.city || "";
    cityInput.value = city;
    form.requestSubmit();
  });
});

setFeedbackState(
  "Ready to explore restaurants",
  "Search by city to load live restaurant data from Yelp.",
  "idle"
);
resultMeta.textContent = "Live Yelp mode enabled.";
