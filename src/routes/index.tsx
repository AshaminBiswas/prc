import { createFileRoute } from "@tanstack/react-router";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { HeroSlider } from "@/components/prch/HeroSlider";
import { CategoryGrid } from "@/components/prch/CategoryGrid";
import { MaterialProducts } from "@/components/prch/MaterialProducts";
import { InstallationsRow } from "@/components/prch/InstallationsRow";
import { GallerySection } from "@/components/prch/GallerySection";
import { SiteFooter } from "@/components/prch/SiteFooter";
import {
  FeaturedSection,
  BestsellerSection,
  TrendingSection,
} from "@/components/prch/FeaturedSections";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        <HeroSlider />
        <CategoryGrid />
        <FeaturedSection />
        <MaterialProducts />
        <BestsellerSection />
        <TrendingSection />
        <InstallationsRow />
        <GallerySection />
      </main>
      <SiteFooter />
    </div>
  );
}
