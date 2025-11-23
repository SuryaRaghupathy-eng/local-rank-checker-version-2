import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import Papa from "papaparse";
import { WebSocketServer } from "ws";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

interface QueryRow {
  Keywords: string;
  Brand: string;
  Branch: string;
}

interface PlaceResult {
  title?: string;
  address?: string;
  rating?: number;
  category?: string;
  query: string;
  brand: string;
  branch: string;
  query_result_number: number;
  brand_match: boolean;
  is_local_pack?: boolean;
  local_pack_position?: number;
  device_type?: string;
  search_latitude?: number;
  search_longitude?: number;
  [key: string]: any;
}

interface GeoGridConfig {
  enabled: boolean;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  gridSize: number;
}

interface ProcessingProgress {
  currentQuery: string;
  totalQueries: number;
  processedQueries: number;
  queriesPerSecond: number;
  estimatedTimeRemaining: number;
  apiCallsMade: number;
  currentPage: number;
}

async function searchSerperPlaces(
  query: string, 
  gl: string = "gb", 
  hl: string = "en", 
  page: number = 1,
  deviceType: string = "desktop",
  lat?: number,
  lng?: number
): Promise<any> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY not configured");
  }

  const payload: any = {
    q: query,
    gl: gl,
    hl: hl,
    page,
    device: deviceType,
  };

  if (lat !== undefined && lng !== undefined) {
    payload.ll = `@${lat},${lng},14z`;
  }

  const response = await fetch("https://google.serper.dev/places", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function generateGeoGrid(centerLat: number, centerLng: number, radiusKm: number, gridSize: number): Array<{lat: number, lng: number}> {
  const points: Array<{lat: number, lng: number}> = [];
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos(centerLat * Math.PI / 180);
  
  const latStep = (radiusKm * 2) / (gridSize - 1) / kmPerDegreeLat;
  const lngStep = (radiusKm * 2) / (gridSize - 1) / kmPerDegreeLng;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat - radiusKm / kmPerDegreeLat + (i * latStep);
      const lng = centerLng - radiusKm / kmPerDegreeLng + (j * lngStep);
      points.push({ lat, lng });
    }
  }
  
  return points;
}

function parseCSV(content: string): QueryRow[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    const errorMsg = result.errors.map(e => e.message).join('; ');
    throw new Error(`CSV parsing error: ${errorMsg}`);
  }

  if (!result.data || result.data.length === 0) {
    throw new Error("CSV file is empty or has no data rows");
  }

  const firstRow = result.data[0];
  const hasKeywords = 'Keywords' in firstRow || 'keywords' in firstRow;
  const hasBrand = 'Brand' in firstRow || 'brand' in firstRow;
  const hasBranch = 'Branch' in firstRow || 'branch' in firstRow;

  if (!hasKeywords || !hasBrand || !hasBranch) {
    throw new Error("CSV must contain 'Keywords', 'Brand', and 'Branch' columns");
  }

  const rows: QueryRow[] = [];
  for (const row of result.data) {
    const keywords = (row.Keywords || row.keywords || '').trim();
    const brand = (row.Brand || row.brand || '').trim();
    const branch = (row.Branch || row.branch || '').trim();

    if (keywords && brand && branch) {
      rows.push({ Keywords: keywords, Brand: brand, Branch: branch });
    }
  }

  if (rows.length === 0) {
    throw new Error("No valid data rows found in CSV");
  }

  return rows;
}

function normalizeBrandName(text: string): string {
  return text.toLowerCase().replace(/\s/g, '');
}

function normalizeBranchName(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/process-csv-stream", upload.single('file'), async (req, res) => {
    let searchId: string | null = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const gl = req.body.gl || 'gb';
      const hl = req.body.hl || 'en';
      const deviceType = req.body.deviceType || 'desktop';
      const projectId = req.body.projectId || null;
      const geoGridEnabled = req.body.geoGridEnabled === 'true' || req.body.geoGridEnabled === true;
      const geoGridConfig = geoGridEnabled ? JSON.parse(req.body.geoGridConfig || '{}') : null;
      const queryData = parseCSV(csvContent);

      if (queryData.length === 0) {
        return res.status(400).json({ error: "No valid data rows found in CSV" });
      }

      const search = await storage.createSearch({
        projectId,
        csvFilename: req.file.originalname,
        country: gl,
        language: hl,
        deviceType,
        geoGridEnabled,
        geoGridConfig,
        totalQueries: queryData.length,
        totalResults: 0,
        totalBrandMatches: 0,
        totalLocalPackMatches: 0,
        apiCallsMade: 0,
        status: 'processing',
      });
      searchId = search.id;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      
      if (req.socket) {
        req.socket.setNoDelay(true);
        req.socket.setTimeout(0);
      }
      
      res.flushHeaders();

      const sendProgress = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        console.log('[SSE] Sending:', data.type, data.processedQueries || 0, '/', data.totalQueries || 0);
        res.write(message);
      };

      const allResults: PlaceResult[] = [];
      let totalApiCalls = 0;
      const startTime = Date.now();

      sendProgress({
        type: 'progress',
        currentQuery: 'Starting...',
        totalQueries: queryData.length,
        processedQueries: 0,
        queriesPerSecond: 0,
        estimatedTimeRemaining: 0,
        apiCallsMade: 0,
        currentPage: 1,
        progress: 0,
      });

      for (let i = 0; i < queryData.length; i++) {
        const { Keywords: query, Brand: brand, Branch: branch } = queryData[i];
        
        console.log(`Processing query ${i + 1}/${queryData.length}: "${query}" for brand "${brand}" - "${branch}"`);
        
        const elapsed = (Date.now() - startTime) / 1000;
        const qps = i > 0 ? i / elapsed : 0;
        const remaining = i > 0 ? Math.ceil((queryData.length - i) / qps) : 0;

        sendProgress({
          type: 'progress',
          currentQuery: query,
          totalQueries: queryData.length,
          processedQueries: i + 1,
          queriesPerSecond: Number(qps.toFixed(2)),
          estimatedTimeRemaining: remaining,
          apiCallsMade: totalApiCalls,
          currentPage: 1,
          progress: Math.round(((i + 1) / queryData.length) * 100),
        });

        const normBrand = normalizeBrandName(brand);
        const normBranch = normalizeBranchName(branch);

        let foundBrandMatch = false;
        let foundAnyResults = false;
        let foundLocalPackMatch = false;

        const gridPoints = geoGridEnabled && geoGridConfig 
          ? generateGeoGrid(
              geoGridConfig.centerLat, 
              geoGridConfig.centerLng, 
              geoGridConfig.radiusKm || 5, 
              geoGridConfig.gridSize || 3
            )
          : [{ lat: undefined, lng: undefined }];

        for (const gridPoint of gridPoints) {
          const searchLat = gridPoint.lat;
          const searchLng = gridPoint.lng;

          let page = 1;
          let queryResultIndex = 1;

          while (true) {
            const data = await searchSerperPlaces(query, gl, hl, page, deviceType, searchLat, searchLng);
            totalApiCalls++;

            const places = data.places || [];
            if (places.length === 0) break;

            foundAnyResults = true;

            for (const place of places) {
              const title = place.title || '';
              const normTitle = title.toLowerCase().replace(/\s/g, '');

              const brandMatch = normTitle.includes(normBrand) && normTitle.includes(normBranch);
              const isLocalPack = queryResultIndex <= 3;
              const localPackPosition = isLocalPack ? queryResultIndex : null;

              if (brandMatch) {
                foundBrandMatch = true;
                if (isLocalPack) foundLocalPackMatch = true;
                const packInfo = isLocalPack ? ` (Local Pack #${localPackPosition})` : '';
                const gridInfo = searchLat ? ` @ (${searchLat.toFixed(4)}, ${searchLng.toFixed(4)})` : '';
                console.log(`  ✓ Brand match found at position ${queryResultIndex}${packInfo}${gridInfo}: "${title}"`);
              }

              allResults.push({
                ...place,
                query,
                brand,
                branch,
                query_result_number: queryResultIndex,
                brand_match: brandMatch,
                is_local_pack: isLocalPack,
                local_pack_position: localPackPosition,
                device_type: deviceType,
                search_latitude: searchLat,
                search_longitude: searchLng,
              });

              queryResultIndex++;
            }

            page++;
            
            const elapsedNow = (Date.now() - startTime) / 1000;
            const qpsNow = (i + 1) / elapsedNow;
            const remainingNow = Math.ceil((queryData.length - (i + 1)) / qpsNow);

            sendProgress({
              type: 'progress',
              currentQuery: query,
              totalQueries: queryData.length,
              processedQueries: i + 1,
              queriesPerSecond: Number(qpsNow.toFixed(2)),
              estimatedTimeRemaining: remainingNow,
              apiCallsMade: totalApiCalls,
              currentPage: page,
              progress: Math.round(((i + 1) / queryData.length) * 100),
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!foundBrandMatch) {
          console.log(`  ✗ No brand match found for "${query}" - adding N/A entry`);
          allResults.push({
            title: 'Brand not found',
            address: 'N/A',
            rating: undefined,
            category: 'N/A',
            query,
            brand,
            branch,
            query_result_number: 'N/A' as any,
            brand_match: false,
            local_ranking: 'N/A',
          });
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      if (searchId) {
        try {
          const currentSearchId = searchId;
          const rankingResultsToSave = allResults
            .filter(r => typeof r.query_result_number === 'number')
            .map(r => ({
              searchId: currentSearchId,
              query: r.query,
              brand: r.brand,
              branch: r.branch,
              rankingPosition: typeof r.query_result_number === 'number' ? r.query_result_number : null,
              isLocalPack: r.is_local_pack || false,
              localPackPosition: r.local_pack_position || null,
              deviceType: r.device_type || deviceType,
              searchLatitude: r.search_latitude ? String(r.search_latitude) : null,
              searchLongitude: r.search_longitude ? String(r.search_longitude) : null,
              title: r.title || null,
              address: r.address || null,
              rating: r.rating ? String(r.rating) : null,
              category: r.category || null,
              brandMatch: r.brand_match,
              latitude: r.latitude ? String(r.latitude) : null,
              longitude: r.longitude ? String(r.longitude) : null,
              rawData: r,
            }));

          const noMatchResults = allResults
            .filter(r => typeof r.query_result_number !== 'number')
            .map(r => ({
              searchId: currentSearchId,
              query: r.query,
              brand: r.brand,
              branch: r.branch,
              rankingPosition: null,
              isLocalPack: false,
              localPackPosition: null,
              deviceType: deviceType,
              searchLatitude: null,
              searchLongitude: null,
              title: 'Brand not found',
              address: null,
              rating: null,
              category: null,
              brandMatch: false,
              latitude: null,
              longitude: null,
              rawData: { note: 'No brand match found' },
            }));

          await storage.createRankingResults([...rankingResultsToSave, ...noMatchResults]);

          await storage.updateSearch(searchId, {
            totalResults: allResults.length,
            totalBrandMatches: allResults.filter(r => r.brand_match).length,
            totalLocalPackMatches: allResults.filter(r => r.is_local_pack && r.brand_match).length,
            apiCallsMade: totalApiCalls,
            processingTimeSeconds: String(processingTime),
            status: 'completed',
          });

          console.log(`Saved ${rankingResultsToSave.length + noMatchResults.length} ranking results to database`);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
        }
      }

      sendProgress({
        type: 'complete',
        data: {
          searchId,
          allPlaces: allResults,
          brandMatches: allResults.filter(r => r.brand_match),
          stats: {
            queriesProcessed: queryData.length,
            placesFound: allResults.length,
            apiCallsMade: totalApiCalls,
            processingTimeSeconds: processingTime,
          },
        },
      });

      res.end();
    } catch (error: any) {
      console.error("CSV processing error:", error);
      
      if (searchId) {
        try {
          await storage.updateSearch(searchId, {
            status: 'error',
          });
        } catch (dbError) {
          console.error('Error updating search status:', dbError);
        }
      }
      
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || "Failed to process CSV file" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/process-csv", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const gl = req.body.gl || 'gb';
      const hl = req.body.hl || 'en';
      const deviceType = req.body.deviceType || 'desktop';
      const geoGridEnabled = req.body.geoGridEnabled === 'true' || req.body.geoGridEnabled === true;
      const geoGridConfig = geoGridEnabled ? JSON.parse(req.body.geoGridConfig || '{}') : null;
      const queryData = parseCSV(csvContent);

      if (queryData.length === 0) {
        return res.status(400).json({ error: "No valid data rows found in CSV" });
      }

      const allResults: PlaceResult[] = [];
      let totalApiCalls = 0;
      const startTime = Date.now();

      for (let i = 0; i < queryData.length; i++) {
        const { Keywords: query, Brand: brand, Branch: branch } = queryData[i];
        
        console.log(`Processing query ${i + 1}/${queryData.length}: "${query}" for brand "${brand}" - "${branch}"`);
        
        const normBrand = normalizeBrandName(brand);
        const normBranch = normalizeBranchName(branch);

        let foundBrandMatch = false;
        let foundAnyResults = false;
        let foundLocalPackMatch = false;

        const gridPoints = geoGridEnabled && geoGridConfig 
          ? generateGeoGrid(
              geoGridConfig.centerLat, 
              geoGridConfig.centerLng, 
              geoGridConfig.radiusKm || 5, 
              geoGridConfig.gridSize || 3
            )
          : [{ lat: undefined, lng: undefined }];

        for (const gridPoint of gridPoints) {
          const searchLat = gridPoint.lat;
          const searchLng = gridPoint.lng;

          let page = 1;
          let queryResultIndex = 1;

          while (true) {
            const data = await searchSerperPlaces(query, gl, hl, page, deviceType, searchLat, searchLng);
            totalApiCalls++;

            const places = data.places || [];
            if (places.length === 0) break;

            foundAnyResults = true;

            for (const place of places) {
              const title = place.title || '';
              const normTitle = title.toLowerCase().replace(/\s/g, '');

              const brandMatch = normTitle.includes(normBrand) && normTitle.includes(normBranch);
              const isLocalPack = queryResultIndex <= 3;
              const localPackPosition = isLocalPack ? queryResultIndex : null;

              if (brandMatch) {
                foundBrandMatch = true;
                if (isLocalPack) foundLocalPackMatch = true;
                const packInfo = isLocalPack ? ` (Local Pack #${localPackPosition})` : '';
                const gridInfo = searchLat ? ` @ (${searchLat.toFixed(4)}, ${searchLng.toFixed(4)})` : '';
                console.log(`  ✓ Brand match found at position ${queryResultIndex}${packInfo}${gridInfo}: "${title}"`);
              }

              allResults.push({
                ...place,
                query,
                brand,
                branch,
                query_result_number: queryResultIndex,
                brand_match: brandMatch,
                is_local_pack: isLocalPack,
                local_pack_position: localPackPosition,
                device_type: deviceType,
                search_latitude: searchLat,
                search_longitude: searchLng,
              });

              queryResultIndex++;
            }

            page++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!foundBrandMatch) {
          console.log(`  ✗ No brand match found for "${query}" - adding N/A entry`);
          allResults.push({
            title: 'Brand not found',
            address: 'N/A',
            rating: undefined,
            category: 'N/A',
            query,
            brand,
            branch,
            query_result_number: 'N/A' as any,
            brand_match: false,
            local_ranking: 'N/A',
          });
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      res.json({
        success: true,
        data: {
          allPlaces: allResults,
          brandMatches: allResults.filter(r => r.brand_match),
          stats: {
            queriesProcessed: queryData.length,
            placesFound: allResults.length,
            apiCallsMade: totalApiCalls,
            processingTimeSeconds: processingTime,
          },
        },
      });
    } catch (error: any) {
      console.error("CSV processing error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process CSV file",
      });
    }
  });

  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json({ success: true, data: projects });
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: error.message || "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, description, queryData, country, language } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Project name is required" });
      }
      const project = await storage.createProject({ name, description, queryData, country, language });
      res.json({ success: true, data: project });
    } catch (error: any) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: error.message || "Failed to create project" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getProject(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      const searches = await storage.getSearchesByProject(id);
      
      res.json({ 
        success: true, 
        data: {
          campaign,
          searches,
          stats: {
            totalSearches: searches.length,
            lastRun: searches.length > 0 ? searches[0].createdAt : null,
          }
        }
      });
    } catch (error: any) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: error.message || "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns/:id/rerun", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getProject(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (!campaign.queryData) {
        return res.status(400).json({ error: "Campaign has no saved query data" });
      }

      const queryData = campaign.queryData as any[];
      const gl = campaign.country || 'gb';
      const hl = campaign.language || 'en';
      const deviceType = req.body.deviceType || 'desktop';
      const geoGridEnabled = req.body.geoGridEnabled === 'true' || req.body.geoGridEnabled === true || false;
      const geoGridConfig = geoGridEnabled ? JSON.parse(req.body.geoGridConfig || '{}') : null;

      const search = await storage.createSearch({
        projectId: id,
        csvFilename: `${campaign.name} - Rerun`,
        country: gl,
        language: hl,
        deviceType,
        geoGridEnabled,
        geoGridConfig,
        totalQueries: queryData.length,
        totalResults: 0,
        totalBrandMatches: 0,
        totalLocalPackMatches: 0,
        apiCallsMade: 0,
        status: 'processing',
      });

      const allResults: PlaceResult[] = [];
      let totalApiCalls = 0;
      const startTime = Date.now();

      for (let i = 0; i < queryData.length; i++) {
        const { Keywords: query, Brand: brand, Branch: branch } = queryData[i];
        
        console.log(`Processing query ${i + 1}/${queryData.length}: "${query}" for brand "${brand}" - "${branch}"`);
        
        const normBrand = normalizeBrandName(brand);
        const normBranch = normalizeBranchName(branch);

        let foundBrandMatch = false;
        let foundLocalPackMatch = false;

        const gridPoints = geoGridEnabled && geoGridConfig 
          ? generateGeoGrid(
              geoGridConfig.centerLat, 
              geoGridConfig.centerLng, 
              geoGridConfig.radiusKm || 5, 
              geoGridConfig.gridSize || 3
            )
          : [{ lat: undefined, lng: undefined }];

        for (const gridPoint of gridPoints) {
          const searchLat = gridPoint.lat;
          const searchLng = gridPoint.lng;

          let page = 1;
          let queryResultIndex = 1;

          while (true) {
            const data = await searchSerperPlaces(query, gl, hl, page, deviceType, searchLat, searchLng);
            totalApiCalls++;

            const places = data.places || [];
            if (places.length === 0) break;

            for (const place of places) {
              const title = place.title || '';
              const normTitle = title.toLowerCase().replace(/\s/g, '');

              const brandMatch = normTitle.includes(normBrand) && normTitle.includes(normBranch);
              const isLocalPack = queryResultIndex <= 3;
              const localPackPosition = isLocalPack ? queryResultIndex : null;

              if (brandMatch) {
                foundBrandMatch = true;
                if (isLocalPack) foundLocalPackMatch = true;
                const packInfo = isLocalPack ? ` (Local Pack #${localPackPosition})` : '';
                const gridInfo = searchLat ? ` @ (${searchLat.toFixed(4)}, ${searchLng.toFixed(4)})` : '';
                console.log(`  ✓ Brand match found at position ${queryResultIndex}${packInfo}${gridInfo}: "${title}"`);
              }

              allResults.push({
                ...place,
                query,
                brand,
                branch,
                query_result_number: queryResultIndex,
                brand_match: brandMatch,
                is_local_pack: isLocalPack,
                local_pack_position: localPackPosition,
                device_type: deviceType,
                search_latitude: searchLat,
                search_longitude: searchLng,
              });

              queryResultIndex++;
            }

            page++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!foundBrandMatch) {
          console.log(`  ✗ No brand match found for "${query}" - adding N/A entry`);
          allResults.push({
            title: 'Brand not found',
            address: 'N/A',
            rating: undefined,
            category: 'N/A',
            query,
            brand,
            branch,
            query_result_number: 'N/A' as any,
            brand_match: false,
            local_ranking: 'N/A',
          });
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      const rankingResultsToSave = allResults
        .filter(r => typeof r.query_result_number === 'number')
        .map(r => ({
          searchId: search.id,
          query: r.query,
          brand: r.brand,
          branch: r.branch,
          rankingPosition: typeof r.query_result_number === 'number' ? r.query_result_number : null,
          isLocalPack: r.is_local_pack || false,
          localPackPosition: r.local_pack_position || null,
          deviceType: r.device_type || deviceType,
          searchLatitude: r.search_latitude ? String(r.search_latitude) : null,
          searchLongitude: r.search_longitude ? String(r.search_longitude) : null,
          title: r.title || null,
          address: r.address || null,
          rating: r.rating ? String(r.rating) : null,
          category: r.category || null,
          brandMatch: r.brand_match,
          latitude: r.latitude ? String(r.latitude) : null,
          longitude: r.longitude ? String(r.longitude) : null,
          rawData: r,
        }));

      const noMatchResults = allResults
        .filter(r => typeof r.query_result_number !== 'number')
        .map(r => ({
          searchId: search.id,
          query: r.query,
          brand: r.brand,
          branch: r.branch,
          rankingPosition: null,
          isLocalPack: false,
          localPackPosition: null,
          deviceType: deviceType,
          searchLatitude: null,
          searchLongitude: null,
          title: 'Brand not found',
          address: null,
          rating: null,
          category: null,
          brandMatch: false,
          latitude: null,
          longitude: null,
          rawData: { note: 'No brand match found' },
        }));

      await storage.createRankingResults([...rankingResultsToSave, ...noMatchResults]);

      await storage.updateSearch(search.id, {
        totalResults: allResults.length,
        totalBrandMatches: allResults.filter(r => r.brand_match).length,
        totalLocalPackMatches: allResults.filter(r => r.is_local_pack && r.brand_match).length,
        apiCallsMade: totalApiCalls,
        processingTimeSeconds: String(processingTime),
        status: 'completed',
      });

      res.json({
        success: true,
        data: {
          searchId: search.id,
          allPlaces: allResults,
          brandMatches: allResults.filter(r => r.brand_match),
          stats: {
            queriesProcessed: queryData.length,
            placesFound: allResults.length,
            apiCallsMade: totalApiCalls,
            processingTimeSeconds: processingTime,
          },
        },
      });
    } catch (error: any) {
      console.error("Campaign rerun error:", error);
      res.status(500).json({ error: error.message || "Failed to rerun campaign" });
    }
  });

  app.get("/api/searches", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const projectId = req.query.projectId as string | undefined;
      
      const searches = projectId 
        ? await storage.getSearchesByProject(projectId)
        : await storage.getAllSearches(limit);
        
      res.json({ success: true, data: searches });
    } catch (error: any) {
      console.error("Error fetching searches:", error);
      res.status(500).json({ error: error.message || "Failed to fetch searches" });
    }
  });

  app.get("/api/searches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const search = await storage.getSearch(id);
      
      if (!search) {
        return res.status(404).json({ error: "Search not found" });
      }
      
      const results = await storage.getRankingResultsBySearch(id);
      
      res.json({ 
        success: true, 
        data: {
          search,
          results,
          stats: {
            totalResults: results.length,
            brandMatches: results.filter(r => r.brandMatch).length,
          }
        }
      });
    } catch (error: any) {
      console.error("Error fetching search:", error);
      res.status(500).json({ error: error.message || "Failed to fetch search" });
    }
  });

  app.get("/api/ranking-history", async (req, res) => {
    try {
      const { query, brand, branch, startDate, endDate } = req.query;
      
      if (!query || !brand || !branch) {
        return res.status(400).json({ 
          error: "Query, brand, and branch parameters are required" 
        });
      }
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const history = await storage.getRankingHistory(
        query as string,
        brand as string,
        branch as string,
        start,
        end
      );
      
      const historyWithTrends = history.map((result, index) => {
        const prevResult = index < history.length - 1 ? history[index + 1] : null;
        const prevPos = prevResult?.rankingPosition;
        const currPos = result.rankingPosition;
        
        return {
          ...result,
          previousPosition: prevPos ?? null,
          change: currPos && prevPos ? prevPos - currPos : null,
        };
      });
      
      res.json({ success: true, data: historyWithTrends });
    } catch (error: any) {
      console.error("Error fetching ranking history:", error);
      res.status(500).json({ error: error.message || "Failed to fetch ranking history" });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws/logs' });

  const logClients = new Set<any>();

  wss.on('connection', (ws) => {
    console.log('Console log client connected');
    logClients.add(ws);

    ws.send(JSON.stringify({ 
      type: 'log', 
      message: 'Connected to console log stream',
      timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
      console.log('Console log client disconnected');
      logClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      logClients.delete(ws);
    });
  });

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.log = (...args: any[]) => {
    originalConsoleLog(...args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    logClients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'log',
          level: 'info',
          message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  console.error = (...args: any[]) => {
    originalConsoleError(...args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    logClients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'log',
          level: 'error',
          message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  console.warn = (...args: any[]) => {
    originalConsoleWarn(...args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    logClients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'log',
          level: 'warn',
          message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  return httpServer;
}
