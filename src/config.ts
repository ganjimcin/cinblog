import type {
    SiteConfig,
    NavbarLink,
    NavbarConfig,
    SidebarConfig,
    ProfileConfig,
    AnnouncementConfig,
    PostConfig,
    FooterConfig,
    ParticleConfig,
    MusicPlayerConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";
import config from "./twilight.config.yaml";



const linkPresetNameMap: Record<string, LinkPreset> = {
    Home: LinkPreset.Home,
    Archive: LinkPreset.Archive,
    Anime: LinkPreset.Anime,
    About: LinkPreset.About,
};

const normalizeNavbarLink = (
    link: NavbarLink | LinkPreset | string,
): NavbarLink | LinkPreset => {
    if (typeof link === "string") {
        const preset = linkPresetNameMap[link];
        if (preset === undefined) {
            throw new Error(`Unknown LinkPreset: ${link}`);
        }
        return preset;
    }
    if (typeof link === "number") {
        return link;
    }
    const children = link.children?.map(normalizeNavbarLink);
    return children ? { ...link, children } : link;
};

const normalizeNavbarLinks = (links: Array<NavbarLink | LinkPreset | string>) =>
    links.map(normalizeNavbarLink);

const resolvedPostConfig: PostConfig = {
    ...config.post,
};

// Site Configuration
export const siteConfig: SiteConfig = config.site;

// Navbar Configuration
export const navbarConfig: NavbarConfig = {
    links: normalizeNavbarLinks(config.navbar.links),
};

// Sidebar Configuration
export const sidebarConfig: SidebarConfig = config.sidebar;

// Profile Configuration
export const profileConfig: ProfileConfig = config.profile;

// Announcement Configuration
export const announcementConfig: AnnouncementConfig = config.announcement;

// Post Configuration
export const postConfig: PostConfig = resolvedPostConfig;

// Footer Configuration
export const footerConfig: FooterConfig = config.footer;

// Particle Configuration
export const particleConfig: ParticleConfig = config.particle;

// Music Player Configuration
export const musicPlayerConfig: MusicPlayerConfig = config.musicPlayer;
