import type { Metadata } from "next";
import { ProductLanding } from "@/components/sections/ProductLanding";
import { products } from "@/lib/products";

const product = products.vermieter;

export const metadata: Metadata = {
  title: product.meta.title,
  description: product.meta.description,
  alternates: { canonical: product.slug },
  openGraph: { title: product.meta.title, description: product.meta.description, url: product.slug },
};

export default function Page() {
  return <ProductLanding product={product} />;
}
