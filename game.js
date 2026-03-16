const RESOURCE_KEYS = [
  "rock", "ironOre", "copperOre", "silicon", "ice", "energy",
  "ironPlates", "copperWire", "steel", "siliconWafers", "components",
  "circuits", "motors", "processors", "industrialFrames",
  "quantumChips", "nanotubes", "darkMatterCores",
  "hydrogen", "water", "organics", "rareMinerals",
  "planetMass", "systemEssence", "galaxySeeds", "darkMatter",
];

const state = {
  resources: Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0])),
  rates: Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0])),
  logs: [],
  last: performance.now(),
  time: 0,
  activeTab: "overview",
  unlockedTabs: new Set(["overview", "factory", "transcendence"]),
  unlockedMechanics: new Set(["manualMining"]),
  buildings: {
    miningDrone: 0, oreDrill: 0, copperRig: 0, siliconHarvester: 0, iceExtractor: 0,
    smelter: 0, assembler: 0, circuitFab: 0, processorPlant: 0, quantumForge: 0,
    solarGenerator: 0, thermalGenerator: 0, fusionReactor: 0, dysonCollector: 0,
  },
  automation: {
    transportDrones: false, conveyorBelts: false, logisticsHubs: false,
    blueprints: false, aiManagers: false, selfExpansion: false, optimizationCore: false,
  },
  research: {},
  planets: { rocky: 0, gas: 0, ocean: 0, volcanic: 0 },
  megastructures: { orbitalFactory: 0, dysonSwarm: 0, shipyard: 0, matterSynth: 0 },
};

const buildingDefs = {
  miningDrone: { name: "Mining Drone", energy: 0.2, cost: { rock: 16, ironPlates: 8 }, prod: { rock: 0.8 } },
  oreDrill: { name: "Ore Drill", req: "oreProspecting", energy: 0.6, cost: { rock: 20, components: 6 }, prod: { ironOre: 0.65 } },
  copperRig: { name: "Copper Rig", req: "oreProspecting", energy: 0.6, cost: { rock: 20, components: 6 }, prod: { copperOre: 0.65 } },
  siliconHarvester: { name: "Silicon Harvester", req: "siliconExtraction", energy: 0.8, cost: { steel: 14, motors: 5 }, prod: { silicon: 0.45 } },
  iceExtractor: { name: "Ice Extractor", req: "cryoExtraction", energy: 0.8, cost: { steel: 16, motors: 6 }, prod: { ice: 0.45 } },
  smelter: { name: "Smelter", energy: 1.2, cost: { rock: 40, ironOre: 20 }, convert: { ironOre: -1.1, copperOre: -1.1, ironPlates: 0.9, copperWire: 0.85 } },
  assembler: { name: "Assembler", energy: 1.7, cost: { ironPlates: 32, copperWire: 26 }, convert: { ironPlates: -0.9, copperWire: -0.9, motors: 0.26, industrialFrames: 0.22 } },
  circuitFab: { name: "Circuit Foundry", req: "circuitry", energy: 2.2, cost: { steel: 20, siliconWafers: 16 }, convert: { copperWire: -0.95, siliconWafers: -0.75, circuits: 0.35 } },
  processorPlant: { name: "Processor Plant", req: "processorArchitecture", energy: 3.8, cost: { circuits: 40, motors: 20 }, convert: { circuits: -0.85, siliconWafers: -0.85, processors: 0.22 } },
  quantumForge: { name: "Quantum Forge", req: "quantumFabrication", energy: 9, cost: { processors: 35, industrialFrames: 30 }, convert: { processors: -0.55, nanotubes: -0.32, quantumChips: 0.1 } },
  solarGenerator: { name: "Solar Generator", cost: { ironPlates: 14, copperWire: 10 }, energyProd: 2.6 },
  thermalGenerator: { name: "Thermal Generator", req: "thermalPower", cost: { steel: 20, circuits: 10 }, convert: { hydrogen: -0.5, energy: 7 } },
  fusionReactor: { name: "Fusion Reactor", req: "fusionPower", cost: { processors: 22, quantumChips: 4 }, convert: { hydrogen: -1.2, darkMatterCores: -0.03, energy: 34 } },
  dysonCollector: { name: "Dyson Collector", req: "dysonEngineering", cost: { quantumChips: 18, industrialFrames: 70, darkMatterCores: 10 }, energyProd: 230 },
};

const researchDefs = {
  basicAssembly: { name: "Basic Assembly", cost: { ironPlates: 24, copperWire: 20 }, desc: "Unlock components." },
  oreProspecting: { name: "Ore Prospecting", req: "basicAssembly", cost: { components: 16 }, desc: "Unlock ore drills and copper rigs." },
  circuitry: { name: "Circuit Theory", req: "basicAssembly", cost: { components: 35, copperWire: 60 }, desc: "Unlock circuit foundries." },
  metallurgy: { name: "Advanced Metallurgy", req: "basicAssembly", cost: { components: 25, energy: 120 }, desc: "Unlock steel processing." },
  processorArchitecture: { name: "Processor Architecture", req: "circuitry", cost: { circuits: 42, steel: 28 }, desc: "Unlock processors + blueprints tier." },
  siliconExtraction: { name: "Silicon Extraction", req: "circuitry", cost: { steel: 18, circuits: 8 }, desc: "Unlock silicon + wafers." },
  cryoExtraction: { name: "Cryogenic Extraction", req: "processorArchitecture", cost: { processors: 10, steel: 30 }, desc: "Unlock ice extraction." },
  thermalPower: { name: "Thermal Power", req: "metallurgy", cost: { motors: 20, circuits: 20 }, desc: "Unlock thermal generation." },
  planetaryIndustry: { name: "Planetary Industry", req: "processorArchitecture", cost: { processors: 45, industrialFrames: 52 }, desc: "Unlock planet construction." },
  fusionPower: { name: "Fusion Power", req: "planetaryIndustry", cost: { processors: 25, hydrogen: 180 }, desc: "Unlock fusion reactors." },
  automationIntelligence: { name: "Automation Intelligence", req: "processorArchitecture", cost: { processors: 80, circuits: 130 }, desc: "Unlock high automation." },
  quantumFabrication: { name: "Quantum Fabrication", req: "fusionPower", cost: { processors: 70, darkMatterCores: 5 }, desc: "Unlock quantum forge." },
  nanoEngineering: { name: "Nano Engineering", req: "quantumFabrication", cost: { processors: 90, quantumChips: 12 }, desc: "Unlock nanotubes." },
  darkMatterCompression: { name: "Dark Matter Compression", req: "quantumFabrication", cost: { quantumChips: 14, energy: 1800 }, desc: "Unlock dark matter cores." },
  dysonEngineering: { name: "Dyson Engineering", req: "fusionPower", cost: { quantumChips: 24, industrialFrames: 120 }, desc: "Unlock Dyson systems + megastructures." },
  galacticManufacturing: { name: "Galactic Manufacturing", req: "dysonEngineering", cost: { planetMass: 80, systemEssence: 20, darkMatterCores: 30 }, desc: "Unlock galaxy seed synthesis." },
};

const recipeDefs = {
  components: { in: { ironPlates: 2, copperWire: 2 }, out: "components", amount: 1, unlockedBy: "basicAssembly" },
  steel: { in: { ironPlates: 3, energy: 2 }, out: "steel", amount: 1, unlockedBy: "metallurgy" },
  siliconWafers: { in: { silicon: 2, energy: 1.5 }, out: "siliconWafers", amount: 1, unlockedBy: "siliconExtraction" },
  nanotubes: { in: { carbonProxy: 1, processors: 1 }, out: "nanotubes", amount: 0.25, unlockedBy: "nanoEngineering" },
  darkMatterCores: { in: { quantumChips: 1, energy: 50 }, out: "darkMatterCores", amount: 0.04, unlockedBy: "darkMatterCompression" },
};

const automationDefs = {
  transportDrones: { name: "Transport Drones", req: "oreProspecting", cost: { components: 30, energy: 150 }, bonus: "+10% throughput" },
  conveyorBelts: { name: "Conveyor Belts", req: "basicAssembly", cost: { ironPlates: 120, copperWire: 140 }, bonus: "+15% throughput" },
  logisticsHubs: { name: "Logistics Hubs", req: "circuitry", cost: { circuits: 80, motors: 45 }, bonus: "+20% throughput" },
  blueprints: { name: "Factory Blueprints", req: "processorArchitecture", cost: { processors: 30, circuits: 150 }, bonus: "Build x5" },
  aiManagers: { name: "AI Factory Managers", req: "automationIntelligence", cost: { processors: 150, quantumChips: 20 }, bonus: "+35% throughput" },
  selfExpansion: { name: "Self-Expanding Factories", req: "automationIntelligence", cost: { industrialFrames: 120, processors: 120 }, bonus: "Auto-replicate buildings" },
  optimizationCore: { name: "Optimization Core", req: "galacticManufacturing", cost: { quantumChips: 120, darkMatterCores: 70 }, bonus: "+60% throughput" },
};

const planetDefs = {
  rocky: { name: "Rocky Planet", req: "planetaryIndustry", cost: { industrialFrames: 50, motors: 35, energy: 500 }, bonus: { ironOre: 0.95, copperOre: 0.95, rareMinerals: 0.05 } },
  gas: { name: "Gas Giant", req: "planetaryIndustry", cost: { industrialFrames: 60, processors: 20, energy: 700 }, bonus: { hydrogen: 1.7 } },
  ocean: { name: "Ocean World", req: "planetaryIndustry", cost: { steel: 120, processors: 18, energy: 650 }, bonus: { water: 1.2, organics: 0.6, ice: 0.4 } },
  volcanic: { name: "Volcanic Planet", req: "planetaryIndustry", cost: { steel: 180, quantumChips: 8, energy: 900 }, bonus: { rareMinerals: 0.9, silicon: 0.7 } },
};

const megaDefs = {
  orbitalFactory: { name: "Orbital Factory", req: "dysonEngineering", cost: { industrialFrames: 220, processors: 90, energy: 5000 }, effect: "Fabrication +35%" },
  dysonSwarm: { name: "Dyson Swarm", req: "dysonEngineering", cost: { quantumChips: 80, darkMatterCores: 30, energy: 8000 }, effect: "Power scaling" },
  shipyard: { name: "Interstellar Shipyard", req: "galacticManufacturing", cost: { industrialFrames: 400, quantumChips: 120, energy: 14000 }, effect: "System essence" },
  matterSynth: { name: "Matter Synthesizer", req: "galacticManufacturing", cost: { darkMatterCores: 80, quantumChips: 160, energy: 25000 }, effect: "Energy→materials" },
};

const els = {
  phaseLine: document.getElementById("phaseLine"),
  mineRockBtn: document.getElementById("mineRockBtn"),
  collapseBtn: document.getElementById("collapseBtn"),
  statusBar: document.getElementById("statusBar"),
  tabNav: document.getElementById("tabNav"),
  resourceList: document.getElementById("resourceList"),
  buildingList: document.getElementById("buildingList"),
  researchList: document.getElementById("researchList"),
  automationList: document.getElementById("automationList"),
  planetList: document.getElementById("planetList"),
  megaList: document.getElementById("megaList"),
  prestigeInfo: document.getElementById("prestigeInfo"),
  logList: document.getElementById("logList"),
  planetCanvas: document.getElementById("planetCanvas"),
};

function fmt(n) {
  if (!isFinite(n)) return "∞";
  if (Math.abs(n) < 1000) return n.toFixed(n >= 10 ? 1 : 2);
  const e = Math.floor(Math.log10(Math.abs(n)));
  return `${(n / 10 ** e).toFixed(2)}e${e}`;
}
const hasCost = (cost, m = 1) => Object.entries(cost).every(([k, v]) => (state.resources[k] || 0) >= v * m);
function spend(cost, m = 1) { Object.entries(cost).forEach(([k, v]) => (state.resources[k] -= v * m)); }
function canUnlock(req) { return !req || state.research[req]; }
function log(t) { state.logs.unshift(`[${new Date().toLocaleTimeString()}] ${t}`); state.logs = state.logs.slice(0, 80); }

function throughputBonus() {
  let b = 1;
  if (state.automation.transportDrones) b *= 1.1;
  if (state.automation.conveyorBelts) b *= 1.15;
  if (state.automation.logisticsHubs) b *= 1.2;
  if (state.automation.aiManagers) b *= 1.35;
  if (state.automation.optimizationCore) b *= 1.6;
  b *= 1 + state.resources.darkMatter * 0.02;
  b *= 1 + state.megastructures.orbitalFactory * 0.35;
  return b;
}

function unlockProgression() {
  const unlock = (cond, tab, mechanic, msg) => {
    if (cond && tab && !state.unlockedTabs.has(tab)) state.unlockedTabs.add(tab);
    if (cond && mechanic && !state.unlockedMechanics.has(mechanic)) {
      state.unlockedMechanics.add(mechanic);
      if (msg) log(msg);
    }
  };
  unlock(state.research.basicAssembly, null, "components", "Mechanic unlocked: component crafting.");
  unlock(state.research.circuitry, "research", "circuitry", "Mechanic unlocked: circuit manufacturing.");
  unlock(state.research.oreProspecting, "automation", "oreAutomation", "Mechanic unlocked: drone logistics.");
  unlock(state.research.planetaryIndustry, "expansion", "planets", "Mechanic unlocked: planet construction.");
  unlock(state.research.dysonEngineering, "expansion", "megastructures", "Mechanic unlocked: megastructures.");
  unlock(state.research.galacticManufacturing, null, "galaxySeeds", "Mechanic unlocked: galaxy seed synthesis.");
}

function manualMine() {
  const b = throughputBonus();
  state.resources.rock += 1.6 * b;
  state.resources.ironOre += 0.2 * b;
  state.resources.copperOre += 0.2 * b;
  state.resources.energy = Math.max(0, state.resources.energy - 0.12);
}

function processTick(dt) {
  for (const k of RESOURCE_KEYS) state.rates[k] = 0;
  const t = throughputBonus();

  let supply = 0, demand = 0;
  Object.entries(state.buildings).forEach(([id, c]) => {
    if (!c) return;
    const d = buildingDefs[id];
    if (d.energyProd) supply += d.energyProd * c * (1 + state.megastructures.dysonSwarm * 0.7);
    if (d.energy) demand += d.energy * c;
  });

  state.resources.energy += supply * dt;
  state.rates.energy += supply;
  const powerRatio = demand <= 0 ? 1 : Math.min(1, state.resources.energy / (demand * dt + 1e-6));
  const m = t * powerRatio;

  Object.entries(state.buildings).forEach(([id, c]) => {
    if (!c) return;
    const d = buildingDefs[id];
    if (d.energy) {
      state.resources.energy = Math.max(0, state.resources.energy - d.energy * c * dt);
      state.rates.energy -= d.energy * c;
    }
    if (d.prod) Object.entries(d.prod).forEach(([r, v]) => {
      state.resources[r] += v * c * dt * m;
      state.rates[r] += v * c * m;
    });
    if (d.convert) {
      const inn = Object.entries(d.convert).filter(([, v]) => v < 0);
      const out = Object.entries(d.convert).filter(([, v]) => v > 0);
      const scale = dt * c * m;
      if (!inn.every(([r, v]) => state.resources[r] >= -v * scale)) return;
      inn.forEach(([r, v]) => { state.resources[r] += v * scale; state.rates[r] += v * c * m; });
      out.forEach(([r, v]) => { state.resources[r] += v * scale; state.rates[r] += v * c * m; });
    }
  });

  Object.values(recipeDefs).forEach((recipe) => {
    if (!state.research[recipe.unlockedBy]) return;
    const cyc = dt * 0.4 * t;
    const carbonProxy = state.resources.organics * 0.2 + state.resources.rareMinerals * 0.1;
    if (!Object.entries(recipe.in).every(([k, v]) => k === "carbonProxy" ? carbonProxy >= v * cyc : state.resources[k] >= v * cyc)) return;
    Object.entries(recipe.in).forEach(([k, v]) => { if (k !== "carbonProxy") state.resources[k] -= v * cyc; });
    state.resources[recipe.out] += recipe.amount * cyc;
  });

  Object.entries(state.planets).forEach(([id, c]) => {
    if (!c) return;
    const p = planetDefs[id];
    Object.entries(p.bonus).forEach(([r, v]) => {
      state.resources[r] += v * c * dt * m;
      state.rates[r] += v * c * m;
    });
    state.resources.planetMass += 0.06 * c * dt * m;
    state.rates.planetMass += 0.06 * c * m;
  });

  state.resources.systemEssence += state.megastructures.shipyard * 0.2 * dt * m;
  state.rates.systemEssence += state.megastructures.shipyard * 0.2 * m;

  if (state.megastructures.matterSynth > 0) {
    const draw = Math.min(state.resources.energy, state.megastructures.matterSynth * 40 * dt);
    state.resources.energy -= draw;
    state.resources.industrialFrames += draw * 0.015;
    state.resources.quantumChips += draw * 0.0018;
    state.resources.darkMatterCores += draw * 0.0003;
  }

  if (state.research.galacticManufacturing) {
    const c = Math.min(state.resources.planetMass / 10, state.resources.systemEssence / 2, state.resources.darkMatterCores);
    if (c > 0.01) {
      const amt = c * dt * 0.08 * m;
      state.resources.planetMass -= amt * 10;
      state.resources.systemEssence -= amt * 2;
      state.resources.darkMatterCores -= amt;
      state.resources.galaxySeeds += amt;
      state.rates.galaxySeeds += amt / Math.max(dt, 0.001);
    }
  }

  if (state.automation.selfExpansion && Math.random() < 0.02 * dt) {
    const owned = Object.keys(state.buildings).filter((k) => state.buildings[k] > 0);
    if (owned.length) state.buildings[owned[Math.floor(Math.random() * owned.length)]] += 1;
  }

  for (const k of RESOURCE_KEYS) state.resources[k] = Math.max(0, state.resources[k]);
  state.time += dt;
}

function build(id, amount = 1) {
  const d = buildingDefs[id];
  if (!canUnlock(d.req)) return;
  const mult = state.automation.blueprints ? Math.min(5, amount) : 1;
  if (!hasCost(d.cost, mult)) return;
  spend(d.cost, mult);
  state.buildings[id] += mult;
}
function buyResearch(id) {
  const d = researchDefs[id];
  if (!d || state.research[id] || !canUnlock(d.req) || !hasCost(d.cost)) return;
  spend(d.cost);
  state.research[id] = true;
  log(`Research complete: ${d.name}.`);
}
function unlockAutomation(id) {
  const d = automationDefs[id];
  if (state.automation[id] || !canUnlock(d.req) || !hasCost(d.cost)) return;
  spend(d.cost);
  state.automation[id] = true;
  log(`Automation online: ${d.name}.`);
}
function buildPlanet(id) {
  const d = planetDefs[id];
  if (!canUnlock(d.req) || !hasCost(d.cost)) return;
  spend(d.cost);
  state.planets[id] += 1;
  log(`Constructed ${d.name}.`);
}
function buildMega(id) {
  const d = megaDefs[id];
  if (!canUnlock(d.req) || !hasCost(d.cost)) return;
  spend(d.cost);
  state.megastructures[id] += 1;
  log(`Commissioned ${d.name}.`);
}

function collapseYield() {
  const w = state.resources.quantumChips * 0.6 + state.resources.darkMatterCores * 18 + state.resources.planetMass * 0.3 + state.resources.systemEssence * 1.4 + state.resources.galaxySeeds * 30;
  return Math.floor(Math.pow(w / 120 + 1, 0.72));
}
function cosmicCollapse() {
  const gain = collapseYield();
  if (gain < 1) return;
  const keepDM = state.resources.darkMatter + gain;
  state.resources = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0]));
  state.rates = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0]));
  state.resources.darkMatter = keepDM;
  Object.keys(state.buildings).forEach((k) => state.buildings[k] = 0);
  Object.keys(state.automation).forEach((k) => state.automation[k] = false);
  Object.keys(state.planets).forEach((k) => state.planets[k] = 0);
  Object.keys(state.megastructures).forEach((k) => state.megastructures[k] = 0);
  state.research = keepDM >= 30 ? { basicAssembly: true } : {};
  state.unlockedTabs = new Set(["overview", "factory", "transcendence"]);
  state.unlockedMechanics = new Set(["manualMining"]);
  log(`Cosmic Collapse complete. +${gain} Dark Matter.`);
}

function renderTabs() {
  document.querySelectorAll("#tabNav .tab").forEach((btn) => {
    const t = btn.dataset.tab;
    btn.style.display = state.unlockedTabs.has(t) ? "inline-block" : "none";
    btn.classList.toggle("active", state.activeTab === t);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === state.activeTab));
}

function renderResources() {
  const visible = RESOURCE_KEYS.filter((k) => state.resources[k] > 0.01 || state.rates[k] > 0.01 || ["rock", "energy", "darkMatter"].includes(k));
  els.resourceList.innerHTML = visible.map((k) => `<div class="resource"><strong>${k}</strong><div>${fmt(state.resources[k])}</div><div class="meta"><span>rate</span><span>${fmt(state.rates[k])}/s</span></div></div>`).join("");
}
function renderBuildings() {
  els.buildingList.innerHTML = Object.entries(buildingDefs).filter(([, d]) => canUnlock(d.req)).map(([id, d]) => `
  <div class="card">
    <strong>${d.name}</strong>
    <div class="meta"><span>Owned: ${state.buildings[id]}</span><span>${d.energyProd ? `+${d.energyProd}/s energy` : `-${d.energy || 0}/s energy`}</span></div>
    <div class="meta"><span>Cost</span><span>${Object.entries(d.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
    <button ${hasCost(d.cost) ? "" : "disabled"} onclick="build('${id}',5)">Build</button>
  </div>`).join("");
}
function renderResearch() {
  els.researchList.innerHTML = Object.entries(researchDefs).filter(([, d]) => canUnlock(d.req)).map(([id, d]) => `
  <div class="card">
    <strong>${d.name}</strong>
    <div>${d.desc}</div>
    <div class="meta"><span>Cost</span><span>${Object.entries(d.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
    <button ${state.research[id] || !hasCost(d.cost) ? "disabled" : ""} onclick="buyResearch('${id}')">${state.research[id] ? "Completed" : "Research"}</button>
  </div>`).join("");
}
function renderAutomation() {
  els.automationList.innerHTML = Object.entries(automationDefs).filter(([, d]) => canUnlock(d.req)).map(([id, d]) => `
  <div class="card">
    <strong>${d.name}</strong>
    <div class="meta"><span>${d.bonus}</span><span>${state.automation[id] ? "ONLINE" : "OFFLINE"}</span></div>
    <div class="meta"><span>Cost</span><span>${Object.entries(d.cost).map(([k, v]) => `${k}:${fmt(v)}`).join(" | ")}</span></div>
    <button ${state.automation[id] || !hasCost(d.cost) ? "disabled" : ""} onclick="unlockAutomation('${id}')">Activate</button>
  </div>`).join("");
}
function renderPlanets() {
  if (!state.research.planetaryIndustry) {
    els.planetList.innerHTML = `<div class="card">Research <strong>Planetary Industry</strong> to unlock planetary construction.</div>`;
    return;
  }
  els.planetList.innerHTML = Object.entries(planetDefs).map(([id, d]) => `
  <div class="card"><strong>${d.name}</strong>
    <div class="meta"><span>Owned: ${state.planets[id]}</span><span>${Object.entries(d.bonus).map(([k,v])=>`${k}+${v}/s`).join(", ")}</span></div>
    <div class="meta"><span>Cost</span><span>${Object.entries(d.cost).map(([k,v])=>`${k}:${fmt(v)}`).join(" | ")}</span></div>
    <button ${hasCost(d.cost) ? "" : "disabled"} onclick="buildPlanet('${id}')">Construct</button>
  </div>`).join("");
}
function renderMegas() {
  const unlocked = Object.entries(megaDefs).filter(([, d]) => canUnlock(d.req));
  els.megaList.innerHTML = unlocked.length ? unlocked.map(([id, d]) => `
  <div class="card"><strong>${d.name}</strong>
    <div class="meta"><span>Owned: ${state.megastructures[id]}</span><span>${d.effect}</span></div>
    <div class="meta"><span>Cost</span><span>${Object.entries(d.cost).map(([k,v])=>`${k}:${fmt(v)}`).join(" | ")}</span></div>
    <button ${hasCost(d.cost) ? "" : "disabled"} onclick="buildMega('${id}')">Build</button>
  </div>`).join("") : `<div class="card">Megastructures unlock with late-game research.</div>`;
}
function renderPrestige() {
  const g = collapseYield();
  els.prestigeInfo.innerHTML = `<div class="meta"><span>Dark Matter</span><span>${fmt(state.resources.darkMatter)}</span></div>
  <div class="meta"><span>Collapse Gain</span><span>+${g}</span></div>
  <div class="meta"><span>Permanent Bonus</span><span>+2% global throughput / Dark Matter</span></div>`;
  els.collapseBtn.disabled = g < 1;
}
function renderLog() { els.logList.innerHTML = state.logs.map((l) => `<div class="log-item">${l}</div>`).join(""); }

function currentPhase() {
  if (state.resources.galaxySeeds > 1) return "Galaxy Foundry";
  if (state.resources.systemEssence > 20) return "System Architect";
  if (state.resources.planetMass > 10) return "Planet Forge";
  if (state.research.processorArchitecture) return "Industrial Intelligence";
  return "Asteroid Bootstrap";
}

function drawPlanetView() {
  const c = els.planetCanvas;
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w * 0.35, cy = h * 0.54, r = Math.min(w, h) * 0.23;

  ctx.fillStyle = "#081122";
  ctx.fillRect(0, 0, w, h);

  const planet = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.2, cx, cy, r);
  planet.addColorStop(0, "#4a7ac5");
  planet.addColorStop(1, "#243761");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = planet; ctx.fill();

  const machineCount = Object.values(state.buildings).reduce((a, b) => a + b, 0);
  const patches = Math.min(60, 4 + Math.floor(machineCount / 2));
  for (let i = 0; i < patches; i++) {
    const ang = (i / patches) * Math.PI * 2 + state.time * 0.03;
    const rr = r * (0.35 + (i % 7) / 10);
    const x = cx + Math.cos(ang) * rr;
    const y = cy + Math.sin(ang) * rr * 0.72;
    ctx.fillStyle = i % 2 ? "#90ffd177" : "#59b9ff5e";
    ctx.fillRect(x, y, 3 + (i % 3), 2 + (i % 2));
  }

  const satCount =
    (state.automation.transportDrones ? 1 : 0) +
    (state.automation.logisticsHubs ? 1 : 0) +
    Object.values(state.planets).reduce((a, b) => a + b, 0) +
    Object.values(state.megastructures).reduce((a, b) => a + b, 0);

  const orbitR = r * 1.52;
  ctx.strokeStyle = "#3f5c9377";
  ctx.beginPath(); ctx.arc(cx, cy, orbitR, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < satCount; i++) {
    const ang = state.time * 0.32 + (i * (Math.PI * 2 / Math.max(1, satCount)));
    const x = cx + Math.cos(ang) * orbitR;
    const y = cy + Math.sin(ang) * orbitR * 0.68;
    ctx.fillStyle = i < Object.values(state.megastructures).reduce((a,b)=>a+b,0) ? "#ffdf93" : "#9fd6ff";
    ctx.fillRect(x - 4, y - 2, 8, 4);
    ctx.strokeStyle = "#7fc6ff44";
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
  }

  ctx.fillStyle = "#c8dbff";
  ctx.font = "13px Inter, sans-serif";
  ctx.fillText(`Factories: ${machineCount}`, w * 0.63, h * 0.28);
  ctx.fillText(`Satellites: ${satCount}`, w * 0.63, h * 0.33);
  ctx.fillText(`Planets: ${Object.values(state.planets).reduce((a, b) => a + b, 0)}`, w * 0.63, h * 0.38);
  ctx.fillText(`Megastructures: ${Object.values(state.megastructures).reduce((a, b) => a + b, 0)}`, w * 0.63, h * 0.43);
}

function renderStatus() {
  const phase = currentPhase();
  els.phaseLine.textContent = `${phase} — automation depth: x${fmt(throughputBonus())}`;
  els.statusBar.innerHTML = `
    <span class="badge">Phase: ${phase}</span>
    <span class="badge">Throughput x${fmt(throughputBonus())}</span>
    <span class="badge">Energy ${fmt(state.resources.energy)}</span>
    <span class="badge">Dark Matter ${fmt(state.resources.darkMatter)}</span>`;
}

function renderAll() {
  unlockProgression();
  renderTabs();
  renderResources();
  renderBuildings();
  renderResearch();
  renderAutomation();
  renderPlanets();
  renderMegas();
  renderPrestige();
  renderStatus();
  renderLog();
  drawPlanetView();
}

function tick(now) {
  const dt = Math.min(1, (now - state.last) / 1000);
  state.last = now;
  processTick(dt);
  renderAll();
  requestAnimationFrame(tick);
}

els.mineRockBtn.addEventListener("click", manualMine);
els.collapseBtn.addEventListener("click", cosmicCollapse);
els.tabNav.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  const t = btn.dataset.tab;
  if (!state.unlockedTabs.has(t)) return;
  state.activeTab = t;
  renderTabs();
});

Object.assign(window, { build, buyResearch, unlockAutomation, buildPlanet, buildMega });
state.resources.rock = 12;
state.resources.ironOre = 6;
state.resources.copperOre = 6;
state.resources.energy = 18;
log("Asteroid outpost initialized. Start mining and assemble your first industrial chain.");
requestAnimationFrame(tick);
