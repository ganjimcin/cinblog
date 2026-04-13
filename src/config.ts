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


type ConfigFile = {
    site: SiteConfig;

    navbar: {
        links: Array<NavbarLink | LinkPreset | string>;
    };
    sidebar: SidebarConfig;
    profile: ProfileConfig;
    announcement: AnnouncementConfig;
    post: PostConfig;
    footer: FooterConfig;
    particle: ParticleConfig;
    musicPlayer: MusicPlayerConfig;
};

const linkPresetNameMap: Record<string, LinkPreset> = {
    Home: LinkPreset.Home,
    Archive: LinkPreset.Archive,
    Projects: LinkPreset.Projects,
    Skills: LinkPreset.Skills,
    Timeline: LinkPreset.Timeline,
    Diary: LinkPreset.Diary,
    Albums: LinkPreset.Albums,
    Anime: LinkPreset.Anime,
    About: LinkPreset.About,
    Friends: LinkPreset.Friends,
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

// 站点配置
export const siteConfig: SiteConfig = config.site;



// 导航栏配置
export const navbarConfig: NavbarConfig = {
    links: normalizeNavbarLinks(config.navbar.links),
};

// 侧边栏配置
export const sidebarConfig: SidebarConfig = config.sidebar;

// 资料配置
export const profileConfig: ProfileConfig = config.profile;

// 公告配置
export const announcementConfig: AnnouncementConfig = config.announcement;

// 文章配置
export const postConfig: PostConfig = resolvedPostConfig;

// 页脚配置
export const footerConfig: FooterConfig = config.footer;

// 粒子特效配置
export const particleConfig: ParticleConfig = config.particle;

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = config.musicPlayer;
