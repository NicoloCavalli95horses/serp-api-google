//===========================
// Import
//===========================
import { getJson } from "serpapi";
import fs from 'fs';
import path from 'path';



//===========================
// Consts
//===========================
const dirname = import.meta.dirname;

const N_OF_PAGES = 10;

const config = {
  location: "France",
  hl: "en", // language to use for search
  gl: "us", // country to use for search
  engine: "google",
  api_key: process.env.API_KEY,
  safe: "active", // filter adult content
}

const excluded_domains = `
  -site:x.com
  -site:facebook.com
  -site:microsoft.com
  -site:instagram.com
  -site:tiktok.com
  -site:reddit.com
  -site:youtube.com
  -site:quora.com
  -site:medium.com
  -site:play.google.com
  -site:apps.apple.com
  -site:.edu
`;

const queries = [
  `online language learning ${excluded_domains}`,
  `online news ${excluded_domains}`,
  `online graphic design ${excluded_domains}`,
  `online meditation OR relaxation OR well-being ${excluded_domains}`
];

const CATEGORIES = [
  'language learning',
  'news',
  'graphic design',
  'well-being'
];

const uniqueDomains = new Set();
const allRows = [["Id", "Category", "Title", "Link"]];



//===========================
// Functions
//===========================
main();


function saveCSV() {
  const csvContent = allRows.map(row => row.map(value => `"${value}"`).join(",")).join("\n");
  fs.writeFileSync(path.join(dirname, "output.csv"), csvContent, "utf8");
  console.log("✅ CSV saved in:", path.join(dirname, "output.csv"));
}

async function main() {
  const data = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    for (let j = 0; j < N_OF_PAGES; j++) {
      console.log(`Request ${j + 1}/${N_OF_PAGES}`);
      const start = Date.now();

      try {
        const d = await getJson({ ...config, q: query,start: j * 10, timeout: 10000});
        console.log(`Response in ${Date.now() - start} ms`);

        data.push({ category: CATEGORIES[i], results: d });
      } catch (err) {
        console.error(`Request ${j + 1} failed:`, err);
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    const results = data[i].results.organic_results;
    const category = data[i].category;

    if (!results || results.length === 0) {
      console.log("No organic results available");
      continue;
    }

    for (let j = 0; j < results.length; j++) {
      const res = results[j];

      if (res.duration) { continue; } // skip video results

      const link = res.link;
      const domain = getDomain(link);

      if (uniqueDomains.has(domain)) {
        continue;
      }

      uniqueDomains.add(domain);

      const id = `${category[0].toUpperCase()}${i}_${res.position}`;
      const title = res.title?.replace(/"/g, '""') || "";
      allRows.push([id, category, title, link]);
    }
  }

  saveCSV();
}


function getDomain(url) {
  return new URL(url).hostname.replace(/^www\./, '');
}