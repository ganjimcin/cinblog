import { LinkPreset, type NavbarLink } from "@/types/config";
import { i18n } from "@i18n/translation";
import I18nKey from "@i18n/i18nKey";


export const LinkPresets: { [key in LinkPreset]: NavbarLink } = {
    [LinkPreset.Home]: {
        name: i18n(I18nKey.home),
        url: "/",
        icon: "material-symbols:home",
        description: "El Jardín de una Pedagoga - Un rincón para reflexionar.",
    },
    [LinkPreset.Archive]: {
        name: i18n(I18nKey.archive),
        url: "/archive/",
        icon: "material-symbols:archive",
        description: "A chronological list of all published posts.",
    },
    [LinkPreset.Anime]: {
        name: "Anime",
        url: "/anime/",
        icon: "material-symbols:movie",
        description: "A collection of my favorite anime.",
    },
    [LinkPreset.About]: {
        name: i18n(I18nKey.about),
        url: "/about/",
        icon: "material-symbols:info",
        description: i18n(I18nKey.about),
    },
};