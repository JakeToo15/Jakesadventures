export type Role = "player" | "gamemaster";
export type Rank = "Recruit" | "Veteran" | "Champion" | "Lord";
export type Permission =
  | "view_rules"
  | "use_dice_tools"
  | "view_characters"
  | "edit_own_profile"
  | "manage_sessions"
  | "manage_adventures"
  | "moderate_profiles"
  | "manage_maps"
  | "assign_roles_permissions";

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  race: string;
  career: string;
  title: string;
  rank: Rank;
  roles: Role[];
  permissions: Permission[];
  sheetUrl: string;
  faction: string;
  tags: string[];
  createdAt: number;
};

type UnknownProfile = Partial<Profile> & {
  role?: Role;
};

export type Adventure = {
  id: string;
  title: string;
  summary: string;
  status: "planned" | "active" | "done";
};

export type Session = {
  id: string;
  adventureId: string;
  title: string;
  location: string;
  agenda: string;
  startsAt: string;
  notes: string;
  gmProfileId: string;
};

export const PROFILES_KEY = "wh_profiles_v1";
export const ADVENTURES_KEY = "wh_adventures_v1";
export const SESSIONS_KEY = "wh_sessions_v1";

export const aosRaces = [
  "Stormcast Eternals",
  "Cities of Sigmar Human",
  "Cities of Sigmar Duardin",
  "Cities of Sigmar Aelf",
  "Lumineth Realm-lords",
  "Idoneth Deepkin",
  "Daughters of Khaine",
  "Sylvaneth",
  "Fyreslayers",
  "Kharadron Overlords",
  "Seraphon",
  "Slaves to Darkness",
  "Blades of Khorne",
  "Disciples of Tzeentch",
  "Maggotkin of Nurgle",
  "Hedonites of Slaanesh",
  "Skaven",
  "Ossiarch Bonereapers",
  "Soulblight Gravelords",
  "Nighthaunt",
  "Gloomspite Gitz",
  "Orruk Warclans",
  "Ogors",
  "Sons of Behemat",
];

export const aosCareers = [
  "Freeguild Soldier",
  "Freeguild Marshal",
  "Witch Hunter",
  "Battlemage",
  "Arkanaut Privateer",
  "Aether-Khemist",
  "Runeson",
  "Runemaster",
  "Vanari Sentinel",
  "Scinari Loreseeker",
  "Namarti Thrall",
  "Isharann Tidecaster",
  "Branchwych",
  "Kurnoth Tracker",
  "Knight-Incantor",
  "Lord-Celestant",
  "Chaos Marauder",
  "Chaos Sorcerer",
  "Bloodreaver",
  "Skull Priest",
  "Tzaangor Acolyte",
  "Magister",
  "Plaguebearer Cultist",
  "Putrid Blightking",
  "Slaaneshi Duelist",
  "Shardspeaker",
  "Clanrat",
  "Warlock Engineer",
  "Deathrattle Skeleton",
  "Grave Guard Captain",
  "Nighthaunt Spirit",
  "Guardian of Souls",
  "Moonclan Sneak",
  "Fungoid Shaman",
  "Ardboy",
  "Warchanter",
  "Irongut",
  "Butcher",
  "Mega-Gargant Mercenary",
  "Realm Cartographer",
  "Expedition Quartermaster",
  "Sigmarite Envoy",
  "Dawnbringer Scout",
  "Arcane Archivist",
  "Agitator",
  "Apothecary",
  "Artisan",
  "Beggar",
  "Boatman",
  "Bodyguard",
  "Bounty Hunter",
  "Camp Follower",
  "Coachman",
  "Entertainer",
  "Ferryman",
  "Fieldwarden",
  "Fisherman",
  "Forger",
  "Grave Robber",
  "Hunter",
  "Initiate",
  "Jailer",
  "Kislevite Kossar",
  "Messenger",
  "Militiaman",
  "Miner",
  "Noble",
  "Outlaw",
  "Pedlar",
  "Pit Fighter",
  "Protagonist",
  "Rat Catcher",
  "Roadwarden",
  "Scribe",
  "Seaman",
  "Servant",
  "Smuggler",
  "Soldier",
  "Student",
  "Thief",
  "Tomb Robber",
  "Tradesman",
  "Valet",
  "Vagabond",
  "Watchman",
  "Woodsman",
  "Academic",
  "Alchemist",
  "Assassin",
  "Barber-Surgeon",
  "Captain",
  "Champion",
  "Charlatan",
  "Demagogue",
  "Engineer",
  "Explorer",
  "Fence",
  "Friar",
  "Gamekeeper",
  "Guild Master",
  "Hedge Wizard",
  "Highwayman",
  "Interrogator",
  "Judicial Champion",
  "Knight",
  "Magister Lord",
  "Master Thief",
  "Merchant",
  "Militia Captain",
  "Noble Lord",
  "Outlaw Chief",
  "Physician",
  "Priest",
  "Scholar",
  "Scout",
  "Sergeant",
  "Ship Captain",
  "Spy",
  "Templar",
  "Veteran",
  "Warrior Priest",
  "Witch Hunter Captain",
  "Wizard Lord",
];

export const aosFactions = [
  "Order",
  "Chaos",
  "Death",
  "Destruction",
  "Cities of Sigmar",
  "Stormcast Eternals",
  "Slaves to Darkness",
  "Skaven Clans",
  "Soulblight Courts",
  "Free Company",
];

export const permissionLabels: Record<Permission, string> = {
  view_rules: "View Rule Library",
  use_dice_tools: "Use Dice Tools",
  view_characters: "View Character Registry",
  edit_own_profile: "Edit Own Profile",
  manage_sessions: "Manage Sessions & Schedule",
  manage_adventures: "Create / Edit Adventures",
  moderate_profiles: "Moderate All Profiles",
  manage_maps: "Manage Map Uploads & Pins",
  assign_roles_permissions: "Assign Roles & Permissions",
};

export function defaultPermissionsForRoles(roles: Role[]): Permission[] {
  const base: Permission[] = ["view_rules", "use_dice_tools", "view_characters", "edit_own_profile"];
  if (roles.includes("gamemaster")) {
    base.push("manage_sessions", "manage_adventures", "manage_maps");
  }
  return Array.from(new Set(base));
}

export function normalizeProfile(input: UnknownProfile): Profile {
  const legacyRole = input.role;
  const asAny = input as Record<string, unknown>;
  const roles =
    input.roles && input.roles.length
      ? input.roles
      : legacyRole
        ? [legacyRole]
        : (["player"] as Role[]);
  return {
    id: input.id ?? "legacy-profile",
    username: (asAny.username ?? "") as string,
    displayName: ((asAny.displayName ?? asAny.display_name ?? "Unknown") as string),
    race: input.race ?? "",
    career: input.career ?? "",
    title: input.title ?? "",
    rank: input.rank ?? "Recruit",
    roles,
    permissions:
      input.permissions && input.permissions.length
        ? input.permissions
        : defaultPermissionsForRoles(roles),
    sheetUrl: ((asAny.sheetUrl ?? asAny.sheet_url ?? "") as string),
    faction: input.faction ?? "",
    tags: input.tags ?? [],
    createdAt: ((asAny.createdAt ?? asAny.created_at ?? 0) as number),
  };
}

export const seedAdventures: Adventure[] = [
  {
    id: "adv-1",
    title: "Shadows over Altdorf",
    summary: "Rumors, disappearances, and cult activity in the docks.",
    status: "active",
  },
];

export const seedSessions: Session[] = [
  {
    id: "ses-1",
    adventureId: "adv-1",
    title: "Session 01 - Broken Sigils",
    location: "Altdorf, Dock District",
    agenda: "Investigation, social contacts, ritual site scouting",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
    notes: "Bring cult clues and dock map props.",
    gmProfileId: "",
  },
];
