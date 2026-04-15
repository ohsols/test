
/**
 * Service to fetch media posters from various public APIs.
 */

const posterCache: Record<string, string> = {};

// Simple concurrency queue to prevent rate limiting
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;
const requestQueue: (() => void)[] = [];

const acquireToken = (): Promise<void> => {
  return new Promise(resolve => {
    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      activeRequests++;
      resolve();
    } else {
      requestQueue.push(resolve);
    }
  });
};

const releaseToken = () => {
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    if (next) next();
  } else {
    activeRequests--;
  }
};

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const manualSearchMap: Record<string, string> = {
  "How to Train Your Dragon: The Hidden World": "https://m.media-amazon.com/images/M/MV5BMjIwOTc1MjA0MV5BMl5BanBnXkFtZTgwODg3MDIxNzM@._V1_FMjpg_UX1000_.jpg",
  "Saw 2": "https://m.media-amazon.com/images/M/MV5BMTY5ODc0OTM5N15BMl5BanBnXkFtZTcwMjU2MTAzMQ@@._V1_FMjpg_UX1000_.jpg",
  "Spider-Man: Homecoming": "https://m.media-amazon.com/images/M/MV5BNTk4ODQ1MzgzN15BMl5BanBnXkFtZTgwMTMyMzM4MTI@._V1_FMjpg_UX1000_.jpg",
  "Star Wars: Attack of the Clones": "https://m.media-amazon.com/images/M/MV5BMDAzM2M0Y2UtZjRmZi00MzVlLTg4MjEtOTE3NzU5ZDVlMTg5XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_FMjpg_UX1000_.jpg",
  "Shrek 3": "https://m.media-amazon.com/images/M/MV5BMTk3OTM5Nzg5M15BMl5BanBnXkFtZTgwMTA0NzMyMjE@._V1_FMjpg_UX1000_.jpg",
  "The Lion King": "https://m.media-amazon.com/images/M/MV5BYTYxNGMyZTYtMjE3MS00MzNjLWFjNmYtMDk3N2FmM2JiM2M1XkEyXkFqcGdeQXVyNjY5NDU4NzI@._V1_FMjpg_UX1000_.jpg",
  "Prince Caspian": "https://m.media-amazon.com/images/M/MV5BMTYwOTU1OTU5N15BMl5BanBnXkFtZTcwMjU2MTAzMQ@@._V1_FMjpg_UX1000_.jpg",
  "High School Musical 2": "https://m.media-amazon.com/images/M/MV5BN2Y2OTljY2QtY2Y2Mi00YmRkLWE5OTYtYmJkZWNkZWNkZWNkXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
  "Spider-Man Across The Spider-Verse": "https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDM3LTk4NGMtM2FhYjRjY2QyM2E0XkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_FMjpg_UX1000_.jpg",
  "Scary Movie": "https://m.media-amazon.com/images/M/MV5BMjE3NDg5MDU5M15BMl5BanBnXkFtZTcwMjU2MTAzMQ@@._V1_FMjpg_UX1000_.jpg",
  "Teen Titans: Judas Contract": "https://m.media-amazon.com/images/M/MV5BMTY5ODc0OTM5N15BMl5BanBnXkFtZTcwMjU2MTAzMQ@@._V1_FMjpg_UX1000_.jpg",
  "West Side Story": "https://m.media-amazon.com/images/M/MV5BMTY5ODc0OTM5N15BMl5BanBnXkFtZTcwMjU2MTAzMQ@@._V1_FMjpg_UX1000_.jpg",
  "West Side Story (2021)": "https://m.media-amazon.com/images/M/MV5BMjIwOTc1MjA0MV5BMl5BanBnXkFtZTgwODg3MDIxNzM@._V1_FMjpg_UX1000_.jpg",
  "Pulp Fiction": "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UX1000_.jpg",
  "Coraline": "https://m.media-amazon.com/images/M/MV5BMjE3NDg5MDU5M15BMl5BanBnXkFtZTcwMjU2MTAzMQ@@._V1_FMjpg_UX1000_.jpg",
  "Deadpool 2": "https://m.media-amazon.com/images/M/MV5BMjQyODg5Njc4N15BMl5BanBnXkFtZTgwMzExMjE3NTM@._V1_FMjpg_UX1000_.jpg",
  "Rio 2": "https://m.media-amazon.com/images/M/MV5BMTQxNDk5MjQ3NV5BMl5BanBnXkFtZTgwMjI3MTQ0MDE@._V1_FMjpg_UX1000_.jpg",
  "Transformers 1": "https://m.media-amazon.com/images/M/MV5BNDg1NTU2OWEtM2UzYi00ZWRmLWEwMTktZWNjYWQ1NWM1OThjXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_FMjpg_UX1000_.jpg",
  "Terrifier": "https://m.media-amazon.com/images/M/MV5BYmMxNzA0OTUtYjE0Yi00YWY1LWEyYmItYmRiZTBmZGE1NDc5XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_FMjpg_UX1000_.jpg",
  "Child's Play 2": "https://m.media-amazon.com/images/M/MV5BMTQ0NDg4OTM5OF5BMl5BanBnXkFtZTgwOTIyNzE0MjE@._V1_FMjpg_UX1000_.jpg",
  "Interstellar": "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
  "Halloween 2": "https://m.media-amazon.com/images/M/MV5BMjE3NDg5MDU5M15BMl5BanBnXkFtZTcwMjU2MTAzMQ@@._V1_FMjpg_UX1000_.jpg",
  "Cars": "https://m.media-amazon.com/images/M/MV5BMTg5NzY0MzA2MV5BMl5BanBnXkFtZTYwNDc3NTc2._V1_FMjpg_UX1000_.jpg",
  "Star Wars: A New Hope": "https://m.media-amazon.com/images/M/MV5BOTA5NjhiOTAtZWM0ZC00MWNhLThiMzEtZDFkOTk2OTU1ZDJkXkEyXkFqcGdeQXVyMTA4NDI1NTQx._V1_FMjpg_UX1000_.jpg",
  "Alvin and the Chipmunks 2007": "https://m.media-amazon.com/images/M/MV5BMTQ1MDc0NTY4NV5BMl5BanBnXkFtZTcwMTE4MzkzMQ@@._V1_FMjpg_UX1000_.jpg",
  "Accel World": "https://m.media-amazon.com/images/M/MV5BYzA0NWY1YjQtNWI5Mi00ZDc5LWJmYmItZTFkOWY2YjZkYjM2XkEyXkFqcGdeQXVyMzgxODM4NjM@._V1_FMjpg_UX1000_.jpg",
  "Chainsaw Man Sub": "https://m.media-amazon.com/images/M/MV5BZDhjM2E1ZWEtZTE5OC00Mjc4LThjN2ItMTA2ZGE0OTJmYmQyXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_FMjpg_UX1000_.jpg",
  "Call of the Night": "https://m.media-amazon.com/images/M/MV5BNDM1Y2ZlNDEtY2U4Ny00YmI1LTgzOTMtYmI0Y2I0OGYxYjU2XkEyXkFqcGdeQXVyMzgxODM4NjM@._V1_FMjpg_UX1000_.jpg",
  "Konosuba S1": "https://m.media-amazon.com/images/M/MV5BNDQ2ZGFmNjMtMzEyNC00OTI5LTg4NDEtYjYyZTI4YWNhN2FiXkEyXkFqcGdeQXVyMzgxODM4NjM@._V1_FMjpg_UX1000_.jpg",
  "Yu Yu Hakusho": "https://m.media-amazon.com/images/M/MV5BZTg5ZTRjY2QtYmRkMy00YjcwLWI4MGEtN2Y0MTg1ZGNmZDMxXkEyXkFqcGdeQXVyNjc3OTE4Nzk@._V1_FMjpg_UX1000_.jpg",
  "Solo Leveling": "https://m.media-amazon.com/images/I/816hywlmu-L._AC_UF1000,1000_QL80_.jpg"
};

export const fetchPoster = async (title: string, category: string): Promise<string | null> => {
  if (posterCache[title]) return posterCache[title];

  const mappedValue = manualSearchMap[title];
  // If the mapping is a direct URL, use it immediately
  if (mappedValue && (mappedValue.startsWith('http') || mappedValue.startsWith('https'))) {
    posterCache[title] = mappedValue;
    return mappedValue;
  }

  await acquireToken();

  try {
    let url: string | null = null;
    
    // Aggressively clean the title for better API search results
    const cleanTitle = (mappedValue || title)
      .replace(/\s*\(.+?\)/g, "") // Remove (2021), (MANGA), etc.
      .replace(/\s*\d{4}\s*/g, "") // Remove years like 1994, 2021
      .replace(/[:\-]/g, " ")       // Replace colons and dashes with spaces
      .replace(/\s+/g, " ")        // Collapse multiple spaces
      .trim();

    const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
      for (let i = 0; i <= retries; i++) {
        try {
          const res = await fetch(url);
          if (res.ok) return res;
          // If 429 Too Many Requests, wait and retry
          if (res.status === 429) {
            await delay(1000 * (i + 1));
            continue;
          }
          return res;
        } catch (error) {
          if (i === retries) throw error;
          await delay(1000 * (i + 1));
        }
      }
      throw new Error("Max retries reached");
    };

    if (category === 'anime' || category === 'manga') {
      const type = category === 'anime' ? 'anime' : 'manga';
      const res = await fetchWithRetry(`https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(cleanTitle)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        url = data?.data?.[0]?.images?.jpg?.large_image_url || null;
      }
    } else if (category === 'tv') {
      const res = await fetchWithRetry(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleanTitle)}`);
      if (res.ok) {
        const data = await res.json();
        url = data?.[0]?.show?.image?.original || data?.[0]?.show?.image?.medium || null;
      }
    } else {
      // Movies: use iTunes Search API
      const res = await fetchWithRetry(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=movie&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data?.results?.[0]?.artworkUrl100) {
          url = data.results[0].artworkUrl100.replace('100x100bb', '600x900bb');
        }
      }
      
      // Fallback to TVMaze for movies if iTunes fails
      if (!url) {
        const tvRes = await fetchWithRetry(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleanTitle)}`);
        if (tvRes.ok) {
          const tvData = await tvRes.json();
          url = tvData?.[0]?.show?.image?.original || null;
        }
      }
    }

    if (url) {
      posterCache[title] = url;
      return url;
    }
    return null;
  } catch (e) {
    console.error("Poster fetch failed for " + title, e);
    return null;
  } finally {
    // Add a small delay between requests to be nice to the APIs
    await delay(300);
    releaseToken();
  }
};
