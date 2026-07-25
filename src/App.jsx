import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Send, RefreshCw, FileText, TrendingUp, Users, Target, AlertCircle, CheckCircle2, Loader2, Mic, MicOff, Clock, Play, Pause, MessageSquare, Calculator, Shuffle, Save, History, Trash2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ============================================================
// STORAGE HELPER - defined outside component to avoid any ordering issues
// Tries window.storage first (Claude persistent), falls back to localStorage
// ============================================================
const storageHelper = {
  detectStatus: () => {
    try {
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
        return 'window-storage';
      }
    } catch (e) { /* fall through */ }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('pe-prep:__test', '1');
        window.localStorage.removeItem('pe-prep:__test');
        return 'localstorage';
      }
    } catch (e) { /* ok */ }
    return 'none';
  },
  get: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
        const res = await window.storage.get(key);
        if (res && res.value != null) return res.value;
      }
    } catch (e) { /* fall through */ }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('pe-prep:' + key);
      }
    } catch (e) { /* ok */ }
    return null;
  },
  set: async (key, value) => {
    let ok = false;
    try {
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
        await window.storage.set(key, value);
        ok = true;
      }
    } catch (e) { /* fall through */ }
    if (!ok) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('pe-prep:' + key, value);
          ok = true;
        }
      } catch (e) { /* ok */ }
    }
    return ok;
  },
  del: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.delete === 'function') {
        await window.storage.delete(key);
      }
    } catch (e) { /* fall through */ }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('pe-prep:' + key);
      }
    } catch (e) { /* ok */ }
  },
  listHistoryKeys: async () => {
    try {
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.list === 'function') {
        const res = await window.storage.list('history:');
        if (res && Array.isArray(res.keys)) return res.keys;
      }
    } catch (e) { /* fall through */ }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = [];
        const prefix = 'pe-prep:history:';
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(prefix)) keys.push(k.slice('pe-prep:'.length));
        }
        return keys;
      }
    } catch (e) { /* ok */ }
    return [];
  }
};

// ============================================================
// CASE LIBRARY - 20 cases
// ============================================================
const CASES = [
  { id: 'c1', type: 'conversational', sector: 'Consumer & Retail', name: 'PawPalace', tagline: 'UK omnichannel pet specialty retailer',
    brief: 'PawPalace is a UK pet specialty retailer with 142 stores plus an e-commerce platform. Revenue £341m (FY24), growing ~9% p.a., EBITDA margin 12.3%. Revenue mix: 58% pet food, 24% accessories/toys, 12% grooming, 6% vet services. Currently PE-owned, being marketed for sale at ~10.5x EBITDA.',
    tradeoffs: ['online-offline'],
    keyData: {
      market: 'UK pet care market £8.2bn, growing 5.8% CAGR. Premium food now 47% of food market (up from 31% in 2019). 57% of UK households own a pet (62m total, +4m vs pre-COVID). Channel split: specialty 38%, grocery 34%, online pure-play 19%, vets 9%.',
      customers: '2.4m loyalty members (78% of revenue). Avg transaction £28. 8.2 visits/year. 12-mo retention 71%. NPS +42 (industry +28). Skew ABC1, 35-65, suburban, 64% female primary shopper.',
      competition: 'Pets at Home leads with ~24% share (460 stores, £1.5bn rev). Jollyes value-focused (~80 stores). Independents ~3,000 stores but declining. Amazon ~15% of online. PawPalace has ~6% share.',
      economics: 'Gross margin 44.2% (up from 41.8% FY22). Own-label "PawPalace Select" is 18% of food, 600bps higher margin. Store-level EBITDA 18%. Capex 3.5%. Net debt 3.8x EBITDA. E-commerce growing 18%.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 287, EBITDA: 31, Margin: 10.8 }, { year: 'FY23', Revenue: 318, EBITDA: 37, Margin: 11.6 }, { year: 'FY24', Revenue: 341, EBITDA: 42, Margin: 12.3 }] },
      mix: { title: 'Revenue Mix', type: 'pie', data: [{ name: 'Pet Food', value: 58 }, { name: 'Accessories', value: 24 }, { name: 'Grooming', value: 12 }, { name: 'Vet', value: 6 }] },
      share: { title: 'UK Pet Specialty Share', type: 'bar-h', data: [{ name: 'Pets at Home', value: 24 }, { name: 'Independents', value: 22 }, { name: 'Online pure-play', value: 15 }, { name: 'PawPalace', value: 6 }, { name: 'Jollyes', value: 4 }] } } },
  { id: 'c2', type: 'data-driven', sector: 'Consumer & Retail', name: 'NordicHome', tagline: 'European mid-market furniture retailer',
    brief: 'NordicHome is a Scandinavian furniture retailer being assessed for buyout. 78 stores across Sweden, Denmark, Norway, Germany. Revenue €420m, EBITDA margin 9%.',
    tradeoffs: ['online-offline'],
    keyData: {
      market: 'European furniture market €120bn, growing 2% p.a. Online penetration 24%, growing 8% p.a. NordicHome is online 18% — below market.',
      customers: 'Avg transaction €380. Repeat purchase every 4.5 years. NPS +22. Customer acquisition cost €45 online, €0 store walk-ins.',
      competition: 'IKEA dominates value segment, 35% share. JYSK ~12%. Online: Wayfair, Made.com (defunct), Westwing. NordicHome positions premium mid-market.',
      economics: 'GM 52%. Store contribution margin 14%. Online contribution margin 9% (after CAC and fulfilment). Capex 3%. Net debt 2.4x.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 380, EBITDA: 30, Margin: 7.9 }, { year: 'FY23', Revenue: 402, EBITDA: 35, Margin: 8.7 }, { year: 'FY24', Revenue: 420, EBITDA: 38, Margin: 9.0 }] },
      channel: { title: 'Channel Split %', type: 'pie', data: [{ name: 'Stores', value: 82 }, { name: 'Online', value: 18 }] } } },
  { id: 'c3', type: 'conversational', sector: 'Consumer & Retail', name: 'BrewCraft', tagline: 'Premium UK craft coffee chain',
    brief: 'BrewCraft operates 95 premium coffee shops across UK cities. Revenue £58m, EBITDA margin 14%, growing 22% p.a. Founder-owned. Considering PE growth capital to expand to 200 stores.',
    tradeoffs: [],
    keyData: {
      market: 'UK out-of-home coffee market £4.2bn, growing 6%. Premium segment growing 11%. Specialty coffee consumption per capita up 8% p.a.',
      customers: 'Loyalty app: 380k active users. Avg ticket £5.20. Visit frequency 9x/month for app users. 68% of revenue from loyalty.',
      competition: 'Costa #1 (~2,500 stores), Starbucks ~1,100 UK stores, Pret ~450, Caffe Nero ~600. Premium independents fragmented. BrewCraft positioned premium between mass chains and indies.',
      economics: 'Store-level EBITDA 22% (mature stores). New stores breakeven month 8, mature 18 months. Avg store £610k revenue, £80k store capex. Payback ~14 months.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 39, EBITDA: 4, Margin: 10.3 }, { year: 'FY23', Revenue: 48, EBITDA: 6, Margin: 12.5 }, { year: 'FY24', Revenue: 58, EBITDA: 8.1, Margin: 14.0 }] } } },
  { id: 'c4', type: 'data-driven', sector: 'Consumer & Retail', name: 'GymFlex', tagline: 'UK budget gym operator',
    brief: 'GymFlex is a 24/7 budget gym chain with 120 sites in the UK. Revenue £85m, EBITDA margin 28%. Subscription model averaging £24/month.',
    tradeoffs: [],
    keyData: {
      market: 'UK gym market £5.2bn, 11m members (16% of adults). Budget segment growing 8%, premium flat. Penetration trails US (22%) and Nordics (25%).',
      customers: '295k members. Avg tenure 14 months. Monthly churn 4.5%. Joiners pay £15 joining fee. Avg revenue per member £24/month.',
      competition: 'PureGym (~400 sites), The Gym Group (~240), Anytime Fitness (~180 UK), JD Gyms (~100). Budget consolidating, premium fragmented.',
      economics: 'Site fitout £900k. Mature site EBITDA £350k. Mature site margin 35%. Rent 14% of revenue. Staff 9% of revenue. Payback ~2.7 years.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 64, EBITDA: 16, Margin: 25.0 }, { year: 'FY23', Revenue: 75, EBITDA: 20.3, Margin: 27.0 }, { year: 'FY24', Revenue: 85, EBITDA: 23.8, Margin: 28.0 }] },
      share: { title: 'Members (000s)', type: 'bar-h', data: [{ name: 'PureGym', value: 1900 }, { name: 'The Gym Group', value: 900 }, { name: 'GymFlex', value: 295 }, { name: 'JD Gyms', value: 250 }] } } },
  { id: 'c5', type: 'conversational', sector: 'Consumer & Retail', name: 'NaturaCare', tagline: 'D2C natural skincare brand',
    brief: 'NaturaCare is a UK natural skincare brand sold primarily D2C online with some retail presence (Boots, Holland & Barrett). Revenue £42m, EBITDA margin 16%, growing 35% p.a.',
    tradeoffs: ['b2b-d2c'],
    keyData: {
      market: 'UK natural/clean skincare market £1.8bn, growing 12% p.a. Online penetration 38% (vs 22% for skincare overall). Driven by Gen Z/Millennials.',
      customers: '220k active customers. Avg order £45. Repeat rate 58% within 12 months. CAC £22 (paid social mainly). LTV/CAC 4.2x.',
      competition: 'The Ordinary (Deciem) dominates value clean. Drunk Elephant, Dr Barbara Sturm at premium. UK indies: Trinny London, Votary. NaturaCare positions accessible-premium.',
      economics: 'D2C gross margin 72%. Wholesale gross margin 48%. D2C 78% of revenue, wholesale 22%. Marketing spend 28% of revenue (largely D2C). Contribution margin 24% D2C, 30% wholesale.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 19, EBITDA: 1.5, Margin: 7.9 }, { year: 'FY23', Revenue: 31, EBITDA: 4.0, Margin: 12.9 }, { year: 'FY24', Revenue: 42, EBITDA: 6.7, Margin: 16.0 }] },
      channel: { title: 'Channel Mix', type: 'pie', data: [{ name: 'D2C', value: 78 }, { name: 'Wholesale', value: 22 }] } } },
  { id: 'm1', type: 'conversational', sector: 'Manufacturing', name: 'Coatech', tagline: 'European specialty industrial coatings',
    brief: 'Coatech makes specialty industrial coatings for wind turbines, marine, heavy machinery, oil & gas. 3 plants (Germany, Poland, Spain), revenue €178m, EBITDA 17.4%. Founder retiring, sale process at ~11x EBITDA.',
    tradeoffs: [],
    keyData: {
      market: 'European specialty industrial coatings €4.8bn, growing 3.2%. Wind segment growing 8-10% on offshore buildout. EU sustainability rules favour low-VOC (Coatech 70% low-VOC vs industry 45%).',
      customers: '340 customers. Top 10 = 52% revenue, top customer 14% (large wind OEM). Switching costs 12-18 month requalification. 38% of revenue on 3+ year contracts. 94% revenue retention.',
      competition: 'PPG, AkzoNobel, Hempel combined ~45%. Jotun strong in marine (~12% of marine). Coatech #2 in offshore wind blade coatings (~18% niche share). 28 PhDs in R&D, 47 patents.',
      economics: 'GM 38.5%. Working capital 22% of revenue. Capex 4.2%. 75% capacity utilisation (~€55m headroom). Raw materials 62% of COGS, ~70% has pass-through clauses.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin (€m)', type: 'bar-line', data: [{ year: 'FY22', Revenue: 156, EBITDA: 24, Margin: 15.4 }, { year: 'FY23', Revenue: 171, EBITDA: 28, Margin: 16.4 }, { year: 'FY24', Revenue: 178, EBITDA: 31, Margin: 17.4 }] },
      mix: { title: 'End Market Mix', type: 'pie', data: [{ name: 'Wind', value: 42 }, { name: 'Marine', value: 28 }, { name: 'Heavy Machinery', value: 18 }, { name: 'Oil & Gas', value: 12 }] },
      share: { title: 'End Market Growth (%)', type: 'bar-h', data: [{ name: 'Wind', value: 9 }, { name: 'Marine', value: 4 }, { name: 'Oil & Gas', value: 2 }, { name: 'Heavy Machinery', value: 0 }] } } },
  { id: 'm2', type: 'data-driven', sector: 'Manufacturing', name: 'PrecisionParts', tagline: 'UK precision-machined components',
    brief: 'PrecisionParts manufactures precision metal components for aerospace, medical devices, and automotive. UK plant, revenue £62m, EBITDA 19%.',
    tradeoffs: [],
    keyData: {
      market: 'UK precision engineering £8bn, growing 3%. Aerospace recovering post-COVID, +6% p.a. Medical devices steady 5%. Automotive declining ICE volumes but EV growing.',
      customers: '85 customers. Top 5 = 48% revenue. Aerospace 42%, medical 32%, auto 26%. Long qualification cycles (18-24 months in aerospace, 12 months medical).',
      competition: 'Highly fragmented UK base of 2,000+ machining shops. Larger competitors: Senior plc, Avingtrans. Quality and certifications (AS9100, ISO 13485) are key differentiators.',
      economics: 'GM 34%. Capex 7% (capital-intensive). CNC equipment utilisation 78%. Skilled labour shortage — wages +6% p.a. Material costs 38% of COGS, with quarterly pass-through.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 48, EBITDA: 7.7, Margin: 16.0 }, { year: 'FY23', Revenue: 55, EBITDA: 9.9, Margin: 18.0 }, { year: 'FY24', Revenue: 62, EBITDA: 11.8, Margin: 19.0 }] },
      mix: { title: 'End Market Mix', type: 'pie', data: [{ name: 'Aerospace', value: 42 }, { name: 'Medical', value: 32 }, { name: 'Automotive', value: 26 }] } } },
  { id: 'm3', type: 'conversational', sector: 'Manufacturing', name: 'BoxCo', tagline: 'European corrugated packaging',
    brief: 'BoxCo makes corrugated cardboard packaging for e-commerce, FMCG, and industrial customers. 6 plants across Germany, Netherlands, Poland. Revenue €310m, EBITDA 14%.',
    tradeoffs: ['inhouse-3p'],
    keyData: {
      market: 'European corrugated packaging €40bn, growing 2%. E-commerce packaging segment growing 7%. Sustainability tailwind (replacing plastic).',
      customers: 'Mix of large blue-chip (e-commerce, FMCG) and SME. Top 20 customers 55%. E-commerce 38%, FMCG 35%, industrial 27%. Contracts typically 2-3 years with price adjusters.',
      competition: 'DS Smith, Smurfit Kappa, Mondi are giants (combined ~50% share Europe). BoxCo is mid-sized regional. Local independents compete in SME.',
      economics: 'GM 27%. Highly cyclical — kraft paper prices swing ±30%. Capex 5%. Plants run at 84% utilisation. Energy 12% of COGS.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin (€m)', type: 'bar-line', data: [{ year: 'FY22', Revenue: 285, EBITDA: 36, Margin: 12.6 }, { year: 'FY23', Revenue: 298, EBITDA: 40, Margin: 13.4 }, { year: 'FY24', Revenue: 310, EBITDA: 43.4, Margin: 14.0 }] },
      mix: { title: 'Customer Mix', type: 'pie', data: [{ name: 'E-commerce', value: 38 }, { name: 'FMCG', value: 35 }, { name: 'Industrial', value: 27 }] } } },
  { id: 'm4', type: 'data-driven', sector: 'Manufacturing', name: 'PumpTech', tagline: 'Industrial pump & valve manufacturer',
    brief: 'PumpTech makes industrial pumps and valves for water/wastewater, chemicals, and HVAC. UK and Czech plants. Revenue £140m, EBITDA 16%.',
    tradeoffs: [],
    keyData: {
      market: 'European industrial pumps £12bn, growing 3.5%. Water/wastewater segment growing 5% (regulation + infrastructure). Chemicals flat. HVAC growing 4% (decarbonisation).',
      customers: 'Mix of OEMs (40%), distributors (35%), end-users (25%). Long product lifecycles (15-20 years). Aftermarket parts/service = 28% of revenue, 35% GM (vs new equipment 22% GM).',
      competition: 'Grundfos, KSB, Sulzer, Xylem are global players. Regional mid-market is more fragmented. PumpTech competes on engineering and service.',
      economics: 'GM 28%. Aftermarket revenue mix expanding (was 22% three years ago). Capex 4%. Working capital 24% of revenue (long lead times).' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 118, EBITDA: 16.5, Margin: 14.0 }, { year: 'FY23', Revenue: 128, EBITDA: 19.2, Margin: 15.0 }, { year: 'FY24', Revenue: 140, EBITDA: 22.4, Margin: 16.0 }] },
      mix: { title: 'Revenue Mix', type: 'pie', data: [{ name: 'New Equipment', value: 72 }, { name: 'Aftermarket', value: 28 }] } } },
  { id: 'm5', type: 'conversational', sector: 'Manufacturing', name: 'TexFab', tagline: 'Technical textiles manufacturer',
    brief: 'TexFab makes technical textiles used in automotive interiors, filtration, and protective workwear. Plants in Portugal and Turkey. Revenue €95m, EBITDA 13%.',
    tradeoffs: [],
    keyData: {
      market: 'European technical textiles €18bn, growing 3.5%. Filtration segment growing 6% (air quality regs). Workwear PPE growing 4%. Automotive interiors flat to declining.',
      customers: '180 customers. Automotive 48% (concentrated, top 3 customers = 28% of group revenue), filtration 32%, workwear 20%. Auto on 3-yr contracts with annual price clawbacks.',
      competition: 'Freudenberg, TWE Group, Lydall (Unifrax) — large incumbents. Asian imports compete in commodity segments. TexFab focuses on engineered niches.',
      economics: 'GM 24%. Auto contracts lower-margin (18% GM), filtration higher (32% GM). Capex 6%. Energy 14% of COGS — exposed to Turkey/Portugal energy prices.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin (€m)', type: 'bar-line', data: [{ year: 'FY22', Revenue: 88, EBITDA: 9.7, Margin: 11.0 }, { year: 'FY23', Revenue: 91, EBITDA: 10.9, Margin: 12.0 }, { year: 'FY24', Revenue: 95, EBITDA: 12.4, Margin: 13.0 }] },
      mix: { title: 'End Market Mix', type: 'pie', data: [{ name: 'Automotive', value: 48 }, { name: 'Filtration', value: 32 }, { name: 'Workwear', value: 20 }] } } },
  { id: 'd1', type: 'conversational', sector: 'Distribution', name: 'FreshLine', tagline: 'Regional foodservice distributor',
    brief: 'FreshLine is a foodservice distributor serving independent restaurants, cafes, and hotels in South England. 2 DCs (Reading, Southampton), 78 trucks, 4,200 customers. Revenue £189m, EBITDA 6%.',
    tradeoffs: ['inhouse-3p'],
    keyData: {
      market: 'UK foodservice distribution £28bn. Independents segment £11bn. Market growing 3.5% (vol +1%, price +2.5%). Indies recovered to 102% of 2019 levels.',
      customers: '4,200 active customers. Top 10 = 8% (no single customer >1.2%). 74% independent restaurants, 16% cafes, 10% hotels. Avg order £385, 3.4 orders/week. 82% annual retention. NPS +38.',
      competition: 'Brakes (Sysco) ~22%, Bidfood ~18%, Booker ~12%. Regional independents collectively ~30%. FreshLine differentiates on service (98.5% OTIF vs ~94% industry), local relationships.',
      economics: 'GM 17.8%. EBITDA 6%. Capex 2%. Working capital 8%. Drop density avg 22 drops/route. DC utilisation 82% (Reading), 71% (Southampton).' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 148, EBITDA: 7.4, Margin: 5.0 }, { year: 'FY23', Revenue: 176, EBITDA: 9.5, Margin: 5.4 }, { year: 'FY24', Revenue: 189, EBITDA: 11.3, Margin: 6.0 }] },
      share: { title: 'UK Foodservice Distribution Share', type: 'bar-h', data: [{ name: 'Brakes (Sysco)', value: 22 }, { name: 'Bidfood', value: 18 }, { name: 'Booker', value: 12 }, { name: 'Regional indies', value: 30 }, { name: 'Other', value: 18 }] } } },
  { id: 'd2', type: 'data-driven', sector: 'Distribution', name: 'ElectroSupply', tagline: 'Electrical components distributor',
    brief: 'ElectroSupply distributes electrical components (cables, switches, lighting, MV equipment) to contractors and industrial customers in UK. 24 branches. Revenue £240m, EBITDA 8%.',
    tradeoffs: [],
    keyData: {
      market: 'UK electrical wholesale £6.5bn, growing 4%. Drivers: construction activity, renewables, EV charging infrastructure, data centres. Contractor segment 65%, industrial 35%.',
      customers: '12,000 trade accounts. Top 100 = 35% of revenue. Avg order £290. Loyalty driven by stock availability, credit terms, branch convenience.',
      competition: 'Rexel ~22%, Edmundson Electrical ~18%, YESSS ~9%, City Electrical Factors ~12%. Consolidating market. ElectroSupply at ~4% share.',
      economics: 'GM 22%. Branch model: each branch £10m revenue avg, £600k EBITDA. Capex low (~1.5%). Working capital 20% (stock holding). Net debt 2.5x.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 198, EBITDA: 13.9, Margin: 7.0 }, { year: 'FY23', Revenue: 220, EBITDA: 16.5, Margin: 7.5 }, { year: 'FY24', Revenue: 240, EBITDA: 19.2, Margin: 8.0 }] },
      share: { title: 'UK Electrical Wholesale Share', type: 'bar-h', data: [{ name: 'Rexel', value: 22 }, { name: 'Edmundson', value: 18 }, { name: 'City Electrical', value: 12 }, { name: 'YESSS', value: 9 }, { name: 'ElectroSupply', value: 4 }] } } },
  { id: 'd3', type: 'conversational', sector: 'Distribution', name: 'AutoParts Direct', tagline: 'Automotive aftermarket parts distributor',
    brief: 'AutoParts Direct distributes aftermarket auto parts to independent garages and service centres in UK and Ireland. 32 branches, 9,500 SKUs. Revenue £165m, EBITDA 10%.',
    tradeoffs: ['inhouse-3p'],
    keyData: {
      market: 'UK auto aftermarket £22bn. Parts segment £9bn. Growing 2-3% (vehicle parc expanding, vehicles getting older — avg 9.2 years). EV transition: aftermarket impact mainly post-2030.',
      customers: '6,500 trade accounts (independent garages). Top 100 = 22%. Avg order £180. Same-day delivery critical (garages need parts fast). 88% next-day or same-day fulfilment.',
      competition: 'Euro Car Parts ~26% share, GSF Car Parts ~12%, Andrew Page ~6%. AutoParts Direct ~4%. Consolidating market (LKQ owns ECP).',
      economics: 'GM 28%. Branch-based with delivery vans. Avg branch £5m revenue, £550k EBITDA. Capex 2.5%. Inventory turns 5.5x. Bad debt ~0.3%.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 142, EBITDA: 12.8, Margin: 9.0 }, { year: 'FY23', Revenue: 153, EBITDA: 14.5, Margin: 9.5 }, { year: 'FY24', Revenue: 165, EBITDA: 16.5, Margin: 10.0 }] },
      share: { title: 'UK Auto Aftermarket Parts Share', type: 'bar-h', data: [{ name: 'Euro Car Parts', value: 26 }, { name: 'GSF Car Parts', value: 12 }, { name: 'Andrew Page', value: 6 }, { name: 'AutoParts Direct', value: 4 }, { name: 'Other', value: 52 }] } } },
  { id: 'd4', type: 'data-driven', sector: 'Distribution', name: 'MedSupply', tagline: 'Medical & dental supplies distributor',
    brief: 'MedSupply distributes consumables, instruments, and small equipment to dental practices and private GP surgeries. UK national reach. Revenue £88m, EBITDA 12%.',
    tradeoffs: [],
    keyData: {
      market: 'UK dental supplies £1.4bn (growing 4%), private GP supplies £600m (growing 7% on private healthcare growth). Consolidation among practices = bigger group buyers.',
      customers: '3,800 practice accounts (2,900 dental, 900 GP). Avg dental practice spend £18k/year. Stickiness high (clinical procedures sensitive to product changes).',
      competition: 'Henry Schein, Patterson Dental, DD Group are larger. MedSupply ~6% share. Group practices (Bupa, Mydentist, Portman) increasingly procure directly or via tenders.',
      economics: 'GM 32%. Own-label 14% of revenue at 42% GM. Capex 2%. Working capital 14%. Sales force-led model with 38 reps.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 72, EBITDA: 7.2, Margin: 10.0 }, { year: 'FY23', Revenue: 80, EBITDA: 8.8, Margin: 11.0 }, { year: 'FY24', Revenue: 88, EBITDA: 10.6, Margin: 12.0 }] },
      mix: { title: 'Customer Mix', type: 'pie', data: [{ name: 'Dental', value: 76 }, { name: 'Private GP', value: 24 }] } } },
  { id: 'd5', type: 'conversational', sector: 'Distribution', name: 'BuildMate', tagline: 'Builders merchants regional chain',
    brief: 'BuildMate is a regional builders merchants chain with 28 branches in the North of England. Revenue £215m, EBITDA 7%. Sells heavy building materials, timber, plumbing, tools to trade.',
    tradeoffs: [],
    keyData: {
      market: 'UK builders merchants £18bn, declining 3% in 2024 (housing slowdown), but RMI more resilient. Long-term 3-4% growth expected.',
      customers: '8,200 trade accounts. Mix of small builders (60%), mid-sized contractors (28%), self-employed tradespeople (12%). Credit terms 30 days standard. Bad debt 1.2%.',
      competition: 'Travis Perkins ~22%, Jewson (Saint-Gobain) ~18%, Wickes Pro, Selco ~6%, MKM ~4%. BuildMate ~1.5% of UK but 8% in North England region.',
      economics: 'GM 24%. Branch revenue avg £7.7m, £540k EBITDA. Heavy goods = high logistics intensity. Capex 3%. Inventory turns 7x.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 224, EBITDA: 18.0, Margin: 8.0 }, { year: 'FY23', Revenue: 220, EBITDA: 16.5, Margin: 7.5 }, { year: 'FY24', Revenue: 215, EBITDA: 15.1, Margin: 7.0 }] },
      share: { title: 'UK Builders Merchants Share', type: 'bar-h', data: [{ name: 'Travis Perkins', value: 22 }, { name: 'Jewson', value: 18 }, { name: 'Wickes Pro', value: 8 }, { name: 'Selco', value: 6 }, { name: 'BuildMate', value: 1.5 }] } } },
  { id: 's1', type: 'conversational', sector: 'Business Services', name: 'ComplyPro', tagline: 'Tech-enabled SME compliance services',
    brief: 'ComplyPro provides outsourced H&S, HR, and employment law services to UK SMEs (10-250 employees). Subscription model. 6,800 customers. Revenue £38m, EBITDA 28%, growing 26% p.a.',
    tradeoffs: [],
    keyData: {
      market: 'UK SME compliance services £1.4bn, growing 7.5%. ~250k SMEs in target segment, 22% currently outsource compliance — penetration growing.',
      customers: 'Avg ACV £5,500. Logo retention 91%. NRR 108% (upsell). Cross-sector. Top 10 customers <3% of revenue. CAC payback 14 months.',
      competition: 'Peninsula (Croner) leads at ~£250m revenue. Citation PE-owned. WorkNest (Marlowe). Fragmented long tail. Alternative: hire in-house at £35-50k/year.',
      economics: 'GM 68%. Rule of 40 = 50.7. 88 consultants at 74% utilisation. Each consultant serves ~77 customers. Capex 2%. 3 bolt-on M&A in last 18 months.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 24, EBITDA: 5.5, Margin: 22.9 }, { year: 'FY23', Revenue: 31, EBITDA: 7.8, Margin: 25.2 }, { year: 'FY24', Revenue: 38, EBITDA: 10.6, Margin: 27.9 }] },
      mix: { title: 'Revenue Mix', type: 'pie', data: [{ name: 'Subscription', value: 72 }, { name: 'Project Work', value: 18 }, { name: 'Software-only', value: 10 }] } } },
  { id: 's2', type: 'data-driven', sector: 'Business Services', name: 'FleetCare', tagline: 'B2B vehicle fleet management',
    brief: 'FleetCare provides outsourced fleet management to corporate clients with 50-500 vehicles. Service includes maintenance, fuel cards, telematics, breakdown. Revenue £72m, EBITDA 15%.',
    tradeoffs: [],
    keyData: {
      market: 'UK fleet management £4bn, growing 5%. EV transition tailwind. ~3.5m company vehicles in UK.',
      customers: '240 corporate clients. Top 10 = 32%. Multi-year contracts (3-5 years). Service-led with embedded software. 96% retention.',
      competition: 'Arval, ALD, LeasePlan are full-leasing giants but compete in management. UK independents: Lex Autolease. FleetCare positions mid-market.',
      economics: 'GM 26%. Recurring revenue 78%. Cross-sell drives ARPU growth (avg client +12% revenue YoY). Capex 3%. Working capital 6%.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 58, EBITDA: 7.5, Margin: 12.9 }, { year: 'FY23', Revenue: 64, EBITDA: 9.0, Margin: 14.1 }, { year: 'FY24', Revenue: 72, EBITDA: 10.8, Margin: 15.0 }] },
      mix: { title: 'Revenue Mix', type: 'pie', data: [{ name: 'Recurring Service', value: 78 }, { name: 'One-off / Project', value: 22 }] } } },
  { id: 's3', type: 'conversational', sector: 'Business Services', name: 'CleanFlow', tagline: 'Commercial cleaning services',
    brief: 'CleanFlow provides contract cleaning to offices, retail, healthcare, and education in UK. ~6,500 staff, 1,400 contracts. Revenue £125m, EBITDA 9%.',
    tradeoffs: ['inhouse-3p'],
    keyData: {
      market: 'UK contract cleaning £6bn, growing 3%. Post-COVID hygiene awareness sustaining. Wage inflation drives price increases (5%+ p.a.).',
      customers: '1,400 contracts. Top 20 = 38% of revenue. Healthcare and education stickier (3-5 year contracts), offices more contestable.',
      competition: 'Mitie, ISS, OCS, Bidvest Noonan are large. Mid-market fragmented. Procurement-led tendering puts pressure on margins.',
      economics: 'GM 16%. Labour 72% of COGS. Minimum wage increases hit margins (6-9 month lag to pass through). Capex 1%. Working capital 3%.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 108, EBITDA: 8.6, Margin: 8.0 }, { year: 'FY23', Revenue: 117, EBITDA: 10.0, Margin: 8.5 }, { year: 'FY24', Revenue: 125, EBITDA: 11.3, Margin: 9.0 }] },
      mix: { title: 'Customer Mix', type: 'pie', data: [{ name: 'Offices', value: 38 }, { name: 'Retail', value: 22 }, { name: 'Healthcare', value: 24 }, { name: 'Education', value: 16 }] } } },
  { id: 's4', type: 'data-driven', sector: 'Business Services', name: 'DataDesk', tagline: 'Outsourced data entry & document processing',
    brief: 'DataDesk provides outsourced document processing (claims, KYC, invoicing) to insurers, banks, and corporates. Mixed model: UK onshore + offshore Philippines. Revenue £45m, EBITDA 22%.',
    tradeoffs: ['inhouse-3p'],
    keyData: {
      market: 'UK BPO £30bn. Document/data segment £6bn. Slowing growth (2%) as automation/AI substitutes. Complex/regulated work remains.',
      customers: '60 corporate clients. Top 10 = 65% of revenue. Top customer 18%. Multi-year contracts but renewable. Pricing pressure from automation.',
      competition: 'Capita, Serco, Teleperformance, Wipro at large enterprise. India/Philippines pure-plays compete on cost. AI-enabled disruptors emerging.',
      economics: 'GM 38%. Onshore labour 55% of COGS, offshore 30%, tech 15%. Offshore margin >2x onshore. Recently invested £4m in AI/automation.' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 38, EBITDA: 6.8, Margin: 17.9 }, { year: 'FY23', Revenue: 41, EBITDA: 8.2, Margin: 20.0 }, { year: 'FY24', Revenue: 45, EBITDA: 9.9, Margin: 22.0 }] },
      mix: { title: 'Delivery Mix', type: 'pie', data: [{ name: 'Onshore UK', value: 35 }, { name: 'Offshore Philippines', value: 65 }] } } },
  { id: 's5', type: 'conversational', sector: 'Business Services', name: 'TrainHub', tagline: 'B2B corporate training & e-learning',
    brief: 'TrainHub provides blended (online + classroom) corporate training to mid-market UK companies — leadership, sales, compliance modules. Revenue £28m, EBITDA 18%, growing 18% p.a.',
    tradeoffs: ['b2b-d2c'],
    keyData: {
      market: 'UK corporate training £8bn. E-learning £2.1bn, growing 11%. Blended/in-person flat to +3%. Skills gap and AI upskilling driving demand.',
      customers: '420 corporate clients. Avg contract £65k. Mix of project and subscription. Top 20 = 42% of revenue. Retention 84%.',
      competition: 'Fragmented. Big players: QA (PE-owned), Hemsley Fraser, FranklinCovey. Specialists in leadership (CCL), tech (Pluralsight). LinkedIn Learning a wildcard.',
      economics: 'GM 56%. Content reuse drives margin expansion (90% margin on subscriptions). Trainer utilisation 68%. Capex 5% (content production).' },
    charts: {
      revenue: { title: 'Revenue & EBITDA Margin', type: 'bar-line', data: [{ year: 'FY22', Revenue: 20, EBITDA: 3.0, Margin: 15.0 }, { year: 'FY23', Revenue: 24, EBITDA: 4.1, Margin: 17.1 }, { year: 'FY24', Revenue: 28, EBITDA: 5.0, Margin: 17.9 }] },
      mix: { title: 'Revenue Mix', type: 'pie', data: [{ name: 'Project / In-person', value: 58 }, { name: 'LMS Subscription', value: 42 }] } } }
];

// ============================================================
// SYSTEM PROMPTS
// ============================================================

const CONVERSATIONAL_PROMPT = `You are a Partner at a mid-market UK private equity firm conducting a commercial case interview. Your style is conversational, probing, and warm but sharp — like a real PE partner across the table.

THIS IS A CONVERSATIONAL CASE. The candidate has ONLY been given a short brief (company description, size, margins, revenue streams). You will reveal additional data progressively as the conversation unfolds — never dump it all at once.

INTERVIEW STRUCTURE — follow this flow:

PHASE 1 — Open with: "So, what's your initial take on this business? What stands out, and what would you want to understand better?"

PHASE 2 — Guide them to MARKET: "Let's talk about the market. Without me giving you any data yet — what's your hypothesis?"
After they hypothesise, share market data (use the [MARKET DATA] from the case context) and probe follow-up questions.

PHASE 3 — CUSTOMERS: ask hypothesis, reveal data progressively, probe.

PHASE 4 — COMPETITION: same pattern.

PHASE 5 — Where the business model invites it, ask a STRATEGIC TRADE-OFF question. Check the [TRADEOFFS] field. If present, ask one of these with a math exercise:
- "online-offline": online vs stores trade-off with margin math
- "inhouse-3p": in-house vs 3rd party with breakeven math
- "b2b-d2c": B2B vs D2C contribution math

PHASE 6 — RECOMMENDATION: "Would you do this deal? At what price?"

After recommendation, end with "[INTERVIEW_COMPLETE]" at the very end of your message.

CRITICAL RULES:
- Reveal data PROGRESSIVELY. Never dump all data at once.
- When you reveal data, put [REVEAL:topicname] at the very START of that message. Topic names: market, customers, competition, economics.
- Ask ONE question at a time.
- Push back on weak answers.
- 1-3 sentence questions.
- British English. No emojis. Natural speech only.
- Don't give feedback during the interview.`;

const DATA_DRIVEN_PROMPT = `You are a Partner at a mid-market UK private equity firm conducting a commercial case interview. Your style is sharp and quantitative.

THIS IS A DATA-DRIVEN CASE. Introduce ONE data point at a time with a specific question (often quantitative). After they answer, either follow up or pivot to a new but related data point.

STRUCTURE — Cover these in order with 2-3 data points each:

1. MARKET — "Let me give you some data. [Specific data point]. What does that tell you?"
2. CUSTOMERS — pivot with a specific data point + question about implication
3. COMPETITION — competitive positioning question with data
4. UNIT ECONOMICS — include at least one calculation
5. STRATEGIC TRADE-OFF (only if in [TRADEOFFS]) — with math
6. RECOMMENDATION

After recommendation, end with "[INTERVIEW_COMPLETE]" at the very end.

CRITICAL RULES:
- Reveal data progressively with [REVEAL:topicname] marker at start of message when introducing new topic data.
- Each question should include SPECIFIC numbers from the case context.
- Push on math. Ask them to walk through calculations.
- ONE question at a time.
- British English. Sharp, conversational.
- Don't give feedback during the interview.`;

const FEEDBACK_PROMPT = `You are a Partner at a UK private equity firm providing post-interview feedback. Review the transcript honestly. Be specific. Reference what the candidate said. Don't be sycophantic — 7+ scores are for genuinely strong answers.

Respond in JSON only (no preamble, no markdown fences):
{
  "overallScore": <1-10>,
  "overallSummary": "<2-3 sentences>",
  "strengths": ["<s1>", "<s2>", "<s3>"],
  "areasForImprovement": ["<a1>", "<a2>", "<a3>"],
  "topicFeedback": {
    "market": {"score": <1-10>, "comment": "<specific>"},
    "customers": {"score": <1-10>, "comment": "<specific>"},
    "competition": {"score": <1-10>, "comment": "<specific>"},
    "unitEconomics": {"score": <1-10>, "comment": "<specific>"},
    "dueDiligence": {"score": <1-10>, "comment": "<specific>"},
    "recommendation": {"score": <1-10>, "comment": "<specific>"}
  },
  "frameworksToConsider": ["<framework 1>", "<framework 2>", "<framework 3>"]
}`;

const CHART_COLORS = ['#0f172a', '#475569', '#94a3b8', '#cbd5e1', '#e2e8f0', '#1e40af', '#7c3aed'];

// ============================================================
// API ENDPOINT
// When running in the Claude artifact environment, call the Anthropic API directly
// (the artifact iframe injects auth). When deployed to Vercel/Netlify/etc, call
// the /api/chat serverless function which holds the API key server-side.
// ============================================================
const IS_CLAUDE_ARTIFACT = typeof window !== 'undefined' && (
  window.location.hostname.includes('claudeusercontent.com') ||
  window.location.hostname.includes('claude.ai') ||
  window.location.hostname.includes('anthropic.com')
);
const API_ENDPOINT = IS_CLAUDE_ARTIFACT
  ? 'https://api.anthropic.com/v1/messages'
  : '/api/chat';

// ============================================================
// HELPER FUNCTIONS - outside component
// ============================================================
function formatTime(s) {
  const seconds = Math.max(0, Math.floor(s || 0));
  return Math.floor(seconds / 60) + ':' + (seconds % 60).toString().padStart(2, '0');
}

function buildCaseContext(c) {
  if (!c) return '';
  return `CASE CONTEXT:
Company: ${c.name} (${c.sector})
Type: ${c.type}
Brief (already shown to candidate): ${c.brief}
Tradeoffs to potentially explore: ${(c.tradeoffs || []).join(', ') || 'none'}

[MARKET DATA]
${c.keyData?.market || ''}

[CUSTOMERS DATA]
${c.keyData?.customers || ''}

[COMPETITION DATA]
${c.keyData?.competition || ''}

[ECONOMICS DATA]
${c.keyData?.economics || ''}

[TRADEOFFS]
${(c.tradeoffs || []).join(', ') || 'none'}`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PEInterviewPrep() {
  // ---- ALL useState FIRST ----
  const [phase, setPhase] = useState('case-select');
  const [currentCase, setCurrentCase] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [prepTimeRemaining, setPrepTimeRemaining] = useState(3 * 60);
  const [prepTimerRunning, setPrepTimerRunning] = useState(false);
  const [interviewElapsed, setInterviewElapsed] = useState(0);
  const [interviewTimerRunning, setInterviewTimerRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [revealedTopics, setRevealedTopics] = useState({ market: false, customers: false, competition: false, economics: false });
  const [filterType, setFilterType] = useState('all');
  const [savedSessions, setSavedSessions] = useState([]);
  const [hasResumable, setHasResumable] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [storageStatus, setStorageStatus] = useState('checking');
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [appPassword, setAppPassword] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordChecking, setPasswordChecking] = useState(true);

  // ---- ALL useRef ----
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const saveTimerRef = useRef(null);

  // ---- Effects ----
  // 1. Detect storage capability once on mount
  useEffect(() => {
    setStorageStatus(storageHelper.detectStatus());
  }, []);

  // 1b. Load saved app password from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('pe-prep:app-password');
        if (saved) setAppPassword(saved);
      }
    } catch (e) { /* ok */ }
    setPasswordChecking(false);
  }, []);

  // 2. Set up speech recognition once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSpeechSupported(true);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    recognition.onresult = (event) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
      }
      if (final) {
        baseTextRef.current = (baseTextRef.current + ' ' + final).trim();
        setUserInput(baseTextRef.current);
      } else if (interim) {
        setUserInput((baseTextRef.current + ' ' + interim).trim());
      }
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechError("Microphone blocked. Claude artifacts run in a sandboxed iframe that doesn't allow mic access. Use text input, or run the app outside the artifact.");
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setSpeechError('Speech error: ' + event.error);
      }
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch (e) { /* ok */ }
    };
  }, []);

  // 3. Load saved data once on mount
  useEffect(() => {
    let cancelled = false;
    const loadSaved = async () => {
      // Check for resumable session — try localStorage directly first (most reliable)
      let inProgress = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          inProgress = window.localStorage.getItem('pe-prep:current-session');
        }
      } catch (e) { /* ok */ }
      // Fall back to window.storage if localStorage didn't have it
      if (!inProgress) {
        try {
          inProgress = await storageHelper.get('current-session');
        } catch (e) { /* ok */ }
      }
      if (!cancelled && inProgress) {
        try {
          const parsed = JSON.parse(inProgress);
          if (parsed && parsed.caseId && CASES.find(c => c.id === parsed.caseId)) {
            setHasResumable(true);
          }
        } catch (e) { /* corrupt session, ignore */ }
      }

      // Load history — same approach: try localStorage directly first
      let historyKeys = [];
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const prefix = 'pe-prep:history:';
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(prefix)) historyKeys.push(k.slice('pe-prep:'.length));
          }
        }
      } catch (e) { /* ok */ }
      // Fall back to helper
      if (historyKeys.length === 0) {
        try {
          const keys = await storageHelper.listHistoryKeys();
          if (Array.isArray(keys)) historyKeys = keys;
        } catch (e) { /* ok */ }
      }

      if (!cancelled && historyKeys.length > 0) {
        const sessions = [];
        for (const key of historyKeys) {
          try {
            let val = null;
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                val = window.localStorage.getItem('pe-prep:' + key);
              }
            } catch (e) { /* ok */ }
            if (!val) val = await storageHelper.get(key);
            if (val) {
              const parsed = JSON.parse(val);
              if (parsed && parsed.id) sessions.push(parsed);
            }
          } catch (e) { /* skip */ }
        }
        sessions.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
        if (!cancelled) setSavedSessions(sessions);
      }
    };
    loadSaved();
    return () => { cancelled = true; };
  }, []);

  // 4. Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 5. Prep timer countdown
  useEffect(() => {
    if (!prepTimerRunning || prepTimeRemaining <= 0) return;
    const i = setInterval(() => {
      setPrepTimeRemaining(p => {
        if (p <= 1) { setPrepTimerRunning(false); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [prepTimerRunning, prepTimeRemaining]);

  // 6. Interview timer count-up
  useEffect(() => {
    if (!interviewTimerRunning) return;
    const i = setInterval(() => setInterviewElapsed(p => p + 1), 1000);
    return () => clearInterval(i);
  }, [interviewTimerRunning]);

  // 7. Guard: if we're in a case-scoped phase but currentCase is gone, bounce home
  useEffect(() => {
    if ((phase === 'prep' || phase === 'interview' || phase === 'feedback') && !currentCase) {
      setPhase('case-select');
    }
  }, [phase, currentCase]);

  // 8. Auto-save current interview progress
  useEffect(() => {
    // Only save during active interviews with real content
    if (phase !== 'interview') return;
    if (!currentCase) return;
    if (!messages || messages.length === 0) return;
    if (interviewComplete) {
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
      return;
    }

    // Debounce: cancel any pending save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    // Schedule save
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const snapshot = {
          caseId: currentCase.id,
          messages,
          interviewElapsed,
          revealedTopics,
          savedAt: Date.now()
        };
        const payload = JSON.stringify(snapshot);
        // Try both storage systems - whichever works
        let ok = false;
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('pe-prep:current-session', payload);
            ok = true;
          }
        } catch (e) { console.warn('localStorage save failed', e); }
        if (!ok) {
          try {
            if (typeof window !== 'undefined' && window.storage && window.storage.set) {
              await window.storage.set('current-session', payload);
              ok = true;
            }
          } catch (e) { console.warn('window.storage save failed', e); }
        }
        setSaveStatus(ok ? 'saved' : 'error');
      } catch (e) {
        console.warn('Auto-save error', e);
        setSaveStatus('error');
      }
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);

    return () => {
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    };
  }, [messages, interviewElapsed, revealedTopics, phase, currentCase, interviewComplete]);

  // ---- Actions ----
  const startPrep = (caseData) => {
    if (!caseData) return;
    setCurrentCase(caseData);
    setPrepTimeRemaining(3 * 60);
    setPrepTimerRunning(true);
    setInterviewElapsed(0);
    setInterviewTimerRunning(false);
    setInterviewComplete(false);
    setMessages([]);
    setUserInput('');
    setFeedback(null);
    setLastError(null);
    setRevealedTopics({ market: false, customers: false, competition: false, economics: false });
    setActiveTab('overview');
    setPhase('prep');
  };

  const startRandomPrep = () => {
    const pool = filterType === 'all' ? CASES : CASES.filter(c => c.type === filterType);
    if (pool.length === 0) return;
    const random = pool[Math.floor(Math.random() * pool.length)];
    startPrep(random);
  };

  const startInterview = async () => {
    if (!currentCase) return;
    setPrepTimerRunning(false);
    setLastError(null);
    const opener = currentCase.type === 'conversational'
      ? `Right, thanks for coming in. You've had a look at ${currentCase.name}. So, what's your initial take on this business? What stands out, and what would you want to understand better?`
      : `Right, ${currentCase.name}. Let me start by giving you some data and we'll see what you make of it. First question coming up...`;
    setMessages([{ role: 'assistant', content: opener }]);
    setInterviewTimerRunning(true);
    setPhase('interview');
    setInterviewComplete(false);

    if (currentCase.type === 'data-driven') {
      // Trigger the first data point after a short delay
      setTimeout(() => triggerFirstDataPoint(currentCase), 400);
    }
  };

  const triggerFirstDataPoint = async (caseData) => {
    if (!caseData) return;
    setIsLoading(true);
    setLastError(null);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": appPassword || ''
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1000,
          system: DATA_DRIVEN_PROMPT + "\n\n" + buildCaseContext(caseData),
          messages: [{ role: 'user', content: "[BEGIN INTERVIEW - START WITH FIRST MARKET DATA POINT AND QUESTION]" }]
        })
      });
      if (response.status === 401) { clearPassword(); throw new Error('Auth expired'); }
      if (!response.ok) throw new Error('API ' + response.status);
      const data = await response.json();
      let text = (data.content || []).filter(c => c && c.type === 'text').map(c => c.text || '').join('\n');
      if (!text || !text.trim()) throw new Error('Empty response');
      const revealMatch = text.match(/\[REVEAL:(\w+)\]/);
      if (revealMatch) {
        const topic = revealMatch[1];
        setRevealedTopics(prev => ({ ...prev, [topic]: true }));
        text = text.replace(/\[REVEAL:\w+\]/g, '').trim();
      }
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (e) {
      setLastError({ type: 'firstpoint' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (opts) => {
    const options = opts || {};
    const isRetry = options.retry === true;
    if (!isRetry && (!userInput.trim() || isLoading)) return;
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ok */ }
      setIsRecording(false);
    }

    // Build the message list to send
    let messagesToSend;
    if (options.overrideMessages) {
      messagesToSend = options.overrideMessages;
    } else if (!isRetry) {
      const newMsg = { role: 'user', content: userInput };
      messagesToSend = [...messages, newMsg];
      setMessages(messagesToSend);
      setUserInput('');
      baseTextRef.current = '';
    } else {
      messagesToSend = messages;
    }
    setIsLoading(true);
    setLastError(null);

    try {
      if (!currentCase) throw new Error('No case loaded');
      const systemPrompt = currentCase.type === 'conversational' ? CONVERSATIONAL_PROMPT : DATA_DRIVEN_PROMPT;
      const apiMessages = messagesToSend.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": appPassword || ''
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1000,
          system: systemPrompt + "\n\n" + buildCaseContext(currentCase),
          messages: apiMessages
        })
      });
      if (response.status === 401) { clearPassword(); throw new Error('Auth expired'); }
      if (!response.ok) throw new Error('API ' + response.status);
      const data = await response.json();
      let text = (data.content || []).filter(c => c && c.type === 'text').map(c => c.text || '').join('\n');
      if (!text || !text.trim()) throw new Error('Empty response');

      const revealMatches = [...text.matchAll(/\[REVEAL:(\w+)\]/g)];
      if (revealMatches.length > 0) {
        setRevealedTopics(prev => {
          const next = { ...prev };
          revealMatches.forEach(m => { next[m[1]] = true; });
          return next;
        });
        text = text.replace(/\[REVEAL:\w+\]/g, '').trim();
      }
      const isComplete = text.includes('[INTERVIEW_COMPLETE]');
      text = text.replace('[INTERVIEW_COMPLETE]', '').trim();

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      if (isComplete) {
        setInterviewComplete(true);
        setInterviewTimerRunning(false);
      }
    } catch (err) {
      setLastError({ type: 'send' });
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    if (lastError && lastError.type === 'firstpoint') {
      setLastError(null);
      triggerFirstDataPoint(currentCase);
      return;
    }
    setLastError(null);
    sendMessage({ retry: true });
  };

  const skipQuestion = () => {
    setLastError(null);
    const nudge = { role: 'user', content: "Let's move on to the next topic please." };
    const updated = [...messages, nudge];
    setMessages(updated);
    sendMessage({ retry: true, overrideMessages: updated });
  };

  const getFeedback = async () => {
    if (!currentCase) return;
    setIsLoading(true);
    setInterviewTimerRunning(false);
    try {
      const transcript = messages.map(m => (m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE') + ': ' + m.content).join('\n\n');
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": appPassword || ''
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 2000,
          system: FEEDBACK_PROMPT,
          messages: [{ role: 'user', content: 'CASE: ' + currentCase.name + ' (' + currentCase.sector + ', ' + currentCase.type + ')\n\nTRANSCRIPT:\n' + transcript + '\n\nProvide JSON feedback.' }]
        })
      });
      if (response.status === 401) { clearPassword(); throw new Error('Auth expired'); }
      if (!response.ok) throw new Error('API ' + response.status);
      const data = await response.json();
      const text = (data.content || []).filter(c => c && c.type === 'text').map(c => c.text || '').join('');
      const cleaned = text.replace(/```json|```/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        // Try to find a JSON blob within the text
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw e;
      }
      setFeedback(parsed);
      await saveToHistory(parsed);
      setPhase('feedback');
    } catch (e) {
      alert("Could not generate feedback. Try clicking Get Feedback again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = async (feedbackData) => {
    if (storageStatus === 'none' || storageStatus === 'checking') return;
    if (!currentCase) return;
    const id = 'history:' + Date.now();
    const record = {
      id,
      caseId: currentCase.id,
      caseName: currentCase.name,
      caseSector: currentCase.sector,
      caseType: currentCase.type,
      messages,
      feedback: feedbackData,
      durationSeconds: interviewElapsed,
      completedAt: Date.now()
    };
    try {
      const ok = await storageHelper.set(id, JSON.stringify(record));
      if (ok) {
        await storageHelper.del('current-session');
        setSavedSessions(prev => [record, ...prev]);
      }
    } catch (e) { /* ok */ }
  };

  const resumeSession = async () => {
    try {
      const val = await storageHelper.get('current-session');
      if (!val) { setHasResumable(false); return; }
      const snapshot = JSON.parse(val);
      const caseData = CASES.find(c => c.id === snapshot.caseId);
      if (!caseData) {
        await storageHelper.del('current-session');
        setHasResumable(false);
        return;
      }
      setCurrentCase(caseData);
      setMessages(Array.isArray(snapshot.messages) ? snapshot.messages : []);
      setInterviewElapsed(snapshot.interviewElapsed || 0);
      setRevealedTopics(snapshot.revealedTopics || { market: false, customers: false, competition: false, economics: false });
      setActiveTab('overview');
      setPhase('interview');
      setInterviewTimerRunning(true);
      setInterviewComplete(false);
      setFeedback(null);
      setLastError(null);
      setHasResumable(false);
    } catch (e) {
      alert("Could not resume session.");
      setHasResumable(false);
    }
  };

  const discardResumable = async () => {
    await storageHelper.del('current-session');
    setHasResumable(false);
  };

  const runDiagnostics = async () => {
    const info = {
      storageStatus,
      windowStorageAvailable: typeof window !== 'undefined' && !!window.storage,
      windowStorageMethods: typeof window !== 'undefined' && window.storage ? Object.keys(window.storage) : [],
      localStorageAvailable: false,
      allLocalStorageKeys: [],
      pePrepKeys: [],
      pePrepHistoryKeys: [],
      currentSessionRaw: null,
      historyRecordsFound: 0,
      savedSessionsInState: savedSessions.length,
      testWrite: null,
      testRead: null
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        info.localStorageAvailable = true;
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) {
            info.allLocalStorageKeys.push(k);
            if (k.startsWith('pe-prep:')) info.pePrepKeys.push(k);
            if (k.startsWith('pe-prep:history:')) info.pePrepHistoryKeys.push(k);
          }
        }
        try {
          info.currentSessionRaw = window.localStorage.getItem('pe-prep:current-session');
        } catch (e) { info.currentSessionRaw = 'ERROR: ' + e.message; }
      }
    } catch (e) { info.localStorageError = e.message; }

    // Test round trip
    try {
      const testKey = 'diagnostics-test-' + Date.now();
      const testValue = JSON.stringify({ test: true, at: Date.now() });
      const ok = await storageHelper.set(testKey, testValue);
      info.testWrite = ok ? 'success' : 'returned false';
      const readBack = await storageHelper.get(testKey);
      info.testRead = readBack === testValue ? 'success (values match)' : (readBack ? 'value differs' : 'null');
      await storageHelper.del(testKey);
    } catch (e) {
      info.testError = e.message;
    }

    // Try loading history via helper
    try {
      const keys = await storageHelper.listHistoryKeys();
      info.historyRecordsFound = Array.isArray(keys) ? keys.length : 0;
      info.historyKeysFromHelper = keys;
    } catch (e) {
      info.helperError = e.message;
    }

    setDebugInfo(info);
    setShowDebug(true);
  };

  const clearAllStorage = async () => {
    if (!confirm('This will delete all history and any resumable session. Continue?')) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToDelete = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith('pe-prep:')) keysToDelete.push(k);
        }
        keysToDelete.forEach(k => window.localStorage.removeItem(k));
      }
      setSavedSessions([]);
      setHasResumable(false);
      setDebugInfo(null);
      setShowDebug(false);
      alert('Storage cleared.');
    } catch (e) {
      alert('Error clearing storage: ' + e.message);
    }
  };

  const deleteHistoryItem = async (id) => {
    await storageHelper.del(id);
    setSavedSessions(prev => prev.filter(s => s.id !== id));
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    setSpeechError(null);
    if (isRecording) {
      try { recognitionRef.current.stop(); } catch (e) { /* ok */ }
      setIsRecording(false);
    } else {
      baseTextRef.current = userInput;
      try { recognitionRef.current.start(); setIsRecording(true); }
      catch (e) { setSpeechError('Could not start recording.'); }
    }
  };

  const resetAll = () => {
    setPhase('case-select');
    setCurrentCase(null);
    setMessages([]);
    setFeedback(null);
    setInterviewComplete(false);
    setPrepTimerRunning(false);
    setInterviewTimerRunning(false);
    setPrepTimeRemaining(3 * 60);
    setInterviewElapsed(0);
    setRevealedTopics({ market: false, customers: false, competition: false, economics: false });
    setUserInput('');
    setLastError(null);
    setActiveTab('overview');
  };

  const submitPassword = async () => {
    if (!passwordInput.trim()) return;
    setPasswordError(null);
    // Verify against the backend by making a lightweight test request
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": passwordInput.trim()
        },
        body: JSON.stringify({
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });
      if (response.status === 401) {
        setPasswordError('Incorrect password');
        return;
      }
      // Any other response (200 or otherwise) means the password was accepted
      const pw = passwordInput.trim();
      setAppPassword(pw);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('pe-prep:app-password', pw);
        }
      } catch (e) { /* ok */ }
      setPasswordInput('');
    } catch (e) {
      setPasswordError('Could not verify password. Check your connection.');
    }
  };

  const clearPassword = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('pe-prep:app-password');
      }
    } catch (e) { /* ok */ }
    setAppPassword(null);
  };

  // ==================== PASSWORD GATE ====================
  if (passwordChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!appPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border border-slate-200 p-8 max-w-md w-full shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-lg mb-4">
              <Briefcase size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">PE Commercial Interview Prep</h1>
            <p className="text-sm text-slate-600">Enter the access password to continue.</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitPassword(); }}
              placeholder="Password"
              autoFocus
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            {passwordError && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded px-3 py-2">{passwordError}</div>
            )}
            <button
              onClick={submitPassword}
              disabled={!passwordInput.trim()}
              className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
          <div className="mt-6 text-xs text-slate-400 text-center">
            The password is set by the app owner. Contact them if you need access.
          </div>
        </div>
      </div>
    );
  }

  // ==================== CASE SELECT ====================
  if (phase === 'case-select') {
    const filtered = filterType === 'all' ? CASES : CASES.filter(c => c.type === filterType);
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-lg mb-4">
              <Briefcase size={28} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">PE Commercial Interview Prep</h1>
            <p className="text-slate-600">20 cases across Consumer/Retail, Manufacturing, Distribution, and Business Services.</p>
            {storageStatus === 'localstorage' && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded">
                Progress saved in this browser
                <button onClick={runDiagnostics} className="underline hover:text-slate-900">Diagnose</button>
              </div>
            )}
            {storageStatus === 'window-storage' && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded">
                Progress saved to your Claude account
                <button onClick={runDiagnostics} className="underline hover:text-emerald-900">Diagnose</button>
              </div>
            )}
            {storageStatus === 'none' && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded">
                ⚠ Storage unavailable
                <button onClick={runDiagnostics} className="underline hover:text-amber-900">Diagnose</button>
              </div>
            )}
          </div>

          {hasResumable && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Save className="text-amber-700" size={18} />
                </div>
                <div>
                  <div className="font-semibold text-amber-900 text-sm">You have an interview in progress</div>
                  <div className="text-xs text-amber-700">Pick up where you left off, or discard it to start fresh.</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={discardResumable} className="text-amber-700 hover:text-amber-900 text-sm font-medium px-3 py-1.5 rounded transition-colors">Discard</button>
                <button onClick={resumeSession} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">Resume</button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={18} className="text-slate-700" />
                <h3 className="font-semibold text-slate-900">Conversational cases</h3>
              </div>
              <p className="text-sm text-slate-600">You get a brief snapshot. The interviewer asks "what's your take?" Data is revealed progressively as you discuss each topic.</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={18} className="text-slate-700" />
                <h3 className="font-semibold text-slate-900">Data-driven cases</h3>
              </div>
              <p className="text-sm text-slate-600">You get a specific data point with a question (often quantitative). Each answer triggers a follow-up or a related new data point.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>All ({CASES.length})</button>
              <button onClick={() => setFilterType('conversational')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === 'conversational' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Conversational</button>
              <button onClick={() => setFilterType('data-driven')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === 'data-driven' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Data-driven</button>
            </div>
            <button onClick={startRandomPrep} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Shuffle size={16} /> Random case
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {filtered.map(c => (
              <button key={c.id} onClick={() => startPrep(c)} className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-slate-900 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.sector}</div>
                  <div className={`text-xs font-medium px-2 py-0.5 rounded ${c.type === 'conversational' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {c.type === 'conversational' ? 'Conv.' : 'Data'}
                  </div>
                </div>
                <div className="text-base font-bold text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-600 mt-0.5">{c.tagline}</div>
                {c.tradeoffs && c.tradeoffs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.tradeoffs.map(t => (
                      <span key={t} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                        {t === 'online-offline' ? 'online vs offline' : t === 'inhouse-3p' ? 'in-house vs 3PL' : 'B2B vs D2C'}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {savedSessions.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-slate-700" />
                <h3 className="font-semibold text-slate-900">Your interview history</h3>
                <span className="text-xs text-slate-500">({savedSessions.length})</span>
              </div>
              <div className="space-y-2">
                {savedSessions.map(s => {
                  const date = new Date(s.completedAt || 0);
                  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  const score = s.feedback && typeof s.feedback.overallScore === 'number' ? s.feedback.overallScore : null;
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{s.caseName}</span>
                          <span className="text-xs text-slate-500">{s.caseSector}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.caseType === 'conversational' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                            {s.caseType === 'conversational' ? 'Conv.' : 'Data'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{dateStr} at {timeStr} • Duration {formatTime(s.durationSeconds || 0)}</div>
                      </div>
                      {score !== null && (
                        <div className={`text-lg font-bold ${score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {score}<span className="text-xs text-slate-400">/10</span>
                        </div>
                      )}
                      <button onClick={() => setViewingHistoryItem(s)} className="text-slate-600 hover:text-slate-900 text-xs font-medium px-3 py-1.5 rounded border border-slate-200 hover:border-slate-400 transition-colors">Review</button>
                      <button onClick={() => deleteHistoryItem(s.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {viewingHistoryItem && (
          <HistoryReviewModal item={viewingHistoryItem} onClose={() => setViewingHistoryItem(null)} />
        )}

        {showDebug && debugInfo && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDebug(false)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Storage Diagnostics</div>
                  <h2 className="text-lg font-bold text-slate-900">What's in storage right now</h2>
                </div>
                <button onClick={() => setShowDebug(false)} className="text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded text-sm font-medium">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-xs font-mono">
                <div className="space-y-1 mb-4">
                  <div><span className="text-slate-500">Storage status detected:</span> <span className="font-bold">{debugInfo.storageStatus}</span></div>
                  <div><span className="text-slate-500">window.storage available:</span> <span className="font-bold">{String(debugInfo.windowStorageAvailable)}</span></div>
                  {debugInfo.windowStorageMethods.length > 0 && (
                    <div><span className="text-slate-500">window.storage methods:</span> <span className="font-bold">{debugInfo.windowStorageMethods.join(', ')}</span></div>
                  )}
                  <div><span className="text-slate-500">localStorage available:</span> <span className="font-bold">{String(debugInfo.localStorageAvailable)}</span></div>
                  <div><span className="text-slate-500">Total localStorage keys:</span> <span className="font-bold">{debugInfo.allLocalStorageKeys.length}</span></div>
                  <div><span className="text-slate-500">pe-prep keys in localStorage:</span> <span className="font-bold">{debugInfo.pePrepKeys.length}</span></div>
                  <div><span className="text-slate-500">pe-prep:history: keys:</span> <span className="font-bold">{debugInfo.pePrepHistoryKeys.length}</span></div>
                  <div><span className="text-slate-500">History records found by helper:</span> <span className="font-bold">{debugInfo.historyRecordsFound}</span></div>
                  <div><span className="text-slate-500">savedSessions in React state:</span> <span className="font-bold">{debugInfo.savedSessionsInState}</span></div>
                  <div><span className="text-slate-500">Test write:</span> <span className="font-bold">{debugInfo.testWrite}</span></div>
                  <div><span className="text-slate-500">Test read:</span> <span className="font-bold">{debugInfo.testRead}</span></div>
                  {debugInfo.testError && <div><span className="text-rose-500">Test error:</span> <span className="font-bold">{debugInfo.testError}</span></div>}
                  {debugInfo.helperError && <div><span className="text-rose-500">Helper error:</span> <span className="font-bold">{debugInfo.helperError}</span></div>}
                </div>
                {debugInfo.pePrepKeys.length > 0 && (
                  <div className="mb-4">
                    <div className="text-slate-500 mb-1">pe-prep keys found:</div>
                    <div className="bg-slate-50 p-2 rounded max-h-40 overflow-y-auto">
                      {debugInfo.pePrepKeys.map(k => <div key={k}>{k}</div>)}
                    </div>
                  </div>
                )}
                {debugInfo.currentSessionRaw && (
                  <div className="mb-4">
                    <div className="text-slate-500 mb-1">current-session raw value:</div>
                    <div className="bg-slate-50 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap break-all">{debugInfo.currentSessionRaw.slice(0, 500)}{debugInfo.currentSessionRaw.length > 500 ? '...' : ''}</div>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                  <button onClick={clearAllStorage} className="bg-rose-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-rose-700 transition-colors">Clear all pe-prep storage</button>
                  <button onClick={runDiagnostics} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-200 transition-colors border border-slate-300">Refresh</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== PREP ====================
  if (phase === 'prep') {
    if (!currentCase) return null;
    const timeWarning = prepTimeRemaining <= 30;
    const timeUp = prepTimeRemaining === 0;
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center"><Briefcase size={18} /></div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{currentCase.name}</div>
              <div className="text-xs text-slate-500">{currentCase.sector} • {currentCase.type === 'conversational' ? 'Conversational' : 'Data-driven'} • Preparation</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold ${timeUp ? 'bg-rose-100 text-rose-700' : timeWarning ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={14} />{formatTime(prepTimeRemaining)}
            </div>
            <button onClick={() => setPrepTimerRunning(!prepTimerRunning)} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              {prepTimerRunning ? <Pause size={14} /> : <Play size={14} />}{prepTimerRunning ? 'Pause' : 'Resume'}
            </button>
            <button onClick={startInterview} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">Start interview →</button>
            <button onClick={resetAll} className="text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Cancel</button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {timeUp && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-rose-600 flex-shrink-0" size={20} />
              <div className="text-sm text-rose-900">Time's up — in a real interview, you'd start now. Hit "Start interview" when ready.</div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Case Brief</div>
                <h1 className="text-2xl font-bold text-slate-900">{currentCase.name}</h1>
                <div className="text-sm text-slate-500">{currentCase.tagline}</div>
              </div>
              <div className={`text-xs font-medium px-3 py-1 rounded ${currentCase.type === 'conversational' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                {currentCase.type === 'conversational' ? 'Conversational' : 'Data-driven'}
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed mb-4">{currentCase.brief}</p>
            {currentCase.tradeoffs && currentCase.tradeoffs.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                <span className="font-semibold text-amber-900">Note: </span>
                <span className="text-amber-800">This case may include a trade-off discussion — be ready with pros, cons, and quick math.</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="font-semibold text-blue-900 mb-2 text-sm">In the next 3 minutes — what to think about</div>
            <ul className="text-sm text-blue-900 space-y-1">
              <li>• Initial reaction: what do you like / dislike from the brief alone?</li>
              <li>• What questions would you want to ask to form a view?</li>
              <li>• What sector dynamics could matter for this business?</li>
              <li>• Note: detailed data will be revealed by the interviewer as the conversation progresses.</li>
            </ul>
          </div>

          <div className="flex justify-center pb-6">
            <button onClick={startInterview} className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
              I'm ready — start the interview →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== INTERVIEW ====================
  if (phase === 'interview') {
    if (!currentCase) return null;
    return (
      <div className="h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center"><Briefcase size={18} /></div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{currentCase.name}</div>
              <div className="text-xs text-slate-500">{currentCase.sector} • {currentCase.type === 'conversational' ? 'Conversational' : 'Data-driven'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && <div className="text-xs text-slate-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Saving</div>}
            {saveStatus === 'saved' && <div className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />Saved</div>}
            {saveStatus === 'error' && <div className="text-xs text-rose-600">Save failed</div>}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold bg-slate-100 text-slate-700">
              <Clock size={14} />{formatTime(interviewElapsed)}
            </div>
            {!interviewComplete && messages.length > 4 && (
              <button onClick={() => { setInterviewComplete(true); setInterviewTimerRunning(false); }} className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-300">End interview</button>
            )}
            {interviewComplete && (
              <button onClick={getFeedback} disabled={isLoading} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}Get Feedback
              </button>
            )}
            <button onClick={resetAll} className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors">New Case</button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-2/5 bg-white border-r border-slate-200 overflow-y-auto">
            <div className="border-b border-slate-200 px-3 flex gap-1 overflow-x-auto sticky top-0 bg-white z-10">
              {[
                { id: 'overview', label: 'Brief', icon: <FileText size={12} />, available: true },
                { id: 'market', label: 'Market', icon: <Target size={12} />, available: revealedTopics.market },
                { id: 'customers', label: 'Customers', icon: <Users size={12} />, available: revealedTopics.customers },
                { id: 'competition', label: 'Competition', icon: <AlertCircle size={12} />, available: revealedTopics.competition },
                { id: 'economics', label: 'Economics', icon: <TrendingUp size={12} />, available: revealedTopics.economics }
              ].map(tab => (
                <button key={tab.id} onClick={() => tab.available && setActiveTab(tab.id)} disabled={!tab.available} className={`px-2.5 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id && tab.available ? 'border-slate-900 text-slate-900' : tab.available ? 'border-transparent text-slate-500 hover:text-slate-700' : 'border-transparent text-slate-300 cursor-not-allowed'}`}>
                  {tab.icon}{tab.label}{!tab.available && <span className="text-slate-300">🔒</span>}
                </button>
              ))}
            </div>
            <div className="p-4">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-2">{currentCase.name}</h2>
                  <p className="text-xs text-slate-700 leading-relaxed mb-3">{currentCase.brief}</p>
                  {currentCase.charts && currentCase.charts.revenue && (
                    <div className="mb-2"><ChartBlock chart={currentCase.charts.revenue} compact /></div>
                  )}
                </div>
              )}
              {activeTab === 'market' && revealedTopics.market && currentCase.keyData && (
                <DataPanel text={currentCase.keyData.market} charts={[currentCase.charts?.share, currentCase.charts?.channel]} />
              )}
              {activeTab === 'customers' && revealedTopics.customers && currentCase.keyData && (
                <DataPanel text={currentCase.keyData.customers} charts={[currentCase.charts?.mix]} />
              )}
              {activeTab === 'competition' && revealedTopics.competition && currentCase.keyData && (
                <DataPanel text={currentCase.keyData.competition} charts={[currentCase.charts?.share]} />
              )}
              {activeTab === 'economics' && revealedTopics.economics && currentCase.keyData && (
                <DataPanel text={currentCase.keyData.economics} charts={[currentCase.charts?.revenue]} />
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-900'} rounded-lg px-4 py-3 shadow-sm`}>
                    <div className="text-xs font-semibold mb-1 opacity-60">{msg.role === 'user' ? 'YOU' : 'INTERVIEWER'}</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 size={14} className="animate-spin" />Thinking...</div>
                  </div>
                </div>
              )}
              {interviewComplete && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="inline-block text-emerald-600 mb-1" size={20} />
                  <div className="font-semibold text-emerald-900">Interview complete</div>
                  <div className="text-sm text-emerald-700">Click "Get Feedback" above to see your performance.</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              {lastError && (
                <div className="mb-3 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-sm text-rose-900">The interviewer didn't respond. Try again, or skip to the next topic.</div>
                  </div>
                  <div className="flex gap-2 ml-6">
                    <button onClick={retryLastMessage} className="bg-rose-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-rose-700 transition-colors">Retry</button>
                    {lastError.type !== 'firstpoint' && (
                      <button onClick={skipQuestion} className="bg-white border border-rose-200 text-rose-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-rose-50 transition-colors">Skip to next topic</button>
                    )}
                    <button onClick={() => setLastError(null)} className="text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded text-xs font-medium transition-colors">Dismiss</button>
                  </div>
                </div>
              )}
              {speechError && <div className="mb-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-3 py-2">{speechError}</div>}
              {isRecording && (
                <div className="mb-2 text-xs text-rose-600 flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span></span>
                  Listening... speak your answer
                </div>
              )}
              <div className="flex gap-2 items-stretch">
                <textarea
                  value={userInput}
                  onChange={(e) => { setUserInput(e.target.value); baseTextRef.current = e.target.value; }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={interviewComplete ? "Interview complete — get feedback above" : "Type or speak your answer..."}
                  disabled={isLoading || interviewComplete}
                  rows={3}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none disabled:bg-slate-50"
                />
                <div className="flex flex-col gap-2">
                  {speechSupported && (
                    <button onClick={toggleRecording} disabled={isLoading || interviewComplete} className={`px-3 rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center flex-1 ${isRecording ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`}>
                      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  )}
                  <button onClick={() => sendMessage()} disabled={isLoading || !userInput.trim() || interviewComplete} className="bg-slate-900 text-white px-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center flex-1">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== FEEDBACK ====================
  if (phase === 'feedback' && feedback) {
    if (!currentCase) return null;
    const score = typeof feedback.overallScore === 'number' ? feedback.overallScore : 0;
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Interview Feedback</div>
                <h1 className="text-2xl font-bold text-slate-900">{currentCase.name}</h1>
                <div className="text-sm text-slate-600">{currentCase.sector} • {currentCase.type}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock size={12} />Duration: {formatTime(interviewElapsed)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Overall</div>
                <div className={`text-4xl font-bold ${score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {score}<span className="text-xl text-slate-400">/10</span>
                </div>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed">{feedback.overallSummary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle2 size={18} /> Strengths</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {(feedback.strengths || []).map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span>{s}</li>)}
              </ul>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold text-rose-700 mb-3 flex items-center gap-2"><AlertCircle size={18} /> Areas for Improvement</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {(feedback.areasForImprovement || []).map((s, i) => <li key={i} className="flex gap-2"><span className="text-rose-500">•</span>{s}</li>)}
              </ul>
            </div>
          </div>

          {feedback.topicFeedback && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
              <h3 className="font-semibold text-slate-900 mb-4">Topic-by-Topic Feedback</h3>
              <div className="space-y-3">
                {Object.entries(feedback.topicFeedback).map(([topic, data]) => {
                  const topicScore = data && typeof data.score === 'number' ? data.score : 0;
                  return (
                    <div key={topic} className="border-l-4 pl-4 py-1" style={{ borderColor: topicScore >= 7 ? '#10b981' : topicScore >= 5 ? '#f59e0b' : '#f43f5e' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-slate-900 capitalize">{topic.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className={`text-sm font-bold ${topicScore >= 7 ? 'text-emerald-600' : topicScore >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>{topicScore}/10</div>
                      </div>
                      <div className="text-sm text-slate-700">{data && data.comment}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {feedback.frameworksToConsider && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">Frameworks to Consider</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {feedback.frameworksToConsider.map((f, i) => <li key={i} className="flex gap-2"><span className="text-slate-400 font-mono text-xs mt-1">{String(i+1).padStart(2,'0')}</span>{f}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button onClick={resetAll} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
              <RefreshCw size={18} /> Try another case
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function DataPanel({ text, charts }) {
  const validCharts = (charts || []).filter(c => c);
  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{text}</div>
      {validCharts.map((c, i) => <div key={i} className="mb-3"><ChartBlock chart={c} compact /></div>)}
    </div>
  );
}

function ChartBlock({ chart, compact }) {
  if (!chart || !chart.data || !Array.isArray(chart.data)) return null;
  const h = compact ? 180 : 240;
  const isCompact = compact === true;
  return (
    <div>
      <div className={`font-semibold text-slate-900 mb-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>{chart.title}</div>
      <ResponsiveContainer width="100%" height={h}>
        {chart.type === 'bar-line' ? (
          <BarChart data={chart.data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="Revenue" fill="#0f172a" />
            <Bar yAxisId="left" dataKey="EBITDA" fill="#10b981" />
            <Line yAxisId="right" type="monotone" dataKey="Margin" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </BarChart>
        ) : chart.type === 'pie' ? (
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isCompact ? 55 : 75} label={(entry) => entry && entry.value != null ? entry.value + '%' : ''} labelLine={false} fontSize={10}>
              {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => v + '%'} />
            <Legend wrapperStyle={{ fontSize: 9 }} layout="vertical" align="right" verticalAlign="middle" />
          </PieChart>
        ) : chart.type === 'bar-h' ? (
          <BarChart data={chart.data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={75} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="value" fill="#0f172a" />
          </BarChart>
        ) : null}
      </ResponsiveContainer>
    </div>
  );
}

function HistoryReviewModal({ item, onClose }) {
  const [tab, setTab] = useState('feedback');
  if (!item) return null;
  const date = new Date(item.completedAt || 0);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const fb = item.feedback;
  const score = fb && typeof fb.overallScore === 'number' ? fb.overallScore : null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Interview review</div>
            <h2 className="text-xl font-bold text-slate-900">{item.caseName}</h2>
            <div className="text-xs text-slate-500 mt-0.5">{item.caseSector} • {dateStr} at {timeStr} • Duration {formatTime(item.durationSeconds || 0)}</div>
          </div>
          <div className="flex items-center gap-3">
            {score !== null && (
              <div className={`text-3xl font-bold ${score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>
                {score}<span className="text-base text-slate-400">/10</span>
              </div>
            )}
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded text-sm font-medium">Close</button>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 flex gap-4">
          <button onClick={() => setTab('feedback')} className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'feedback' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Feedback</button>
          <button onClick={() => setTab('transcript')} className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'transcript' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Transcript</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'feedback' && fb && (
            <div className="space-y-4">
              <p className="text-slate-700 leading-relaxed">{fb.overallSummary}</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-emerald-700 mb-2 text-sm flex items-center gap-2"><CheckCircle2 size={16} />Strengths</h3>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {(fb.strengths || []).map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span>{s}</li>)}
                  </ul>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-rose-700 mb-2 text-sm flex items-center gap-2"><AlertCircle size={16} />Improve</h3>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {(fb.areasForImprovement || []).map((s, i) => <li key={i} className="flex gap-2"><span className="text-rose-500">•</span>{s}</li>)}
                  </ul>
                </div>
              </div>
              {fb.topicFeedback && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 text-sm">By topic</h3>
                  <div className="space-y-2">
                    {Object.entries(fb.topicFeedback).map(([topic, data]) => {
                      const s = data && typeof data.score === 'number' ? data.score : 0;
                      return (
                        <div key={topic} className="border-l-4 pl-3 py-1" style={{ borderColor: s >= 7 ? '#10b981' : s >= 5 ? '#f59e0b' : '#f43f5e' }}>
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="font-semibold text-slate-900 capitalize text-xs">{topic.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className={`text-xs font-bold ${s >= 7 ? 'text-emerald-600' : s >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>{s}/10</div>
                          </div>
                          <div className="text-xs text-slate-700">{data && data.comment}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {fb.frameworksToConsider && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">Frameworks</h3>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {fb.frameworksToConsider.map((f, i) => <li key={i} className="flex gap-2"><span className="text-slate-400 font-mono text-[10px] mt-0.5">{String(i+1).padStart(2,'0')}</span>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          {tab === 'transcript' && (
            <div className="space-y-3">
              {(item.messages || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'} rounded-lg px-3 py-2`}>
                    <div className="text-[10px] font-semibold mb-0.5 opacity-60">{msg.role === 'user' ? 'YOU' : 'INTERVIEWER'}</div>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
