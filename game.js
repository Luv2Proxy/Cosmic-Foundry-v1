const RESOURCE_KEYS = [
  "rock", "ironOre", "copperOre", "silicon", "ice", "energy",
  "ironPlates", "copperWire", "steel", "siliconWafers",
  "components", "circuits", "motors", "processors", "industrialFrames",
  "quantumChips", "nanotubes", "darkMatterCores",
  "hydrogen", "water", "organics", "rareMinerals",
  "planetMass", "systemEssence", "galaxySeeds", "darkMatter"
];

const state = {
  resources: Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0])),
  rates: Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0])),
  buildings: {
    miningDrone: 0,
    oreDrill: 0,
    copperRig: 0,
    siliconHarvester: 0,
    iceExtractor: 0,
    smelter: 0,
    assembler: 0,
    circuitFab: 0,
    processorPlant: 0,
    quantumForge: 0,
    solarGenerator: 0,
    thermalGenerator: 0,
    fusionReactor: 0,
    dysonCollector: 0,
  },
  automation: {
    transportDrones: false,
    conveyorBelts: false,
    logisticsHubs: false,
    blueprints: false,
    aiManagers: false,
    selfExpansion: false,
    optimizationCore: false,
  },
  planets: {
    rocky: 0,
    gas: 0,
    ocean: 0,
    volcanic: 0,
  },
  megastructures: {
    orbitalFactory: 0,
    dysonSwarm: 0,
    shipyard: 0,
    matterSynth: 0,
  },
  research: {},
  darkMatterSpent: 0,
  tickMs: 200,
  last: performance.now(),
  logs: [],
};

const els = {
  mineRockBtn: document.getElementById("mineRockBtn"),
  statusBar: document.getElementById("statusBar"),
  resourceList: document.getElementById("resourceList"),
  buildingList: document.getElementById("buildingList"),
  automationList: document.getElementById("automationList"),
  researchList: document.getElementById("researchList"),
  planetList: document.getElementById("planetList"),
  megaList: document.getElementById("megaList"),
  collapseBtn: document.getElementById("collapseBtn"),
  prestigeInfo: document.getElementById("prestigeInfo"),
  logList: document.getElementById("logList"),
};

const buildingDefs = {
  miningDrone: { name: "Mining Drone", energy: 0.2, cost: { rock: 15, ironPlates: 8 }, prod: { rock: 0.7 } },
  oreDrill: { name: "Ore Drill", energy: 0.5, req: "oreProspecting", cost: { rock: 20, components: 6 }, prod: { ironOre: 0.6 } },
  copperRig: { name: "Copper Rig", energy: 0.5, req: "oreProspecting", cost: { rock: 18, components: 6 }, prod: { copperOre: 0.6 } },
  siliconHarvester: { name: "Silicon Harvester", energy: 0.8, req: "siliconExtraction", cost: { steel: 12, motors: 4 }, prod: { silicon: 0.45 } },
  iceExtractor: { name: "Ice Extractor", energy: 0.8, req: "cryoExtraction", cost: { steel: 14, motors: 4 }, prod: { ice: 0.45 } },
  smelter: { name: "Smelter", energy: 1.2, cost: { rock: 40, ironOre: 20 }, convert: { ironOre: -1.2, copperOre: -1, ironPlates: 0.9, copperWire: 0.75 } },
  assembler: { name: "Assembler", energy: 1.6, cost: { ironPlates: 30, copperWire: 24 }, convert: { ironPlates: -0.8, copperWire: -0.8, motors: 0.25, industrialFrames: 0.2 } },
  circuitFab: { name: "Circuit Foundry", energy: 2.2, req: "circuitry", cost: { steel: 20, siliconWafers: 16 }, convert: { copperWire: -0.9, siliconWafers: -0.7, circuits: 0.35 } },
  processorPlant: { name: "Processor Plant", energy: 3.8, req: "processorArchitecture", cost: { circuits: 40, motors: 18 }, convert: { circuits: -0.8, siliconWafers: -0.8, processors: 0.22 } },
  quantumForge: { name: "Quantum Forge", energy: 9, req: "quantumFabrication", cost: { processors: 35, industrialFrames: 30 }, convert: { processors: -0.5, nanotubes: -0.35, quantumChips: 0.1 } },
  solarGenerator: { name: "Solar Generator", cost: { ironPlates: 14, copperWire: 10 }, energyProd: 2.4 },
  thermalGenerator: { name: "Thermal Generator", req: "thermalPower", cost: { steel: 20, circuits: 8 }, convert: { hydrogen: -0.5, energy: 7 } },
  fusionReactor: { name: "Fusion Reactor", req: "fusionPower", cost: { processors: 20, quantumChips: 4 }, convert: { hydrogen: -1.2, darkMatterCores: -0.03, energy: 32 } },
  dysonCollector: { name: "Dyson Swarm Collector", req: "dysonEngineering", cost: { quantumChips: 18, industrialFrames: 70, darkMatterCores: 10 }, energyProd: 220 },
};

const recipeDefs = {
  components: { in: { ironPlates: 2, copperWire: 2 }, out: "components", amount: 1, unlockedBy: "basicAssembly" },
  steel: { in: { ironPlates: 3, energy: 2 }, out: "steel", amount: 1, unlockedBy: "metallurgy" },
  siliconWafers: { in: { silicon: 2, energy: 1.5 }, out: "siliconWafers", amount: 1, unlockedBy: "siliconExtraction" },
  nanotubes: { in: { carbonProxy: 1, processors: 1 }, out: "nanotubes", amount: 0.25, unlockedBy: "nanoEngineering" },
  darkMatterCores: { in: { quantumChips: 1, energy: 50 }, out: "darkMatterCores", amount: 0.04, unlockedBy: "darkMatterCompression" },
};

const researchDefs = {
  basicAssembly: { name: "Basic Assembly", cost: { ironPlates: 25, copperWire: 20 }, desc: "Unlock components." },
  oreProspecting: { name: "Ore Prospecting", cost: { components: 15 }, desc: "Unlock ore drills + copper rigs." },
  metallurgy: { name: "Advanced Metallurgy", cost: { components: 25, energy: 120 }, desc: "Unlock steel." },
  siliconExtraction: { name: "Silicon Extraction", cost: { steel: 18, circuits: 8 }, req: "circuitry", desc: "Unlock silicon harvest + wafers." },
  circuitry: { name: "Circuit Theory", cost: { components: 35, copperWire: 60 }, desc: "Unlock circuit foundry." },
  processorArchitecture: { name: "Processor Architecture", cost: { circuits: 40, steel: 25 }, req: "circuitry", desc: "Unlock processors." },
  cryoExtraction: { name: "Cryogenic Extraction", cost: { processors: 10, steel: 28 }, req: "processorArchitecture", desc: "Unlock ice extraction." },
  thermalPower: { name: "Thermal Power", cost: { motors: 20, circuits: 20 }, desc: "Unlock thermal generators." },
  fusionPower: { name: "Fusion Power", cost: { processors: 25, hydrogen: 180 }, req: "planetaryIndustry", desc: "Unlock fusion reactors." },
  planetaryIndustry: { name: "Planetary Industry", cost: { processors: 45, industrialFrames: 50 }, req: "processorArchitecture", desc: "Unlock planet construction." },
  automationIntelligence: { name: "Automation Intelligence", cost: { processors: 80, circuits: 120 }, req: "processorArchitecture", desc: "Unlock AI automation upgrades." },
  nanoEngineering: { name: "Nano Engineering", cost: { processors: 90, quantumChips: 12 }, req: "quantumFabrication", desc: "Unlock nanotubes." },
  quantumFabrication: { name: "Quantum Fabrication", cost: { processors: 70, darkMatterCores: 5 }, req: "fusionPower", desc: "Unlock quantum forge." },
  darkMatterCompression: { name: "Dark Matter Compression", cost: { quantumChips: 14, energy: 1800 }, req: "quantumFabrication", desc: "Unlock dark matter cores." },
  dysonEngineering: { name: "Dyson Engineering", cost: { quantumChips: 24, industrialFrames: 120 }, req: "fusionPower", desc: "Unlock Dyson collectors and swarms." },
  galacticManufacturing: { name: "Galactic Manufacturing", cost: { planetMass: 80, systemEssence: 20, darkMatterCores: 30 }, req: "dysonEngineering", desc: "Unlock galaxy seed fabrication." },
};

const automationDefs = {
  transportDrones: { name: "Transport Drones", req: "oreProspecting", cost: { components: 30, energy: 150 }, bonus: "+10% throughput" },
  conveyorBelts: { name: "Conveyor Belts", req: "basicAssembly", cost: { ironPlates: 120, copperWire: 140 }, bonus: "+15% throughput" },
  logisticsHubs: { name: "Logistics Hubs", req: "circuitry", cost: { circuits: 80, motors: 45 }, bonus: "+20% throughput" },
  blueprints: { name: "Factory Blueprints", req: "processorArchitecture", cost: { processors: 30, circuits: 150 }, bonus: "build x5" },
  aiManagers: { name: "AI Factory Managers", req: "automationIntelligence", cost: { processors: 150, quantumChips: 20 }, bonus: "+35% throughput" },
  selfExpansion: { name: "Self-Expanding Factories", req: "automationIntelligence", cost: { industrialFrames: 120, processors: 120 }, bonus: "passive building replication" },
  optimizationCore: { name: "Automated Optimization Core", req: "galacticManufacturing", cost: { quantumChips: 120, darkMatterCores: 70 }, bonus: "+60% throughput" },
};

const planetDefs = {
  rocky: { name: "Rocky Planet", req: "planetaryIndustry", cost: { industrialFrames: 50, motors: 35, energy: 500 }, bonus: { ironOre: 0.9, copperOre: 0.9, rareMinerals: 0.05 } },
  gas: { name: "Gas Giant", req: "planetaryIndustry", cost: { industrialFrames: 60, processors: 20, energy: 700 }, bonus: { hydrogen: 1.6 } },
  ocean: { name: "Ocean World", req: "planetaryIndustry", cost: { steel: 120, processors: 18, energy: 650 }, bonus: { water: 1.2, organics: 0.55, ice: 0.4 } },
  volcanic: { name: "Volcanic Planet", req: "planetaryIndustry", cost: { steel: 180, quantumChips: 8, energy: 900 }, bonus: { rareMinerals: 0.9, silicon: 0.7 } },
};

const megaDefs = {
  orbitalFactory: { name: "Orbital Factory", req: "dysonEngineering", cost: { industrialFrames: 220, processors: 90, energy: 5000 }, effect: "All fabrication +35%" },
  dysonSwarm: { name: "Dyson Swarm", req: "dysonEngineering", cost: { quantumChips: 80, darkMatterCores: 30, energy: 8000 }, effect: "Massive energy scaling" },
  shipyard: { name: "Interstellar Shipyard", req: "galacticManufacturing", cost: { industrialFrames: 400, quantumChips: 120, energy: 14000 }, effect: "System essence generation" },
  matterSynth: { name: "Matter Synthesizer", req: "galacticManufacturing", cost: { darkMatterCores: 80, quantumChips: 160, energy: 25000 }, effect: "Convert energy to high-tier materials" },
};

function fmt(n) {
  if (!isFinite(n)) return "∞";
  if (Math.abs(n) < 1000) return n.toFixed(n >= 10 ? 1 : 2);
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mant = n / 10 ** exp;
  return `${mant.toFixed(2)}e${exp}`;
}

function hasCost(cost, mult = 1) {
  return Object.entries(cost).every(([k, v]) => (state.resources[k] || 0) >= v * mult);
}
function spend(cost, mult = 1) {
  for (const [k, v] of Object.entries(cost)) state.resources[k] = (state.resources[k] || 0) - v * mult;
}
function addLog(text) {
  state.logs.unshift(`[${new Date().toLocaleTimeString()}] ${text}`);
  state.logs = state.logs.slice(0, 80);
}

function totalAutomationBonus() {
  let bonus = 1;
  if (state.automation.transportDrones) bonus *= 1.10;
  if (state.automation.conveyorBelts) bonus *= 1.15;
  if (state.automation.logisticsHubs) bonus *= 1.20;
  if (state.automation.aiManagers) bonus *= 1.35;
  if (state.automation.optimizationCore) bonus *= 1.60;
  const dmMulti = 1 + state.resources.darkMatter * 0.02;
  return bonus * dmMulti;
}

function canUnlock(req) { return !req || state.research[req]; }

function manualMine() {
  const bonus = totalAutomationBonus();
  state.resources.rock += 1.5 * bonus;
  state.resources.ironOre += 0.2 * bonus;
  state.resources.copperOre += 0.2 * bonus;
  state.resources.energy = Math.max(0, state.resources.energy - 0.1);
}

function craftRecipes(dt) {
  // carbonProxy generated from organics + rare minerals as abstract carbon source.
  const carbonProxy = state.resources.organics * 0.2 + state.resources.rareMinerals * 0.1;
  for (const recipe of Object.values(recipeDefs)) {
    if (!state.research[recipe.unlockedBy]) continue;
    const cycle = dt * 0.4 * totalAutomationBonus();
    const feasible = Object.entries(recipe.in).every(([k, v]) => {
      if (k === "carbonProxy") return carbonProxy >= v * cycle;
      return (state.resources[k] || 0) >= v * cycle;
    });
    if (!feasible) continue;
    for (const [k, v] of Object.entries(recipe.in)) {
      if (k === "carbonProxy") continue;
      state.resources[k] -= v * cycle;
    }
    state.resources[recipe.out] = (state.resources[recipe.out] || 0) + recipe.amount * cycle;
  }
}

function processBuildings(dt) {
  for (const k of RESOURCE_KEYS) state.rates[k] = 0;
  const throughput = totalAutomationBonus() * (1 + state.megastructures.orbitalFactory * 0.35);

  let energySupply = 0;
  let energyDemand = 0;

  Object.entries(state.buildings).forEach(([id, count]) => {
    if (!count) return;
    const def = buildingDefs[id];
    if (def.energyProd) energySupply += def.energyProd * count * (1 + state.megastructures.dysonSwarm * 0.7);
    if (def.energy) energyDemand += def.energy * count;
  });

  state.resources.energy += energySupply * dt;
  state.rates.energy += energySupply;

  const powerRatio = energyDemand <= 0 ? 1 : Math.min(1, state.resources.energy / (energyDemand * dt + 1e-6));
  const workMult = throughput * powerRatio;

  Object.entries(state.buildings).forEach(([id, count]) => {
    if (!count) return;
    const def = buildingDefs[id];
    if (def.energy) {
      const used = def.energy * count * dt;
      state.resources.energy = Math.max(0, state.resources.energy - used);
      state.rates.energy -= def.energy * count;
    }
    if (def.prod) {
      for (const [res, perSec] of Object.entries(def.prod)) {
        const gain = perSec * count * dt * workMult;
        state.resources[res] += gain;
        state.rates[res] += perSec * count * workMult;
      }
    }
    if (def.convert) {
      const inEntries = Object.entries(def.convert).filter(([, v]) => v < 0);
      const outEntries = Object.entries(def.convert).filter(([, v]) => v > 0);
      const scale = dt * count * workMult;
      const canRun = inEntries.every(([r, v]) => (state.resources[r] || 0) >= -v * scale);
      if (!canRun) return;
      for (const [r, v] of inEntries) {
        const amt = v * scale;
        state.resources[r] += amt;
        state.rates[r] += v * count * workMult;
      }
      for (const [r, v] of outEntries) {
        const amt = v * scale;
        state.resources[r] = (state.resources[r] || 0) + amt;
        state.rates[r] += v * count * workMult;
      }
    }
  });

  processPlanets(dt, workMult);
  processMegastructures(dt, workMult);
  craftRecipes(dt);

  if (state.automation.selfExpansion && Math.random() < 0.02 * dt) {
    const ids = Object.keys(state.buildings).filter((id) => state.buildings[id] > 0);
    if (ids.length) {
      const pick = ids[Math.floor(Math.random() * ids.length)];
      state.buildings[pick] += 1;
      addLog(`Self-expansion replicated ${buildingDefs[pick].name}.`);
    }
  }

  for (const k of RESOURCE_KEYS) state.resources[k] = Math.max(0, state.resources[k] || 0);
}

function processPlanets(dt, mult) {
  Object.entries(state.planets).forEach(([id, count]) => {
    if (!count) return;
    const def = planetDefs[id];
    Object.entries(def.bonus).forEach(([r, v]) => {
      const gain = v * count * dt * mult;
      state.resources[r] += gain;
      state.rates[r] += v * count * mult;
    });
    state.resources.planetMass += 0.06 * count * dt * mult;
    state.rates.planetMass += 0.06 * count * mult;
  });
}

function processMegastructures(dt, mult) {
  state.resources.systemEssence += state.megastructures.shipyard * 0.2 * dt * mult;
  state.rates.systemEssence += state.megastructures.shipyard * 0.2 * mult;

  if (state.megastructures.matterSynth > 0) {
    const draw = Math.min(state.resources.energy, state.megastructures.matterSynth * 40 * dt);
    state.resources.energy -= draw;
    state.rates.energy -= state.megastructures.matterSynth * 40;
    state.resources.industrialFrames += draw * 0.015;
    state.resources.quantumChips += draw * 0.0018;
    state.resources.darkMatterCores += draw * 0.0003;
  }

  if (state.research.galacticManufacturing) {
    const cycle = Math.min(
      state.resources.planetMass / 10,
      state.resources.systemEssence / 2,
      state.resources.darkMatterCores / 1
    );
    if (cycle > 0.01) {
      const amt = cycle * dt * 0.08 * mult;
      state.resources.planetMass -= amt * 10;
      state.resources.systemEssence -= amt * 2;
      state.resources.darkMatterCores -= amt;
      state.resources.galaxySeeds += amt;
      state.rates.galaxySeeds += amt / dt;
    }
  }
}

function build(id, amount = 1) {
  const def = buildingDefs[id];
  if (!canUnlock(def.req)) return;
  const mult = state.automation.blueprints ? Math.min(amount, 5) : 1;
  if (!hasCost(def.cost, mult)) return;
  spend(def.cost, mult);
  state.buildings[id] += mult;
}

function buyResearch(id) {
  const def = researchDefs[id];
  if (!def || state.research[id] || !canUnlock(def.req) || !hasCost(def.cost)) return;
  spend(def.cost);
  state.research[id] = true;
  addLog(`Research completed: ${def.name}.`);
}

function unlockAutomation(id) {
  const def = automationDefs[id];
  if (state.automation[id] || !canUnlock(def.req) || !hasCost(def.cost)) return;
  spend(def.cost);
  state.automation[id] = true;
  addLog(`Automation online: ${def.name}.`);
}

function buildPlanet(id) {
  const def = planetDefs[id];
  if (!canUnlock(def.req) || !hasCost(def.cost)) return;
  spend(def.cost);
  state.planets[id] += 1;
  addLog(`New ${def.name} stabilized in your sector.`);
}

function buildMega(id) {
  const def = megaDefs[id];
  if (!canUnlock(def.req) || !hasCost(def.cost)) return;
  spend(def.cost);
  state.megastructures[id] += 1;
  addLog(`${def.name} commissioned.`);
}

function collapseYield() {
  const weighted =
    state.resources.quantumChips * 0.6 +
    state.resources.darkMatterCores * 18 +
    state.resources.planetMass * 0.3 +
    state.resources.systemEssence * 1.4 +
    state.resources.galaxySeeds * 30;
  return Math.floor(Math.pow(weighted / 120 + 1, 0.72));
}

function cosmicCollapse() {
  const gain = collapseYield();
  if (gain < 1) return;
  const keepDarkMatter = state.resources.darkMatter + gain;
  const spent = state.darkMatterSpent;

  state.resources = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0]));
  state.rates = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0]));
  state.resources.darkMatter = keepDarkMatter;
  state.darkMatterSpent = spent;
  Object.keys(state.buildings).forEach((k) => (state.buildings[k] = 0));
  Object.keys(state.planets).forEach((k) => (state.planets[k] = 0));
  Object.keys(state.megastructures).forEach((k) => (state.megastructures[k] = 0));
  Object.keys(state.automation).forEach((k) => (state.automation[k] = false));

  // Keep only dark-matter-powered meta progression research.
  const keptResearch = {};
  if (state.resources.darkMatter >= 30) keptResearch.basicAssembly = true;
  state.research = keptResearch;

  addLog(`Cosmic Collapse complete. Gained ${gain} Dark Matter.`);
}

function renderResources() {
  const visible = RESOURCE_KEYS.filter((k) => state.resources[k] > 0.01 || state.rates[k] > 0.01 || k === "rock" || k === "energy" || k === "darkMatter");
  els.resourceList.innerHTML = visible.map((k) => `
    <div class="resource">
      <strong>${k}</strong><br/>
      ${fmt(state.resources[k])}
      <div class="meta"><span>rate</span><span>${fmt(state.rates[k])}/s</span></div>
    </div>
  `).join("");
}

function renderBuildings() {
  els.buildingList.innerHTML = Object.entries(buildingDefs)
    .filter(([, d]) => canUnlock(d.req))
    .map(([id, def]) => {
      const count = state.buildings[id];
      const canBuy = hasCost(def.cost);
      const badge = def.energyProd ? `<span class="badge">+Energy</span>` : `<span class="badge">Factory</span>`;
      return `<div class="card">
        <div><strong>${def.name}</strong> ${badge}</div>
        <div class="meta"><span>Owned: ${count}</span><span>Energy ${def.energy || 0}</span></div>
        <div class="meta"><span>Cost</span><span>${Object.entries(def.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
        <button ${canBuy ? "" : "disabled"} onclick="build('${id}', 5)">Build</button>
      </div>`;
    })
    .join("");
}

function renderAutomation() {
  els.automationList.innerHTML = Object.entries(automationDefs)
    .filter(([, d]) => canUnlock(d.req))
    .map(([id, def]) => {
      const done = state.automation[id];
      return `<div class="card">
        <strong>${def.name}</strong>
        <div class="meta"><span>${def.bonus}</span><span>${done ? "ONLINE" : "OFFLINE"}</span></div>
        <div class="meta"><span>Cost</span><span>${Object.entries(def.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
        <button ${done || !hasCost(def.cost) ? "disabled" : ""} onclick="unlockAutomation('${id}')">Activate</button>
      </div>`;
    }).join("");
}

function renderResearch() {
  els.researchList.innerHTML = Object.entries(researchDefs)
     .filter(([, d]) => canUnlock(d.req))
    .map(([id, def]) => {
      const done = !!state.research[id];
      return `<div class="card">
        <strong>${def.name}</strong>
        <div>${def.desc}</div>
        <div class="meta"><span>Cost</span><span>${Object.entries(def.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
        <button ${done || !canUnlock(def.req) || !hasCost(def.cost) ? "disabled" : ""} onclick="buyResearch('${id}')">${done ? "Completed" : "Research"}</button>
      </div>`;
    }).join("");
}

function renderPlanets() {
  const unlocked = state.research.planetaryIndustry;
  if (!unlocked) {
    els.planetList.innerHTML = `<div class="card">Research <strong>Planetary Industry</strong> to unlock planet construction.</div>`;
    return;
  }
  els.planetList.innerHTML = Object.entries(planetDefs).map(([id, def]) => `
    <div class="card">
      <strong>${def.name}</strong>
      <div class="meta"><span>Owned: ${state.planets[id]}</span><span>${Object.entries(def.bonus).map(([k,v])=>`${k}+${v}/s`).join(", ")}</span></div>
      <div class="meta"><span>Cost</span><span>${Object.entries(def.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
      <button ${hasCost(def.cost) ? "" : "disabled"} onclick="buildPlanet('${id}')">Construct</button>
    </div>
  `).join("");
}

function renderMegas() {
  const avail = Object.entries(megaDefs).filter(([, d]) => canUnlock(d.req));
  if (!avail.length) {
    els.megaList.innerHTML = `<div class="card">Megastructures unlock in late-game research.</div>`;
    return;
  }
  els.megaList.innerHTML = avail.map(([id, def]) => `
    <div class="card">
      <strong>${def.name}</strong>
      <div class="meta"><span>Owned: ${state.megastructures[id]}</span><span>${def.effect}</span></div>
      <div class="meta"><span>Cost</span><span>${Object.entries(def.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
      <button ${hasCost(def.cost) ? "" : "disabled"} onclick="buildMega('${id}')">Build</button>
    </div>
  `).join("");
}

function renderPrestige() {
  const gain = collapseYield();
  els.prestigeInfo.innerHTML = `
    <div class="meta"><span>Current Dark Matter</span><span>${fmt(state.resources.darkMatter)}</span></div>
    <div class="meta"><span>Collapse Gain</span><span>+${gain}</span></div>
    <div class="meta"><span>Permanent Bonus</span><span>+2% global throughput per Dark Matter</span></div>
  `;
  els.collapseBtn.disabled = gain < 1;
}

function renderStatus() {
  const throughput = totalAutomationBonus();
  const phase = state.resources.galaxySeeds > 1 ? "Galaxy Foundry" :
    state.resources.systemEssence > 20 ? "System Architect" :
    state.resources.planetMass > 10 ? "Planet Forge" :
    state.research.processorArchitecture ? "Industrial Intelligence" :
    "Asteroid Bootstrap";
  els.statusBar.innerHTML = `
    <span class="badge">Phase: ${phase}</span>
    <span class="badge">Throughput x${fmt(throughput)}</span>
    <span class="badge">Energy ${fmt(state.resources.energy)}</span>
  `;
}

function renderLog() {
  els.logList.innerHTML = state.logs.map((item) => `<div class="log-item">${item}</div>`).join("");
}

function tick(now) {
  const dt = Math.min(1, (now - state.last) / 1000);
  state.last = now;
  processBuildings(dt);
  renderResources();
  renderBuildings();
  renderAutomation();
  renderResearch();
  renderPlanets();
  renderMegas();
  renderPrestige();
  renderStatus();
  renderLog();
  requestAnimationFrame(tick);
}

els.mineRockBtn.addEventListener("click", manualMine);
els.collapseBtn.addEventListener("click", cosmicCollapse);

Object.assign(window, { build, buyResearch, unlockAutomation, buildPlanet, buildMega });

state.resources.rock = 10;
state.resources.ironOre = 5;
state.resources.copperOre = 5;
state.resources.energy = 15;
addLog("Initialized asteroid outpost. Manual mining is active.");
requestAnimationFrame(tick);
