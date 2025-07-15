//===========================
// Import
//===========================
import { getJson } from "serpapi";
import fs  from 'fs';
import path from 'path';



//===========================
// Consts
//===========================
const __dirname = import.meta.dirname;

const config = {
  location: "United States",
  engine: "google",
  api_key: process.env.API_KEY,
  num: 50,
}
const excluded_domains = `
  -site:x.com
  -site:facebook.com
  -site:instagram.com
  -site:tiktok.com
  -site:reddit.com
  -site:youtube.com
  -site:quora.com
  -site:play.google.com
  -site:apps.apple.com
`;

const queries = [
  `online language learning ${excluded_domains}`,
  `online news ${excluded_domains}`,
  `online graphic design ${excluded_domains}`
];

const CATEGORIES = [
  'language learning',
  'news',
  'graphic design'
];

const allRows = [["Id", "Category", "Title", "Link"]];



//===========================
// Functions
//===========================
main();

async function fetchData( {q} ) {
  return await getJson( {...config, q} );
}

function saveCSV() {
  const csvContent = allRows.map(row => row.map(value => `"${value}"`).join(",")).join("\n");
  fs.writeFileSync(path.join(__dirname, "output.csv"), csvContent, "utf8");
  console.log("CSV saved in:", path.join(__dirname, "output.csv"));
}

async function main() {
  const data = [];

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const j = await fetchData( {q} );
    data.push(j);
  }

  for (let i = 0; i < data.length; i++) {
    const results = data[i].organic_results;
  
    if (Object.keys(results).length === 0) { 
      console.log("No organic results available");
      break;
    }

    for (let j = 0; j < results.length; j++) {
      const res = results[j];
  
      if (res.duration) { continue; } // skip video results
      
      const category = CATEGORIES[i];
      const id = res.position;
      const title = res.title?.replace(/"/g, '""') || "";
      const link = res.link;
      allRows.push( [id, category, title, link] );
    }
  }
  
  saveCSV();
}
