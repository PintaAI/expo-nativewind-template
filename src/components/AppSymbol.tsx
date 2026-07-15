import { SymbolView, type SFSymbol, type SymbolViewProps } from "expo-symbols";
import { getPlatformSymbol } from "@/config/symbols";

type AppSymbolProps = Omit<SymbolViewProps, "name"> & {
  name: SFSymbol;
};

export function AppSymbol({ name, ...props }: AppSymbolProps) {
  return <SymbolView name={getPlatformSymbol(name)} {...props} />;
}
