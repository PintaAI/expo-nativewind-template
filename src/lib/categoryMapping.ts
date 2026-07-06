const webColorToHex: Record<string, string> = {
  default: "#64748b",
  gray: "#6b7280",
  brown: "#d97706",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
};

export const CATEGORY_COLOR_OPTIONS = Object.values(webColorToHex);

const hexToWebColor = Object.fromEntries(Object.entries(webColorToHex).map(([name, hex]) => [hex.toLowerCase(), name]));

const webIconToSFSymbol: Record<string, string> = {
  Alert01Icon: "exclamationmark.triangle.fill",
  Audit01Icon: "checkmark.seal.fill",
  BookEditIcon: "book.fill",
  Briefcase01Icon: "briefcase.fill",
  Bus01Icon: "bus.fill",
  Calendar03Icon: "calendar",
  Camera01Icon: "camera.fill",
  CleanIcon: "sparkles",
  Coffee01Icon: "cup.and.saucer.fill",
  CookieIcon: "birthday.cake.fill",
  CreditCardIcon: "creditcard.fill",
  Diamond01Icon: "diamond.fill",
  Dumbbell01Icon: "dumbbell.fill",
  FavouriteIcon: "heart.fill",
  GameController01Icon: "gamecontroller.fill",
  GiftIcon: "gift.fill",
  HealthIcon: "cross.case.fill",
  Home01Icon: "house.fill",
  Image01Icon: "photo.fill",
  Invoice01Icon: "receipt.fill",
  Laundry: "washer.fill",
  MoneyReceiveIcon: "arrow.down.circle.fill",
  MoneySendIcon: "arrow.up.circle.fill",
  More01Icon: "tag.fill",
  PinIcon: "pin.fill",
  SchoolIcon: "graduationcap.fill",
  Share01Icon: "square.and.arrow.up",
  ShoppingCart01Icon: "basket.fill",
  SmartPhone01Icon: "smartphone",
  TShirtIcon: "tshirt.fill",
  UserGroupIcon: "person.2.fill",
  Wallet01Icon: "wallet.pass.fill",
  Water: "drop.fill",
};

export const CATEGORY_ICON_OPTIONS = Object.values(webIconToSFSymbol);

const sfSymbolToWebIcon = Object.fromEntries(Object.entries(webIconToSFSymbol).map(([web, sf]) => [sf, web]));

export function serverCategoryColorToLocal(color: string | null | undefined): string | null {
  if (!color) return null;
  if (color.startsWith("#")) return color;
  return webColorToHex[color] ?? webColorToHex.default;
}

export function localCategoryColorToServer(color: string | null | undefined): string | undefined {
  if (!color) return undefined;
  if (!color.startsWith("#")) return color;
  return hexToWebColor[color.toLowerCase()] ?? "default";
}

export function serverCategoryIconToLocal(icon: string | null | undefined): string | null {
  if (!icon) return null;
  return webIconToSFSymbol[icon] ?? icon;
}

export function localCategoryIconToServer(icon: string | null | undefined): string | undefined {
  if (!icon) return undefined;
  return sfSymbolToWebIcon[icon] ?? icon;
}
