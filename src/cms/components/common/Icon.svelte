<script lang="ts">
  /**
   * Icon Component using Lucide Svelte
   * Proxies old material-symbols names to Lucide icons
   */
  import * as Icons from 'lucide-svelte';

  interface Props {
    icon: string;
    class?: string;
    style?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number | string;
    color?: string;
    strokeWidth?: number;
  }

  let {
    icon,
    class: className = "",
    style = "",
    size = "md",
    color,
    strokeWidth = 2
  }: Props = $props();

  // Mapping from Material Symbols / Legacy names to Lucide
  const mapping: Record<string, string> = {
    "material-symbols:search-rounded": "Search",
    "material-symbols:search-off-rounded": "SearchX",
    "material-symbols:grid-view-rounded": "LayoutGrid",
    "material-symbols:grid-view-outline-rounded": "LayoutGrid",
    "material-symbols:view-list-rounded": "List",
    "material-symbols:add-rounded": "Plus",
    "material-symbols:home-outline-rounded": "Home",
    "material-symbols:edit-note-outline-rounded": "SquarePen",
    "material-symbols:chrome-reader-mode-outline-rounded": "Columns2",
    "material-symbols:visibility-outline-rounded": "Eye",
    "material-symbols:settings-outline-rounded": "Settings",
    "material-symbols:check-circle": "CheckCircle2",
    "material-symbols:logout-rounded": "LogOut",
    "material-symbols:dashboard-outline-rounded": "LayoutDashboard",
    "material-symbols:eco-outline": "Leaf",
    "material-symbols:lock-person-outline-rounded": "UserLock",
    "material-symbols:format-bold-rounded": "Bold",
    "material-symbols:format-h1-rounded": "Heading1",
    "material-symbols:format-h2-rounded": "Heading2",
    "material-symbols:format-h3-rounded": "Heading3",
    "material-symbols:format-italic-rounded": "Italic",
    "material-symbols:strikethrough-s-rounded": "Strikethrough",
    "material-symbols:format-quote-rounded": "Quote",
    "material-symbols:code-rounded": "Code",
    "material-symbols:terminal-rounded": "Terminal",
    "material-symbols:horizontal-rule-rounded": "Minus",
    "material-symbols:format-list-bulleted-rounded": "List",
    "material-symbols:format-list-numbered-rounded": "ListOrdered",
    "material-symbols:article-outline": "FileText",
    "material-symbols:archive": "Archive",
    "material-symbols:link-rounded": "Link",
    "material-symbols:image-outline": "Image",
    "material-symbols:format-clear-rounded": "Eraser",
    "material-symbols:rocket-launch-outline": "Rocket",
    "material-symbols:auto-stories-outline": "BookOpenText",
    "material-symbols:award-star-outline": "Award",
    "material-symbols:timeline": "Milestone",
    "material-symbols:photo-library-outline": "Library",
    "material-symbols:all-inclusive": "Infinity",
    "material-symbols:label-outline-rounded": "Tag",
    "material-symbols:upload-rounded": "Upload",
    "material-symbols:close-rounded": "X",
    "material-symbols:check-circle-outline-rounded": "CheckCircle",
    "material-symbols:description-outline": "FileCode",
    "material-symbols:settings-outline": "Settings2",
    "material-symbols:delete-outline-rounded": "Trash2",
    "material-symbols:delete-rounded": "Trash2",
    "material-symbols:lightbulb-outline-rounded": "Lightbulb",
    "material-symbols:warning-amber-rounded": "AlertTriangle",
    "material-symbols:error-outline-rounded": "AlertCircle",
    "material-symbols:info-outline-rounded": "Info",
    "material-symbols:music-note-rounded": "Music",
    "material-symbols:video-library-rounded": "Youtube",
    "material-symbols:bar-chart-4-bars-rounded": "BarChart3",
    "material-symbols:functions-rounded": "Sigma",
    "material-symbols:visibility-off-outline-rounded": "EyeOff",
    "material-symbols:deployed-code-outline-rounded": "Cpu",
    "material-symbols:calendar-month-outline-rounded": "Calendar",
    "material-symbols:dark-mode-outline-rounded": "Moon",
    "material-symbols:light-mode-outline-rounded": "Sun",
    "material-symbols:title-rounded": "Type",
    "material-symbols:arrow-drop-down-rounded": "ChevronDown",
    "material-symbols:image-search-outline": "ImagePlus",
    "material-symbols:upload-file-outline-rounded": "FileUp",
    "material-symbols:help-outline-rounded": "HelpCircle",
    "material-symbols:account-tree-outline-rounded": "Network",
    "material-symbols:add-a-photo-outline-rounded": "ImagePlus",
    "material-symbols:shield-check-outline-rounded": "ShieldCheck",
    "material-symbols:warning-outline-rounded": "AlertTriangle",
    "material-symbols:cloud-done-outline": "CloudUpload",
    "material-symbols:keyboard-outline-rounded": "Keyboard",
    "material-symbols:add-photo-alternate-outline-rounded": "ImagePlus",
    "material-symbols:keep-outline-rounded": "Pin",
    "material-symbols:check-circle-rounded": "CheckCircle2",
    "material-symbols:error-rounded": "XCircle",
    "material-symbols:warning-rounded": "AlertTriangle",
    "material-symbols:info-rounded": "Info",
    "svg-spinners:ring-resize": "Loader2"
  };

  // Convert size presets to values Lucide understands
  const sizeMap: Record<string, number> = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 20,
    xl: 24,
    "2xl": 32
  };

  const finalSize = $derived(typeof size === 'number' ? size : (sizeMap[size] || size));
  
  // Clean up the name if not in mapping
  const lucideName = $derived(
    mapping[icon] || 
    icon.split(':').pop()?.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') || 
    'HelpCircle'
  );
  
  // Get the Lucide component
  // @ts-ignore
  const IconComp = $derived(Icons[lucideName] || Icons.HelpCircle);
  
  // Spinner logic
  const isSpinner = $derived(icon.includes('spinner') || icon === 'svg-spinners:ring-resize');
</script>

<span 
  class="inline-icon inline-flex items-center justify-center {className}"
  class:animate-spin={isSpinner}
  style={style}
>
  <IconComp 
    size={finalSize} 
    color={color || 'currentColor'} 
    strokeWidth={strokeWidth}
  />
</span>

<style>
  .inline-icon {
    display: inline-flex;
    line-height: 0;
  }
  
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
