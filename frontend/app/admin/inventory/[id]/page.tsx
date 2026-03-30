"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ProductForm from "@/components/admin/ProductForm";
import { usePreferences } from "@/lib/preferences";
import { adminText } from "@/lib/admin-i18n";
import { useStore } from "@/lib/store";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bootstrap = useStore((state) => state.bootstrap);
  const products = useStore((state) => state.products);
  const isBootstrapping = useStore((state) => state.isBootstrapping);
  const updateProduct = useStore((state) => state.updateProduct);
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].inventoryEdit;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const product = useMemo(() => products.find((entry) => entry.id === params.id), [params.id, products]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{t.editTitle}</h1>
            <p className="mt-1 text-muted-foreground">{t.editSubtitle}</p>
          </div>
          <Link href="/admin/inventory" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted">
            {t.back}
          </Link>
        </div>

        {!product ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {isBootstrapping ? t.loading : t.notFound}
          </div>
        ) : (
          <ProductForm
            initialProduct={product}
            submitLabel={t.save}
            isSubmitting={isSubmitting}
            onSubmit={async (nextProduct) => {
              setIsSubmitting(true);
              const updated = await updateProduct(nextProduct);
              setIsSubmitting(false);
              if (updated) router.push("/admin/inventory");
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
